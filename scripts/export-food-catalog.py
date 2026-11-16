#!/usr/bin/env python3
"""Export the QikCal USDA and U.K. CoFID catalog for the client-side browser."""

from __future__ import annotations

import argparse
import json
import sqlite3
from datetime import date
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    with sqlite3.connect(args.database) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT food_id, name, category, calories_per_100g, source,
                   source_reference, source_notes
            FROM foods
            ORDER BY name COLLATE NOCASE, food_id
            """
        ).fetchall()
        serving_rows = connection.execute(
            """
            SELECT food_id, name, weight_g
            FROM serving_measures
            WHERE weight_g > 0
            ORDER BY food_id, rank IS NULL, rank, name, id
            """
        ).fetchall()

    first_serving: dict[str, dict[str, str | float]] = {}
    for row in serving_rows:
        food_id = str(row["food_id"])
        first_serving.setdefault(
            food_id,
            {"name": str(row["name"]), "grams": round(float(row["weight_g"]), 2)},
        )

    sources: dict[str, dict[str, int | str]] = {}
    for row in rows:
        source = str(row["source"])
        is_cofid = source.startswith("UK CoFID")
        entry = sources.setdefault(
            source,
            {
                "name": source,
                "records": 0,
                "withEnergy": 0,
                "url": (
                    "https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid"
                    if is_cofid
                    else "https://fdc.nal.usda.gov/"
                ),
                "license": (
                    "Open Government Licence v3.0 except where third-party rights are identified"
                    if is_cofid
                    else "CC0 1.0 Universal"
                ),
            },
        )
        entry["records"] = int(entry["records"]) + 1
        if row["calories_per_100g"] is not None:
            entry["withEnergy"] = int(entry["withEnergy"]) + 1

    source_names = sorted(sources)
    source_index = {name: index for index, name in enumerate(source_names)}
    records = []
    for row in rows:
        record = {
            "id": str(row["food_id"]),
            "name": str(row["name"]),
            "kcalPer100g": (
                round(float(row["calories_per_100g"]), 2)
                if row["calories_per_100g"] is not None
                else None
            ),
            "source": source_index[str(row["source"])],
        }
        serving = first_serving.get(str(row["food_id"]))
        if serving:
            record["serving"] = serving
        if row["source_reference"]:
            record["sourceReference"] = str(row["source_reference"])
        if row["source_notes"]:
            record["sourceNotes"] = str(row["source_notes"])
        records.append(record)

    payload = {
        "snapshot": date.today().isoformat(),
        "citation": "U.S. Department of Agriculture, Agricultural Research Service, FoodData Central; Public Health England (2021), McCance and Widdowson’s Composition of Foods Integrated Dataset.",
        "license": "USDA FoodData Central: CC0 1.0 Universal. U.K. CoFID: Open Government Licence v3.0 except where third-party rights are identified.",
        "sourceUrls": [
            "https://fdc.nal.usda.gov/",
            "https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid",
        ],
        "dataUseUrl": "https://fdc.nal.usda.gov/api-guide/",
        "recordCount": len(records),
        "withEnergyCount": sum(record["kcalPer100g"] is not None for record in records),
        "sources": [sources[name] for name in source_names],
        "records": records,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(
        f"Exported {payload['recordCount']} U.S. and U.K. food records from "
        f"{len(payload['sources'])} data collections; "
        f"{payload['withEnergyCount']} include energy values; "
        f"{args.output.stat().st_size:,} bytes written."
    )


if __name__ == "__main__":
    main()
