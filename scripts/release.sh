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
FILES=(dist/SuzuvchiQuron-"${VERSION}"-*.{dmg,exe,AppImage,deb})
if (( ${#FILES[@]} == 0 )); then
  echo "dist/ da ${VERSION} versiya installer'lari topilmadi. Avval: npm run dist:all" >&2
  exit 1
fi

NOTES=$(cat <<'MD'
## O'rnatish

| Platforma | Fayl |
|---|---|
| macOS (Apple Silicon: M1/M2/M3/M4) | `*-mac-arm64.dmg` |
| macOS (Intel) | `*-mac-x64.dmg` |
| Windows 10/11 | `*-win-x64.exe` |
| Linux | `*-linux-x86_64.AppImage` |

**macOS:** ilova Apple tomonidan notarizatsiya qilinmagan:
1. `.dmg` ni oching, **Suzuvchi Quron** ni **Applications** ga torting.
2. Ilovani oching → *"Apple could not verify..."* → **Done**.
3. **System Settings → Privacy & Security** → **Open Anyway** → parol.

Yoki terminalda: `xattr -cr "/Applications/Suzuvchi Quron.app"`

> `.app` ni zip qilib Telegram orqali yubormang — ilova buziladi. `.dmg` ni yuboring.

**Windows:** SmartScreen ogohlantirsa — **More info → Run anyway**.

**Linux:** `chmod +x SuzuvchiQuron-*.AppImage && ./SuzuvchiQuron-*.AppImage`
MD
)

# Ixtiyoriy: WHATSNEW="- yangilik 1\n- yangilik 2" bash scripts/release.sh
if [[ -n "${WHATSNEW:-}" ]]; then
  NOTES="$(printf '## Yangiliklar\n\n%b\n\n%s' "$WHATSNEW" "$NOTES")"
fi

if gh release view "$TAG" --repo "$REPO" > /dev/null 2>&1; then
  echo "Release ${TAG} bor — fayllar va matn yangilanmoqda..."
  gh release upload "$TAG" "${FILES[@]}" --repo "$REPO" --clobber
  gh release edit "$TAG" --repo "$REPO" --notes "$NOTES"
else
  echo "Release ${TAG} yaratilmoqda..."
  gh release create "$TAG" "${FILES[@]}" --repo "$REPO" --target main \
    --title "Suzuvchi Quron ${VERSION}" --notes "$NOTES"
fi

echo "Tayyor: https://github.com/${REPO}/releases/tag/${TAG}"
