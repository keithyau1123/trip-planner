# 旅行規劃網站（日系繪本風）

依「旅行規劃網站｜可分享的 AI Prompt」實作的靜態網站：**純 HTML/CSS/JS，無建置步驟**，
可直接開 `index.html`、部署到 GitHub Pages / 任何靜態主機。旅程一開始是**空白**的，
你可以在網站內自己設定日期、新增行程，或貼上你現有的行程／JSON 匯入。

## 快速開始

```bash
# 直接開檔（本機試）
# 雙擊 index.html 即可；但地圖 geocode（Nominatim）建議用本地 server：
python -m http.server 8080
# 或
npx serve .
# 然後開 http://localhost:8080
```

## 功能對應

| 需求 | 實作 |
| --- | --- |
| 三頁：行程規劃／費用總覽／攜帶用品 | 頁首分頁＋底部綠色工具籤（向上展開） |
| 空白開始、自行設定 | ⚙ 旅程設定：名稱、目的地、起訖日期、時區、人數、幣別、匯率、每日出發/返回 |
| 新增／編輯／刪除行程 | 右上＋、單擊預覽、**雙擊編輯**、刪除可復原（Ctrl+Z） |
| 匯入你貼的行程 | 工具籤「匯入行程」：貼文字（`第1天` + `09:00 淺草寺 — 備註` 這種格式）或 JSON/檔案 |
| 匯出 | JSON 備份、**ICS**（以旅程當地時區輸出，可匯入 iCloud/Google 行事曆） |
| 拖移／調整時長 | 週視圖**長按 3 秒**才能拖；底部把手調時長；已預約可鎖定 🔒 |
| 地圖與路線 | 無 Google key：開源地圖（Leaflet+CARTO 灰階，CARTO 底圖已內置免費 Basemaps key；2025 年起無 key 舊 URL 會返回「API key required」佔用瓦片），路段依交通方式著色（火車藍/地鐵紫/新幹線橘/公車綠/步行灰虛線/計程車珊瑚），OSRM 實際步行線形；**目的地點兩下→Google Maps 導航** |
| Google Maps API key | 選填，放⚙設定（存本機）：有 key 改用 Google 自訂樣式（灰階＋淡藍水域）＋ Directions 線形/時間/票價預估；沒 key 一律走上方 fallback，預估保留不覆寫手動值 |
| 單日時間軸 | 日期電站列＋40×30 插圖滑站（550ms）、日期數字 320ms 彈跳、圓形追蹤、遠卡淡白漸層＋模糊、焦點卡 1.05×、滾輪單格上限 32px、紅線 HH:MM 每 15 秒（當地時區） |
| 費用 | 先按幣別匯率換算→單筆取整→合計；每人/每車/全團；待估標示；圓餅＋圖例；頁首眼睛切換總花費 |
| 用品 | 六分類彩色標頭、數量、備註、勾選進度、搜尋、完成篩選 |
| 減少動態 | `prefers-reduced-motion` 全關裝飾動畫 |

## SVG 插圖

- 品牌：251×66 城郭＋列車＋賽車＋摩天輪（列車每 4 秒左右 3px 循環）。
- 日期列：40×30 viewBox、墨灰 #3E3A39 線寬 1.7。附飞机/賽車摩天輪/宝贝球皮卡丘/铁道博物馆/任天堂/LEGO/面包超人/城郭/鳥居/温泉/寺廟/美食/住宿/散步。
- 逐日插圖**依當日行程自動選題**（關鍵字比對：城堡→城郭、F1/摩天輪→賽車摩天輪…），單日視圖右上角可手動改選。
- 交通圖示：Font Awesome 向量路徑離線不可用，改以同風格 24×24 單線路徑（見 `assets/js/svg.js` 註記）。

## 部署到 GitHub Pages

1. 把 repo 推上 GitHub（公開或私有皆可；私有需 Pages 付費方案或直接用 Pages 設定）。
2. Repo → Settings → Pages → Source: `Deploy from a branch` → 分支 `main` / `(root)`。
3. 網址會變成 `https://<用戶名>.github.io/<repo>/`。

## 隱私備註

- 全部資料存瀏覽器 `localStorage`（本機草稿），不經伺服器。
- Google Maps API key 只存本機，寫入前請自備 key（ Maps 計費綁你自己的帳務）。
- 匯出的 JSON 不包含 API key。

## 檔案結構

```
index.html            版面與樣式契約（ID/類別與原版一致）
assets/css/main.css   日系繪本風（色彩/圓角/3px 描邊/動畫/600,700,850 斷點）
assets/js/svg.js      品牌與日期插圖庫、插圖自動選題、交通圖示
assets/js/map.js      地圖模組（Leaflet fallback / Google 模式、geocode 快取）
assets/js/app.js      狀態、行事曆、時間軸、費用、用品、匯入匯出、ICS、復原
data/trip.sample.json 示範行程（可直接匯入玩看看）
ASSUMPTIONS.md        假設與待查項目清單（交付要求）
```
