// Download Leaflet 1.9.4 dist files into assets/vendor/leaflet/ for self-hosting.
import { mkdirSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
const dir = 'C:/Users/yakh/Documents/Strata/Workspace/trip-planner/assets/vendor/leaflet';
mkdirSync(dir, { recursive: true });
mkdirSync(dir + '/images', { recursive: true });
const files = [
  ['leaflet.js', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'],
  ['leaflet.css', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'],
  ['images/marker-icon.png', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png'],
  ['images/marker-icon-2x.png', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png'],
  ['images/marker-shadow.png', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png'],
  ['images/layers.png', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/layers.png'],
  ['images/layers-2x.png', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/layers-2x.png'],
];
for (const [out, url] of files) {
  const res = await fetch(url);
  if (!res.ok) { console.log('FAIL', out, res.status); continue; }
  await pipeline(res.body, createWriteStream(dir + '/' + out));
  console.log('OK', out, (await res.arrayBuffer().catch(()=>new ArrayBuffer(0))).byteLength || '');
}
console.log('DONE');
