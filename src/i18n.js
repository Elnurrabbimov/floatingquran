// UI strings. Shared by the main process (require) and the windows (<script>).
(function (root) {
  const STR = {
    en: {
      hide: 'Hide', show: 'Show', move: 'Move', lock: 'Lock',
      visTitle: 'Hide / show the subtitle', moveTitle: 'Drag the subtitle to another place',
      tabListen: 'Listen', tabStyle: 'Appearance', tabSettings: 'Settings',
      pickSurah: 'Choose a surah',
      replayTitle: 'Restart this verse (or the whole recitation if it has finished)',
      prevTitle: 'Previous verse', nextTitle: 'Next verse', playTitle: 'Play / pause', volume: 'Volume',
      modeSurah: 'Surah', modePage: 'Page', modeJuz: 'Juz',
      prevSurah: 'Previous surah', nextSurah: 'Next surah',
      ayahs: 'Verses', fromAyah: 'From verse', toAyah: 'To verse',
      pageRange: 'Page (1–604)', prevPage: 'Previous page', nextPage: 'Next page',
      juzRange: 'Juz (1–30)', prevJuz: 'Previous juz', nextJuz: 'Next juz',
      reciter: 'Reciter', translation: 'Translation', trToggleTitle: 'Show / hide the translation',
      trOn: 'Shown', trOff: 'Off', start: 'Start listening',
      repeat: 'Repeat', repEach: 'Each verse', repAll: 'Whole recitation', infinite: 'Infinite',
      presets: 'Presets', pClassic: 'Classic', pContrast: 'Contrast', pGold: 'Gold', pClear: 'Clear', pLight: 'Light', pGreen: 'Green',
      showOn: 'Show on the subtitle', showAr: 'Arabic text', showLabel: 'Surah and verse number',
      wordHl: 'Highlight the recited word', wordHlSub: 'Letters light up as the reciter reads',
      tajweed: 'Tajweed colors', tajweedSub: 'Ghunnah, ikhfa, idgham, qalqalah, madd…',
      font: 'Font', fArabic: 'Arabic', fTranslation: 'Translation', fSystem: 'System font',
      arSize: 'Arabic size', trSize: 'Translation size', trWeight: 'Translation weight',
      wRegular: 'Regular', wSemi: 'Semibold', wBold: 'Bold', lineH: 'Line height',
      colors: 'Colors', cArabic: 'Arabic text', cTranslation: 'Translation', cBg: 'Background', cOutline: 'Outline',
      cHl: 'Recited word', auto: 'Auto', autoTitle: 'Pick automatically from the text and background colors',
      bgContrast: 'Background & contrast', bgAlpha: 'Background', opacity: 'Opacity', shadow: 'Shadow',
      outline: 'Outline', radius: 'Corners', pad: 'Padding',
      subWin: 'Subtitle window', allScreens: 'On all displays', allScreensSub: 'When off, it shows only on the main display',
      moveHint: 'To reposition the subtitle, click “Move” at the top, drag it, then click “Lock”.',
      shortcuts: 'Keyboard shortcuts',
      shortcutsHint: 'They work inside any app. Default: ⌃ ⌥ + letter. Click a field and press a new combination.',
      cache: 'Offline cache', cacheHint: 'Surahs you have listened to open without internet.', clear: 'Clear',
      language: 'Language',
      cacheSize: 'Size: {mb} MB', cacheCleared: 'Cache cleared.',
      phSurah: 'Number or name: 36, yasin, mulk, الملك …', phReciter: 'Reciter: alafasy, sudais, husary …',
      phTranslation: 'Language or translator: english, urdu, türkçe, saheeh …',
      trLimit: 'You can pick up to {max} translations.', trLoading: 'Loading translation…', trChanged: 'Translation changed.',
      error: 'Error: {msg}', pageTitle: 'Page {n}', juzTitle: 'Juz {n}', surahN: 'Surah {n}',
      loadingSurahs: 'Loading surahs…', ready: 'Ready.', versesCount: '{n} verses',
      finished: '{name} finished.', audioFail: 'Could not load audio: {label}. Check your internet or try another reciter.',
      playError: 'Playback error: {msg}', loadingText: 'Loading text…', noVerses: 'No verses in this range',
      statAyah: 'verse {a}/{b}', statRange: 'round {a}/{b}', screens: 'Connected displays: {n}',
      scClickTitle: 'Click and press a new combination', scOff: 'Disable', scDefault: 'Default: {k}',
      scBusy: 'This combination is taken by another app or the system — choose another one.',
      scPress: 'Press a combination… (Esc to cancel)', scNeedMod: 'Use at least one of ⌃ / ⌥ / ⌘',
      selected: 'Selected: {n}', none: 'Nothing selected', nothingFound: 'Nothing found', nTranslations: '{n} translations selected', done: 'Done',
      dragHint: 'Drag to position · click “Lock” when done',
      sampleText: 'In the name of Allah, the Most Gracious, the Most Merciful.', sample: 'Sample', sampleShort: 'Sample text',
      // Tajweed legend
      tjGhunnah: 'Ghunnah', tjIkhfa: 'Ikhfa', tjIkhfaShafawi: 'Ikhfa shafawi', tjIdghamG: 'Idgham with ghunnah',
      tjIdghamNoG: 'Idgham without ghunnah', tjIdghamShafawi: 'Idgham shafawi', tjIqlab: 'Iqlab', tjQalqalah: 'Qalqalah',
      tjMaddNormal: 'Natural madd', tjMaddPerm: 'Permissible madd', tjMaddOblig: 'Obligatory madd', tjMaddNec: 'Necessary madd',
      tjSilent: 'Silent letter',
      // Main process
      scToggleSubtitle: 'Hide / show subtitle', scPlayPause: 'Play / pause', scNextAyah: 'Next verse',
      scPrevAyah: 'Previous verse', scMoveSubtitle: 'Move subtitle',
      trayHide: 'Hide subtitle', trayShow: 'Show subtitle', trayPlay: 'Play', trayPause: 'Pause',
      trayMove: 'Move subtitle', trayLock: 'Lock subtitle', trayOpen: 'Open main window', trayQuit: 'Quit',
    },
    uz: {
      hide: 'Yashirish', show: "Ko'rsatish", move: 'Joyi', lock: 'Qulflash',
      visTitle: "Subtitle'ni yashirish / ko'rsatish", moveTitle: "Subtitle'ni sudrab boshqa joyga qo'yish",
      tabListen: 'Tinglash', tabStyle: "Ko'rinish", tabSettings: 'Sozlamalar',
      pickSurah: 'Sura tanlang',
      replayTitle: "Joriy oyatni boshidan (tugagan bo'lsa — qiroatni boshidan)",
      prevTitle: 'Oldingi oyat', nextTitle: 'Keyingi oyat', playTitle: 'Play / pauza', volume: 'Ovoz',
      modeSurah: 'Sura', modePage: 'Sahifa', modeJuz: 'Juz',
      prevSurah: 'Oldingi sura', nextSurah: 'Keyingi sura',
      ayahs: 'Oyatlar', fromAyah: 'Dan (oyat)', toAyah: 'Gacha (oyat)',
      pageRange: 'Sahifa (1–604)', prevPage: 'Oldingi sahifa', nextPage: 'Keyingi sahifa',
      juzRange: 'Juz (1–30)', prevJuz: 'Oldingi juz', nextJuz: 'Keyingi juz',
      reciter: 'Qori', translation: 'Tarjima', trToggleTitle: "Tarjimani ko'rsatish / yashirish",
      trOn: "Ko'rsatish", trOff: "O'chiq", start: 'Tinglashni boshlash',
      repeat: 'Takrorlash', repEach: 'Har bir oyat', repAll: 'Butun qiroat', infinite: 'Cheksiz',
      presets: 'Tayyor uslublar', pClassic: 'Klassik', pContrast: 'Kontrast', pGold: 'Oltin', pClear: 'Fonsiz', pLight: "Yorug'", pGreen: 'Yashil',
      showOn: "Subtitle'da ko'rsatish", showAr: 'Arabcha matn', showLabel: 'Sura va oyat raqami',
      wordHl: "O'qilayotgan so'zni bo'yash", wordHlSub: "So'z qori bilan birga harfma-harf bo'yaladi",
      tajweed: 'Tajvid ranglari', tajweedSub: "G'unna, ixfo, idg'om, qalqala, madlar…",
      font: 'Shrift', fArabic: 'Arabcha', fTranslation: 'Tarjima', fSystem: 'Tizim shrifti',
      arSize: "Arabcha o'lchami", trSize: "Tarjima o'lchami", trWeight: 'Tarjima qalinligi',
      wRegular: 'Oddiy', wSemi: 'Yarim qalin', wBold: 'Qalin', lineH: "Qator oralig'i",
      colors: 'Ranglar', cArabic: 'Arabcha matn', cTranslation: 'Tarjima', cBg: 'Fon', cOutline: 'Kontur',
      cHl: "O'qilayotgan so'z", auto: 'Avto', autoTitle: 'Matn va fon rangiga qarab avtomatik',
      bgContrast: 'Fon va kontrast', bgAlpha: 'Fon zichligi', opacity: 'Shaffoflik', shadow: 'Soya',
      outline: 'Kontur', radius: 'Burchaklar', pad: "Ichki bo'shliq",
      subWin: 'Subtitle oynasi', allScreens: 'Barcha monitorlarda', allScreensSub: "O'chirilsa faqat asosiy monitorda chiqadi",
      moveHint: "Subtitle'ni boshqa joyga ko'chirish uchun yuqoridagi “Joyi” tugmasini bosing, sudrang, so'ng “Qulflash”ni bosing.",
      shortcuts: 'Tezkor tugmalar',
      shortcutsHint: "Istalgan ilova ichida ishlaydi. Standart: ⌃ ⌥ + harf. O'zgartirish uchun maydonni bosib, yangi kombinatsiyani bosing.",
      cache: 'Kesh', cacheHint: 'Tinglangan suralar internetsiz ochiladi.', clear: 'Tozalash',
      language: 'Til',
      cacheSize: 'Hajmi: {mb} MB', cacheCleared: 'Kesh tozalandi.',
      phSurah: 'Raqam yoki nom: 36, yosin, mulk, الملك …', phReciter: 'Qori ismi: afasy, sudays, husariy …',
      phTranslation: 'Til yoki tarjimon: rus, english, türk, kuliev …',
      trLimit: "Ko'pi bilan {max} ta tarjima tanlash mumkin.", trLoading: 'Tarjima yuklanmoqda…', trChanged: 'Tarjima almashtirildi.',
      error: 'Xato: {msg}', pageTitle: '{n}-sahifa', juzTitle: '{n}-juz', surahN: 'Sura {n}',
      loadingSurahs: "Suralar ro'yxati yuklanmoqda…", ready: 'Tayyor.', versesCount: '{n} oyat',
      finished: '{name} tugadi.', audioFail: 'Audio yuklanmadi: {label}. Internetni yoki boshqa qorini tekshiring.',
      playError: 'Ijro xatosi: {msg}', loadingText: 'Matn yuklanmoqda…', noVerses: 'Bu oraliqda oyat topilmadi',
      statAyah: 'oyat {a}/{b}', statRange: 'qiroat {a}/{b}', screens: 'Ulangan monitorlar: {n}',
      scClickTitle: 'Bosing va yangi kombinatsiyani kiriting', scOff: "O'chirish", scDefault: 'Standart: {k}',
      scBusy: 'Bu kombinatsiyani boshqa dastur yoki tizim band qilgan — boshqasini tanlang.',
      scPress: 'Kombinatsiyani bosing… (Esc — bekor)', scNeedMod: 'Kamida bitta ⌃ / ⌥ / ⌘ tugmasi kerak',
      selected: 'Tanlangan: {n}', none: 'Tanlanmagan', nothingFound: 'Hech narsa topilmadi', nTranslations: '{n} ta tarjima tanlangan', done: 'Tayyor',
      dragHint: 'Sudrab joylashtiring · tugatgach “Qulflash”ni bosing',
      sampleText: 'Mehribon va rahmli Allohning nomi bilan boshlayman.', sample: 'Namuna', sampleShort: 'Namuna matn',
      tjGhunnah: "G'unna", tjIkhfa: 'Ixfo', tjIkhfaShafawi: 'Ixfoi shafaviy', tjIdghamG: "Idg'om g'unnali",
      tjIdghamNoG: "Idg'om g'unnasiz", tjIdghamShafawi: "Idg'omi shafaviy", tjIqlab: 'Iqlob', tjQalqalah: 'Qalqala',
      tjMaddNormal: 'Madd tabiiy', tjMaddPerm: 'Madd joiz', tjMaddOblig: 'Madd vojib', tjMaddNec: 'Madd lozim',
      tjSilent: "O'qilmaydigan harf",
      scToggleSubtitle: "Subtitle'ni yashirish / ko'rsatish", scPlayPause: 'Play / pauza', scNextAyah: 'Keyingi oyat',
      scPrevAyah: 'Oldingi oyat', scMoveSubtitle: "Subtitle joyini o'zgartirish",
      trayHide: "Subtitle'ni yashirish", trayShow: "Subtitle'ni ko'rsatish", trayPlay: 'Play', trayPause: 'Pauza',
      trayMove: "Subtitle joyini o'zgartirish", trayLock: 'Subtitle joyini qulflash', trayOpen: 'Asosiy oynani ochish', trayQuit: 'Chiqish',
    },
  };

  const LANGS = { en: 'English', uz: "O'zbekcha" };

  function make(lang) {
    const dict = STR[lang] || STR.en;
    return (key, vars) => {
      let s = dict[key] ?? STR.en[key] ?? key;
      if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
      return s;
    };
  }

  // Fill elements marked with data-i18n / data-i18n-title / data-i18n-aria / data-i18n-ph
  function apply(t, rootEl) {
    rootEl.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    rootEl.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    rootEl.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  }

  const api = { STR, LANGS, make, apply };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.I18N = api;
    const lang = (root.bridge && root.bridge.lang) || 'en';
    root.LANG = STR[lang] ? lang : 'en';
    root.t = make(root.LANG);
  }
})(typeof window !== 'undefined' ? window : globalThis);
