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
must(/href="assets\/css\/main\.css(\?v=\d+)?"/.test(idx), 'css link');
must(/src="assets\/js\/svg\.js(\?v=\d+)?"/.test(idx), 'svg.js tag');
must(/src="assets\/js\/map\.js(\?v=\d+)?"/.test(idx), 'map.js tag');
must(/src="assets\/js\/app\.js(\?v=\d+)?"/.test(idx), 'app.js tag');

idx = idx
  .replace(/<link rel="stylesheet" href="assets\/css\/main\.css(\?v=\d+)?">/, "<?!= include('css') ?>")
  .replace(/<script src="assets\/js\/svg\.js(\?v=\d+)?"><\/script>/, "<?!= include('js_svg') ?>")
  .replace(/<script src="assets\/js\/map\.js(\?v=\d+)?"><\/script>/, "<?!= include('js_map') ?>")
  .replace(/<script src="assets\/js\/app\.js(\?v=\d+)?"><\/script>/, "<script>var USER_EMAIL = <?!= JSON.stringify(_email ? _email : '') ?>;<\/script>\n<?!= include('js_app') ?>");

W('apps-script/index.html', idx);
W('apps-script/css.html', '<style>\n' + css + '</style>');
// map/app 檔以 base64 編碼嵌入（GAS HtmlService 會 re-serialize inline script 並改壞內容；base64 內容 parser 改唔到）
const wrapEval = (name, body) => {
  const b64 = Buffer.from(body, 'utf8').toString('base64');
  if (Buffer.from(b64, 'base64').toString('utf8') !== body) { console.log('ABORT: base64 round-trip broke js_' + name); process.exit(1); }
  return '<script>\ntry {\n  var src = new TextDecoder().decode(Uint8Array.from(atob("' + b64 + '"), function (c) { return c.charCodeAt(0); }));\n  (0, eval)(src + "\\n//# sourceURL=js_' + name + '.gas");\n} catch (e) { if (window.__appErr) window.__appErr("js_' + name + ' 解碼或執行失敗", e); else throw e; }\n<\/script>';
};
const outSvg = '<script>\n' + jsSvg + '</script>';
const outMap = wrapEval('map', jsMap);
const outApp = wrapEval('app', jsApp);
W('apps-script/js_svg.html', outSvg);
W('apps-script/js_map.html', outMap);
W('apps-script/js_app.html', outApp);
if (/[\uFFFD]/.test(css + jsSvg + jsMap + jsApp)) console.log('WARN U+FFFD in SOURCE files');

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
const inc = { css: '<style>\n' + css + '</style>', js_svg: outSvg, js_map: outMap, js_app: outApp };
let doc = fs.readFileSync('apps-script/index.html', 'utf8').replace(/<\?([\s\S]*?)\?>/g, (m, inner) => {
  inner = inner.replace(/^[!=]{1,2}/, '').trim();
  const mi = inner.match(/^include\('([^']+)'\)$/);
  if (mi) return inc[mi[1]];
  if (inner.startsWith('JSON.stringify')) return '"test@example.com"';
  return '/*scriptlet*/';
});
console.log('assembled doc lines:', doc.split('\n').length);
fs.mkdirSync('build/sim', { recursive: true });
W('build/sim/assembled-test.html', doc); // local browser smoke test of the assembled GAS doc (gitignored)
console.log('gen done');
