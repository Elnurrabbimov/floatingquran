const { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWin = null;
// Har bir monitor uchun alohida overlay oyna: displayId -> BrowserWindow
const overlays = new Map();
let overlayLocked = true;   // true = click-through, false = drag mumkin
let overlayVisible = true;
let lastVerse = null;
let lastTiming = null;
let lastClock = null;
let lastStyle = null;

// Oddiy sozlamalar (userData/settings.json)
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
let settings = { allScreens: true };
function loadSettings() {
  try { settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) }; } catch {}
}
function saveSettings() {
  try { fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2)); } catch (e) { console.error(e); }
}
const overlayWindows = () => [...overlays.values()].filter((w) => !w.isDestroyed());
const sendOverlays = (channel, payload) => overlayWindows().forEach((w) => w.webContents.send(channel, payload));

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 500,
    height: 820,
    title: 'Suzuvchi Quron',
    icon: path.join(__dirname, 'assets', 'icon.png'), // Windows/Linux oyna ikonkasi
    webPreferences: { preload: path.join(__dirname, 'preload.js'), backgroundThrottling: false },
  });
  mainWin.loadFile(path.join(__dirname, 'index.html'));
  mainWin.on('closed', () => {
    mainWin = null;
    app.quit();
  });
}

function createOverlayWindow(display) {
  const { workArea } = display;
  const width = Math.min(1000, workArea.width - 80);
  const height = 240;

  const win = new BrowserWindow({
    width,
    height,
    x: Math.round(workArea.x + (workArea.width - width) / 2),
    y: Math.round(workArea.y + workArea.height - height - 40),
    show: overlayVisible,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: true,
    skipTaskbar: true,
    focusable: !overlayLocked,
    alwaysOnTop: true,
    // macOS: panel turi fullscreen app'lar ustida ham ko'rinadi
    type: process.platform === 'darwin' ? 'panel' : undefined,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), backgroundThrottling: false },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(overlayLocked, { forward: true });
  const behavior = makeStationary(win);
  if (process.env.SQ_DEBUG) console.log('collectionBehavior =', behavior);
  win.webContents.on('did-finish-load', () => {
    if (lastStyle) win.webContents.send('overlay:style', { ...lastStyle, preview: false });
    win.webContents.send('overlay:locked', overlayLocked);
    if (lastVerse) win.webContents.send('verse:show', lastVerse);
    if (lastTiming) win.webContents.send('verse:timing', lastTiming);
    if (lastClock) win.webContents.send('verse:clock', lastClock);
  });
  win.loadFile(path.join(__dirname, 'overlay.html'));
  return win;
}

// Kerakli monitorlarda overlay bo'lsin, keraksizlarini yopamiz
function syncOverlays() {
  const displays = settings.allScreens ? screen.getAllDisplays() : [screen.getPrimaryDisplay()];
  const wanted = new Set(displays.map((d) => d.id));
  for (const [id, win] of overlays) {
    if (!wanted.has(id) || win.isDestroyed()) {
      if (!win.isDestroyed()) win.destroy();
      overlays.delete(id);
    }
  }
  for (const d of displays) if (!overlays.has(d.id)) overlays.set(d.id, createOverlayWindow(d));
  updateTray();
}

function setAllScreens(on) {
  settings.allScreens = !!on;
  saveSettings();
  syncOverlays();
  mainWin?.webContents.send('overlay:all-screens', settings.allScreens);
}

// macOS: "Show Desktop" va Mission Control'da oyna joyida qolishi uchun
// NSWindowCollectionBehaviorStationary flag'ini qo'shamiz (Electron'da API yo'q, FFI orqali)
function makeStationary(win) {
  if (process.platform !== 'darwin') return;
  try {
    const koffi = require('koffi');
    const objc = koffi.load('/usr/lib/libobjc.A.dylib');
    const sel = objc.func('uint64 sel_registerName(const char *)');
    const send0 = objc.func('objc_msgSend', 'uint64', ['uint64', 'uint64']);
    const send1 = objc.func('objc_msgSend', 'void', ['uint64', 'uint64', 'uint64']);

    const view = win.getNativeWindowHandle().readBigUInt64LE(0); // NSView*
    const nsWindow = BigInt(send0(view, sel('window')));
    const MANAGED = 1n << 2n;
    const TRANSIENT = 1n << 3n;
    const STATIONARY = 1n << 4n;
    const IGNORES_CYCLE = 1n << 6n;
    const FULLSCREEN_PRIMARY = 1n << 7n;
    const current = BigInt(send0(nsWindow, sel('collectionBehavior')));
    // Managed/Transient/Stationary va FullScreenPrimary/Auxiliary bir-birini istisno qiladi
    const next = (current & ~(MANAGED | TRANSIENT | FULLSCREEN_PRIMARY)) | STATIONARY | IGNORES_CYCLE;
    send1(nsWindow, sel('setCollectionBehavior:'), next);
    return BigInt(send0(nsWindow, sel('collectionBehavior')));
  } catch (e) {
    console.error('makeStationary failed:', e);
  }
}

function setOverlayLocked(locked) {
  overlayLocked = locked;
  for (const w of overlayWindows()) {
    w.setIgnoreMouseEvents(locked, { forward: true });
    w.setFocusable(!locked);
    w.webContents.send('overlay:locked', locked);
  }
  mainWin?.webContents.send('overlay:locked', locked);
  updateTray();
}

function toggleOverlayVisible() {
  overlayVisible = !overlayVisible;
  for (const w of overlayWindows()) overlayVisible ? w.showInactive() : w.hide();
  mainWin?.webContents.send('overlay:visible', overlayVisible);
  updateTray();
}

function playerCmd(cmd) {
  mainWin?.webContents.send('player:cmd', cmd);
}

function showMainWindow() {
  if (!mainWin) return;
  if (mainWin.isMinimized()) mainWin.restore();
  mainWin.show();
  mainWin.focus();
}

// --- Global hotkey'lar: foydalanuvchi o'zgartira oladi, userData/shortcuts.json da saqlanadi ---
// Standart: ⌃⌥ (Control+Option) — boshqa app'lar deyarli ishlatmaydi
const SHORTCUT_ACTIONS = {
  toggleSubtitle: { title: 'Subtitle\'ni yashirish / ko\'rsatish', def: 'Control+Alt+S', run: () => toggleOverlayVisible() },
  playPause:      { title: 'Play / pauza',                        def: 'Control+Alt+P', run: () => playerCmd('toggle') },
  nextAyah:       { title: 'Keyingi oyat',                        def: 'Control+Alt+N', run: () => playerCmd('next') },
  prevAyah:       { title: 'Oldingi oyat',                        def: 'Control+Alt+B', run: () => playerCmd('prev') },
  moveSubtitle:   { title: 'Subtitle joyini o\'zgartirish',       def: 'Control+Alt+M', run: () => setOverlayLocked(!overlayLocked) },
};
const shortcutsFile = () => path.join(app.getPath('userData'), 'shortcuts.json');
let shortcuts = {};      // action -> accelerator ('' = o'chirilgan)
let shortcutErrors = {}; // action -> true, agar boshqa app band qilgan bo'lsa

function loadShortcuts() {
  let saved = {};
  try { saved = JSON.parse(fs.readFileSync(shortcutsFile(), 'utf8')); } catch {}
  shortcuts = Object.fromEntries(Object.entries(SHORTCUT_ACTIONS).map(([k, a]) => [k, k in saved ? saved[k] : a.def]));
}

function saveShortcuts() {
  try { fs.writeFileSync(shortcutsFile(), JSON.stringify(shortcuts, null, 2)); } catch (e) { console.error(e); }
}

function registerShortcuts() {
  globalShortcut.unregisterAll();
  shortcutErrors = {};
  for (const [action, accel] of Object.entries(shortcuts)) {
    if (!accel) continue;
    let ok = false;
    try { ok = globalShortcut.register(accel, SHORTCUT_ACTIONS[action].run); } catch {}
    if (!ok) shortcutErrors[action] = true;
  }
  updateTray();
}

function shortcutState() {
  return Object.fromEntries(Object.entries(SHORTCUT_ACTIONS).map(([k, a]) => [k, {
    title: a.title, accel: shortcuts[k] || '', def: a.def, error: !!shortcutErrors[k],
  }]));
}

// --- Menu bar (tray) ---
let tray = null;
let playerState = { playing: false, title: '' };

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'trayTemplate.png'));
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip('Suzuvchi Quron');
  updateTray();
}

function updateTray() {
  if (!tray) return;
  const accel = (k) => (shortcuts[k] && !shortcutErrors[k] ? shortcuts[k] : undefined);
  const visible = overlayVisible;
  const multi = screen.getAllDisplays().length > 1;
  tray.setContextMenu(Menu.buildFromTemplate([
    ...(playerState.title ? [{ label: playerState.title, enabled: false }, { type: 'separator' }] : []),
    { label: visible ? 'Subtitle\'ni yashirish' : 'Subtitle\'ni ko\'rsatish', accelerator: accel('toggleSubtitle'), click: toggleOverlayVisible },
    { label: playerState.playing ? 'Pauza' : 'Play', accelerator: accel('playPause'), click: () => playerCmd('toggle') },
    { label: 'Keyingi oyat', accelerator: accel('nextAyah'), click: () => playerCmd('next') },
    { label: 'Oldingi oyat', accelerator: accel('prevAyah'), click: () => playerCmd('prev') },
    { type: 'separator' },
    { label: overlayLocked ? 'Subtitle joyini o\'zgartirish' : 'Subtitle joyini qulflash', accelerator: accel('moveSubtitle'), click: () => setOverlayLocked(!overlayLocked) },
    ...(multi ? [{ label: 'Barcha monitorlarda', type: 'checkbox', checked: settings.allScreens, click: (item) => setAllScreens(item.checked) }] : []),
    { label: 'Asosiy oynani ochish', click: showMainWindow },
    { type: 'separator' },
    { label: 'Chiqish', role: 'quit' },
  ]));
}

app.whenReady().then(() => {
  // Dev rejimda Dock ikonkasi (yig'ilgan app'da ikonka .icns dan olinadi)
  if (process.platform === 'darwin' && !app.isPackaged) {
    try { app.dock.setIcon(path.join(__dirname, '..', 'build', 'icon.png')); } catch {}
  }

  loadSettings();
  createMainWindow();
  syncOverlays();
  createTray();
  loadShortcuts();
  registerShortcuts();

  // Renderer -> overlay: joriy oyat
  ipcMain.on('verse:show', (_e, payload) => {
    lastVerse = payload;
    lastTiming = lastClock = null;
    sendOverlays('verse:show', payload);
  });
  // So'zma-so'z bo'yash: so'z vaqtlari va audio soati
  ipcMain.on('verse:timing', (_e, payload) => {
    lastTiming = payload;
    sendOverlays('verse:timing', payload);
  });
  ipcMain.on('verse:clock', (_e, payload) => {
    lastClock = payload;
    sendOverlays('verse:clock', payload);
  });
  ipcMain.on('overlay:style', (_e, style) => {
    lastStyle = style;
    sendOverlays('overlay:style', style);
  });
  // Monitor ulansa / uzilsa overlay'lar ham qo'shiladi / yopiladi
  screen.on('display-added', syncOverlays);
  screen.on('display-removed', syncOverlays);
  ipcMain.handle('overlay:get-all-screens', () => ({ on: settings.allScreens, count: screen.getAllDisplays().length }));
  ipcMain.on('overlay:set-all-screens', (_e, on) => setAllScreens(on));
  // Overlay balandligini matnga moslash (pastki cheti joyida qoladi).
  // Ruxsat etilgan maksimal balandlikni qaytaradi — overlay shunga qarab shriftni kichraytiradi.
  ipcMain.handle('overlay:fit', (e, needed) => {
    const overlayWin = BrowserWindow.fromWebContents(e.sender);
    if (!overlayWin) return 0;
    const b = overlayWin.getBounds();
    const wa = screen.getDisplayMatching(b).workArea;
    const maxH = Math.round(wa.height * 0.6);
    if (!needed) return maxH; // faqat maksimal balandlikni so'rash
    const h = Math.max(80, Math.min(Math.ceil(needed), maxH));
    if (Math.abs(h - b.height) >= 2) {
      const bottom = Math.min(b.y + b.height, wa.y + wa.height);
      overlayWin.setBounds({ x: b.x, y: Math.max(wa.y, bottom - h), width: b.width, height: h });
    }
    return maxH;
  });
  ipcMain.on('overlay:toggle-lock', () => setOverlayLocked(!overlayLocked));
  ipcMain.on('overlay:toggle-visible', toggleOverlayVisible);

  ipcMain.on('player:state', (_e, state) => {
    playerState = { ...playerState, ...state };
    updateTray();
  });

  ipcMain.handle('shortcuts:get', () => shortcutState());
  // accel: yangi kombinatsiya, '' = o'chirish, null = standartga qaytarish
  ipcMain.handle('shortcuts:set', (_e, action, accel) => {
    if (!(action in SHORTCUT_ACTIONS)) return shortcutState();
    const value = accel === null ? SHORTCUT_ACTIONS[action].def : String(accel || '');
    // Bir xil kombinatsiya ikki amalda bo'lmasin
    if (value) for (const k of Object.keys(shortcuts)) if (k !== action && shortcuts[k] === value) shortcuts[k] = '';
    shortcuts[action] = value;
    saveShortcuts();
    registerShortcuts();
    return shortcutState();
  });
  // Tugma yozib olinayotganda eski hotkey'lar ishlab ketmasin
  ipcMain.on('shortcuts:pause', (_e, paused) => (paused ? globalShortcut.unregisterAll() : registerShortcuts()));
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
