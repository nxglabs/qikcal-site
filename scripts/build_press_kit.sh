#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE_DIR="$(mktemp -d)"
KIT_DIR="$STAGE_DIR/QikCal Media Kit"
ARCHIVE="$SITE_ROOT/dist/assets/qikcal-media-kit.zip"
PREPARED_ON="$(date '+%-d %B %Y')"
trap 'rm -rf "$STAGE_DIR"' EXIT

mkdir -p "$KIT_DIR/screens"
cp "$SITE_ROOT/dist/assets/mark.svg" "$KIT_DIR/qikcal-mark.svg"
cp "$SITE_ROOT/dist/assets/launch-preview.mp4" "$KIT_DIR/qikcal-preview-silent.mp4"
cp "$SITE_ROOT/dist/assets/press/01-today.jpg" "$KIT_DIR/screens/01-today.jpg"
cp "$SITE_ROOT/dist/assets/press/02-food-search.jpg" "$KIT_DIR/screens/02-food-search.jpg"
cp "$SITE_ROOT/dist/assets/press/03-saved-meals.jpg" "$KIT_DIR/screens/03-saved-meals.jpg"
cp "$SITE_ROOT/dist/assets/press/04-weekly-view.jpg" "$KIT_DIR/screens/04-weekly-view.jpg"

cat > "$KIT_DIR/Read me.txt" <<EOF
QikCal media kit
Prepared $PREPARED_ON

ABOUT
QikCal is an offline-first food diary for iPhone. People can search the QikCal Food Library, log portions, save meals they repeat, and review a seven-day view. The diary stays on the iPhone.

AVAILABILITY
Version 1.0 is in App Review and is not yet available to download in the United States or United Kingdom.

PLATFORM AND PRICE
iPhone, iOS 17 and later. Planned one-time purchase price: \$19.99 in the United States and £14.99 in the United Kingdom. The final price shown to customers is set in the App Store.

ACCURACY
The screenshots contain sample diary entries and estimated nutrition values. Food energy and nutrient values are for general reference, may be missing or vary with preparation, and are not medical advice. Do not present the sample entries as customer data.

ASSETS
The archive contains the QikCal mark in SVG format, four iPhone screenshots, and a silent product preview in MP4 format.

OFFICIAL SITE
https://cal.qik.ai/

PRESS CONTACT
hello@qik.ai
EOF

cd "$STAGE_DIR"
zip -qr "$ARCHIVE" "QikCal Media Kit"
printf 'Built %s\n' "$ARCHIVE"
