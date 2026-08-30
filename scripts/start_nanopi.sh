#!/usr/bin/env bash
# ==============================================================================
# Script de Inicialização e Execução no NanoPi NEO (Armbian Minimal / Debian 13)
# Otimizado para baixo consumo de RAM (256MB/512MB) e economia de I/O em MicroSD
# ==============================================================================

set -e

# Diretório base da aplicação
APP_DIR="/home/lnb/AppFinanceiro"
cd "$APP_DIR"

echo "=========================================================="
echo "🚀 Iniciando AppFinanceiro no NanoPi NEO (ARMv7)"
echo "=========================================================="

# 1. Criação do Virtualenv Nativo ARM (se não existir)
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual Python nativo ARM..."
    python3 -m venv venv
fi

# 2. Ativação do Virtualenv
source venv/bin/activate

# 3. Instalação / Atualização de Dependências
echo "📥 Verificando dependências Python (--no-cache-dir para economizar RAM/Disco)..."
pip install --upgrade pip --no-cache-dir --quiet
pip install -r requirements.txt --no-cache-dir --quiet

# Garante gunicorn instalado
pip install gunicorn --no-cache-dir --quiet

# 4. Aplicação de Migrações do Banco SQLite
echo "🗄️ Executando migrações do banco de dados SQLite..."
python manage.py migrate --noinput

# 5. Coleta de Arquivos Estáticos do Django/Admin
echo "🎨 Coletando arquivos estáticos do Django e Admin..."
python manage.py collectstatic --noinput --quiet || true

# 6. Inicialização do Servidor de Produção Otimizado
# Configurado com 2 workers assíncronos (ideal para 256MB/512MB RAM)
echo "⚡ Iniciando Gunicorn na porta 8000 (2 workers, threads otimizadas)..."
exec gunicorn config.wsgi:application \
    --name app_financeiro \
    --workers 2 \
    --threads 2 \
    --worker-class gthread \
    --worker-tmp-dir /dev/shm \
    --bind 0.0.0.0:8000 \
    --timeout 60 \
    --log-level info
