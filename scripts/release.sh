#!/usr/bin/env bash
# dist/ dagi installer'lar bilan GitHub release yaratadi (yoki mavjudiga fayllarni qayta yuklaydi).
# Talab: GitHub CLI (`brew install gh`, `gh auth login`).
#
#   npm run dist:all && bash scripts/release.sh
set -euo pipefail

cd "$(dirname "$0")/.."

REPO="Elnurrabbimov/floatingquran"
VERSION="$(node -p "require('./package.json').version")"
TAG="v${VERSION}"

shopt -s nullglob
FILES=(dist/FloatingQuran-"${VERSION}"-*.{dmg,exe,AppImage,deb})
if (( ${#FILES[@]} == 0 )); then
  echo "dist/ da ${VERSION} versiya installer'lari topilmadi. Avval: npm run dist:all" >&2
  exit 1
fi

NOTES=$(cat <<'MD'
## Install

| Platform | File |
|---|---|
| macOS (Apple Silicon: M1/M2/M3/M4) | `*-mac-arm64.dmg` |
| macOS (Intel) | `*-mac-x64.dmg` |
| Windows 10/11 | `*-win-x64.exe` |
| Linux | `*-linux-x86_64.AppImage` |

**macOS:** the app is not notarized by Apple yet:
1. Open the `.dmg` and drag **Floating Quran** into **Applications**.
2. Open the app → *"Apple could not verify..."* → **Done**.
3. **System Settings → Privacy & Security** → **Open Anyway** → password.

Or in Terminal: `xattr -cr "/Applications/Floating Quran.app"`

> Do not zip the `.app` and send it via messengers — it breaks. Share the `.dmg`.

**Windows:** if SmartScreen warns — **More info → Run anyway**.

**Linux:** `chmod +x FloatingQuran-*.AppImage && ./FloatingQuran-*.AppImage`
MD
)

# Optional: WHATSNEW="- change 1\n- change 2" bash scripts/release.sh
if [[ -n "${WHATSNEW:-}" ]]; then
  NOTES="$(printf "## What's new\n\n%b\n\n%s" "$WHATSNEW" "$NOTES")"
fi

if gh release view "$TAG" --repo "$REPO" > /dev/null 2>&1; then
  echo "Release ${TAG} bor — fayllar va matn yangilanmoqda..."
  gh release upload "$TAG" "${FILES[@]}" --repo "$REPO" --clobber
  gh release edit "$TAG" --repo "$REPO" --notes "$NOTES"
else
  echo "Release ${TAG} yaratilmoqda..."
  gh release create "$TAG" "${FILES[@]}" --repo "$REPO" --target main \
    --title "Floating Quran ${VERSION}" --notes "$NOTES"
fi

echo "Tayyor: https://github.com/${REPO}/releases/tag/${TAG}"
