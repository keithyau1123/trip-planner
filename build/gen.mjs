// gen.mjs — byte-safe regeneration of apps-script/*.html from web sources (single source of truth)
import fs from 'node:fs';
import vm from 'node:vm';

const R = fs.readFileSync;
const W = (p, s) => fs.writeFileSync(p, s, 'utf8'); // node always UTF-8, no BOM

const web = 'index.html';
const css = R('assets/css/main.css', 'utf8');
const jsSvg = R('assets/js/svg.js', 'utf8');
const jsMap = R('assets/js/map.js', 'utf8');
const jsApp = R('assets/js/app.js', 'utf8');

let idx = R(web, 'utf8');
const must = (cond, what) => { if (!cond) { console.log('ABORT: pattern not found: ' + what); process.exit(1); } };

if (idx.includes('leaflet')) { console.log('ABORT: leaflet still referenced in index.html'); process.exit(1); }
must(idx.includes('<link rel="stylesheet" href="assets/css/main.css">'), 'css link');
must(idx.includes('<script src="assets/js/svg.js"></script>'), 'svg.js tag');
must(idx.includes('<script src="assets/js/map.js"></script>'), 'map.js tag');
must(idx.includes('<script src="assets/js/app.js"></script>'), 'app.js tag');

idx = idx
  .replace('<link rel="stylesheet" href="assets/css/main.css">', "<?!= include('css') ?>")
  .replace('<script src="assets/js/svg.js"></script>', "<?!= include('js_svg') ?>")
  .replace('<script src="assets/js/map.js"></script>', "<?!= include('js_map') ?>")
  .replace('<script src="assets/js/app.js"></script>', "<script>var USER_EMAIL = <?!= JSON.stringify(_email ? _email : '') ?>;</script>\n<?!= include('js_app') ?>");

W('apps-script/index.html', idx);
W('apps-script/css.html', '<style>\n' + css + '</style>');
W('apps-script/js_svg.html', '<script>\n' + jsSvg + '</script>');
W('apps-script/js_map.html', '<script>\n' + jsMap + '</script>');
W('apps-script/js_app.html', '<script>\n' + jsApp + '</script>');

// ---- verification ----
const files = ['index.html', 'css.html', 'js_svg.html', 'js_map.html', 'js_app.html'];
for (const f of files) {
  const b = fs.readFileSync('apps-script/' + f);
  if (b[0] === 0xEF) console.log('WARN BOM in ' + f);
  const s = b.toString('utf8');
  if (/[\uFFFD]/.test(s)) console.log('WARN U+FFFD in ' + f);
  if (/[\uE000-\uF8FF\uFFF0-\uFFFF]/.test(s)) console.log('WARN mojibake/PUA chars in ' + f);
}
// title round-trip
const t1 = (R(web, 'utf8').match(/<title>([^<]*)<\/title>/) || [])[1];
const t2 = (fs.readFileSync('apps-script/index.html', 'utf8').match(/<title>([^<]*)<\/title>/) || [])[1];
console.log('title web  :', JSON.stringify(t1));
console.log('title gas  :', JSON.stringify(t2), t1 === t2 ? 'MATCH' : 'MISMATCH!!');
// CJK presence spot check
for (const f of files) {
  const s = fs.readFileSync('apps-script/' + f, 'utf8');
  console.log(f, 'cjk-chars=' + (s.match(/[\u4e00-\u9fff]/g) || []).length);
}
// JS syntax check
for (const [f, body] of [['js_svg.html', jsSvg], ['js_map.html', jsMap], ['js_app.html', jsApp]]) {
  try { new vm.Script(body); console.log('vm-ok ' + f); } catch (e) { console.log('VM-FAIL ' + f + ': ' + e.message); }
}
// assembled doc line count (sim)
const inc = { css: '<style>\n' + css + '</style>', js_svg: '<script>\n' + jsSvg + '</script>', js_map: '<script>\n' + jsMap + '</script>', js_app: '<script>\n' + jsApp + '</script>' };
let doc = fs.readFileSync('apps-script/index.html', 'utf8').replace(/<\?([\s\S]*?)\?>/g, (m, inner) => {
  inner = inner.replace(/^[!=]{1,2}/, '').trim();
  const mi = inner.match(/^include\('([^']+)'\)$/);
  if (mi) return inc[mi[1]];
  if (inner.startsWith('JSON.stringify')) return '"test@example.com"';
  return '/*scriptlet*/';
});
console.log('assembled doc lines:', doc.split('\n').length);
console.log('gen done');
