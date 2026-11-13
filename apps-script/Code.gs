/* ===== 旅行規劃 · Apps Script Web App 後台 =====
   兩層門禁：
     1) 部署設定：執行身分「存取者」＋ 存取權「僅 domain」或「特定使用者及群組」← 最重要
     2) 下面名单嘅 code guard：部署設定萬一改錯都仲擋一層
   每人一份行程：UserProperties 自動按 Google 帳號分隔，互不睇到。
   更新流程：改完 code → 管理部署 → 編輯 → 產生新版本（/exec URL 唔變）。
*/
/* 邊個用到：
   - ALLOWED_EMAILS：指定 email 名單（最準確）。填咗呢個，只有列咗嘅 email 入到。
   - 想成個 domain 都用得：ALLOWED_EMAILS 留空 []，改用 ALLOWED_DOMAINS。
   - 兩個都留空 = 淨係靠部署設定嗰層。
   （部署嗰邊揀「特定使用者及群組」都係一層 Google 嘅門；呢度係雙保險） */
const ALLOWED_EMAILS = ['yakh@ghs.edu.hk'];
const ALLOWED_DOMAINS = []; // 想全 school 都得：清空上面名單，呢度填 ['ghs.edu.hk']

const PKEY = '***';
const CHUNK = 8000; // PropertiesService 每個 key 上限 9KB，留返位置

function doGet() {
  const email = Session.getActiveUser().getEmail() || '';
  if (!accessOk(email)) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:48px;max-width:560px;margin:0 auto">' +
      '<h2>冇得入 🙅</h2><p>呢個 Google 帳號（<b>' + (email || '(攞唔到 email：部署設定可能唔啱，執行身分要揀「存取的使用者」)') + '</b>）' +
      '唔喺授權名單入面。</p><p>如果你應該有權限，聯絡管理員 check 下 ALLOWED_EMAILS／ALLOWED_DOMAINS 同部署設定。</p></div>'
    );
  }
  const t = HtmlService.createTemplateFromFile('index');
  t._email = email;
  return t.evaluate()
    .setTitle('旅行規劃｜日系繪本風')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function accessOk(email) {
  if (!email) return false;
  const e = email.toLowerCase();
  if (ALLOWED_EMAILS.length) return ALLOWED_EMAILS.some(x => x.toLowerCase() === e);
  if (!ALLOWED_DOMAINS.length) return true; // 淨係靠部署設定
  const at = e.lastIndexOf('@');
  if (at < 0) return false;
  const dom = e.slice(at + 1);
  return ALLOWED_DOMAINS.some(d => { d = d.toLowerCase(); return dom === d || dom.endsWith('.' + d); });
}

/* ----- 每個使用者自己一份（雲端行程，分塊存） ----- */
function me_() {
  return Session.getActiveUser().getEmail() || '';
}

function loadAll() {
  if (!accessOk(me_())) throw new Error('呢個帳號冇授權');
  const p = PropertiesService.getUserProperties();
  const n = +(p.getProperty(PKEY + '.n') || 0);
  let json = null, savedAt = 0;
  if (n > 0) {
    let s = '';
    for (let i = 0; i < n; i++) s += p.getProperty(PKEY + '.' + i) || '';
    json = s || null;
    savedAt = +(p.getProperty(PKEY + '.t') || 0);
  }
  return { json: json, savedAt: savedAt, email: me_() };
}

function saveAll(str) {
  if (!accessOk(me_())) throw new Error('呢個帳號冇授權');
  if (typeof str !== 'string' || !str.length) throw new Error('空資料');
  if (str.length > 400000) throw new Error('資料過大（>400KB）');
  const p = PropertiesService.getUserProperties();
  const oldN = +(p.getProperty(PKEY + '.n') || 0);
  const chunks = [];
  for (let i = 0; i < str.length; i += CHUNK) chunks.push(str.slice(i, i + CHUNK));
  chunks.forEach(function (c, i) { p.setProperty(PKEY + '.' + i, c); });
  for (let i = chunks.length; i < oldN; i++) p.deleteProperty(PKEY + '.' + i); // 清走剩低嘅舊塊
  p.setProperty(PKEY + '.n', String(chunks.length));
  p.setProperty(PKEY + '.t', String(Date.now()));
  return { savedAt: Date.now(), email: me_() };
}

/* 清自己嗰份（想重來喺編輯器行一次呢個 function，要用返自己個帳號執行） */
function resetMine() {
  const p = PropertiesService.getUserProperties();
  const n = +(p.getProperty(PKEY + '.n') || 0);
  for (let i = 0; i < n; i++) p.deleteProperty(PKEY + '.' + i);
  p.deleteProperty(PKEY + '.n');
  p.deleteProperty(PKEY + '.t');
}
