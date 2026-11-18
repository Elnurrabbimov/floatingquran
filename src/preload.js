const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bridge', {
  showVerse: (payload) => ipcRenderer.send('verse:show', payload),
  setStyle: (style) => ipcRenderer.send('overlay:style', style),
  toggleLock: () => ipcRenderer.send('overlay:toggle-lock'),
  toggleVisible: () => ipcRenderer.send('overlay:toggle-visible'),
  fitWindow: (height) => ipcRenderer.invoke('overlay:fit', height),
  setPlayerState: (state) => ipcRenderer.send('player:state', state),
  getShortcuts: () => ipcRenderer.invoke('shortcuts:get'),
  setShortcut: (action, accel) => ipcRenderer.invoke('shortcuts:set', action, accel),
  pauseShortcuts: (paused) => ipcRenderer.send('shortcuts:pause', paused),
  onVerse: (cb) => ipcRenderer.on('verse:show', (_e, p) => cb(p)),
  onStyle: (cb) => ipcRenderer.on('overlay:style', (_e, s) => cb(s)),
  onLocked: (cb) => ipcRenderer.on('overlay:locked', (_e, l) => cb(l)),
  onVisible: (cb) => ipcRenderer.on('overlay:visible', (_e, v) => cb(v)),
  onPlayerCmd: (cb) => ipcRenderer.on('player:cmd', (_e, cmd) => cb(cmd)),
});
