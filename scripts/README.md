# 🚀 Guia de Deploy e Execução no NanoPi NEO (ARMv7 / Armbian)

Este diretório contém os scripts e arquivos de configuração otimizados para compilação, envio e execução do **AppFinanceiro** em dispositivos embarcados de baixo consumo de recursos, como o **NanoPi NEO (Allwinner H3, ARMv7 / armhf com 256MB / 512MB RAM)** rodando **Armbian (Debian 13 Minimal)**.

---

## 📁 Estrutura dos Arquivos

| Arquivo | Onde Executar | Descrição |
| :--- | :--- | :--- |
| **`deploy_to_nanopi.sh`** | **Computador de Desenvolvimento** | Compila o frontend React (`npm run build`), copia os artefatos para `dist/` e envia os arquivos necessários para a placa via `rsync`. |
| **`start_nanopi.sh`** | **NanoPi NEO (SSH)** | Cria o `venv` ARM nativo, instala dependências com `--no-cache-dir`, aplica migrações e inicia o Gunicorn otimizado. |
| **`nginx_appfinanceiro.conf`** | **NanoPi NEO (Nginx)** | Configuração de alta performance para o Nginx servir o `dist/` diretamente na porta 80 e encaminhar a API para o Django. |
| **`appfinanceiro.service`** | **NanoPi NEO (Systemd)** | Daemon do Systemd para gerenciar o backend e iniciar automaticamente com o boot da placa. |

---

## 🛠️ Passo 1: Compilação e Envio (No seu Computador)

Execute este passo no seu computador (Linux, WSL ou Git Bash):

1. Abra o arquivo `scripts/deploy_to_nanopi.sh` e verifique o **IP da placa**:
   ```bash
   NANOPI_USER="lnb"
   NANOPI_HOST="192.168.1.100"  # <-- Ajuste para o IP do seu NanoPi
   NANOPI_DIR="/home/lnb/AppFinanceiro"
   ```

2. Dê permissão e execute o deploy:
   ```bash
   chmod +x scripts/deploy_to_nanopi.sh
   bash scripts/deploy_to_nanopi.sh
   ```

> 💡 **Nota:** O script ignora automaticamente pastas pesadas como `node_modules/`, `front/` e caches, transferindo apenas o essencial para a placa.

---

## ⚡ Passo 2: Execução no NanoPi NEO (Via SSH)

Acesse sua placa via SSH:
```bash
ssh lnb@<IP_DO_NANOPI>
cd /home/lnb/AppFinanceiro
```

### Opção A: Execução Direta / Teste Rápido
Para rodar diretamente no terminal:
```bash
chmod +x scripts/start_nanopi.sh
bash scripts/start_nanopi.sh
```

---

### Opção B: Configuração Permanente de Produção (Nginx + Systemd)

Esta é a configuração recomendada para que o sistema rode em segundo plano e reinicie automaticamente em caso de queda de energia:

#### 1. Instalar e Configurar o Nginx
```bash
sudo apt update && sudo apt install -y nginx

# Copiar a configuração do site
sudo cp /home/lnb/AppFinanceiro/scripts/nginx_appfinanceiro.conf /etc/nginx/sites-available/appfinanceiro

# Ativar o site e remover o padrão
sudo ln -sf /etc/nginx/sites-available/appfinanceiro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar o Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### 2. Configurar o Serviço do Backend (Systemd)
```bash
# Copiar o arquivo de serviço
sudo cp /home/lnb/AppFinanceiro/scripts/appfinanceiro.service /etc/systemd/system/

# Recarregar os daemons do sistema
sudo systemctl daemon-reload

# Ativar no boot e iniciar o serviço
sudo systemctl enable appfinanceiro
sudo systemctl start appfinanceiro
```

---

## 🔍 Comandos Úteis de Manutenção no NanoPi

* **Ver status do backend:**
  ```bash
  sudo systemctl status appfinanceiro
  ```

* **Acompanhar logs em tempo real:**
  ```bash
  sudo journalctl -u appfinanceiro -f
  ```

* **Reiniciar o backend:**
  ```bash
  sudo systemctl restart appfinanceiro
  ```

* **Recarregar o Nginx:**
  ```bash
  sudo systemctl reload nginx
  ```

---

## 🎯 Otimizações para Baixo Consumo de RAM (256MB / 512MB)
1. **Sem Node.js na Placa:** O processamento pesado de compilação do Vite/React ocorre na sua máquina de desenvolvimento.
2. **`--no-cache-dir` no Pip:** Evita sobrecarga de memória temporária durante atualizações de dependências.
3. **Memória Compartilhada (`/dev/shm`):** O Gunicorn utiliza memória RAM volátil para IPC, economizando ciclos de escrita no cartão MicroSD.
4. **2 Workers Assíncronos (`gthread`):** Consumo médio de RAM mantido entre **60MB e 90MB**.
