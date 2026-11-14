/* ===== 地圖模組：只用 Google Maps =====
   - 地圖一律用 Google Maps JS SDK（要喺 ⚙ 旅程設定輸入 Google Maps API key，
     專案需開通 Maps JavaScript API + Directions API；Geocoding 用 SDK 自帶，唔另使 key）。
   - 未填 key：地圖區顯示提示，其他功能（行程、費用、打包、🚌 按鈕提示）照常。
   - geocode 結果有本機快取（GEO_CACHE_KEY），同地址唔-repeat 食 quota。
*/
const GEO_CACHE_KEY = 'jp-trip-geo-cache-v1';
/* localStorage 安全包裝：Apps Script HtmlService 嘅 sandbox iframe 有可能禁 localStorage，
   禁咗就淨係用記憶體快取（每次開頁重新 geocode），唔好撻死成個 app。 */
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 沙箱唔畀用：忽略 */ } }
const geoCache = JSON.parse(lsGet(GEO_CACHE_KEY) || '{}');

const MapX = (() => {
  let el = null, gmap = null, key = '', sdkKey = null;

  function init(element) { el = element; }

  function placeholder(html) {
    if (!el || gmap) return;
    el.innerHTML = `<div style="display:flex;height:100%;min-height:180px;align-items:center;justify-content:center;text-align:center;padding:20px;color:#6b655e;font-size:14px;line-height:2">${html}</div>`;
  }
  const KEY_HINT = `🗺️ 地圖用 <b style="margin:0 4px">Google Maps</b>。<br>撳右上角 ⚙ 旅程設定 → 輸入 Google Maps API key（_maps.googleapis.com_ 需開通 Maps JavaScript API 同 Directions API）<br>填咗 key 就有地圖，同埋先至用到 🚌 查實際班次。`;

  function saveCache(q, lat, lng) { geoCache[q] = [lat, lng]; lsSet(GEO_CACHE_KEY, JSON.stringify(geoCache)); }

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

  async function drawGoogle(evts, showRoute) {
    const gm = await loadGoogle(key);
    if (!gmap) {
      gmap = new gm.maps.Map(el, { center: { lat: 35.68, lng: 139.69 }, zoom: 6, styles: G_STYLES, disableDefaultUI: false, mapTypeControl: false, streetViewControl: false });
      gmap.setOptions({ gestureHandling: 'greedy' });
    }
    // 清掉舊覆蓋物
    (gmap.__over = gmap.__over || []).forEach(o => o.setMap(null));
    gmap.__over = [];
    const bounds = new gm.maps.LatLngBounds();
    const sorted = [...evts].sort((a, b) => a.startMin - b.startMin);
    const fitLater = () => { try { gmap.fitBounds(bounds, 40); } catch (e) {} };
    const isNode = e => e.category !== 'transit' && !(e.category === 'stay' && !e.address);
    let any = false;
    for (const e of sorted) {
      if (!isNode(e)) continue;
      any = true;
      const mk = new gm.maps.Marker({ map: gmap, title: e.name });
      gmap.__over.push(mk);
      const resolve = loc => {
        mk.setPosition(loc);
        mk.addListener('dblclick', () => window.open(navUrl(e), '_blank')); // 點兩下直接導航
        mk.addListener('click', () => gmap.panTo(loc));
        bounds.extend(loc);
        fitLater();
      };
      const q = e.address || e.name;
      const cached = geoCache[q];
      if (cached) { resolve({ lat: cached[0], lng: cached[1] }); continue; }
      if (gm.maps.places && gm.maps.places.search) {
        gm.maps.places.search({ query: q, fields: ['place_id', 'geometry', 'displayName'] })
          .then(res => {
            const p = res?.places?.[0];
            if (p) { resolve(p.geometry.location); saveCache(q, p.geometry.location.lat(), p.geometry.location.lng()); }
          })
          .catch(() => {});
      } else {
        const GC = (gm.maps.places && gm.maps.places.Geocoder) || gm.maps.Geocoder;
        new GC().geocode({ address: q }, (r, s) => {
          if (s === 'OK' && r[0]) { resolve(r[0].geometry.location); saveCache(q, r[0].geometry.location.lat(), r[0].geometry.location.lng()); }
        });
      }
    }
    if (showRoute) {
      const nodeIdx = [];
      sorted.forEach((e, i) => { if (isNode(e)) nodeIdx.push(i); });
      for (let k = 1; k < nodeIdx.length; k++) {
        const prev = sorted[nodeIdx[k - 1]], next = sorted[nodeIdx[k]];
        const pends = sorted.slice(nodeIdx[k - 1] + 1, nodeIdx[k]).filter(e => e.category === 'transit');
        const modeE = pends.length ? pends[pends.length - 1].mode : 'walk';
        const allWalk = pends.length && pends.every(p => p.mode === 'walk');
        const travelMode = allWalk ? 'WALKING' : (modeE === 'taxi' || modeE === 'car') ? 'DRIVING'
          : modeE === 'plane' ? 'PLANE' : 'TRANSIT';
        if (travelMode === 'PLANE') continue; // 航班唔使 Directions 畫線
        new gm.maps.DirectionsService().route({ origin: prev.address || prev.name, destination: next.address || next.name, travelMode }, (res, status) => {
          if (status !== 'OK' || !res?.routes?.[0]) return;
          const leg = res.routes[0].legs[0];
          const pl = new gm.maps.Polyline({ map: gmap, path: leg.overview_path, strokeColor: LEG_COLOR[modeE] || '#84909E', strokeWeight: 4, strokeOpacity: .95 });
          gmap.__over.push(pl);
          bounds.extend(leg.start_location); bounds.extend(leg.end_location); fitLater();
          if (window.AppX && AppX.applyRouteResult) AppX.applyRouteResult(next.id, leg.duration?.value, leg.distance?.text, leg.fare?.value?.currency);
        });
      }
    }
    if (!any) gmap.setCenter({ lat: 35.68, lng: 139.69 });
    return true;
  }

  async function showDay(evts, opts = {}) {
    const showRoute = opts.route !== false;
    if (!key) { placeholder(KEY_HINT); return; }
    try { return await drawGoogle(evts, showRoute); }
    catch (e) {
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

  /* A→B 公共交通班次（Google Directions TRANSIT）：幾個方案一次過顯示，
     等於「miss 咗呢班，接住仲有邊班」；出發時間可揀未來任何一刻。
     無 Google SDK（未填/未載入 key）就回 NO_KEY，由 app.js 彈提示。 */
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
      if (departMs) req.departureTime = new Date(departMs);
      new g.maps.DirectionsService().route(req, (res, status) => {
        if (status !== 'OK' || !res || !res.routes || !res.routes.length) { resolve({ error: String(status || 'ZERO_RESULTS') }); return; }
        resolve({
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

  return { init, showDay, setKey, transitSearch, get mode() { return (window.google && window.google.maps && window.google.maps.DirectionsService) ? 'google' : 'none'; } };
})();

function navUrl(e) {
  const q = encodeURIComponent(e.address || e.name);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}
