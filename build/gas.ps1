# 由 web 版（單一副本）生成 apps-script/ 嘅 HtmlService include 檔。
# 用法：pwsh -File build/gas.ps1
# 規則：assets/css + assets/js 同 index.html 先係 source of truth；
#       apps-script/ 入面除 Code.gs 之外全部係生成物，唔好手改。
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root 'assets'
$out  = Join-Path $root 'apps-script'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function ReadU8([string]$p) { return [System.IO.File]::ReadAllText($p) }

# JS/CSS 直接嵌入 <script>/<style>：內文出現 </script> 會切斷標籤，要先確認冇
function Wrap([string]$content, [string]$open, [string]$close, [string]$name) {
  $closer = '</scr' + 'ipt>'
  if ($name -like 'js_*' -and $content.Contains($closer)) {
    throw "$name 內容含有 </script>，唔可以直接嵌入 <script> 區塊"
  }
  return $open + "`r`n" + $content + "`r`n" + $close
}

[System.IO.File]::WriteAllText((Join-Path $out 'css.html'),
  (Wrap (ReadU8 (Join-Path $src 'css\main.css')) '<style>' '</style>' 'css'), $utf8NoBom)

foreach ($pair in @(
  @{ name = 'js_svg'; src = 'js\svg.js' },
  @{ name = 'js_map'; src = 'js\map.js' },
  @{ name = 'js_app'; src = 'js\app.js' }
)) {
  [System.IO.File]::WriteAllText((Join-Path $out ($pair.name + '.html')),
    (Wrap (ReadU8 (Join-Path $src $pair.src)) '<script>' '</script>' $pair.name), $utf8NoBom)
}

# index.html template：外部檔案連結轉做 HtmlService include()，再注入使用者 email
$idx = ReadU8 (Join-Path $root 'index.html')
$repl = [ordered]@{
  '<link rel="stylesheet" href="assets/css/main.css">'            = "<?!= include('css') ?>"
  '<script src="assets/js/svg.js"></script>'                      = "<?!= include('js_svg') ?>"
  '<script src="assets/js/map.js"></script>'                      = "<?!= include('js_map') ?>"
  '<script src="assets/js/app.js"></script>'                      = "<script>var USER_EMAIL = <?!= JSON.stringify(_email ? _email : '') ?>;</script>`n<?!= include('js_app') ?>"
}
foreach ($k in $repl.Keys) {
  if (-not $idx.Contains($k)) { throw "index.html 搵唔到標籤：$k（web 版結構改咗，要更新 build/gas.ps1）" }
  $idx = $idx.Replace($k, $repl[$k])
}
[System.IO.File]::WriteAllText((Join-Path $out 'index.html'), $idx, $utf8NoBom)

Write-Host "OK：apps-script/ 已生成 css.html, js_svg.html, js_map.html, js_app.html, index.html"
