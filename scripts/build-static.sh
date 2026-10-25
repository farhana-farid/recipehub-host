#!/usr/bin/env bash
# Builds the static demo bundle (out/) for static hosts like tiiny.host and
# zips it to the Desktop. The full-stack build is untouched.
#   bash scripts/build-static.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "── Baking fresh demo data from the database…"
npx tsx scripts/bake-data.ts

echo "── Preparing sources for static export…"
BACKUP=".static-api-backup"
rm -rf "$BACKUP"
mv src/app/api "$BACKUP"

DYN_LINE='export const dynamic = DEMO ? "force-static" : "force-dynamic";'
STATIC_LINE='export const dynamic = "force-static";'
for f in src/app/page.tsx "src/app/recipe/[slug]/page.tsx"; do
  sed -i "s|${DYN_LINE}|${STATIC_LINE}|" "$f"
done

cleanup() {
  for f in src/app/page.tsx "src/app/recipe/[slug]/page.tsx"; do
    sed -i "s|${STATIC_LINE}|${DYN_LINE}|" "$f"
  done
  if [ -d "$BACKUP" ]; then
    rm -rf src/app/api
    mv "$BACKUP" src/app/api
  fi
}
trap cleanup EXIT

echo "── Building static export…"
NEXT_PUBLIC_DEMO_MODE=1 npx next build

SIZE=$(du -sh out | cut -f1)
echo "── Static bundle ready in ./out ($SIZE)"

ZIPDEST="$USERPROFILE/Desktop/RecipeHub-tiinyhost"
rm -f "$ZIPDEST.zip"
rm -rf "$ZIPDEST"
cp -r out "$ZIPDEST"
(cd "$ZIPDEST" && powershell.exe -NoProfile -Command "Compress-Archive -Path '*' -DestinationPath '..\\RecipeHub-tiinyhost.zip' -Force")
echo "── Copied to Desktop: RecipeHub-tiinyhost/ and RecipeHub-tiinyhost.zip"
