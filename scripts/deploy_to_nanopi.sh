#!/usr/bin/env bash
# ==============================================================================
# Script de Build do Front e Envio (Deploy) para o NanoPi NEO
# Execute este script no seu computador de desenvolvimento (Linux/WSL/Git Bash)
# ==============================================================================

set -e

# Configurações do NanoPi NEO (Ajuste o IP se necessário)
NANOPI_USER="lnb"
NANOPI_HOST="192.168.1.100"  # <-- Altere para o IP do seu NanoPi na rede local
NANOPI_DIR="/home/lnb/AppFinanceiro"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================================="
echo "🔨 Compilando Frontend React (Vite PWA)..."
echo "=========================================================="

cd "$PROJECT_ROOT/front"
npm run build

echo "✅ Build do React concluído com sucesso em front/dist/!"

# Garante a pasta dist na raiz do projeto
cd "$PROJECT_ROOT"
rm -rf dist
cp -r front/dist dist

echo "=========================================================="
echo "🚀 Sincronizando arquivos com o NanoPi NEO ($NANOPI_USER@$NANOPI_HOST)..."
echo "=========================================================="

# Utiliza rsync para transferir apenas o necessário, ignorando lixo e node_modules
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'front' \
    --exclude 'front-react' \
    --exclude '.git' \
    --exclude 'venv' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.pytest_cache' \
    --exclude '.env.local' \
    "$PROJECT_ROOT/" "$NANOPI_USER@$NANOPI_HOST:$NANOPI_DIR/"

echo "=========================================================="
echo "✨ Deploy concluído com sucesso no NanoPi NEO!"
echo "➡️  Para iniciar na placa, acesse via SSH e rode: bash scripts/start_nanopi.sh"
echo "=========================================================="
