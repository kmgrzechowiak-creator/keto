// użycie: node render.js scena szer wys przebiegi plik.jpg [jakość]
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
(async () => {
  const [,, scene, w, h, n, out, q='90'] = process.argv;
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 1200)); });
  await p.goto(`file://${__dirname}/render.html?scene=${scene}&w=${w}&h=${h}&n=${n}`);
  const t0 = Date.now();
  await p.waitForFunction(() => window.__done || window.__error, null, { timeout: 3_000_000, polling: 1000 });
  const err = await p.evaluate(() => window.__error);
  if (err) { console.log('BŁĄD:', err.slice(0, 1500)); process.exit(1); }
  const url = await p.evaluate((q) => document.getElementById('c').toDataURL('image/jpeg', +q / 100), q);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`${scene} ${w}x${h} x${n} → ${out} (${Math.round((Date.now() - t0) / 1000)} s, ${fs.statSync(out).size} B)`);
  await b.close();
})();
