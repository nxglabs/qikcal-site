# QikCal website

This repository publishes the official QikCal website at https://cal.qik.ai using GitHub Pages. The static production site is in `dist/`.

The site includes the landing page, food catalog guide, privacy policy, support page, client-side catalog explorer, and a shareable food-facts challenge. The explorer is exported from the packaged iPhone catalog and includes the same 159,088 food records. Search, portion calculations, and challenge scoring run in the visitor's browser. The challenge does not send answers or scores to QikCal; sharing is user initiated.

## Publishing

The `Deploy GitHub Pages` workflow publishes `dist/` on every push to `main` and can also be run manually. The GitHub Pages custom domain is configured as `cal.qik.ai` in repository settings. The DNS record for `cal.qik.ai` should be a DNS-only CNAME to `nxglabs.github.io`.

## Updating the catalog and social card

The silent user-initiated preview at `dist/assets/launch-preview.mp4` uses current Simulator captures, sample diary entries, and estimate disclosures. `dist/assets/launch-preview-poster.jpg` is its poster frame. Keep the player controls, `preload="none"`, and the sample-data disclosure; do not add tracking to the player. The Open Graph images are generated from brand typography and abstract catalog-inspired artwork. `scripts/compose-social-card.swift` regenerates `dist/assets/og-qikcal.jpg` and `dist/assets/og-qikcal-challenge.jpg`.

To refresh the food catalog, run `scripts/export-food-catalog.py` with the current approved QikCal database and write its output to `dist/assets/food-catalog.json`. Export every food row and do not add provider-based filters; keep the app's nutrition estimate limits aligned. The guide credits USDA FoodData Central and provides the required Open Government Licence v3.0 attribution for CoFID. This static site does not receive or store visitor-entered food weights or searches.
