# QikCal website

This repository publishes the official QikCal website at https://cal.qik.ai using GitHub Pages. The static production site is in `dist/`.

The site includes the landing page, English and Hindi USDA FoodData Central guides, privacy policy, support page, catalog explorer, and launch preview. The bundled food reference data is USDA-only and attributed in the user-facing pages. The page calculations run in the visitor's browser.

## Publishing

The `Deploy GitHub Pages` workflow publishes `dist/` on every push to `main` and can also be run manually. The GitHub Pages custom domain is configured as `cal.qik.ai` in repository settings. The DNS record for `cal.qik.ai` should be a DNS-only CNAME to `nxglabs.github.io`.

## Updating the preview and catalog

The landing-page preview is generated with `scripts/build-launch-preview.sh`, which uses the source frames in `assets/launch-demo/`, `scripts/compose-launch-preview.swift`, and FFmpeg. `scripts/compose-social-card.swift` regenerates the Open Graph image from the clearly labeled Simulator sample in `assets/qikcal-screen-sample.jpg`.

To refresh the food catalog, run `scripts/export-food-catalog.py` with the current QikCal database and write its output to `dist/assets/food-catalog.json`. Keep source record IDs and source attribution intact. This static site does not receive or store visitor-entered food weights.
