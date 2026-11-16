# QikCal website

This repository publishes the official QikCal website at https://cal.qik.ai using GitHub Pages. The static production site is in `dist/`.

The site includes the landing page, U.S./U.K. food catalog guide, privacy policy, support page, and source-linked catalog explorer. The bundled catalog combines 13,649 USDA FoodData Central records and 2,818 U.K. CoFID 2021 records. Source attribution and licence details appear on the catalog guide. Search and portion calculations run in the visitor's browser.

## Publishing

The `Deploy GitHub Pages` workflow publishes `dist/` on every push to `main` and can also be run manually. The GitHub Pages custom domain is configured as `cal.qik.ai` in repository settings. The DNS record for `cal.qik.ai` should be a DNS-only CNAME to `nxglabs.github.io`.

## Updating the catalog and social card

The silent user-initiated preview at `dist/assets/launch-preview.mp4` uses current Simulator captures, sample diary entries, and estimate disclosures. `dist/assets/launch-preview-poster.jpg` is its poster frame. Keep the player controls, `preload="none"`, and the sample-data disclosure; do not add tracking to the player. The Open Graph image is generated from brand typography and abstract catalog-inspired artwork. `scripts/compose-social-card.swift` regenerates `dist/assets/og-qikcal.jpg`.

To refresh the food catalog, run `scripts/export-food-catalog.py` with the current QikCal database and write its output to `dist/assets/food-catalog.json`. Keep source record IDs, row references, notes, attribution and licence details intact. This static site does not receive or store visitor-entered food weights.
