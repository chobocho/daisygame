#!/usr/bin/env bash
# Build a single-file deliverable at release/index.html.
#   - Compiles TypeScript (npm run build).
#   - Inlines CSS, all JS files (in script-tag order), and every image asset
#     as base64 data URIs. The audio is already inlined as base64 in audio.js.
#   - Output: release/index.html (self-contained, no external requests).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/daisygame"
OUT_DIR="$ROOT/release"
OUT_HTML="$OUT_DIR/index.html"

if [ ! -d "$SRC" ]; then
  echo "build.sh: expected source dir at $SRC" >&2
  exit 1
fi

echo "[1/4] Compiling TypeScript..."
cd "$ROOT"
npm run build >/dev/null

mkdir -p "$OUT_DIR"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "[2/4] Inlining images as data URIs..."
# Build a sed program: each line replaces `root + "/<filename>"` (the literal
# expression used in image_loader.js) with the matching data URI string.
SED_SCRIPT="$TMP/loader.sed"
: > "$SED_SCRIPT"
shopt -s nullglob
for img in "$SRC/img"/*; do
  [ -f "$img" ] || continue
  fname="$(basename "$img")"
  ext="${fname##*.}"
  case "$ext" in
    jpg|jpeg) mime="image/jpeg" ;;
    png)      mime="image/png"  ;;
    gif)      mime="image/gif"  ;;
    *)        continue          ;;  # favicon.ico etc. are not loaded by JS
  esac
  b64="$(base64 -w 0 "$img")"
  # `|` as sed delimiter — base64 alphabet [A-Za-z0-9+/=] never contains it.
  printf 's|root + "/%s"|"data:%s;base64,%s"|\n' "$fname" "$mime" "$b64" >> "$SED_SCRIPT"
done
shopt -u nullglob

PATCHED_LOADER="$TMP/image_loader.js"
sed -f "$SED_SCRIPT" "$SRC/js/image_loader.js" > "$PATCHED_LOADER"

# Sanity-check: every `root + "/..."` should now be replaced.
if grep -q 'root + "' "$PATCHED_LOADER"; then
  echo "build.sh: warning — some image references in image_loader.js were not rewritten:" >&2
  grep 'root + "' "$PATCHED_LOADER" >&2 || true
fi

echo "[3/4] Bundling HTML..."
# Script load order — must match daisygame/index.html.
SCRIPTS=(
  util.js
  image_loader.js
  audio.js
  values.js
  effects.js
  puzzle.js
  score.js
  leaf.js
  flower.js
  daisygame.js
  game_engine.js
  draw_engine.js
  main.js
)

inline_script() {
  # Print a JS file inside a <script> block, escaping any literal `</script>`
  # so it can't break out of the surrounding tag.
  local file="$1"
  printf '<script>\n'
  sed 's|</script>|<\\/script>|g' "$file"
  printf '\n</script>\n'
}

{
  cat <<'HEADER'
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>Crazy Daisy</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#fafafa">
  <style>
    html, body { margin: 0; padding: 0; background: #000; }
    canvas { -webkit-tap-highlight-color: rgba(0,0,0,0); display: block; margin: 0 auto; }
    #message { color: #fff; font-family: sans-serif; }
HEADER
  if [ -s "$SRC/css/main.css" ]; then
    cat "$SRC/css/main.css"
  fi
  cat <<'HEADER2'
  </style>
</head>
<body>
  <div align="center"><canvas id="canvas"></canvas></div>
  <div align="center" id="message"></div>
HEADER2

  for s in "${SCRIPTS[@]}"; do
    if [ "$s" = "image_loader.js" ]; then
      inline_script "$PATCHED_LOADER"
    else
      file="$SRC/js/$s"
      if [ ! -f "$file" ]; then
        echo "build.sh: missing source file $file" >&2
        exit 1
      fi
      inline_script "$file"
    fi
  done

  cat <<'FOOTER'
</body>
</html>
FOOTER
} > "$OUT_HTML"

echo "[4/4] Done."
size_bytes="$(wc -c < "$OUT_HTML")"
size_human="$(numfmt --to=iec-i --suffix=B "$size_bytes" 2>/dev/null || echo "${size_bytes}B")"
echo "Built: $OUT_HTML ($size_human)"
