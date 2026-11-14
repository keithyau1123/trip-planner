/* ===== 插圖庫：品牌 251×66 ＋ 日期插圖 40×30 ＋ 交通圖示 ===== */
if (window.__PROBE) window.__PROBE.svg = 1;
const INK = '#3E3A39';
const SW = 1.7; // 日期插圖線寬

/* 品牌插圖：城郭＋列車＋賽車＋摩天輪（列車群組可獨立動作） */
const BRAND_SVG = `
<g fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <!-- 城郭 -->
  <g>
    <path d="M8 58h34l-3-14H11z" fill="#fff"/>
    <path d="M12 44h26l-2.5-9H14.5z" fill="#F6D27A"/>
    <path d="M15 35h20l-3-9H18z" fill="#fff"/>
    <path d="M18 26l7-8 7 8" fill="#A8D3E6"/>
    <path d="M22 58v-8h6v8" fill="#F2A497"/>
    <path d="M25 18v-6" />
  </g>
  <!-- 列車（可動群組） -->
  <g class="brand-train">
    <path d="M52 30h74c4 0 6 2 6 6v16c0 4-2 6-6 6H52c-4 0-6-2-6-6V36c0-4 2-6 6-6z" fill="#fff"/>
    <path d="M60 38h10v10H60zM78 38h10v10H78zM96 38h10v10H96z" fill="#A8D3E6"/>
    <path d="M114 38h10v10h-6c-3 0-4-2-4-4z" fill="#A8D3E6"/>
    <path d="M52 58h82" />
    <path d="M126 46h4" />
    <path d="M46 62h100" stroke-width="3"/>
    <path d="M58 62v4M84 62v4M110 62v4" stroke-width="2"/>
  </g>
  <!-- 摩天輪 -->
  <g>
    <circle cx="196" cy="26" r="17" fill="none"/>
    <circle cx="196" cy="26" r="3" fill="#F6D27A"/>
    <path d="M196 9v34M179 26h34M184 14l24 24M208 14l-24 24" stroke-width="2"/>
    <circle cx="196" cy="7" r="3.4" fill="#F2A497"/>
    <circle cx="196" cy="45" r="3.4" fill="#A8D3E6"/>
    <circle cx="177" cy="26" r="3.4" fill="#B9DAA5"/>
    <circle cx="215" cy="26" r="3.4" fill="#F6D27A"/>
    <path d="M188 56l8-13 8 13z" fill="#fff"/>
    <path d="M182 58h28" />
  </g>
  <!-- F1 賽車 -->
  <g>
    <path d="M140 54h44l6 4h6v-3c0-2-2-3-4-3h-4l-8-6H150z" fill="#F2A497"/>
    <path d="M156 46v-5h8v5" fill="#fff"/>
    <circle cx="148" cy="58" r="4.6" fill="#3E3A39"/>
    <circle cx="186" cy="58" r="4.6" fill="#3E3A39"/>
    <circle cx="148" cy="58" r="1.6" fill="#fff"/>
    <circle cx="186" cy="58" r="1.6" fill="#fff"/>
  </g>
  <path d="M236 20c-6 3-9 9-8 15 4-2 9-1 12 2 2-6 0-13-4-17z" fill="#F4C7AA"/>
  <path d="M244 40c3 4 4 10 2 15-2-5-6-8-10-9 3-3 6-4 8-6z" fill="#DED2ED"/>
</g>`;

/* 日期插圖 40×30 viewBox；key: { name, svg } */
const ART = {
  plane: { name:'飛機', svg:`
    <path d="M4 16l22-3 8-6c1.4-1 3 0 2.4 1.8L32 15l-6 2 4 8-2.4.8-6-8-8 1z" fill="#fff"/>
    <path d="M10 15l14-2" stroke="#F2A497" stroke-width="2.2"/>
    <path d="M6 9h7M4 12h9" stroke="#A8D3E6" stroke-width="2.2"/>
    <circle cx="12" cy="24" r="1.2" fill="#A8D3E6"/>`},
  f1wheel: { name:'賽車與摩天輪', svg:`
    <circle cx="12" cy="11" r="8" fill="none"/>
    <circle cx="12" cy="11" r="1.6" fill="#F6D27A"/>
    <path d="M12 3v16M4 11h16M6.3 5.3l11.4 11.4M17.7 5.3L6.3 16.7" stroke-width="1.1"/>
    <circle cx="12" cy="2.5" r="1.8" fill="#F2A497"/>
    <circle cx="12" cy="19.5" r="1.8" fill="#A8D3E6"/>
    <circle cx="3.5" cy="11" r="1.8" fill="#B9DAA5"/>
    <circle cx="20.5" cy="11" r="1.8" fill="#F6D27A"/>
    <path d="M24 22h10l2 2h2v-2c0-1-1-1.6-2-1.6h-2l-3-3h-7z" fill="#F2A497"/>
    <path d="M29 19v-3h3v3" fill="#fff"/>
    <circle cx="26.6" cy="24.4" r="2.4" fill="${INK}"/><circle cx="36" cy="24.4" r="2.4" fill="${INK}"/>
    <path d="M9 27h6" />`},
  pokemon: { name:'寶貝球與皮卡丘', svg:`
    <circle cx="12" cy="18" r="8" fill="#fff"/>
    <path d="M4 18a8 8 0 0 1 16 0z" fill="#F2A497"/>
    <path d="M4 18h16" /><circle cx="12" cy="18" r="2.6" fill="#fff"/><circle cx="12" cy="18" r="1"/>
    <path d="M26 12c0 4 6 4 6 0 0 2-1 3-3 3s-3-1-3-3z" fill="#fff" stroke-width="1.3"/>
    <path d="M29 8.5v3.5" stroke-width="1.3"/>
    <path d="M26.5 6l1.5 3M33.5 6L32 9" />
    <circle cx="30" cy="12" r="4.6" fill="#F6D27A"/>
    <path d="M26.6 8.6l-1.4-3.2 3 1.8M33.4 8.6l1.4-3.2-3 1.8" fill="#F6D27A"/>
    <circle cx="28.2" cy="11.6" r=".8" fill="${INK}"/><circle cx="31.8" cy="11.6" r=".8" fill="${INK}"/>
    <circle cx="26.6" cy="13.4" r="1" fill="#F2A497" stroke="none"/><circle cx="33.4" cy="13.4" r="1" fill="#F2A497" stroke="none"/>`},
  railway: { name:'鐵道博物館', svg:`
    <path d="M4 26V13l8-5 8 5v13z" fill="#B07B4F"/>
    <path d="M8 10h8v3H8z" fill="#fff"/>
    <path d="M22 26V16h14v10z" fill="#B9DAA5"/>
    <path d="M24 16l3-3h8l3 3" fill="#fff"/>
    <circle cx="27" cy="20.5" r="2" fill="#fff"/><circle cx="33" cy="20.5" r="2" fill="#fff"/>
    <circle cx="27" cy="27" r="1.6" fill="${INK}"/><circle cx="33" cy="27" r="1.6" fill="${INK}"/>
    <path d="M4 29h33" stroke-width="1.3"/>`},
  nintendo: { name:'任天堂', svg:`
    <rect x="6" y="10" width="12" height="12" rx="2" fill="#F6D27A"/>
    <path d="M10 14c0-1.4 1.4-2 2.6-1.6 1.6.5 1.6 2.2.4 3-.6.4-.9.9-.7 1.6M12.6 19.6v.8" stroke-width="1.8"/>
    <rect x="22" y="18" width="10" height="11" rx="2" fill="#B9DAA5"/>
    <rect x="24" y="13" width="6" height="5" fill="#B9DAA5"/>
    <path d="M23 8.5a4 4 0 0 1 8 0c0 2 1.6 2.4 1.6 4.4h-11c0-2 1.4-2.4 1.4-4.4z" fill="#F2A497"/>
    <path d="M24.5 11h5" /><circle cx="26" cy="7" r="1.1" fill="#fff"/><circle cx="29.4" cy="7" r="1.1" fill="#fff"/>
    <path d="M34.5 12.9V6" stroke-width="1.5"/>`},
  lego: { name:'LEGO 積木', svg:`
    <rect x="5" y="17" width="11" height="8" rx="1.4" fill="#F2A497"/>
    <path d="M8 17v-2.4M13 17v-2.4" stroke-width="1.8"/>
    <rect x="18" y="13" width="11" height="8" rx="1.4" fill="#F6D27A"/>
    <path d="M21 13v-2.4M26 13v-2.4" stroke-width="1.8"/>
    <rect x="24" y="21" width="11" height="8" rx="1.4" fill="#4678C5"/>
    <path d="M27 21v-2.4M32 21v-2.4" stroke-width="1.8"/>
    <rect x="9" y="24" width="9" height="6" rx="1.2" fill="#B9DAA5"/>`},
  anpanman: { name:'麵包超人', svg:`
    <circle cx="15" cy="13" r="8.6" fill="#F4C7AA"/>
    <circle cx="15" cy="13" r="5.6" fill="#fff"/>
    <circle cx="12.6" cy="12" r="1" fill="${INK}"/><circle cx="17.4" cy="12" r="1" fill="${INK}"/>
    <path d="M13 15.6c.9.9 3 .9 4 0" stroke-width="1.4"/>
    <path d="M15 4.6a8.4 8.4 0 0 1 6 1.6c-1.4.6-2.4.4-3 .2-1.4 1-4.6 1-6 0-.6.2-1.6.4-3-.2a8.4 8.4 0 0 1 6-1.6z" fill="#B07B4F"/>
    <path d="M26 15h9l1.4 9.4a2 2 0 0 1-2 2.3h-7.8a2 2 0 0 1-2-2.3z" fill="#A8D3E6"/>
    <path d="M28 15c0-2 1-3.4 2.5-3.4S33 13 33 15" fill="none" stroke-width="1.4"/>
    <path d="M28.6 20h4" stroke="#fff" stroke-width="1.6"/>`},
  castle: { name:'城郭', svg:`
    <path d="M8 27V14l-3 2V8l5 3V6l2 3h6l2-3v5l5-3v8l-3-2v13z" fill="#fff"/>
    <path d="M13 14h6v5h-6z" fill="#A8D3E6"/>
    <path d="M16 27v-6c0-1.4-2-1.4-2 0v6z" fill="#F2A497"/>
    <path d="M16 4V1.6" /><path d="M16 1.6h3.4v2.2H16" fill="#F2A497"/>`},
  temple: { name:'寺廟', svg:`
    <path d="M9 10h14l3 3H6z" fill="#F2A497"/>
    <path d="M11 14h10v5H11z" fill="#fff"/>
    <path d="M7 20h18l2.4 3H4.6z" fill="#F2A497"/>
    <path d="M11 23h10v5H11z" fill="#fff"/>
    <path d="M15 3l1.5 3h-3z" fill="#F6D27A"/>
    <path d="M16 6v2" /><path d="M4.6 26h22.8" />`},
  torii: { name:'鳥居', svg:`
    <path d="M6 8h24l2 3H4z" fill="#F2A497"/>
    <path d="M8 12h20v3H8z" fill="#fff"/>
    <path d="M10 15v14M26 15v14" stroke-width="2.6"/>
    <path d="M10 18h20" /><path d="M18 12v6" />`},
  onsen: { name:'溫泉', svg:`
    <path d="M6 20h24v4a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5z" fill="#A8D3E6"/>
    <path d="M10 20c2 1.6 4 1.6 6 0s4-1.6 6 0 4 1.6 6 0" stroke="#fff" stroke-width="1.6"/>
    <path d="M13 14c-1-2 1-2.6 0-4.6M19 12c-1.2-2.4 1.2-3 0-5.4M25 14c-1-2 1-2.6 0-4.6" stroke-width="1.4"/>`},
  house: { name:'住宿', svg:`
    <path d="M7 16l12-9 12 9" fill="none"/>
    <path d="M10 16v12h18V16" fill="#fff"/>
    <path d="M7 16h24" />
    <rect x="16" y="19" width="6" height="9" fill="#A8D3E6"/>
    <rect x="12" y="19" width="3.4" height="3.4" fill="#F6D27A"/>`},
  walk: { name:'散步', svg:`
    <circle cx="16" cy="6.6" r="3" fill="#fff"/>
    <path d="M16 10v8M16 18l-4 9M16 18l5 8M10 13l6-1 6 2" stroke-width="2"/>
    <path d="M27 9c-4 0-7 2.6-7 5.6 3 0 4-1.2 5-2.4 1.6 1 5 1 6-.4.8-1.4-.6-2.8-4-2.8z" fill="#F2A497"/>
    <circle cx="31" cy="7" r="2.6" fill="#F6D27A"/>`},
  food: { name:'美食', svg:`
    <path d="M9 5v9c0 2 1.4 3 3 3v9M12 5v8M15 5v8" stroke-width="1.5"/>
    <path d="M28 5c-4 1-5.5 5-5.5 9 0 2 1.4 3 3 3v9" />
    <path d="M25.5 17c-2.6 0-4-1.4-4-3.4C21.5 10.6 23.4 7 28 5" fill="none"/>`},
};
const ART_KEYS = Object.keys(ART);
const ART_KEYWORDS = [
  ['plane', /飛機|航班|機場|空港|airport|flight|[NSH][RTDK][JM]?\b/i],
  ['f1wheel', /F1|賽車|racing|摩天輪|ferris/i],
  ['pokemon', /寶可夢|宝可梦|pokemon|精靈球|皮卡丘|pikachu/i],
  ['railway', /鐵道|铁道|新幹線|新干線|shinkansen|火車|列車|列車博物館/i],
  ['nintendo', /任天堂|nintendo|mario|瑪利歐|马里奥|大金剛|donkey kong/i],
  ['lego', /乐高|lego/i],
  ['anpanman', /麵包超人|面包超人|anpan/i],
  ['onsen', /溫泉|温泉|onsen|露天/i],
  ['castle', /城堡|城郭|姬路|大阪城|名古屋城/i],
  ['torii', /鳥居|torii|神社/i],
  ['temple', /寺|廟|temple|五重塔/i],
  ['food', /拉麵|拉面|壽司|燒肉|燒烤|居酒屋|sushi|ramen|美食/i],
];
/* 依當日行程自動挑插圖；無匹配時按類別退回 */
function pickArt(dayEvents, dayCatMix) {
  const text = dayEvents.map(e => (e.name || '') + ' ' + (e.address || '') + ' ' + (e.notes || '')).join(' ');
  for (const [key, re] of ART_KEYWORDS) if (re.test(text)) return key;
  if (dayCatMix.transit || dayCatMix.flight) return 'plane';
  if (dayCatMix.food) return 'food';
  if (dayCatMix.stay) return 'house';
  return 'walk';
}
function artSVG(key) {
  const a = ART[key] || ART.walk;
  return `<svg viewBox="0 0 40 30" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${a.name}">${a.svg}</svg>`;
}

/* 交通圖示：24×24 單線風格（Font Awesome 向量路徑不可用時的替代，README 有註記） */
const MODE_ICON = {
  walk: '<circle cx="13" cy="4" r="2"/><path d="M12 8l-3 4 1 5-2 6M13 12l3 3 1 6M11 9l4 1 3-1M12 8l4 1"/>',
  train: '<rect x="6" y="4" width="12" height="12" rx="3"/><path d="M8 8h8M8 12h8M7 16l-2 4M17 16l2 4M6 20h12"/>',
  metro: '<rect x="6" y="4" width="12" height="11" rx="2"/><path d="M9 7h6v4H9zM8 19l-2 3M16 19l2 3M6 15h12M12 15v4"/>',
  shinkansen: '<path d="M4 18h14c3 0 4-2 4-5L17 5H8C6 5 5 7 5 10v4c0 2 0 4-1 4z"/><path d="M8 8h7M6 13h10M4 21h16"/>',
  bus: '<rect x="5" y="4" width="14" height="13" rx="2"/><path d="M8 7h8M8 11h8M7 17v3M17 17v3M5 10H3v4h2M19 10h2v4h-2"/>',
  taxi: '<path d="M4 17h16v-3l-2-4H8l-2 4z"/><rect x="10" y="8" width="4" height="2"/><path d="M6 20h3M15 20h3"/>',
  car: '<path d="M3 16h18v-4l-3-4H7L3 12z"/><path d="M6 8l1 4h10l1-4"/>',
  plane: '<path d="M3 12l10-1 4-7 2 7 6-1-1 4-5 1 1 5-2 1-3-5-5 1z"/>',
};
function modeIcon(mode) {
  const d = MODE_ICON[mode] || MODE_ICON.train;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}
const MODE_NAME = { train:'火車', metro:'地鐵', shinkansen:'新幹線', bus:'公車', walk:'步行', taxi:'計程車', car:'自駕', plane:'飛機' };
