$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
Write-Host '正在启动璇玑，请保持此窗口打开。' -ForegroundColor Yellow
Write-Host '打开浏览器访问：http://127.0.0.1:4173/' -ForegroundColor Cyan
Write-Host '关闭窗口即可停止服务。' -ForegroundColor Gray
node (Join-Path $PSScriptRoot 'scripts/server.mjs')
if ($LASTEXITCODE -ne 0) {
  if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host 'Node启动失败，改用已安装的Python静态服务器。' -ForegroundColor Yellow
    python -m http.server 4173 --directory $PSScriptRoot
  } else {
    Write-Host 'Node和Python都不可用，请先安装其中一个运行工具，再重新启动。' -ForegroundColor Red
  }
}
