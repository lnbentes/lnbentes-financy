# 💰 App Financeiro - Gerenciador de Finanças Pessoais

Aplicação moderna para controle financeiro pessoal e familiar, desenvolvida com um backend robusto em Django (Python), um frontend dinâmico em React (TypeScript) com PWA e um Portal Administrativo dedicado para gerenciamento do sistema.

---

## 🏗️ Arquitetura & Tecnologias

- **Backend:** Django 5.x, Django REST Framework (DRF) com Throttling e Segurança Multi-tenant.
- **Frontend Principal:** React 19, TypeScript, Vite, Tailwind CSS, PWA (Progressive Web App), Lucide React, Chart.js.
- **Portal Administrativo:** Interface web integrada (`front_admin`) para gestão de usuários, aprovação de cadastros e manutenção do banco de dados.
- **Autenticação:** Baseada em sessão padrão do Django / DRF.
- **Documentação de API:** Swagger e ReDoc (via `drf-spectacular`).
- **Banco de Dados:** SQLite (com suporte a otimização `VACUUM` e backups consolidados).

---

## 📁 Estrutura do Projeto

O projeto é estruturado de forma modular e escalável:

```
AppFinanceiro/
├── app_core/             # App principal do Django (Backend API)
│   ├── management/       # Comandos customizados (ex: seed_data para popular dados)
│   ├── migrations/       # Arquivos de migração do banco de dados
│   ├── models/           # Entidades (Account, Category, Transaction, RegistrationRequest, Notification)
│   ├── routes/           # Rotas/Endpoints da API divididos por escopo
│   │   ├── auth.py       # Endpoints de login, logout, usuários e admin do sistema
│   │   └── finance.py    # Endpoints de contas, categorias e transações
│   ├── serializers/      # Serializadores DRF com validações multi-tenant
│   ├── services/         # Camada de regras de negócio
│   │   ├── account.py    # Lógica de atualização e validação de contas
│   │   ├── category.py   # Lógica associada a categorias
│   │   ├── data_io.py    # Importação/Exportação e exclusão em lote
│   │   ├── registration.py # Fluxo seguro de solicitação e aprovação de usuários
│   │   ├── report.py     # Geração de relatórios financeiros e estatísticas
│   │   └── transaction.py# Criação, edição e exclusão de transações
│   └── views/            # ViewSets e Controllers dos endpoints REST
├── config/               # Configurações globais do Django (settings.py, urls.py)
├── front/                # Frontend principal em React + TypeScript + Vite + PWA
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis (Layout, Modais, Cards)
│   │   ├── context/      # Contextos e estados globais (AuthContext, FinanceContext)
│   │   ├── screens/      # Telas principais (Dashboard, Finance, Login, Register)
│   │   ├── services/     # Clientes de API fortemente tipados
│   │   ├── types/        # Definições de tipos TypeScript estritos (finance.ts, auth.ts)
│   │   └── utils/        # Formatadores, helpers e utilitário de Logger
├── front_admin/          # Portal Administrativo Web (Django Templates + Vanilla JS + Tailwind)
│   ├── static/           # Scripts administrativos (admin_api.js, admin_app.js)
│   └── templates/        # Template do portal (portal_admin.html)
├── requirements.txt      # Dependências do Python (Backend)
├── manage.py             # CLI do Django
└── db.sqlite3            # Banco de dados SQLite local
```

---

## 🔗 Endpoints Principais da API

Todos os endpoints da API REST estão sob o prefixo `/api/`:

### Autenticação, Usuários & Cadastros

- `POST /api/auth/login/` → Realiza o login do usuário.
- `POST /api/auth/logout/` → Realiza o logout do usuário.
- `GET/POST /api/users/` → Listagem e criação de usuários (restrito).
- `POST /api/users/{id}/toggle-active/` → Ativa ou inativa um usuário.
- `POST /api/users/{id}/toggle-staff/` → Alterna privilégios de Administrador/Staff.
- `POST /api/users/{id}/reset-password/` → Redefine a senha de um usuário.
- `GET/POST /api/registration-requests/` → Solicitações públicas de cadastro (com rate limit).
- `POST /api/registration-requests/{id}/approve/` → Aprova solicitação e cria o usuário.
- `POST /api/registration-requests/{id}/reject/` → Rejeita solicitação de cadastro.
- `GET/POST /api/notifications/` → Notificações do sistema para administradores.

### Módulo Financeiro

- `GET/POST/PUT/DELETE /api/categories/` → Categorias (Moradia, Alimentação, etc.).
- `GET/POST/PUT/DELETE /api/accounts/` → Contas financeiras (Carteira, Bancos, Investimentos).
- `GET/POST/PUT/DELETE /api/transactions/` → Transações de despesas, receitas e transferências.
- `GET /api/reports/monthly-summary/` → Resumo financeiro mensal e saldo total.
- `GET /api/reports/category-breakdown/` → Distribuição de despesas por categoria.
- `GET/POST /api/data/export/` & `POST /api/data/import/` → Exportação e importação de dados.
- `POST /api/data/delete-bulk/` → Exclusão em lote com reversão de saldos.

### Sistema & Manutenção do Banco (Admin)

- `GET /api/admin/stats/` → Métricas do sistema e contagem de registros por tabela.
- `POST /api/admin/db-maintenance/` → Otimização da base SQLite (`VACUUM` e teste de integridade).
- `GET /api/admin/db-backup/` → Download de backup consolidado em JSON.

---

## 🛡️ Portal Administrativo (`front_admin`)

A aplicação conta com um **Portal Administrativo Dedicado** para gestão operacional do sistema:

- **URL de Acesso:** [http://localhost:8000/portal-admin/](http://localhost:8000/portal-admin/)
- **Recursos Disponíveis:**
  - 📊 **Visão Geral:** Dashboard com métricas de usuários, solicitações, transações e uso de disco.
  - 📝 **Solicitações de Cadastro:** Aprovação ou rejeição de novos pedidos de conta com 1 clique.
  - 👥 **Gestão de Usuários:** Criação de contas, busca em tempo real, alternância de status ativo/inativo, controle de Staff e redefinição de senhas.
  - 🗄️ **Banco de Dados & Sistema:** Informações do arquivo SQLite, contadores por entidade, execução de `VACUUM` e download de backup geral em JSON.
  - 🔔 **Notificações:** Central de alertas de sistema com leitura individual ou em massa.
  - 🌓 **Tema Dark/Light:** Interface responsiva com alternador de tema.

---

## 📖 Documentação Interativa da API (Swagger / ReDoc)

- **Swagger UI:** [http://localhost:8000/api/schema/swagger-ui/](http://localhost:8000/api/schema/swagger-ui/)
- **ReDoc:** [http://localhost:8000/api/schema/redoc/](http://localhost:8000/api/schema/redoc/)
- **OpenAPI Schema:** [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/)

---

## 🚀 Como Rodar o Projeto Localmente

### 1️⃣ Inicializando o Backend (Django)

1. **Crie e ative o ambiente virtual:**
   - No Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - No Linux/macOS:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
2. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Execute as migrações:**
   ```bash
   python manage.py migrate
   ```
4. **Popule com dados iniciais de teste (opcional):**
   ```bash
   python manage.py seed_data
   ```
5. **Inicie o servidor:**
   ```bash
   python manage.py runserver
   ```
   *Servidor rodando em: `http://localhost:8000`*

---

### 2️⃣ Inicializando o Frontend (React)

Abra um **segundo terminal**:

1. **Acesse a pasta do frontend:**
   ```bash
   cd front
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Inicie o servidor de desenvolvimento (Vite):**
   ```bash
   npm run dev
   ```
   *Frontend disponível em: `http://localhost:5173`*

4. **Para gerar a build de produção do PWA:**
   ```bash
   npm run build
   ```

---

## 🔐 Contas de Acesso para Testes (`seed_data`)

- **Usuários Comuns:**
  - Papai: `papai` / `123456`
  - Mamãe: `mamae` / `123456`
  - Filho: `filho` / `123456`
- **Administrador:**
  - Usuário: `admin` / `admin`
  - Acesso ao Portal Admin: [http://localhost:8000/portal-admin/](http://localhost:8000/portal-admin/)
  - Acesso ao Django Admin padrão: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## 🧪 Testes Automatizados

Para rodar a suíte completa de testes do backend:

```powershell
.\venv\Scripts\python.exe manage.py test app_core
```

---

## 📜 Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).
