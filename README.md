# Suzuvchi Quron

Quron tilovatini tinglash paytida oyat matni va tarjimasini **barcha oynalar ustida suzib turuvchi subtitle** sifatida ko'rsatadigan desktop ilova (macOS, Windows, Linux).

## Imkoniyatlar

- Ekran ustida suzib turuvchi, sichqoncha o'tib ketadigan (click-through) subtitle — brauzer, Telegram, fullscreen video va "Show Desktop" ustida ham ko'rinadi
- 114 sura, 12 qori, oyatma-oyat ijro — subtitle audio bilan aniq sinxron
- 69 tilda 126 ta tarjima, bir vaqtda 4 tagacha tarjima; tarjimani yoqish/o'chirish
- Qidiruvli tanlagichlar: `36`, `yosin`, `ya-sin`, `يس` — barchasi bir xil surani topadi
- Uslub: shriftlar, ranglar, kontur, soya, fon, tayyor uslublar
- Uzun oyatlarda oyna balandligi va shrift avtomatik moslashadi
- Takrorlash (oyat / sura), qayta ijro
- Disk keshi — bir marta tinglangan sura internetsiz ochiladi
- Menu bar (tray) orqali boshqaruv va sozlanadigan global hotkey'lar
- Lock screen / Control Center'da "Now Playing" va klaviatura media tugmalari

### Standart hotkey'lar

| Amal | macOS | Windows / Linux |
|---|---|---|
| Subtitle'ni yashirish / ko'rsatish | `⌃⌥S` | `Ctrl+Alt+S` |
| Play / pauza | `⌃⌥P` | `Ctrl+Alt+P` |
| Keyingi oyat | `⌃⌥N` | `Ctrl+Alt+N` |
| Oldingi oyat | `⌃⌥B` | `Ctrl+Alt+B` |
| Subtitle joyini o'zgartirish | `⌃⌥M` | `Ctrl+Alt+M` |

Barchasi ilovaning "Tezkor tugmalar" bo'limida o'zgartiriladi.

## O'rnatish

Installer'larni [Releases](https://github.com/Elnurrabbimov/floatingquran/releases/latest) sahifasidan yuklab oling:

| Platforma | Fayl |
|---|---|
| macOS (Apple Silicon) | `SuzuvchiQuron-<versiya>-mac-arm64.dmg` |
| macOS (Intel) | `SuzuvchiQuron-<versiya>-mac-x64.dmg` |
| Windows | `SuzuvchiQuron-<versiya>-win-x64.exe` |
| Linux | `SuzuvchiQuron-<versiya>-linux-x86_64.AppImage` |

**macOS:** ilova imzolanmagan, shuning uchun birinchi ochishda macOS bloklaydi. Applications'da ilova ustida o'ng tugma → **Open**, yoki:

```sh
xattr -cr "/Applications/Suzuvchi Quron.app"
```

**Windows:** SmartScreen ogohlantirsa — **More info → Run anyway**.

**Linux:** `chmod +x SuzuvchiQuron-*.AppImage && ./SuzuvchiQuron-*.AppImage`. Subtitle shaffof bo'lishi uchun compositor (GNOME, KDE va h.k.) kerak.

## Ishlab chiqish

Node.js 20+ kerak.

```sh
npm install
npm start            # ilovani koddan ishga tushirish
npm run dist:mac     # macOS .dmg
npm run dist:win     # Windows .exe (macOS'da ham yig'iladi)
npm run dist:linux   # Linux AppImage (.deb faqat Linux'da yoki GNU binutils bilan)
npm run icons        # build/icon.html dan ikonkalarni qayta yaratish
bash scripts/release.sh   # dist/ dagi installer'lar bilan GitHub release (gh CLI kerak)
```

### Tuzilish

```
src/
  main.js       oynalar, overlay, tray, global hotkey'lar
  preload.js    renderer ↔ main ko'prigi
  index.html    asosiy oyna (player va sozlamalar)
  renderer.js   ijro, sinxronizatsiya, kesh, sozlamalar
  picker.js     qidiruvli tanlagich
  overlay.html  suzuvchi subtitle oynasi
  assets/       ikonkalar
build/icon.html ikonka manbasi
scripts/        yordamchi skriptlar
```

## Ma'lumot manbalari

- Matn va tarjimalar: [Quran.com / Quran Foundation API](https://quran.com)
- Audio: [everyayah.com](https://everyayah.com)
- Arabcha shriftlar: Google Fonts (Amiri Quran va boshqalar)

## Litsenziya

MIT
