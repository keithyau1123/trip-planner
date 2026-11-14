/* ===== 地圖模組：地圖顯示只用 Google Maps =====
   - 底圖／平移／縮放：Google Maps JS SDK（⚙ 輸入 Google Maps API key；專案開通
     Maps JavaScript API）。呢個屬 Google 免費層（Essentials），唔使 billing。
   - 標記坐标（地址→经纬度）同步行線形：用免 key 嘅 Nominatim + OSRM（Google
     Geocoding/Directions 喺 2025 收費制屬付費層，未開 billing 會 REQUEST_DENIED）。
   - 🚌 查實際班次（transitSearch，Google Directions）：project 開通 billing 後
     自動可用，唔使改 code。
*/
const GEO_CACHE_KEY = 'jp-trip-geo-cache-v1';
/* localStorage 安全包裝：Apps Script HtmlService 嘅 sandbox iframe 有可能禁 localStorage，
   禁咗就淨係用記憶體快取（每次開頁重新 geocode），唔好撻死成個 app。 */
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 沙箱唔畀用：忽略 */ } }
const geoCache = JSON.parse(lsGet(GEO_CACHE_KEY) || '{}');

const MapX = (() => {
  let el = null, gmap = null, key = '', sdkKey = null;
  let billingOk = null; // null=未知；false=Geocoding/Directions 被拒（未開 billing）

  function init(element) { el = element; }

  function placeholder(html) {
    if (!el || gmap) return;
    el.innerHTML = `<div style="display:flex;height:100%;min-height:180px;align-items:center;justify-content:center;text-align:center;padding:20px;color:#6b655e;font-size:14px;line-height:2">${html}</div>`;
  }
  const KEY_HINT = `🗺️ 地圖用 <b style="margin:0 4px">Google Maps</b>。<br>撳右上角 ⚙ 旅程設定 → 輸入 Google Maps API key（專案需開通 Maps JavaScript API）<br>填咗 key 就有地圖；🚌 查實際班次另需 project 開通 billing。`;

  function saveCache(q, lat, lng) { geoCache[q] = [lat, lng]; lsSet(GEO_CACHE_KEY, JSON.stringify(geoCache)); }

  /* --- geocode（Nominatim，免 key，限速 ≥1.1s/req，含快取與去重） --- */
  const inflight = new Map();
  let lastGeo = 0;
  function geocode(q) {
    if (!q) return Promise.resolve(null);
    if (geoCache[q]) return Promise.resolve(geoCache[q]);
    if (inflight.has(q)) return inflight.get(q);
    const p = slowLookup(q).then(ll => { inflight.delete(q); return ll; });
    inflight.set(q, p);
    return p;
  }
  async function slowLookup(q) {
    const wait = 1100 - (Date.now() - lastGeo);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastGeo = Date.now();
    let ll = null;
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q), { headers: { 'Accept-Language': 'zh' } });
      const j = await r.json();
      if (j[0]) { ll = [+j[0].lat, +j[0].lon]; geoCache[q] = ll; lsSet(GEO_CACHE_KEY, JSON.stringify(geoCache)); }
    } catch (e) { /* 離線或被擋：略過 */ }
    return ll;
  }

  async function osrmRoute(a, b) {
    if (!a || !b) return null;
    try {
      const c = new AbortController(); const t = setTimeout(() => c.abort(), 4500);
      const r = await fetch(`https://router.project-osrm.org/route/v1/foot/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`, { signal: c.signal });
      clearTimeout(t);
      const j = await r.json();
      if (j.routes && j.routes[0]) return { line: j.routes[0].geometry.coordinates.map(p => [p[1], p[0]]), durSec: j.routes[0].duration || null };
    } catch (e) {}
    return null;
  }

  /* 從事件排出可的地點節點與路段 */
  function nodesAndLegs(evts) {
    const sorted = [...evts].sort((a, b) => a.startMin - b.startMin);
    const nodes = [], legs = [];
    let lastNode = null, pendModes = [], pendMin = 0;
    for (const e of sorted) {
      if (e.category === 'transit') { pendModes.push(e.mode || 'train'); pendMin += e.durationMin; continue; }
      if (e.category === 'stay' && !e.address) continue;
      const node = { e, ll: geoCache[e.address || e.name] || null };
      if (lastNode) {
        const modes = pendModes.length ? pendModes : ['walk'];
        const allWalk = modes.every(m => m === 'walk');
        legs.push({ a: lastNode, b: node, mode: allWalk ? 'walk' : modes[modes.length - 1], allWalk, min: pendMin, merged: modes.length });
      }
      nodes.push(node); lastNode = node; pendModes = []; pendMin = 0;
    }
    return { nodes, legs };
  }

  const LEG_COLOR = { train:'#4678C5', metro:'#9266C2', shinkansen:'#D8902C', bus:'#3A9B80', walk:'#84909E', taxi:'#D77968', car:'#4678C5', plane:'#9266C2' };

  /* ---------- Google Maps SDK 載入（每頁淨係可以注入一次） ---------- */
  function loadGoogle(k) {
    return new Promise((res, rej) => {
      window.gm_authFailure = () => {
        gmap = null;
        placeholder(`⚠️ Google Maps key <b style="margin:0 4px">驗證失敗</b>（key 無效、限制太窄或額度問題）。<br>喺 ⚙ 旅程設定檢查/換返個 key，改完記得 Ctrl+F5 重新整理。`);
        toast('Google Maps key 驗證失敗，地圖無法顯示');
      };
      if (window.__gmapsCb) { sdkKey = sdkKey || k; return res(window.google); }
      sdkKey = k;
      window.__gmapsCb = () => res(window.google);
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(k)}&callback=__gmapsCb&loading=async`;
      s.onerror = rej; document.head.appendChild(s);
      setTimeout(() => window.google?.maps ? res(window.google) : rej(new Error('gmaps load timeout')), 12000);
    });
  }
  const G_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#e6e4e0' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#4a4744' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#A8D3E6' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  ];

  function p2(p) { return { lat: p[0], lng: p[1] }; } // v3.66 向量地圖對 LatLng 要求嚴格：陣座標一律轉返物件先至喂俾 SDK

  /* ---------- 繪製：Google 底圖 + 免 key 坐標/線形 ---------- */
  async function draw(evts, showRoute) {
    const gm = await loadGoogle(key);
    if (!gmap) {
      gmap = new gm.maps.Map(el, { center: { lat: 35.68, lng: 139.69 }, zoom: 6, styles: G_STYLES, disableDefaultUI: false, mapTypeControl: false, streetViewControl: false });
      gmap.setOptions({ gestureHandling: 'greedy' });
    }
    (gmap.__over = gmap.__over || []).forEach(o => o.setMap(null));
    gmap.__over = [];
    const bounds = new gm.maps.LatLngBounds();
    const { nodes, legs } = nodesAndLegs(evts);
    for (const n of nodes) if (!n.ll) n.ll = await geocode(n.e.address || n.e.name);
    let any = false;
    for (const n of nodes) {
      if (!n.ll) continue;
      any = true;
      const loc = { lat: n.ll[0], lng: n.ll[1] };
      const mk = new gm.maps.Marker({ map: gmap, position: loc, title: n.e.name });
      gmap.__over.push(mk);
      const info = new gm.maps.InfoWindow({ content: `<div style="font-size:13px;line-height:1.7"><b>${n.e.name}</b><br>${fmtHM(n.e.startMin)}–${fmtHM(n.e.startMin + n.e.durationMin)}<br><a target="_blank" rel="noopener" href="${navUrl(n.e)}">🧭 Google Maps 導航</a></div>` });
      mk.addListener('click', () => { gmap.panTo(loc); info.open({ map: gmap, anchor: mk }); });
      mk.addListener('dblclick', () => window.open(navUrl(n.e), '_blank'));
      bounds.extend(loc);
    }
    if (showRoute) {
      for (const lg of legs) {
        if (!lg.a.ll || !lg.b.ll) continue;
        let line = null, durSec = null;
        if (lg.allWalk) { const r = await osrmRoute(lg.a.ll, lg.b.ll); if (r) { line = r.line; durSec = r.durSec; } }
        if (!line) line = [lg.a.ll, lg.b.ll];
        const path = line.map(p2);
        const pl = new gm.maps.Polyline({ map: gmap, path, strokeColor: LEG_COLOR[lg.mode] || '#84909E', strokeWeight: 4, strokeOpacity: .9, ...(lg.allWalk ? { icons: undefined, strokeOpacity: .85 } : {}) });
        gmap.__over.push(pl);
        bounds.extend(path[0]); bounds.extend(path[path.length - 1]);
        if (durSec && window.AppX && AppX.applyRouteResult) AppX.applyRouteResult(lg.b.e.id, durSec / 60, null, null);
      }
    }
    if (any) { try { gmap.fitBounds(bounds, 40); gmap.addListenerOnce('idle', () => console.log('[mapx] idle z=', gmap.getZoom())); } catch (e) { console.log('[mapx] fitBounds fail', e); gmap.setCenter({ lat: 43.06, lng: 141.35 }); } }
    else gmap.setCenter({ lat: 35.68, lng: 139.69 });
    return true;
  }

  async function showDay(evts, opts = {}) {
    const showRoute = opts.route !== false;
    if (!key) { placeholder(KEY_HINT); return; }
    try { return await draw(evts, showRoute); }
    catch (e) {
      console.log('[mapx] draw error:', e && e.stack || e);
      placeholder('⚠️ <b style="margin:0 4px">Google Maps 載入失敗</b>（網絡被擋、VPN／防火牆，或 key 問題）。<br>關埋 VPN／擴充再 Ctrl+F5；檢查 ⚙ 設定入面個 key。');
      toast('Google Maps 載入失敗：地圖暫時無顯示');
    }
  }

  async function setKey(k) {
    const nk = (k || '').trim();
    if (nk === key) return;
    key = nk;
    if (!key) { gmap = null; placeholder(KEY_HINT); return; }
    if (window.__gmapsCb && key !== sdkKey) { toast('key 改咗；Ctrl+F5 重新整理先至會用新 key 畫地圖'); return; }
    try { await loadGoogle(key); } catch (e) { /* authFailure／載入失敗由 gm_authFailure／showDay 顯示 */ }
  }

  /* A→B 公共交通班次（Google Directions TRANSIT）：幾個方案一次過顯示。
     ⚠️ Google 2025 收費制：Directions 屬付費層——project 未開通 billing 會回
     REQUEST_DENIED（提示會講清楚點樣開）。標準層 SDK 唔支持指定出發時間
     （departureTime 會俾 SDK 拒），所以查嘅係「而家出發」嘅建議路線；
     要「miss 咗接住邊班」需要開 billing 再用 Routes API（後續升級）。 */
  function transitSearch(qa, qb, departMs) {
    return new Promise(resolve => {
      const g = window.google;
      if (!g || !g.maps || !g.maps.DirectionsService) { resolve({ error: 'NO_KEY' }); return; }
      const req = {
        origin: qa, destination: qb,
        travelMode: 'TRANSIT',
        provideRouteAlternatives: true,
      };
      if (g.maps.UnitSystem) req.unitSystem = g.maps.UnitSystem.METRIC;
      new g.maps.DirectionsService().route(req, (res, status) => {
        if (status !== 'OK' || !res || !res.routes || !res.routes.length) { resolve({ error: String(status || 'ZERO_RESULTS') }); return; }
        resolve({
          noDepartTime: !!departMs, // 標準層：查嘅係「而家」，唔係你揀嗰個時間
          routes: res.routes.slice(0, 5).map(r => ({
            summary: r.summary || '',
            legs: (r.legs || []).map(l => ({
              mode: String(l.travel_mode || 'WALKING').toUpperCase(),
              line: (l.vehicle && l.vehicle.name) || '',
              short: (l.vehicle && l.vehicle.short_names) ? l.vehicle.short_names.join('/') : '',
              head: l.head_sign || '',
              from: l.start_address || '',
              to: l.end_address || '',
              dep: (l.departure_time && l.departure_time.getTime) ? l.departure_time.getTime() : null,
              arr: (l.arrival_time && l.arrival_time.getTime) ? l.arrival_time.getTime() : null,
              dur: (l.duration && l.duration.value) ? l.duration.value : null,
              dist: (l.distance && l.distance.text) || '',
            })),
          })),
        });
      });
    });
  }

  return { init, showDay, setKey, transitSearch, get mode() { return (window.google && window.google.maps && window.google.maps.DirectionsService) ? 'google' : 'none'; }, get _map() { return gmap; } };
})();

function navUrl(e) {
  const q = encodeURIComponent(e.address || e.name);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}
