// Generates one QR code per demo menu (PNG + SVG) in assets/demo/qr/.
// Run: npm run qr   (re-run after changing PUBLIC_URL or adding a demo menu)
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const baseUrl = read('src/features/menu-input/menu-link.ts').match(/PUBLIC_URL = '([^']+)'/)[1];
const ids = [...read('src/features/menu-input/demo-menus.ts').matchAll(/^\s+id: '([^']+)'/gm)].map((m) => m[1]);
const outDir = path.join(root, 'assets', 'demo', 'qr');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (const id of ids) {
    const url = `${baseUrl}/karte/${id}`;
    await QRCode.toFile(path.join(outDir, `${id}.png`), url, { width: 600, margin: 2 });
    await QRCode.toFile(path.join(outDir, `${id}.svg`), url, { type: 'svg', margin: 2 });
    console.log(`${id}: ${url}`);
  }
})();
