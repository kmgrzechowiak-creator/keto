// użycie: node export2.js scena[:nazwa-docelowa] ...   (np. slices:kitchen hero)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
const OUT = require('path').join(__dirname, '../../assets/img/scene/') ;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const p = await b.newPage();
  await p.setContent('<canvas id=c></canvas>');
  async function resize(srcFile, w, h, q, crop) {
    const b64 = fs.readFileSync(srcFile).toString('base64');
    return p.evaluate(async ([b64, w, h, q, crop]) => {
      const img = await createImageBitmap(await (await fetch('data:image/jpeg;base64,' + b64)).blob());
      const c = document.getElementById('c'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (crop) { const ar = w / h; if (sw / sh > ar) { sw = sh * ar; sx = (img.width - sw) / 2; } else { sh = sw / ar; sy = (img.height - sh) / 2; } }
      g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      return c.toDataURL('image/jpeg', q).split(',')[1];
    }, [b64, w, h, q, crop]);
  }
  for (const spec of process.argv.slice(2)) {
    const [src, dst = src] = spec.split(':');
    const file = `final/${src}.jpg`;
    if (!fs.existsSync(file)) { console.log('brak', file); continue; }
    if (src === 'hero') {
      fs.copyFileSync(file, OUT + 'hero-1920.jpg');
      fs.writeFileSync(OUT + 'hero-960.jpg', Buffer.from(await resize(file, 960, 540, .86, false), 'base64'));
      fs.writeFileSync(OUT + 'og-hero.jpg', Buffer.from(await resize(file, 1200, 630, .88, true), 'base64'));
    } else {
      fs.copyFileSync(file, OUT + `${dst}-1600.jpg`);
      fs.writeFileSync(OUT + `${dst}-800.jpg`, Buffer.from(await resize(file, 800, 600, .86, false), 'base64'));
      fs.writeFileSync(OUT + `og-${dst}.jpg`, Buffer.from(await resize(file, 1200, 630, .88, true), 'base64'));
    }
    console.log('wyeksportowano', spec);
  }
  await b.close();
})();
