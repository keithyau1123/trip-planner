# Google Apps Script 版（模式 B：每個 Workspace 帳號自己一份行程）

同一個網頁介面，擺喺 Google Apps Script Web App 後面：

- **門禁**：只有你 Google Workspace domain 嘅帳號開到（兩層：部署設定 ＋ Code.gs 嘅 `ALLOWED_DOMAINS`）
- **每人一份**：行程／打包／設定全部存喺 Google 雲端（UserProperties），按帳號自動分隔，換機換 browser 都跟住個帳號
- GitHub Pages 版（`https://keithyau1123.github.io/trip-planner/`）照用得，兩者互相獨立

## 檔案

| 檔案 | 點解有 |
|---|---|
| `Code.gs` | 後台：門禁 ＋ 分塊讀寫（每人一份）。**呢個係手寫 source** |
| `index.html` / `css.html` / `js_svg.html` / `js_map.html` / `js_app.html` | 全部由 `pwsh -File build/gas.ps1` 從 web 版生成，**唔好手改**；改 web 版後重新生成再推 |

Apps Script 檔名唔容許「-」頭／連字號有限制，所以 include 名用底線（`js_svg` 等）。

## 方法 A：clasp（推薦，一次授權、之後一條命令更新）

呢部機已有 Node 24。授權会開瀏覽器 OAuth，用**你個 Workspace 帳號**撳准：

```powershell
npm i -g @google/clasp
clasp login            # 開 browser，用你個 Google 帳號授權
cd C:\Users\yakh\Documents\Strata\Workspace\trip-planner\apps-script
clasp create --type webapp --title "trip-planner"   # 第一次先做
clasp push
```

之後每次改完 web 版：`pwsh -File ..\build\gas.ps1` → `clasp push` → 去 script.google.com 「管理部署」→ 編輯 → **新版本**。

## 方法 B：第一次手動貼（唔想裝 clasp）

1. 開 <https://script.google.com> → 新項目
2. `Code.gs` 內容貼入唯一個 .gs 檔
3. ＋ → HTML，分別建 5 個檔：`index`、`css`、`js_svg`、`js_map`、`js_app`，內容照貼 `apps-script/` 入面對應 .html
4. 儲存

## 部署（最關鍵，兩個掣一定要啱）

1. 改 `Code.gs` 頂部 `ALLOWED_DOMAINS = ['你嘅domain.com']`（例如 `['mycompany.com.hk']`；留空 `[]` 即淨係靠部署設定）
2. 儲存 → **部署 → 新版本**（或首次：部署 → 全新部署 → 類型「網頁應用程式」）
   - **執行身分：存取的使用者**（「執行為使用者存取」）← 唔係「我」！做錯會每人見到空 email、雲端同步唔到
   - **有權存取的使用者：僅 <你嘅 domain>（完整網域存取）** ← 呢個先係「指定 email domain 先入到」嘅正門
3. 複製 Web app URL（結尾 `/exec`），用 domain 內帳號開

首次開會有一個 Google 授權同意頁（Accessing your Google… 揀 Allow）；之後每次開：

- 空白旅程 → FAB「＋」→ 匯入行程 → 貼 JSON（之後所有改動即時自動上雲端，冇再做匯入）
- 標題欄會見到 `☁ 你個email` 嘅云端 chip；⏳＝未同步、⚠️＝重試緊

## 常見情況

- **見到「冇得入」**：呢個帳號唔喺 `ALLOWED_DOMAINS`／部署 domain 範圍內；括号入面顯示咗佢攞到嘅 email，可以確認邊個申請
- **chip 顯示「攞唔到 email」**：部署「執行身分」唔係「存取的使用者」，改返再出新版本
- **ICS 下載**：Apps Script 內嵌頁面（iframe）大多数情況可下載；如果個 browser 唔畀 Store 個 button，就用 GitHub Pages 版匯 ICS／JSON 做 fallback
- **容量**：PropertiesService 每個帳號約 20KB 屬性值（我哋分塊用，一份行程大概幾 KB，幾十日活動都夠有餘）
- **想清返自己嗰份**：去編輯器揀 `resetMine` → 執行（要用自己帳號執行先啱得）；刪 project 即全部一併冇

## 同 GitHub Pages 版同步

行程 JSON 兩邊都係同一個匯入格式。喺 Pages 版改咗想搬去雲端版：匯出行程 JSON → 去雲端版匯入一次。之後两边各自獨立（雲端版改動唔會返去 Pages 版，除非你再搬一次）。
