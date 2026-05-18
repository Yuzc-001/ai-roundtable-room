@echo off
REM =============================================================================
REM AI 圆桌会议室 — 快速启动脚本 (Windows)
REM 用法：双击运行，或在命令行执行 start.bat [--prod]
REM =============================================================================

setlocal enabledelayedexpansion
set "PROD_MODE=false"
if "%~1"=="--prod" set "PROD_MODE=true"

echo.
echo  ============================================================
echo    AI 圆桌会议室  ^|  快速启动
echo  ============================================================
echo.

REM ── Step 1: Node 版本检查 ────────────────────────────────────────────────
echo [start] 检查 Node 版本...
where node >nul 2>&1
if errorlevel 1 (
  echo [error] 未找到 Node.js，请先安装 Node 22+：https://nodejs.org
  pause
  exit /b 1
)
for /f "tokens=1 delims=." %%v in ('node -e "process.stdout.write(process.versions.node)"') do set "NODE_MAJOR=%%v"
if %NODE_MAJOR% LSS 22 (
  echo [error] Node.js 版本太旧（需要 22+），当前版本：
  node -v
  pause
  exit /b 1
)
echo [  ok ] Node 版本满足要求
node -v

REM ── Step 2: .env 文件 ────────────────────────────────────────────────────
echo.
echo [start] 检查 .env 文件...
if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo [ warn] .env 不存在，已从 .env.example 创建。
    echo [ warn] 请用文本编辑器打开 .env，至少填写 API_KEY；如使用中转，再填写 BASE_URL 和 MODEL。
    echo.
    echo  正在打开 .env 文件...
    start notepad ".env"
    pause
    exit /b 0
  ) else (
    echo [error] 找不到 .env 或 .env.example，请检查文件是否完整。
    pause
    exit /b 1
  )
)
echo [  ok ] .env 已存在

REM ── Step 3: 安装依赖 ─────────────────────────────────────────────────────
echo.
echo [start] 检查依赖...
if not exist "node_modules" (
  echo [start] 首次运行，安装依赖（npm install）...
  npm install
  if errorlevel 1 (
    echo [error] 依赖安装失败，请检查网络或 package.json
    pause
    exit /b 1
  )
  echo [  ok ] 依赖安装完成
) else (
  echo [  ok ] 依赖已安装
)

REM ── Step 4: 环境诊断 ─────────────────────────────────────────────────────
echo.
echo [start] 运行环境诊断...
echo  ------------------------------------------------------------
npm run doctor
echo  ------------------------------------------------------------

REM ── Step 5: 启动服务 ─────────────────────────────────────────────────────
echo.
if "%PROD_MODE%"=="true" (
  echo [start] 构建生产包...
  npm run build
  if errorlevel 1 (
    echo [error] 构建失败
    pause
    exit /b 1
  )
  echo [start] 启动生产服务...
  npm run start
) else (
  echo [  ok ] 启动开发服务...
  echo.
  echo   -^> 打开浏览器访问：http://127.0.0.1:5173
  echo.
  npm run dev
)

pause
