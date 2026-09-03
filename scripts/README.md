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

### Opção B: Configuração Permanente de Produção (Nginx + Systemd) 🌟 *(Recomendado)*

Esta é a configuração definitiva para produção. Com ela:
- O **Nginx** atua como *Reverse Proxy* de alta performance, servindo os arquivos do Frontend (`dist/`) e estáticos diretamente, sem consumir memória Python, e repassando requisições de API para o Django.
- O **Systemd** gerencia o processo do Django/Gunicorn em segundo plano (*daemon*), garantindo **reinicialização automática** caso a placa reinicie ou ocorra queda de energia.

---

#### 📋 Etapa 1: Preparar o Ambiente Python e Banco de Dados

Antes de ativar o serviço permanente, precisamos garantir que o ambiente virtual (`venv`), as dependências, as tabelas do banco SQLite e os arquivos estáticos estejam devidamente preparados:

1. **Instalar pacotes base do sistema (se ainda não instalados):**
   ```bash
   sudo apt update
   sudo apt install -y python3-venv python3-pip nginx
   ```

2. **Criar o ambiente virtual e instalar dependências:**
   ```bash
   cd /home/lnb/AppFinanceiro

   # Criar venv nativo ARM
   python3 -m venv venv

   # Ativar venv
   source venv/bin/activate

   # Instalar dependências sem cache (economiza RAM e memória flash)
   pip install --upgrade pip --no-cache-dir
   pip install -r requirements.txt --no-cache-dir
   pip install gunicorn --no-cache-dir
   ```

3. **Aplicar migrações do banco e coletar arquivos estáticos:**
   ```bash
   # Aplica a estrutura de tabelas no SQLite
   python manage.py migrate --noinput

   # Coleta arquivos CSS/JS do Admin Django para a pasta staticfiles/
   python manage.py collectstatic --noinput
   ```

4. **(Opcional) Criar usuário Administrador do Django:**
   ```bash
   python manage.py createsuperuser
   ```

---

#### ⚙️ Etapa 2: Configurar o Serviço do Backend no Systemd

O Systemd cuidará de manter o Gunicorn sempre ativo.

1. **Copiar o arquivo de serviço para a pasta do sistema:**
   ```bash
   sudo cp /home/lnb/AppFinanceiro/scripts/appfinanceiro.service /etc/systemd/system/
   ```

2. **Entenda o que este serviço faz (`appfinanceiro.service`):**
   * **`User=lnb` / `Group=lnb`**: Executa a aplicação com o usuário padrão não-root (mais seguro).
   * **`ExecStart`**: Roda o Gunicorn apontando para o binário do `venv` (`/home/lnb/AppFinanceiro/venv/bin/gunicorn`).
   * **`--workers 2 --threads 2 --worker-class gthread`**: Otimização máxima para 256MB/512MB RAM.
   * **`--bind 127.0.0.1:8000`**: O Django escuta internamente em localhost (apenas o Nginx fala com ele).
   * **`Restart=always` / `RestartSec=5s`**: Se o processo cair por qualquer motivo, o Linux o reinicia em 5 segundos.

3. **Recarregar o Systemd para reconhecer o novo serviço:**
   ```bash
   sudo systemctl daemon-reload
   ```

4. **Habilitar no boot e iniciar o serviço:**
   ```bash
   sudo systemctl enable --now appfinanceiro
   ```

5. **Verificar se o backend subiu com sucesso:**
   ```bash
   sudo systemctl status appfinanceiro
   ```
   > 💡 **O que esperar:** O status deve mostrar `Active: active (running)` em verde com os logs dos workers Gunicorn iniciados.

---

#### 🌐 Etapa 3: Configurar o Nginx como Servidor Web e Proxy Reverso

O Nginx vai receber todas as conexões externas na porta 80.

1. **Copiar a configuração do site para o Nginx:**
   ```bash
   sudo cp /home/lnb/AppFinanceiro/scripts/nginx_appfinanceiro.conf /etc/nginx/sites-available/appfinanceiro
   ```

2. **Ativar o site criando o link simbólico:**
   ```bash
   sudo ln -sf /etc/nginx/sites-available/appfinanceiro /etc/nginx/sites-enabled/
   ```

3. **Desativar a página padrão de boas-vindas do Nginx (para liberar a porta 80):**
   ```bash
   sudo rm -f /etc/nginx/sites-enabled/default
   ```

4. **Testar se a sintaxe do arquivo de configuração está perfeita:**
   ```bash
   sudo nginx -t
   ```
   > 💡 **O que esperar:** `syntax is ok` e `test is successful`. Se houver erro, revise o arquivo de configuração.

5. **Aplicar as alterações e reiniciar o Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

---

#### ✅ Etapa 4: Validação e Testes no Navegador

Agora seu servidor está 100% configurado e operante! Abra o navegador no seu computador ou celular conectado na mesma rede:

| URL de Acesso | O que deve abrir |
| :--- | :--- |
| `http://<IP_DO_NANOPI>/` | **Frontend React (SPA)** compilado e servido com resposta instantânea. |
| `http://<IP_DO_NANOPI>/api/` | **Django REST API** respondendo através do proxy reverso. |
| `http://<IP_DO_NANOPI>/admin/` | **Painel Administrativo do Django** com CSS/estáticos carregando normalmente. |

---

## 🔍 Comandos Úteis de Manutenção no NanoPi

Guarde estes comandos para o dia a dia e manutenção do servidor:

* **Ver status do backend (Django/Gunicorn):**
  ```bash
  sudo systemctl status appfinanceiro
  ```

* **Acompanhar logs do backend em tempo real:**
  ```bash
  sudo journalctl -u appfinanceiro -f
  ```

* **Reiniciar o backend (após atualizações de código backend):**
  ```bash
  sudo systemctl restart appfinanceiro
  ```

* **Verificar status do Nginx:**
  ```bash
  sudo systemctl status nginx
  ```

* **Acompanhar logs de erro do Nginx:**
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```

* **Recarregar o Nginx (após alterar `nginx_appfinanceiro.conf`):**
  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  ```

* **Monitorar consumo de RAM da placa em tempo real:**
  ```bash
  htop
  # ou
  free -h
  ```

---

## 🛠️ Guia de Solução de Problemas Comuns (Troubleshooting)

### 1. Erro `502 Bad Gateway` no Navegador
- **Causa:** O Nginx está rodando, mas não consegue falar com o Django na porta `127.0.0.1:8000`.
- **Solução:** Verifique o status do backend:
  ```bash
  sudo systemctl status appfinanceiro
  ```
  Se estiver com erro (`failed`), veja os logs detalhados:
  ```bash
  sudo journalctl -u appfinanceiro -n 50 --no-pager
  ```

### 2. Erro `403 Forbidden` ao acessar a página inicial
- **Causa:** O Nginx não tem permissão para ler a pasta `/home/lnb/AppFinanceiro/dist`.
- **Solução:** Ajuste as permissões de leitura das pastas:
  ```bash
  chmod o+x /home/lnb
  chmod -R o+rX /home/lnb/AppFinanceiro/dist
  ```

### 3. Alterei o código no computador e enviei de novo, como atualizar?
- Execute no seu computador:
  ```bash
  bash scripts/deploy_to_nanopi.sh
  ```
- E na placa, se alterou arquivos Python ou banco de dados:
  ```bash
  cd /home/lnb/AppFinanceiro
  source venv/bin/activate
  python manage.py migrate --noinput
  sudo systemctl restart appfinanceiro
  ```
  *(Se alterou apenas o frontend, o Nginx serve os novos arquivos de `dist/` imediatamente, bastando dar um Ctrl+F5 no navegador).*

---

## 🎯 Otimizações para Baixo Consumo de RAM (256MB / 512MB)
1. **Sem Node.js na Placa:** O processamento pesado de compilação do Vite/React ocorre na sua máquina de desenvolvimento.
2. **`--no-cache-dir` no Pip:** Evita sobrecarga de memória temporária durante atualizações de dependências.
3. **Memória Compartilhada (`/dev/shm`):** O Gunicorn utiliza memória RAM volátil para IPC, economizando ciclos de escrita no cartão MicroSD.
4. **2 Workers Assíncronos (`gthread`):** Consumo médio de RAM mantido entre **60MB e 90MB**.
