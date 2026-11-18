// macOS: app'ni to'liq ad-hoc imzo bilan imzolash (Apple sertifikatisiz, bepul).
//
// Imzosiz yig'ilganda Electron binari faqat "linker-signed" bo'lib qoladi va app resurslari
// muhrlanmaydi — Apple Silicon Mac'da internetdan yuklangan bunday app umuman ochilmaydi.
// To'g'ri ad-hoc imzodan keyin macOS "Open Anyway" orqali ochishga ruxsat beradi.
// (Notarizatsiya uchun Apple Developer ID kerak — u bo'lsa mac.identity'ni sozlang va bu hook kerak emas.)
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  console.log(`  • ad-hoc signing  app=${appPath}`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', '--timestamp=none', appPath], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' });
};
