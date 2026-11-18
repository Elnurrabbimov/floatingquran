// Matn va tarjima: Quran.com (Quran Foundation) API
// Audio: everyayah.com — har bir oyat alohida mp3 fayl
const API = 'https://api.qurancdn.com/api/qdc';
const AUDIO = 'https://everyayah.com/data';

const $ = (id) => document.getElementById(id);
const statusEl = $('status');

let queue = [];        // [{ file: '002001', label, arabic, translation }]
let index = -1;        // joriy oyat indeksi
let current = null;    // joriy Audio
let preloaded = null;  // { i, reciter, promise } keyingi oyat oldindan yuklanmoqda
let chapterName = '';

const setStatus = (t) => { statusEl.textContent = t; };
const pad3 = (n) => String(n).padStart(3, '0');

// --- Disk keshi: bir marta yuklangan matn va audio qayta yuklanmaydi ---
const CACHE_NAME = 'sq-cache-v1';

async function cachedFetch(url) {
  let cache = null;
  try {
    cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(url);
    if (hit) return hit;
  } catch {}
  const res = await fetch(url);
  if (res.ok && cache) {
    try { await cache.put(url, res.clone()); } catch {}
  }
  return res;
}

async function isCached(url) {
  try { return !!(await (await caches.open(CACHE_NAME)).match(url)); } catch { return false; }
}

async function getJSON(url) {
  const res = await cachedFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function showCacheSize() {
  try {
    const { usage } = await navigator.storage.estimate();
    $('cacheInfo').textContent = `Kesh hajmi: ${(usage / 1024 / 1024).toFixed(1)} MB`;
  } catch {}
}

async function clearCache() {
  try { await caches.delete(CACHE_NAME); } catch {}
  loadedKey = null;
  showCacheSize();
  setStatus('Kesh tozalandi.');
}

function stripHtml(s) {
  // <sup foot_note=...>1</sup> izohlarini olib tashlash
  return (s || '').replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/<[^>]+>/g, '').trim();
}

// --- Sura va qori tanlagichlari ---
// O'zbekcha nomlar qidiruv uchun ("baqara", "yosin", "mulk" ...)
const UZ_NAMES = [
  'Fotiha', 'Baqara', 'Oli Imron', 'Niso', 'Moida', "An'om", "A'rof", 'Anfol', 'Tavba', 'Yunus',
  'Hud', 'Yusuf', "Ra'd", 'Ibrohim', 'Hijr', 'Nahl', 'Isro', 'Kahf', 'Maryam', 'Toho',
  'Anbiyo', 'Haj', "Mo'minun", 'Nur', 'Furqon', 'Shuaro', 'Naml', 'Qasas', 'Ankabut', 'Rum',
  'Luqmon', 'Sajda', 'Ahzob', 'Saba', 'Fotir', 'Yosin', 'Soffot', 'Sod', 'Zumar', "G'ofir",
  'Fussilat', 'Shuro', 'Zuxruf', 'Duxon', 'Josiya', 'Ahqof', 'Muhammad', 'Fath', 'Hujurot', 'Qof',
  'Zoriyot', 'Tur', 'Najm', 'Qamar', 'Rohman', 'Voqea', 'Hadid', 'Mujodala', 'Hashr', 'Mumtahana',
  'Saf', "Jum'a", 'Munofiqun', "Tag'obun", 'Taloq', 'Tahrim', 'Mulk', 'Qalam', 'Hoqqa', "Ma'orij",
  'Nuh', 'Jin', 'Muzzammil', 'Muddassir', 'Qiyomat', 'Inson', 'Mursalot', "Naba'", "Nozi'ot", 'Abasa',
  'Takvir', 'Infitor', 'Mutaffifun', 'Inshiqoq', 'Buruj', 'Toriq', "A'lo", "G'oshiya", 'Fajr', 'Balad',
  'Shams', 'Layl', 'Zuho', 'Sharh', 'Tin', 'Alaq', 'Qadr', 'Bayyina', 'Zalzala', 'Odiyot',
  "Qori'a", 'Takosur', 'Asr', 'Humaza', 'Fil', 'Quraysh', "Mo'un", 'Kavsar', 'Kofirun', 'Nasr',
  'Masad', 'Ixlos', 'Falaq', 'Nos',
];

// everyayah.com papka nomi, ko'rinadigan nom, qidiruv uchun qo'shimcha nomlar
const RECITERS = [
  ['Alafasy_128kbps', 'Mishari Rashid al-Afasy', 'mishary alafasy afasi'],
  ['Abdul_Basit_Murattal_192kbps', 'Abdulbosit Abdussamad', 'abdul basit abdulbasit murattal'],
  ['Abdurrahmaan_As-Sudais_192kbps', 'Abdurrahmon as-Sudays', 'sudais sudays'],
  ['Husary_128kbps', 'Mahmud Xalil al-Husariy', 'husary husari mahmoud khalil'],
  ['Minshawy_Murattal_128kbps', 'Muhammad Siddiq al-Minshoviy', 'minshawi minshavi'],
  ['Saood_ash-Shuraym_128kbps', "Sa'ud ash-Shuraym", 'shuraim shuraym saud'],
  ['Abu_Bakr_Ash-Shaatree_128kbps', 'Abu Bakr ash-Shotiriy', 'shatri shatree shotiri'],
  ['Hani_Rifai_192kbps', 'Honi ar-Rifoiy', 'hani rifai'],
  ['Yasser_Ad-Dussary_128kbps', 'Yosir ad-Dusariy', 'yasser dossari dosari'],
  ['MaherAlMuaiqly128kbps', 'Mohir al-Muayqiliy', 'maher muaiqly muayqili'],
  ['Ghamadi_40kbps', "Saad al-G'omidiy", 'ghamdi ghamadi gomidi saad'],
  ['Nasser_Alqatami_128kbps', 'Nosir al-Qatomiy', 'nasser qatami qatomi'],
];

let chapters = [];

const chapterPicker = createPicker({
  root: $('chapterPicker'),
  hiddenInput: $('chapter'),
  placeholder: 'Raqam yoki nom: 36, yosin, mulk, الملك ...',
  onSelect: () => loadSurah(),
});

const reciterPicker = createPicker({
  root: $('reciterPicker'),
  hiddenInput: $('reciter'),
  placeholder: 'Qori ismi: afasy, sudays, husariy ...',
  onSelect: () => {
    dropPreloaded();
    savePrefs();
    // Ijro ketayotgan bo'lsa — joriy oyatni yangi qori ovozida qayta boshlash
    if (queue.length && index >= 0) playIndex(index);
  },
});
reciterPicker.setItems(RECITERS.map(([value, label, extra]) => ({
  value, label, search: [normalize(label), ...extra.split(' ').map(normalize)],
})));

// --- Tarjima tanlagichi: API'dagi barcha tillar ---
const LANG_UZ = {
  uzbek: "O'zbekcha", russian: 'Ruscha', english: 'Inglizcha', turkish: 'Turkcha', kazakh: 'Qozoqcha',
  tajik: 'Tojikcha', kyrgyz: "Qirg'izcha", azeri: 'Ozarbayjoncha', tatar: 'Tatarcha', uyghur: "Uyg'urcha",
  bashkir: 'Boshqircha', persian: 'Forscha', urdu: 'Urducha', arabic: 'Arabcha', german: 'Nemischa',
  french: 'Fransuzcha', spanish: 'Ispancha', italian: 'Italyancha', portuguese: 'Portugalcha',
  indonesian: 'Indonezcha', malay: 'Malaycha', chinese: 'Xitoycha', japanese: 'Yaponcha', korean: 'Koreyscha',
  hindi: 'Hindcha', bengali: 'Bengalcha', pashto: 'Pushtucha', kurdish: 'Kurdcha', albanian: 'Albancha',
  bosnian: 'Bosniyacha', chechen: 'Chechencha', dutch: 'Gollandcha', swedish: 'Shvedcha', polish: 'Polyakcha',
  ukrainian: 'Ukraincha', thai: 'Taycha', vietnamese: 'Vyetnamcha', swahili: 'Suaxilicha', somali: 'Somalicha',
};
// Ro'yxatda birinchi chiqadigan tillar
const LANG_ORDER = ['uzbek', 'russian', 'english', 'turkish', 'kazakh', 'tajik', 'kyrgyz', 'azeri', 'tatar', 'uyghur', 'arabic'];

const MAX_TRANSLATIONS = 4;
let trChangeTimer;
const translationPicker = createPicker({
  root: $('translationPicker'),
  hiddenInput: $('translation'),
  placeholder: 'Til yoki tarjimon: rus, english, türk, kuliev ...',
  multiple: true,
  max: MAX_TRANSLATIONS,
  onLimit: (max) => setStatus(`Ko'pi bilan ${max} ta tarjima tanlash mumkin.`),
  // Bir nechtasini ketma-ket belgilaganda har birida yuklamaslik uchun kichik kechikish
  onSelect: () => { clearTimeout(trChangeTimer); trChangeTimer = setTimeout(changeTranslation, 350); },
});

async function loadTranslations() {
  const [tr, lg] = await Promise.all([
    getJSON(`${API}/resources/translations?language=en`),
    getJSON(`${API}/resources/languages?language=en`).catch(() => ({ languages: [] })),
  ]);
  const langs = Object.fromEntries(lg.languages.map((l) => [l.name.toLowerCase(), l]));
  const rank = (name) => { const i = LANG_ORDER.indexOf(name); return i < 0 ? 999 : i; };
  const langTitle = (name) => LANG_UZ[name] || name.charAt(0).toUpperCase() + name.slice(1);

  const items = tr.translations
    .filter((t) => t.language_name)
    .sort((a, b) => rank(a.language_name) - rank(b.language_name)
      || langTitle(a.language_name).localeCompare(langTitle(b.language_name))
      || a.name.localeCompare(b.name))
    .map((t) => {
      const l = langs[t.language_name] || {};
      const native = l.native_name && l.native_name !== langTitle(t.language_name) ? ` · ${l.native_name}` : '';
      return {
        value: t.id,
        label: `${langTitle(t.language_name)} — ${t.name}`,
        short: `${langTitle(t.language_name)} · ${t.author_name || t.name}`,
        sub: `${t.language_name}${native}`,
        search: [t.language_name, langTitle(t.language_name), l.native_name, l.iso_code, t.name, t.author_name]
          .filter(Boolean).map(normalize),
      };
    });
  translationPicker.setItems(items);
}

// Tarjima almashtirilganda audio to'xtamaydi — faqat matn yangilanadi
async function changeTranslation() {
  savePrefs();
  if (!queue.length) return;
  const chapter = +$('chapter').value;
  const translation = $('translation').value;
  setStatus('Tarjima yuklanmoqda...');
  try {
    const verses = await loadVerses(chapter, translation);
    if (translation !== $('translation').value) return; // shu orada yana o'zgardi
    const byKey = Object.fromEntries(verses.map((v) => [v.key, v.translations]));
    const b = queue[0]?.label === 'Basmala' ? await loadBismillah(translation) : null;
    for (const item of queue) item.translations = item.label === 'Basmala' ? b.translations : byKey[item.label] || [];
    loadedKey = `${chapter}|${translation}`;
    if (index >= 0) {
      const item = queue[index];
      showItem(item);
      setStatus(`${chapterName} · ${item.label} (${index + 1}/${queue.length})`);
    } else {
      setStatus('Tarjima almashtirildi.');
    }
  } catch (e) {
    setStatus('Xato: ' + e.message);
  }
}

function surahTitle(c) {
  return `${c.id}. ${UZ_NAMES[c.id - 1] || c.name_simple} — ${c.name_arabic}`;
}

function stepSurah(delta) {
  const next = +$('chapter').value + delta;
  if (next < 1 || next > 114 || !chapterPicker.setValue(next)) return;
  loadSurah();
}

async function loadLists() {
  setStatus('Suralar ro\'yxati yuklanmoqda...');
  const [ch] = await Promise.all([
    getJSON(`${API}/chapters?language=uz`),
    loadTranslations().catch((e) => console.error('Tarjimalar ro\'yxati yuklanmadi', e)),
  ]);
  chapters = ch.chapters;
  chapterPicker.setItems(chapters.map((c) => ({
    value: c.id,
    label: `${c.id}. ${UZ_NAMES[c.id - 1] || c.name_simple}`,
    sub: `${c.name_simple} · ${c.verses_count} oyat`,
    right: c.name_arabic,
    search: [
      normalize(UZ_NAMES[c.id - 1]),
      normalize(c.name_simple),
      normalize(c.name_simple.replace(/^[a-z]+-/i, '')), // "An-Nas" -> "nas"
      normalize(c.name_complex),
      normalize(c.name_arabic),
    ],
  })));
  restorePrefs();
  setStatus('Tayyor.');
}

// translationIds: "55,45" — API tarjimalarni aralash tartibda qaytaradi, shuning uchun resource_id bo'yicha joylaymiz
function pickTranslations(v, translationIds) {
  const byId = Object.fromEntries((v.translations || []).map((t) => [String(t.resource_id), stripHtml(t.text)]));
  return translationIds.split(',').map((id) => byId[id] || '').filter(Boolean);
}

async function loadVerses(chapter, translationIds) {
  const out = [];
  let page = 1;
  while (page) {
    const d = await getJSON(
      `${API}/verses/by_chapter/${chapter}?translations=${translationIds}&fields=text_uthmani&words=false&per_page=300&page=${page}`
    );
    for (const v of d.verses) {
      out.push({
        verseNumber: v.verse_number,
        key: v.verse_key,
        arabic: v.text_uthmani,
        translations: pickTranslations(v, translationIds),
      });
    }
    page = d.pagination?.next_page || null;
  }
  return out;
}

async function loadBismillah(translationIds) {
  const d = await getJSON(`${API}/verses/by_key/1:1?translations=${translationIds}&fields=text_uthmani&words=false`);
  return { arabic: d.verse.text_uthmani, translations: pickTranslations(d.verse, translationIds) };
}

function showItem(item) {
  window.bridge.showVerse({ arabic: item.arabic, translations: item.translations, label: `${chapterName} · ${item.label}` });
  window.bridge.setPlayerState({ title: `${chapterName} · ${item.label}` });
  updateNowPlaying(item);
}

function audioUrl(file) {
  return `${AUDIO}/${$('reciter').value}/${file}.mp3`;
}

// Audio keshdan olinadi (yo'q bo'lsa yuklab, keshga yoziladi), blob URL orqali ijro etiladi
async function makeAudio(i) {
  const res = await cachedFetch(audioUrl(queue[i].file));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blobUrl = URL.createObjectURL(await res.blob());
  const a = new Audio(blobUrl);
  a._blobUrl = blobUrl;
  a.preload = 'auto';
  return a;
}

function releaseAudio(a) {
  if (!a) return;
  a.onended = a.onerror = a.onplay = a.onpause = null;
  a.pause();
  if (a._blobUrl) URL.revokeObjectURL(a._blobUrl);
}

function preload(i) {
  const reciter = $('reciter').value;
  const p = makeAudio(i);
  p.catch(() => {});
  preloaded = { i, reciter, promise: p };
}

function dropPreloaded() {
  if (preloaded) preloaded.promise.then(releaseAudio, () => {});
  preloaded = null;
}

function stopCurrent() {
  releaseAudio(current);
  current = null;
}

function updatePlayBtn() {
  const playing = !!(current && !current.paused);
  $('playBtn').textContent = playing ? '⏸' : '▶';
  window.bridge.setPlayerState({ playing });
}

let playToken = 0; // tez-tez bosilganda eski so'rovlar natijasini e'tiborsiz qoldirish

async function playIndex(i) {
  const token = ++playToken;
  stopCurrent();
  if (i < 0 || i >= queue.length) {
    index = -1;
    dropPreloaded();
    window.bridge.showVerse(null);
    setStatus(`${chapterName} tugadi.`);
    updatePlayBtn();
    return;
  }
  index = i;
  const item = queue[i];

  showItem(item);
  setStatus(`${chapterName} · ${item.label} (${i + 1}/${queue.length})`);

  let audio;
  try {
    if (preloaded && preloaded.i === i && preloaded.reciter === $('reciter').value) {
      const p = preloaded.promise;
      preloaded = null;
      audio = await p;
    } else {
      dropPreloaded();
      audio = await makeAudio(i);
    }
  } catch {
    if (token === playToken) setStatus(`Audio yuklanmadi: ${item.label}. Internetni yoki boshqa qorini tekshiring.`);
    return;
  }
  if (token !== playToken) { releaseAudio(audio); return; }

  current = audio;
  current.volume = +$('volume').value / 100;
  current.onended = handleEnded;
  current.onplay = current.onpause = updatePlayBtn;
  current.play().catch((e) => setStatus('Ijro xatosi: ' + e.message));

  // Keyingi oyatni oldindan yuklash — oyatlar orasida pauza bo'lmasin
  const next = i + 1 < queue.length ? i + 1 : repeatMode === 'surah' ? 0 : -1;
  if (next >= 0) preload(next);
  showCacheSize();
}

let loadedKey = null; // hozir ochiq sura: "sura|tarjima"

async function loadSurah() {
  const chapter = +$('chapter').value;
  const translation = $('translation').value;
  savePrefs();

  // Shu sura allaqachon ochiq — qayta yuklamasdan davom ettiramiz
  const key = `${chapter}|${translation}`;
  if (key === loadedKey && queue.length) {
    if (current) { if (current.paused) current.play(); }
    else playIndex(index >= 0 ? index : 0);
    return;
  }

  $('load').disabled = true;
  const cached = await isCached(
    `${API}/verses/by_chapter/${chapter}?translations=${translation}&fields=text_uthmani&words=false&per_page=300&page=1`
  );
  setStatus(cached ? 'Keshdan ochilmoqda...' : 'Matn yuklanmoqda...');
  try {
    const verses = await loadVerses(chapter, translation);
    const c = chapters.find((x) => x.id === chapter);
    chapterName = c ? surahTitle(c) : `Sura ${chapter}`;

    queue = verses.map((v) => ({
      file: pad3(chapter) + pad3(v.verseNumber),
      label: v.key,
      arabic: v.arabic,
      translations: v.translations,
    }));

    // Fotiha va Tavbadan boshqa suralar boshida Basmala o'qiladi
    if (chapter !== 1 && chapter !== 9) {
      const b = await loadBismillah(translation);
      queue.unshift({ file: '001001', label: 'Basmala', ...b });
    }

    dropPreloaded();
    loadedKey = key;
    playIndex(0);
  } catch (e) {
    setStatus('Xato: ' + e.message);
  } finally {
    $('load').disabled = false;
  }
}

// --- Now Playing: lock screen, Control Center, media tugmalari ---
function updateNowPlaying(item) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: item.translations?.[0] || item.arabic,
    artist: item.arabic,
    album: `${chapterName} · ${item.label}`,
  });
}

if ('mediaSession' in navigator) {
  const ms = navigator.mediaSession;
  ms.setActionHandler('play', () => current?.play());
  ms.setActionHandler('pause', () => current?.pause());
  ms.setActionHandler('previoustrack', () => { if (queue.length) playIndex(Math.max(0, index - 1)); });
  ms.setActionHandler('nexttrack', () => { if (queue.length && index >= 0) playIndex(index + 1); });
}

// --- Qayta ijro va takrorlash ---
const REPEAT_MODES = ['off', 'ayah', 'surah'];
const REPEAT_LABELS = { off: 'o\'chiq', ayah: 'oyat', surah: 'sura' };
let repeatMode = 'off';

function handleEnded() {
  if (repeatMode === 'ayah') {
    current.currentTime = 0;
    current.play();
    return;
  }
  if (repeatMode === 'surah' && index + 1 >= queue.length) {
    playIndex(0);
    return;
  }
  playIndex(index + 1);
}

function replay() {
  if (current) {
    current.currentTime = 0;
    current.play();
  } else if (queue.length) {
    playIndex(0); // sura tugagan — boshidan
  }
}

function setRepeatMode(mode) {
  repeatMode = REPEAT_MODES.includes(mode) ? mode : 'off';
  $('repeatBtn').textContent = `🔁 Takrorlash: ${REPEAT_LABELS[repeatMode]}`;
  $('repeatBtn').classList.toggle('active', repeatMode !== 'off');
  try { localStorage.setItem('repeatMode', repeatMode); } catch {}
}

function togglePlay() {
  if (!current) {
    if (queue.length) playIndex(0);
    else loadSurah();
    return;
  }
  current.paused ? current.play() : current.pause();
}

// --- Uslub sozlamalari ---
const STYLE_EL = [...document.querySelectorAll('[data-style]')];

const PRESETS = {
  classic:  { arColor: '#ffffff', trColor: '#e8eef5', bgColor: '#0a0e14', bgAlpha: 55, shadow: 3, outline: 0, outlineColor: '#000000', opacity: 100 },
  contrast: { arColor: '#ffff00', trColor: '#ffffff', bgColor: '#000000', bgAlpha: 90, shadow: 0, outline: 1, outlineColor: '#000000', opacity: 100, trWeight: '700' },
  gold:     { arColor: '#f5d27a', trColor: '#fff6dc', bgColor: '#1a1206', bgAlpha: 70, shadow: 4, outline: 0, outlineColor: '#000000', opacity: 100 },
  clear:    { arColor: '#ffffff', trColor: '#ffffff', bgColor: '#000000', bgAlpha: 0, shadow: 8, outline: 2, outlineColor: '#000000', opacity: 100, trWeight: '600' },
  light:    { arColor: '#10261f', trColor: '#1f2937', bgColor: '#fdfaf2', bgAlpha: 88, shadow: 0, outline: 0, outlineColor: '#ffffff', opacity: 100 },
  green:    { arColor: '#ffffff', trColor: '#d9f5e8', bgColor: '#0b3d2e', bgAlpha: 80, shadow: 2, outline: 0, outlineColor: '#000000', opacity: 100 },
};

function readStyle() {
  const v = (id) => $(id).value;
  return {
    arFont: v('arFont'), trFont: v('trFont'), trWeight: v('trWeight'),
    arSize: +v('arSize'), trSize: +v('trSize'), line: +v('line'),
    arColor: v('arColor'), trColor: v('trColor'), bgColor: v('bgColor'), outlineColor: v('outlineColor'),
    bgAlpha: +v('bgAlpha') / 100, opacity: +v('opacity') / 100,
    shadow: +v('shadow'), outline: +v('outline'), radius: +v('radius'), pad: +v('pad'),
    showArabic: $('showAr').checked, showTranslation: $('showTr').checked, showLabel: $('showLabel').checked,
  };
}

function pushStyle(preview = false) {
  for (const el of STYLE_EL) {
    const out = document.getElementById(el.id + 'Val');
    if (out) out.textContent = el.value;
  }
  const trOn = $('showTr').checked;
  document.querySelector('.switch-text').textContent = trOn ? 'Ko\'rsatish' : 'O\'chiq';
  $('translationPicker').classList.toggle('off', !trOn);
  window.bridge.setStyle({ ...readStyle(), preview });
  savePrefs();
}

function applyPreset(name) {
  for (const [id, val] of Object.entries(PRESETS[name])) $(id).value = val;
  pushStyle(true);
}

const PREF_IDS = ['chapter', 'reciter', 'translation', 'volume', ...STYLE_EL.filter((e) => e.type !== 'checkbox').map((e) => e.id)];
const CHECK_IDS = STYLE_EL.filter((e) => e.type === 'checkbox').map((e) => e.id);

function savePrefs() {
  try {
    const p = Object.fromEntries(PREF_IDS.map((id) => [id, $(id).value]));
    for (const id of CHECK_IDS) p[id] = $(id).checked;
    localStorage.setItem('prefs', JSON.stringify(p));
  } catch {}
}
function restorePrefs() {
  try {
    const p = JSON.parse(localStorage.getItem('prefs') || '{}');
    for (const id of PREF_IDS) {
      if (p[id] === undefined) continue;
      const el = $(id);
      // select'da mavjud bo'lmagan eski qiymatni o'tkazib yuborish
      if (el.tagName === 'SELECT' && ![...el.options].some((o) => o.value === p[id])) continue;
      el.value = p[id];
    }
    for (const id of CHECK_IDS) if (p[id] !== undefined) $(id).checked = p[id];
  } catch {}
  // Tanlagichlar: saqlangan qiymat yaroqsiz bo'lsa (masalan eski versiyadan) — standart qiymat
  if (!chapterPicker.setValue($('chapter').value)) chapterPicker.setValue(1);
  if (!reciterPicker.setValue($('reciter').value)) reciterPicker.setValue(RECITERS[0][0]);
  if (translationPicker.items().length && !translationPicker.setValue($('translation').value)) translationPicker.setValue(55);
  pushStyle();
}

STYLE_EL.forEach((el) => el.addEventListener('input', () => pushStyle(true)));
document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
$('volume').addEventListener('input', () => {
  if (current) current.volume = +$('volume').value / 100;
  savePrefs();
});
$('load').addEventListener('click', loadSurah);
$('playBtn').addEventListener('click', togglePlay);
$('prevBtn').addEventListener('click', () => { if (queue.length) playIndex(Math.max(0, index - 1)); });
$('nextBtn').addEventListener('click', () => { if (queue.length && index >= 0) playIndex(index + 1); });
$('replayBtn').addEventListener('click', replay);
$('repeatBtn').addEventListener('click', () => {
  setRepeatMode(REPEAT_MODES[(REPEAT_MODES.indexOf(repeatMode) + 1) % REPEAT_MODES.length]);
});
try { setRepeatMode(localStorage.getItem('repeatMode')); } catch { setRepeatMode('off'); }
$('prevSurah').addEventListener('click', () => stepSurah(-1));
$('nextSurah').addEventListener('click', () => stepSurah(1));
$('clearCacheBtn').addEventListener('click', clearCache);
showCacheSize();
$('lockBtn').addEventListener('click', () => window.bridge.toggleLock());
$('visBtn').addEventListener('click', () => window.bridge.toggleVisible());
window.bridge.onLocked((locked) => {
  $('lockBtn').textContent = locked ? 'Joyini o\'zgartirish' : 'Qulflash';
});
// Global hotkey va menu bar buyruqlari
window.bridge.onPlayerCmd((cmd) => {
  if (cmd === 'toggle') togglePlay();
  else if (cmd === 'next') { if (queue.length && index >= 0) playIndex(index + 1); }
  else if (cmd === 'prev') { if (queue.length) playIndex(Math.max(0, index - 1)); }
});
window.bridge.onVisible((visible) => {
  $('visBtn').textContent = visible ? 'Yashirish' : 'Ko\'rsatish';
});

// --- Tezkor tugmalar sozlamasi ---
const IS_MAC = navigator.platform.toUpperCase().includes('MAC');
const KEY_SYMBOLS = IS_MAC
  ? { Control: '⌃', Alt: '⌥', Shift: '⇧', Command: '⌘', CommandOrControl: '⌘', Super: '⌘' }
  : { Control: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Command: 'Win', CommandOrControl: 'Ctrl', Super: 'Win' };
const CODE_KEYS = {
  Space: 'Space', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Enter: 'Return', Tab: 'Tab',
  Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: '\'', Comma: ',', Period: '.',
  Slash: '/', Backslash: '\\', Backquote: '`', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
};

function prettyAccel(accel) {
  if (!accel) return 'O\'chirilgan';
  const parts = accel.split('+');
  const key = parts.pop();
  const mods = parts.map((m) => KEY_SYMBOLS[m] || m);
  return IS_MAC ? mods.join('') + key : [...mods, key].join('+');
}

// KeyboardEvent -> Electron accelerator. e.code ishlatiladi: Option bosilganda e.key boshqa harfga aylanadi
function accelFromEvent(e) {
  let key = null;
  if (/^Key[A-Z]$/.test(e.code)) key = e.code.slice(3);
  else if (/^Digit\d$/.test(e.code)) key = e.code.slice(5);
  else if (/^Numpad\d$/.test(e.code)) key = 'num' + e.code.slice(6);
  else if (/^F\d{1,2}$/.test(e.code)) key = e.code;
  else if (CODE_KEYS[e.code]) key = CODE_KEYS[e.code];
  if (!key) return null; // faqat modifikator bosildi
  const mods = [];
  if (e.ctrlKey) mods.push('Control');
  if (e.altKey) mods.push('Alt');
  if (e.shiftKey) mods.push('Shift');
  if (e.metaKey) mods.push(IS_MAC ? 'Command' : 'Super');
  return { accel: [...mods, key].join('+'), hasMod: mods.length > 0 && !(mods.length === 1 && mods[0] === 'Shift'), isFn: /^F\d/.test(key) };
}

let recording = null; // { action, el }

function stopRecording(save) {
  if (!recording) return;
  const { action, el } = recording;
  recording = null;
  el.classList.remove('recording');
  if (save !== undefined) window.bridge.setShortcut(action, save).then(renderShortcuts);
  else { window.bridge.pauseShortcuts(false); renderShortcuts(); }
}

async function renderShortcuts(state) {
  state = state || await window.bridge.getShortcuts();
  const box = $('shortcutList');
  box.innerHTML = '';
  for (const [action, s] of Object.entries(state)) {
    const row = document.createElement('div');
    row.className = 'sc-row';
    row.innerHTML = `
      <span class="sc-title"></span>
      <button class="sc-key ${s.accel ? '' : 'off'}" title="Bosing va yangi kombinatsiyani kiriting"></button>
      <button class="small" data-act="off" title="O'chirish">✕</button>
      <button class="small" data-act="reset" title="Standart: ${prettyAccel(s.def)}">↺</button>
      ${s.error ? '<div class="sc-err">Bu kombinatsiyani boshqa dastur yoki tizim band qilgan — boshqasini tanlang.</div>' : ''}`;
    row.querySelector('.sc-title').textContent = s.title;
    const keyEl = row.querySelector('.sc-key');
    keyEl.textContent = prettyAccel(s.accel);
    keyEl.addEventListener('click', () => {
      stopRecording();
      recording = { action, el: keyEl };
      keyEl.classList.add('recording');
      keyEl.textContent = 'Kombinatsiyani bosing… (Esc — bekor)';
      window.bridge.pauseShortcuts(true);
      keyEl.focus();
    });
    keyEl.addEventListener('blur', () => { if (recording?.el === keyEl) stopRecording(); });
    row.querySelector('[data-act="off"]').addEventListener('click', () => window.bridge.setShortcut(action, '').then(renderShortcuts));
    row.querySelector('[data-act="reset"]').addEventListener('click', () => window.bridge.setShortcut(action, null).then(renderShortcuts));
    box.appendChild(row);
  }
}

document.addEventListener('keydown', (e) => {
  if (!recording) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.key === 'Escape') { stopRecording(); return; }
  const r = accelFromEvent(e);
  if (!r) return;
  if (!r.hasMod && !r.isFn) {
    recording.el.textContent = 'Kamida bitta ⌃ / ⌥ / ⌘ tugmasi kerak';
    return;
  }
  stopRecording(r.accel);
}, true);

renderShortcuts();

loadLists().catch((e) => setStatus('Xato: ' + e.message));
