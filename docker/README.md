# Configuração Docker - AppFinanceiro

Este diretório contém os arquivos necessários para empacotar e executar a aplicação **AppFinanceiro** (tanto o frontend em React quanto o backend em Django) utilizando contêineres Docker.

---

## 📋 Pré-requisitos (No Servidor Debian)

Antes de iniciar, certifique-se de que o Docker e o Docker Compose estejam instalados no seu servidor Linux Debian:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker --now

# Opcional: Permitir executar comandos docker sem usar sudo
sudo usermod -aG docker $USER
```
*(Nota: Após adicionar seu usuário ao grupo `docker`, reinicie a sessão para aplicar as alterações).*

---

## 🚀 Como Iniciar os Projetos

Você pode construir e rodar os contêineres a partir da raiz do projeto:

```bash
# Executa a build e sobe os contêineres em segundo plano (background)
docker compose -f docker/docker-compose.yml up -d --build
```

Ou navegando até a pasta `docker`:

```bash
cd docker
docker compose up -d --build
```

Após subir os serviços, a aplicação estará disponível na rede local em:
👉 **`http://<IP-DO-SERVIDOR-DEBIAN>:8080`**

---

## ⚙️ Configurações Importantes

### 🔒 Proteção contra CSRF (IP do Servidor)
Como a aplicação frontend (Vite/React) se comunica com o Django backend usando cookies para autenticação e CSRF, o Django precisa saber quais origens são confiáveis. 

Se você acessar o sistema usando o IP local do servidor Debian (por exemplo, `http://192.168.1.150:8080`), você **precisa** adicionar esse endereço na variável `CSRF_TRUSTED_ORIGINS` dentro do arquivo [docker-compose.yml](file:///c:/Users/lnbentes/LnB/projetos/AppFinanceiro/docker/docker-compose.yml):

```yaml
environment:
  - CSRF_TRUSTED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://192.168.1.150:8080
```
Depois de alterar, recrie os contêineres:
```bash
docker compose -f docker/docker-compose.yml up -d
```

---

## 💾 Persistência e Migração da Base de Dados

O banco de dados SQLite (`db.sqlite3`) está configurado para salvar os dados dentro de um volume persistente do Docker chamado `db_data`. Isso evita a perda de informações caso os contêineres sejam recriados.

### Como migrar seu banco `db.sqlite3` atual para o servidor Debian:

1. **Suba o docker uma primeira vez** no Debian para que ele crie as pastas e volumes internos:
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```
2. **Envie o arquivo `db.sqlite3`** da sua máquina local de desenvolvimento para o servidor Debian (por exemplo, usando SCP ou SFTP):
   ```bash
   scp db.sqlite3 usuario@<IP-DO-SERVIDOR>:/home/usuario/db.sqlite3
   ```
3. **Substitua o arquivo de banco padrão** dentro do volume do Docker no servidor Debian:
   ```bash
   # Normalmente os volumes locais do Docker no Debian ficam em:
   sudo cp /home/usuario/db.sqlite3 /var/lib/docker/volumes/docker_db_data/_data/db.sqlite3
   # Garanta a permissão correta caso necessário
   sudo chown 999:999 /var/lib/docker/volumes/docker_db_data/_data/db.sqlite3
   ```
4. **Reinicie o container do backend** para ler os novos dados:
   ```bash
   docker compose -f docker/docker-compose.yml restart backend
   ```

---

## 🛠️ Comandos Úteis de Gerenciamento

* **Parar os serviços:**
  ```bash
  docker compose -f docker/docker-compose.yml down
  ```
* **Visualizar logs em tempo real:**
  ```bash
  docker compose -f docker/docker-compose.yml logs -f
  ```
* **Acessar o terminal do backend (Django):**
  ```bash
  docker compose -f docker/docker-compose.yml exec backend sh
  ```
* **Criar um superusuário no Django:**
  ```bash
  docker compose -f docker/docker-compose.yml exec backend python manage.py createsuperuser
  ```
