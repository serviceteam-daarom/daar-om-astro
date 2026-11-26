// Haalt afbeeldingen, fonts en andere uploads op van daar-om.nl en zet ze in public/.
// JPG en PNG worden opnieuw gecomprimeerd als dat kleiner uitvalt.
import fs from 'node:fs';
import path from 'node:path';

const list = JSON.parse(fs.readFileSync(new URL('./assets.json', import.meta.url)));
const ORIGIN = 'https://www.daar-om.nl';
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { console.warn('sharp niet beschikbaar, geen compressie'); }

let ok = 0, skipped = 0, failed = 0, saved = 0;
async function one(p) {
  const dest = path.join('public', decodeURIComponent(p));
  if (fs.existsSync(dest)) { skipped++; return; }
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(ORIGIN + encodeURI(p), { headers: { 'User-Agent': 'daar-om-astro-build' } });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); continue; }
    if (!res.ok) { failed++; console.warn('mislukt', res.status, p); return; }
    let buf = Buffer.from(await res.arrayBuffer());
    const ext = path.extname(p).toLowerCase();
    if (sharp && ['.jpg', '.jpeg', '.png'].includes(ext)) {
      try {
        const img = sharp(buf);
        const out = ext === '.png'
          ? await img.png({ compressionLevel: 9, palette: true, quality: 85 }).toBuffer()
          : await img.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
        if (out.length < buf.length) { saved += buf.length - out.length; buf = out; }
      } catch {}
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    ok++;
    return;
  }
  failed++;
}

const queue = [...list];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await one(queue.shift()); }));
console.log(`assets: ${ok} opgehaald, ${skipped} al aanwezig, ${failed} mislukt, ${Math.round(saved / 1024)} KB bespaard`);
