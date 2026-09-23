#!/usr/bin/env bash
# Rebuild the self-hosted Schibsted Grotesk subset (needs: pip install fonttools brotli).
# Printable ASCII + the few typographic characters the copy uses; wght axis limited to 500-900.
set -euo pipefail
SRC=node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2
TMP=$(mktemp -d)
fonttools varLib.instancer "$SRC" wght=500:900 -o "$TMP/ranged.woff2" --quiet
pyftsubset "$TMP/ranged.woff2" \
  --unicodes="U+0020-007E,U+00A0,U+00B7,U+00E9,U+2018,U+2019,U+201C,U+201D,U+2026,U+2192" \
  --layout-features='kern,liga,calt' --flavor=woff2 \
  --output-file=public/fonts/schibsted-grotesk-subset.woff2
ls -l public/fonts/schibsted-grotesk-subset.woff2
