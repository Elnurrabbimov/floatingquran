const { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWin = null;
let overlayWin = null;
let overlayLocked = true; // true = click-through, false = drag mumkin

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

function createOverlayWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const width = Math.min(1000, workArea.width - 80);
  const height = 240;

  overlayWin = new BrowserWindow({
    width,
    height,
    x: Math.round(workArea.x + (workArea.width - width) / 2),
    y: Math.round(workArea.y + workArea.height - height - 40),
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: true,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    // macOS: panel turi fullscreen app'lar ustida ham ko'rinadi
    type: process.platform === 'darwin' ? 'panel' : undefined,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), backgroundThrottling: false },
  });

  overlayWin.setAlwaysOnTop(true, 'screen-saver');
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWin.setIgnoreMouseEvents(true, { forward: true });
  const behavior = makeStationary(overlayWin);
  if (process.env.SQ_DEBUG) console.log('collectionBehavior =', behavior);
  overlayWin.loadFile(path.join(__dirname, 'overlay.html'));
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
  if (!overlayWin) return;
  overlayWin.setIgnoreMouseEvents(locked, { forward: true });
  overlayWin.setFocusable(!locked);
  overlayWin.webContents.send('overlay:locked', locked);
  mainWin?.webContents.send('overlay:locked', locked);
  updateTray();
}

function toggleOverlayVisible() {
  if (!overlayWin) return;
  if (overlayWin.isVisible()) overlayWin.hide();
  else overlayWin.showInactive();
  const visible = overlayWin.isVisible();
  mainWin?.webContents.send('overlay:visible', visible);
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
  const visible = overlayWin?.isVisible() ?? true;
  tray.setContextMenu(Menu.buildFromTemplate([
    ...(playerState.title ? [{ label: playerState.title, enabled: false }, { type: 'separator' }] : []),
    { label: visible ? 'Subtitle\'ni yashirish' : 'Subtitle\'ni ko\'rsatish', accelerator: accel('toggleSubtitle'), click: toggleOverlayVisible },
    { label: playerState.playing ? 'Pauza' : 'Play', accelerator: accel('playPause'), click: () => playerCmd('toggle') },
    { label: 'Keyingi oyat', accelerator: accel('nextAyah'), click: () => playerCmd('next') },
    { label: 'Oldingi oyat', accelerator: accel('prevAyah'), click: () => playerCmd('prev') },
    { type: 'separator' },
    { label: overlayLocked ? 'Subtitle joyini o\'zgartirish' : 'Subtitle joyini qulflash', accelerator: accel('moveSubtitle'), click: () => setOverlayLocked(!overlayLocked) },
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

  createMainWindow();
  createOverlayWindow();
  createTray();
  loadShortcuts();
  registerShortcuts();

  // Renderer -> overlay: joriy oyat
  ipcMain.on('verse:show', (_e, payload) => {
    overlayWin?.webContents.send('verse:show', payload);
  });
  let lastStyle = null;
  ipcMain.on('overlay:style', (_e, style) => {
    lastStyle = style;
    overlayWin?.webContents.send('overlay:style', style);
  });
  overlayWin.webContents.on('did-finish-load', () => {
    if (lastStyle) overlayWin.webContents.send('overlay:style', { ...lastStyle, preview: false });
  });
  // Overlay balandligini matnga moslash (pastki cheti joyida qoladi).
  // Ruxsat etilgan maksimal balandlikni qaytaradi — overlay shunga qarab shriftni kichraytiradi.
  ipcMain.handle('overlay:fit', (_e, needed) => {
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
