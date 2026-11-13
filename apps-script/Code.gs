/** ===== _email 白名單 gate ===== */
const ALLOWED_EMAILS = ['yakh@ghs.edu.hk'];
const ALLOWED_DOMAINS = [];   // 例如 ['ghs.edu.hk']：留空名单时用域名放行

const PFX = 'jp.trip.v1.';
const CHUNK = 8000;

function accessOk(email) {
  if (!email) return false;
  const e = String(email).toLowerCase();
  if (ALLOWED_EMAILS.length) return ALLOWED_EMAILS.map(s => String(s).toLowerCase()).includes(e);
  if (ALLOWED_DOMAINS.length) return ALLOWED_DOMAINS.some(d => e.endsWith('@' + String(d).toLowerCase()));
  return true;
}

function meEmail() {
  try { return String(Session.getActiveUser().getEmail() || ''); } catch (e) { return ''; }
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function denyHtml() {
  return HtmlService.createHtmlOutput(
    '<meta charset="utf-8"><div style="font-family:sans-serif;padding:48px;text-align:center;color:#3E3A39">' +
    '<h2>冇得入</h2><p>呢個網站只開放俾指定 email 使用。<br>如果你係学校账号，请确认登录咗正确嘅 Google 账号再重新整理。</p></div>'
  ).setTitle('冇得入');
}

function doGet() {
  const email = meEmail();
  if (!accessOk(email)) return denyHtml();
  const t = HtmlService.createTemplateFromFile('index');
  t._email = email;
  return t.evaluate().setTitle('旅行規劃｜日系繪本風');
}

/** 每人一份：按 email 分 key 存喺 ScriptProperties（部署以 ME 執行，數據按存取者 email 分割） */
function userKeys_(email) {
  return PFX + String(email).toLowerCase() + '.';
}

function loadAll() {
  const email = meEmail();
  if (!accessOk(email)) throw new Error('NO_ACCESS');
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const key = userKeys_(email);
    const t = props.getProperty(key + 't');
    let json = '';
    for (let i = 0; ; i++) {
      const c = props.getProperty(key + 'c' + i);
      if (c === null) break;
      json += c;
    }
    return { json: json || null, savedAt: t ? Number(t) : 0, email: email };
  } finally {
    lock.releaseLock();
  }
}

function saveAll(json) {
  const email = meEmail();
  if (!accessOk(email)) throw new Error('NO_ACCESS');
  const s = String(json || '');
  const key = userKeys_(email);
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    for (const k of props.getKeys()) if (k.indexOf(key) === 0) props.deleteProperty(k);
    let i = 0;
    for (let off = 0; off < s.length; off += CHUNK) props.setProperty(key + 'c' + i++, s.slice(off, off + CHUNK));
    props.setProperty(key + 't', String(Date.now()));
    return { savedAt: Date.now(), email: email };
  } finally {
    lock.releaseLock();
  }
}

function resetMine() {
  const email = meEmail();
  if (!accessOk(email)) throw new Error('NO_ACCESS');
  const props = PropertiesService.getScriptProperties();
  const key = userKeys_(email);
  for (const k of props.getKeys()) if (k.indexOf(key) === 0) props.deleteProperty(k);
  return { cleared: true, email: email };
}
