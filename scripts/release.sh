#!/usr/bin/env bash
# dist/ dagi installer'larni GitLab Generic Package Registry'ga yuklaydi va release yaratadi.
#
# Token: GitLab → Settings → Access tokens, "api" huquqi bilan.
# Token ~/.gitlab-token faylida (chmod 600) yoki GITLAB_TOKEN muhit o'zgaruvchisida bo'lishi kerak.
#
#   bash scripts/release.sh
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT_PATH="Elnurrabbimov/floatingquran"
PROJECT_ID="${PROJECT_PATH//\//%2F}"
API="https://gitlab.com/api/v4"
PACKAGE="suzuvchi-quron"
VERSION="$(node -p "require('./package.json').version")"
TAG="v${VERSION}"

TOKEN="${GITLAB_TOKEN:-}"
if [[ -z "$TOKEN" && -f "$HOME/.gitlab-token" ]]; then
  TOKEN="$(tr -d '[:space:]' < "$HOME/.gitlab-token")"
fi
if [[ -z "$TOKEN" ]]; then
  echo "Token topilmadi: GITLAB_TOKEN yoki ~/.gitlab-token kerak (api huquqi bilan)." >&2
  exit 1
fi

shopt -s nullglob
FILES=(dist/SuzuvchiQuron-"${VERSION}"-*.{dmg,exe,AppImage,deb})
if (( ${#FILES[@]} == 0 )); then
  echo "dist/ da ${VERSION} versiya installer'lari topilmadi. Avval: npm run dist:all" >&2
  exit 1
fi

api() { curl --silent --show-error --fail-with-body -H "PRIVATE-TOKEN: ${TOKEN}" "$@"; }

echo "Token tekshirilmoqda..."
api "${API}/projects/${PROJECT_ID}" > /dev/null

LINKS_JSON="["
for f in "${FILES[@]}"; do
  name="$(basename "$f")"
  echo "Yuklanmoqda: ${name} ($(du -h "$f" | cut -f1))"
  api --upload-file "$f" "${API}/projects/${PROJECT_ID}/packages/generic/${PACKAGE}/${VERSION}/${name}" > /dev/null
  url="${API}/projects/${PROJECT_ID}/packages/generic/${PACKAGE}/${VERSION}/${name}"
  case "$name" in
    *mac-arm64.dmg) label="macOS (Apple Silicon) — ${name}" ;;
    *mac-x64.dmg)   label="macOS (Intel) — ${name}" ;;
    *.exe)          label="Windows — ${name}" ;;
    *.AppImage)     label="Linux AppImage — ${name}" ;;
    *.deb)          label="Linux .deb — ${name}" ;;
    *)              label="${name}" ;;
  esac
  LINKS_JSON+="{\"name\":\"${label}\",\"url\":\"${url}\",\"direct_asset_path\":\"/${name}\",\"link_type\":\"package\"},"
done
LINKS_JSON="${LINKS_JSON%,}]"

DESCRIPTION=$(cat <<'MD'
## O'rnatish

| Platforma | Fayl |
|---|---|
| macOS (Apple Silicon: M1/M2/M3/M4) | `*-mac-arm64.dmg` |
| macOS (Intel) | `*-mac-x64.dmg` |
| Windows 10/11 | `*-win-x64.exe` |
| Linux | `*-linux-x86_64.AppImage` |

**macOS:** ilova imzolanmagan. Birinchi ochishda Applications'da ilova ustida o'ng tugma → **Open**, yoki terminalda:
`xattr -cr "/Applications/Suzuvchi Quron.app"`

**Windows:** SmartScreen ogohlantirsa — **More info → Run anyway**.

**Linux:** `chmod +x SuzuvchiQuron-*.AppImage && ./SuzuvchiQuron-*.AppImage`

Batafsil: [README](README.md)
MD
)

BODY="$(TAG="$TAG" VERSION="$VERSION" DESCRIPTION="$DESCRIPTION" LINKS_JSON="$LINKS_JSON" node -e '
  process.stdout.write(JSON.stringify({
    tag_name: process.env.TAG,
    ref: "main",
    name: `Suzuvchi Quron ${process.env.VERSION}`,
    description: process.env.DESCRIPTION,
    assets: { links: JSON.parse(process.env.LINKS_JSON) },
  }));
')"

if api "${API}/projects/${PROJECT_ID}/releases/${TAG}" > /dev/null 2>&1; then
  echo "Release ${TAG} allaqachon bor — fayllar yangilandi, havolalar o'zgarmadi."
else
  echo "Release ${TAG} yaratilmoqda..."
  api -X POST -H "Content-Type: application/json" --data "$BODY" "${API}/projects/${PROJECT_ID}/releases" > /dev/null
  git fetch --tags --quiet origin || true
fi

echo "Tayyor: https://gitlab.com/${PROJECT_PATH}/-/releases/${TAG}"
