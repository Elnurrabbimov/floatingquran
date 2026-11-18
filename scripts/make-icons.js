// build/icon.html dan ikonkalarni PNG qilib chiqaradi:
//   build/icon.png                    — 1024x1024 app ikonkasi (electron-builder .icns/.ico ni shundan yasaydi)
//   src/assets/icon.png               — 512x512 Windows/Linux oyna ikonkasi
//   src/assets/trayTemplate.png       — 16x16 menu bar ikonkasi
//   src/assets/trayTemplate@2x.png    — 32x32 (Retina)
// Ishga tushirish: npx electron scripts/make-icons.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

async function capture(win, selector, size) {
  const rect = await win.webContents.executeJavaScript(`(() => {
    const r = document.querySelector('${selector}').getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
  })()`);
  const img = await win.webContents.capturePage(rect);
  return img.resize({ width: size, height: size, quality: 'best' }).toPNG();
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024, height: 1100, show: false, transparent: true, frame: false,
    webPreferences: { offscreen: true },
  });
  win.webContents.setFrameRate(1);
  await win.loadFile(path.join(ROOT, 'build', 'icon.html'));
  // SVG <text> shriftni o'zi so'ramaydi — oldindan majburan yuklaymiz
  const ok = await win.webContents.executeJavaScript(
    'document.fonts.load(\'150px "Amiri Quran"\', "ٱقْرَأْ").then((f) => f.length > 0)'
  );
  if (!ok) console.warn('Ogohlantirish: Amiri Quran shrifti yuklanmadi (internet kerak)');
  await new Promise((r) => setTimeout(r, 1000));

  fs.mkdirSync(path.join(ROOT, 'src', 'assets'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'build', 'icon.png'), await capture(win, '#icon', 1024));
  fs.writeFileSync(path.join(ROOT, 'src', 'assets', 'icon.png'), await capture(win, '#icon', 512)); // Windows/Linux oyna ikonkasi
  fs.writeFileSync(path.join(ROOT, 'src', 'assets', 'trayTemplate.png'), await capture(win, '#tray', 16));
  fs.writeFileSync(path.join(ROOT, 'src', 'assets', 'trayTemplate@2x.png'), await capture(win, '#tray', 32));
  console.log('Ikonkalar yaratildi.');
  app.quit();
});
