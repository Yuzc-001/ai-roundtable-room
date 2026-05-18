#!/usr/bin/env bash
# =============================================================================
# AI 圆桌会议室 — 快速启动脚本 (Linux / macOS)
# 用法：bash start.sh [--prod]
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${CYAN}[start]${NC} $*"; }
ok()    { echo -e "${GREEN}[  ok ]${NC} $*"; }
warn()  { echo -e "${YELLOW}[ warn]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*"; exit 1; }

PROD_MODE=false
[[ "${1:-}" == "--prod" ]] && PROD_MODE=true

# ── Step 1: Node 版本检查 ────────────────────────────────────────────────────
log "检查 Node 版本..."
node_major=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))" 2>/dev/null) || \
  error "未找到 Node.js，请先安装 Node 22+：https://nodejs.org"
if [[ "$node_major" -lt 22 ]]; then
  error "Node.js 版本 $node_major 太旧，需要 22+。当前版本：$(node -v)"
fi
ok "Node $(node -v)"

# ── Step 2: .env 文件 ────────────────────────────────────────────────────────
if [[ ! -f ".env" ]]; then
  if [[ -f ".env.example" ]]; then
    cp .env.example .env
    warn ".env 不存在，已从 .env.example 创建。请打开 .env，至少填写 API_KEY；如使用中转，再填写 BASE_URL 和 MODEL。"
    warn "填写完成后重新运行此脚本。"
    exit 0
  else
    error "找不到 .env 或 .env.example，请先检查文件是否存在。"
  fi
fi
ok ".env 已存在"

# ── Step 3: 安装依赖 ─────────────────────────────────────────────────────────
if [[ ! -d "node_modules" ]]; then
  log "首次运行，安装依赖..."
  npm install || error "依赖安装失败，请检查网络或 package.json"
  ok "依赖安装完成"
else
  ok "依赖已安装"
fi

# ── Step 4: 环境诊断 ─────────────────────────────────────────────────────────
log "运行环境诊断（npm run doctor）..."
echo "────────────────────────────────────"
npm run doctor
echo "────────────────────────────────────"

# ── Step 5: 启动服务 ─────────────────────────────────────────────────────────
if [[ "$PROD_MODE" == "true" ]]; then
  log "构建生产包..."
  npm run build || error "构建失败"
  ok "构建成功"
  log "启动生产服务（PORT=${PORT:-5173}）..."
  exec npm run start
else
  log "启动开发服务..."
  echo ""
  echo -e "  ${GREEN}→ 打开浏览器访问：${CYAN}http://127.0.0.1:${PORT:-5173}${NC}"
  echo ""
  exec npm run dev
fi
