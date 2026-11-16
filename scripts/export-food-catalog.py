#!/usr/bin/env python3
"""Export the QikCal Food Library for the client-side catalog explorer."""

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

    with sqlite3.connect(f"file:{args.database}?mode=ro", uri=True) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """SELECT food_id, primary_name, canonical_name, calories_per_100g
               FROM foods"""
        ).fetchall()
        search_names = {
            str(row["food_id"]): str(row["name_text"] or "")
            for row in connection.execute("SELECT food_id, name_text FROM food_search")
        }
        serving_rows = connection.execute(
            """SELECT food_id, measure_name, weight_g, measure_rank
               FROM serving_measures
               WHERE weight_g > 0"""
        ).fetchall()

    first_serving: dict[str, dict[str, str | float]] = {}
    serving_ranks: dict[str, tuple[int, str]] = {}
    for row in serving_rows:
        food_id = str(row["food_id"])
        rank = int(row["measure_rank"]) if row["measure_rank"] is not None else -2**31
        name = str(row["measure_name"])
        current = serving_ranks.get(food_id)
        if current is None or rank > current[0] or (rank == current[0] and name.casefold() < current[1]):
            serving_ranks[food_id] = (rank, name.casefold())
            first_serving[food_id] = {"name": name, "grams": round(float(row["weight_g"]), 2)}

    records = []
    for row in rows:
        calories = row["calories_per_100g"]
        record = {
            "id": str(row["food_id"]),
            "name": str(row["primary_name"] or row["canonical_name"] or f"Food {row['food_id']}"),
            "searchName": search_names.get(str(row["food_id"])) or str(row["primary_name"] or ""),
            "kcalPer100g": round(float(calories), 2) if calories is not None else None,
        }
        serving = first_serving.get(str(row["food_id"]))
        if serving:
            record["serving"] = serving
        records.append(record)

    payload = {
        "snapshot": date.today().isoformat(),
        "recordCount": len(records),
        "withEnergyCount": sum(record["kcalPer100g"] is not None for record in records),
        "records": records,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(
        f"Exported {payload['recordCount']:,} food records; "
        f"{payload['withEnergyCount']:,} include usable energy values; "
        f"{args.output.stat().st_size:,} bytes written."
    )


if __name__ == "__main__":
    main()
