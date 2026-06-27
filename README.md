# 💰 App Financeiro - Gerenciador de Finanças Pessoais

Aplicação moderna para controle financeiro pessoal e familiar, desenvolvida com um backend robusto em Django (Python) e um frontend interativo e dinâmico em React (TypeScript).

---

## 🏗️ Arquitetura & Tecnologias

- **Backend:** Django 5.x, Django REST Framework (DRF)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Autenticação:** Baseada em sessão padrão do Django / DRF
- **Documentação de API:** Swagger (via `drf-spectacular`)
- **Banco de Dados:** SQLite (local)

---

## 📁 Estrutura do Projeto

O projeto é estruturado de forma a separar claramente as responsabilidades de backend (Django) e frontend (React):

```
AppFinanceiro/
├── app_core/             # App principal do Django (Backend)
│   ├── management/       # Comandos customizados (ex: seed_data para popular dados)
│   ├── migrations/       # Arquivos de migração do banco de dados
│   ├── models/           # Definição das tabelas no banco de dados
│   │   └── finance/      # Apenas modelos financeiros (Account, Category, Transaction)
│   ├── routes/           # Rotas/Endpoints da API divididos por escopo
│   │   ├── auth.py       # Endpoints de login, logout e usuários
│   │   └── finance.py    # Endpoints de contas, categorias e transações
│   ├── serializers/      # Serializadores do Django REST Framework (DRF)
│   ├── services/         # Camada de regras de negócio e serviços financeiros
│   │   ├── account.py    # Lógica de atualização e validação de contas
│   │   ├── category.py   # Lógica associada a categorias
│   │   ├── data_io.py    # Importação/Exportação de dados financeiros
│   │   ├── report.py     # Geração de relatórios financeiros e estatísticas
│   │   └── transaction.py# Criação, edição e exclusão de transações
│   └── views/            # ViewSets e Controllers dos endpoints REST
├── config/               # Configurações globais do projeto Django (settings.py, urls.py)
├── front-react/          # Frontend moderno desenvolvido em React
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis (Layout, Sidebar, Header, UI Elements)
│   │   ├── context/      # Contextos e estados globais (Ex: AuthContext)
│   │   ├── screens/      # Telas principais da aplicação
│   │   │   ├── Finance/  # Tela de gestão financeira (contas, transações, filtros)
│   │   │   ├── Dashboard.tsx # Painel principal com gráficos e resumos
│   │   │   └── Login.tsx # Tela de login
│   │   ├── services/     # Requisições HTTP (Axios) integrando com o Django
│   │   └── utils/        # Funções utilitárias e formatadores
│   └── vite.config.ts    # Configuração do Vite com Proxy reverso para o Django na porta 8000
├── front/                # Frontend legado / Fallback (Django Templates + Vanilla JS)
├── requirements.txt      # Dependências do Python (Backend)
├── manage.py             # CLI do Django
└── db.sqlite3            # Banco de dados SQLite local
```

---

## 🔗 Endpoints Principais da API

Todos os endpoints da API REST estão sob o prefixo `/api/`:

### Autenticação & Usuários
- `POST /api/auth/login/` → Realiza o login do usuário
- `POST /api/auth/logout/` → Realiza o logout do usuário
- `GET/POST /api/users/` → Gerenciamento de usuários

### Financeiro
- `GET/POST/PUT/DELETE /api/categories/` → Categorias de transações (ex: Moradia, Alimentação)
- `GET/POST/PUT/DELETE /api/accounts/` → Contas financeiras (ex: Carteira, Banco Itaú, Nubank)
- `GET/POST/PUT/DELETE /api/transactions/` → Transações de despesas ou receitas

---

## 📖 Documentação Interativa da API (Swagger / ReDoc)

A aplicação conta com documentação interativa automática gerada com o `drf-spectacular`. Com o servidor backend rodando (na porta `8000`), você pode acessar:

- **Swagger UI:** [http://localhost:8000/api/schema/swagger-ui/](http://localhost:8000/api/schema/swagger-ui/) (Interface interativa ideal para testar endpoints e requisições)
- **ReDoc:** [http://localhost:8000/api/schema/redoc/](http://localhost:8000/api/schema/redoc/) (Layout limpo, focado em leitura)
- **Schema OpenAPI:** [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/) (Especificação bruta em JSON/YAML)

---

## 🚀 Como Rodar o Projeto Localmente

Para rodar o projeto por completo, você deve iniciar tanto o servidor do **Backend (Django)** quanto o do **Frontend (React)** simultaneamente.

### 1️⃣ Inicializando o Backend (Django)

Abra um terminal na pasta raiz do projeto (`AppFinanceiro/`):

1. **Crie o ambiente virtual (venv):**
   ```powershell
   python -m venv venv
   ```
2. **Ative o ambiente virtual:**
   - No Windows (PowerShell):
     ```powershell
     .\venv\Scripts\activate
     ```
   - No Windows (CMD):
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - No Linux/macOS:
     ```bash
     source venv/bin/activate
     ```
3. **Instale as dependências do Python:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Execute as migrações do banco de dados:**
   ```bash
   python manage.py migrate
   ```
5. **Popule o banco com dados fictícios (Seed):**
   ```bash
   python manage.py seed_data
   ```
6. **Inicie o servidor de desenvolvimento do Django:**
   ```bash
   python manage.py runserver
   ```
   O servidor backend rodará no endereço: `http://localhost:8000`

---

### 2️⃣ Inicializando o Frontend (React)

Abra um **segundo terminal** (mantenha o terminal do backend rodando):

1. **Navegue até a pasta do frontend:**
   ```bash
   cd front-react
   ```
2. **Instale as dependências do Node:**
   ```bash
   npm install
   ```
3. **Inicie o servidor de desenvolvimento (Vite):**
   ```bash
   npm run dev
   ```
   O frontend estará disponível no endereço: `http://localhost:5173`

*(O Vite está configurado para fazer proxy automático de chamadas `/api/*` diretamente para `http://localhost:8000` para evitar problemas de CORS.)*

---

## 🔐 Contas de Acesso para Testes

O comando `python manage.py seed_data` cria contas pré-configuradas para facilitar os testes:

### Usuários da Aplicação
- **Papai:** Usuário: `papai` | Senha: `123456`
- **Mamãe:** Usuário: `mamae` | Senha: `123456`
- **Filho:** Usuário: `filho` | Senha: `123456`

### Administrador do Django (Painel Admin)
- **Painel de Controle:** [http://localhost:8000/admin/](http://localhost:8000/admin/)
- **Superusuário:** Usuário: `admin` | Senha: `admin`

---

## 🧪 Testes

Você pode executar os testes automatizados do backend usando o pytest:
```bash
pytest
```
ou pelo gerenciador do Django:
```bash
python manage.py test
```

---

## 📜 Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).
