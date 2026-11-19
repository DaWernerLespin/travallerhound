// Generates one QR code per demo menu (PNG + SVG) in assets/demo/qr/.
// Run: npm run qr   (re-run after changing PUBLIC_URL or adding a demo menu)
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const baseUrl = read('src/features/menu-input/menu-link.ts').match(/PUBLIC_URL = '([^']+)'/)[1];
const menusFile = read('src/features/menu-input/demo-menus.ts');
const ids = [...menusFile.matchAll(/^\s+id: '([^']+)'/gm)].map((m) => m[1]);
const titles = [...menusFile.matchAll(/^\s+title: '([^']+)'/gm)].map((m) => m[1]);
const outDir = path.join(root, 'assets', 'demo', 'qr');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (const id of ids) {
    const url = `${baseUrl}/karte/${id}`;
    await QRCode.toFile(path.join(outDir, `${id}.png`), url, { width: 600, margin: 2 });
    await QRCode.toFile(path.join(outDir, `${id}.svg`), url, { type: 'svg', margin: 2 });
    console.log(`${id}: ${url}`);
  }
  // One printable page with all codes (open in a browser and print).
  const cards = [];
  for (const [index, id] of ids.entries()) {
    const url = `${baseUrl}/karte/${id}`;
    const svg = await QRCode.toString(url, { type: 'svg', margin: 1 });
    cards.push(`<div class="card">${svg}<h2>${titles[index] ?? id}</h2><p>${url}</p></div>`);
  }
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>TravAllerHound Demo-Karten</title><style>
body{font-family:system-ui,sans-serif;margin:24px;color:#142f36}h1{font-size:20px;margin:0 0 16px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{border:1px solid #ddd;border-radius:12px;padding:12px;text-align:center;break-inside:avoid}
.card svg{width:100%;height:auto}h2{font-size:14px;margin:8px 0 2px}p{font-size:9px;color:#666;margin:0;word-break:break-all}
</style></head><body><h1>TravAllerHound · Demo-Karten zum Scannen</h1><div class="grid">${cards.join('')}</div></body></html>`;
  fs.writeFileSync(path.join(outDir, 'alle-karten.html'), html);
  console.log('alle-karten.html');
})();
