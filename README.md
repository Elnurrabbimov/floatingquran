# Floating Quran

A desktop app for macOS, Windows and Linux that plays Quran recitation and shows each verse with its translation as a **floating subtitle above every window**: your browser, editor, video calls, full-screen videos and the desktop.

*Formerly “Suzuvchi Quron”. O'zbekcha: ilova o'zbek tilida ham ishlaydi — Sozlamalar → Til.*

## Features

- **Floating, click-through subtitle.** It stays on top of all apps, including full-screen video and "Show Desktop", and your clicks pass through it.
- **Shows on every connected display**, or only on the main one.
- **Word-by-word highlighting.** The word being recited lights up letter by letter, karaoke style. Supported for 9 reciters, using Quran.com word timings.
- **Tajweed colors.** Ghunnah, ikhfa, idgham, iqlab, qalqalah, the madd types and other rules are shown in color, with a legend.
- **Recitation:**
  - all 114 surahs and 12 reciters, played verse by verse so the subtitle stays in sync;
  - play by surah (with a verse range), page (1–604) or juz (1–30).
- **Translations:** 126 translations in 69 languages. Up to 4 can be shown at once, and translations can be turned off.
- **Automatic language and region.**
  - The interface is English, or Uzbek when your system language or region is Uzbek.
  - On first launch, the translation is picked from your region and system language (for example Uzbek in Uzbekistan, Russian in Russia, Turkish in Turkey, Urdu in Pakistan).
- **Repeat:** each verse or the whole recitation, 1×, 2×, 3× or infinitely.
- **Styles:**
  - presets, fonts, colors, outline, shadow and background;
  - the highlight color is chosen automatically to contrast with the text.
- **Long verses fit automatically.** The window grows and the font shrinks as needed.
- **Offline cache.** Surahs you have listened to play without internet.
- **Controls:**
  - a menu-bar (tray) menu and configurable global hotkeys;
  - "Now Playing" and the keyboard media keys.

### Default hotkeys

| Action | macOS | Windows / Linux |
|---|---|---|
| Hide / show subtitle | `⌃⌥S` | `Ctrl+Alt+S` |
| Play / pause | `⌃⌥P` | `Ctrl+Alt+P` |
| Next verse | `⌃⌥N` | `Ctrl+Alt+N` |
| Previous verse | `⌃⌥B` | `Ctrl+Alt+B` |
| Move subtitle | `⌃⌥M` | `Ctrl+Alt+M` |

You can change all of them in **Settings → Keyboard shortcuts**.

## Install

Download the installer from [Releases](https://github.com/Elnurrabbimov/floatingquran/releases/latest):

| Platform | File |
|---|---|
| macOS (Apple Silicon) | `FloatingQuran-<version>-mac-arm64.dmg` |
| macOS (Intel) | `FloatingQuran-<version>-mac-x64.dmg` |
| Windows 10/11 | `FloatingQuran-<version>-win-x64.exe` |
| Linux | `FloatingQuran-<version>-linux-x86_64.AppImage` |

**macOS:** the app is not notarized by Apple yet, so macOS blocks it on first launch.

1. Open the `.dmg` and drag **Floating Quran** into **Applications**.
2. Open the app from Applications. When you see *"Apple could not verify…"*, click **Done**.
3. Go to **System Settings → Privacy & Security** and click **Open Anyway** next to *"Floating Quran" was blocked*.

You can also run this once in Terminal:

```sh
xattr -cr "/Applications/Floating Quran.app"
```

> Don't zip the `.app` and send it through messengers, because that breaks it. Share the `.dmg` instead.

**Windows:** if SmartScreen shows a warning, click **More info → Run anyway**.

**Linux:** run `chmod +x FloatingQuran-*.AppImage && ./FloatingQuran-*.AppImage`. A compositor (GNOME, KDE, …) is required for transparency.

## Development

Requires Node.js 20+.

```sh
npm install
npm start                 # run from source
npm run dist:mac          # macOS .dmg
npm run dist:win          # Windows .exe (also builds on macOS)
npm run dist:linux        # Linux AppImage
npm run icons             # regenerate icons from build/icon.html
bash scripts/release.sh   # publish dist/ installers as a GitHub release (needs gh CLI)
```

### Structure

```
src/
  main.js       windows, overlay on every display, tray, global hotkeys
  preload.js    renderer ↔ main bridge
  i18n.js       UI strings (English, Uzbek)
  index.html    main window
  renderer.js   playback, sync, word highlighting, cache, settings
  picker.js     searchable picker
  overlay.html  floating subtitle (highlighting, tajweed)
  assets/       icons
build/          icon source, macOS signing hook
scripts/        helper scripts
```

## Data sources

- Text, translations, tajweed markup and word timings: [Quran.com / Quran Foundation API](https://quran.com)
- Audio: [everyayah.com](https://everyayah.com)
- Arabic fonts: Google Fonts (Amiri Quran and others)

## License

MIT
