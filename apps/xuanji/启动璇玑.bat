@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo 正在启动璇玑，请保持此窗口打开。
echo 打开浏览器访问：http://127.0.0.1:4173/
echo 关闭窗口即可停止服务。
node "%~dp0scripts\server.mjs"
if errorlevel 1 (
  where python > nul 2>&1
  if not errorlevel 1 (
    echo Node启动失败，改用已安装的Python静态服务器。
    python -m http.server 4173 --directory "%~dp0"
  ) else (
    echo Node和Python都不可用，请先安装其中一个运行工具，再重新启动。
  )
)
pause
