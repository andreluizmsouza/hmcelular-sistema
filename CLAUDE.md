# CLAUDE.md - HMCelular Sistema

**AI Assistant Development Guide**

This document provides comprehensive guidance for AI assistants working on the HMCelular Sistema codebase. It explains the project structure, conventions, workflows, and best practices to follow.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Technology Stack](#technology-stack)
5. [Development Workflow](#development-workflow)
6. [Key Conventions](#key-conventions)
7. [Common Tasks](#common-tasks)
8. [Database Schema](#database-schema)
9. [API Design](#api-design)
10. [Authentication & Authorization](#authentication--authorization)
11. [Security Considerations](#security-considerations)
12. [Testing Guidelines](#testing-guidelines)
13. [Deployment](#deployment)
14. [Known Issues & Gotchas](#known-issues--gotchas)
15. [Future Development](#future-development)

---

## Project Overview

**HMCelular Sistema** is a complete commercial management system for a cell phone accessories store chain with multiple locations in Brazil.

### Key Information
- **Version:** 1.0.0
- **Status:** Production - Phase 1 Complete
- **Language:** Portuguese (Brazil)
- **Last Updated:** December 2024
- **Current Phase:** Phase 1 (Authentication & Dashboard) ✅
- **In Development:** Phase 2 (Products & Stock) 🚧

### Business Context
- **Client:** HMCelular - Acessórios para Celular e Serviços
- **Scope:** Multi-store management system
- **Stores:** 3 locations (Matriz, Shopping, Boa Vista)
- **Users:** Administrators, Managers, Salespeople with role-based permissions

### Project Goals
1. Replace manual/spreadsheet-based management
2. Enable real-time multi-store inventory control
3. Provide comprehensive sales tracking and reporting
4. Ensure secure role-based access control
5. Support scalable growth to additional stores

---

## Codebase Structure

```
hmcelular-sistema/
├── backend/                      # Node.js/Express API
│   ├── config/
│   │   └── database.js          # MySQL connection pool & utilities
│   ├── controllers/
│   │   └── authController.js    # Authentication business logic
│   ├── database/
│   │   ├── schema.sql           # Complete database schema
│   │   └── seed.sql             # Initial test data
│   ├── middleware/
│   │   └── auth.js              # JWT validation & permission checks
│   ├── routes/
│   │   └── auth.js              # Authentication API routes
│   ├── Dockerfile               # Backend container image
│   ├── package.json             # Backend dependencies
│   └── server.js                # Express app entry point
│
├── frontend/                     # React SPA
│   ├── public/
│   │   ├── index.html           # HTML template (Tailwind CDN)
│   │   └── manifest.json        # PWA manifest
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js           # API client & service layer
│   │   ├── app.js               # Main React component
│   │   ├── index.css            # Global styles & animations
│   │   └── index.js             # React entry point
│   └── package.json             # Frontend dependencies
│
├── docker-compose.yml            # Full stack orchestration (5 services)
├── env_example.sh               # Environment variables template
├── gitignore.sh                 # .gitignore template
├── readme.md                    # User-facing documentation
└── CLAUDE.md                    # This file - AI assistant guide
```

### Directory Purposes

| Directory | Purpose | Language |
|-----------|---------|----------|
| `backend/config/` | Configuration files (DB, logging, etc.) | JavaScript |
| `backend/controllers/` | Business logic layer | JavaScript |
| `backend/database/` | SQL schema and seed files | SQL |
| `backend/middleware/` | Express middleware (auth, validation) | JavaScript |
| `backend/routes/` | API route definitions | JavaScript |
| `frontend/src/services/` | API communication layer | JavaScript |
| `frontend/src/` | React components | JavaScript/JSX |

---

## Architecture & Design Patterns

### Backend Architecture

**Pattern:** MVC-style with Service Layer

```
HTTP Request
    ↓
[Security Middleware] (Helmet, CORS, Rate Limiting)
    ↓
[Route Handler] (routes/auth.js)
    ↓
[Validation Middleware] (express-validator)
    ↓
[Authentication Middleware] (middleware/auth.js)
    ↓
[Permission Middleware] (checkPermission)
    ↓
[Controller] (controllers/authController.js)
    ↓
[Database Layer] (config/database.js → executeQuery)
    ↓
[MySQL Database]
    ↓
JSON Response
```

**Key Principles:**
- **Separation of Concerns:** Routes → Middleware → Controllers → Database
- **Promise-based:** All async operations use async/await
- **Centralized Error Handling:** Global error handler in server.js
- **Connection Pooling:** MySQL pool managed by config/database.js
- **Stateless API:** JWT tokens, no server-side session storage (DB sessions for validation only)

### Frontend Architecture

**Pattern:** Single Page Application (SPA) with Component-based Design

```
index.html (Tailwind CDN)
    ↓
index.js (React entry)
    ↓
app.js (Main Component)
    ├── TelaLogin (Login Screen)
    ├── MenuLateral (Sidebar Navigation)
    ├── Dashboard (Main Dashboard)
    └── PaginaEmDesenvolvimento (Placeholder)
    ↓
services/api.js (API Layer)
    ↓
Backend API
```

**Key Principles:**
- **Single Responsibility:** Each component has one clear purpose
- **Hooks-based State:** useState, useEffect for state management
- **Service Layer:** All API calls through services/api.js
- **Token Management:** LocalStorage for JWT persistence
- **Loading States:** All async operations show loading indicators
- **Error Handling:** User-friendly error messages

### Database Design

**Pattern:** Relational Normalized Schema

- **Normalization:** 3NF (Third Normal Form)
- **Foreign Keys:** Enforced with ON DELETE CASCADE/RESTRICT
- **Indexes:** Strategic indexing on foreign keys and frequently queried columns
- **JSON Fields:** Used for flexible data (permissions, audit logs)
- **Soft Deletes:** Using `ativo` boolean flags
- **Audit Trail:** Comprehensive logging in `logs_sistema`
- **Session Management:** Database-backed sessions with auto-cleanup

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ (Alpine) | Runtime environment |
| **Express** | 4.18.2 | Web framework |
| **MySQL** | 8.0 | Database |
| **mysql2** | 3.6.0 | MySQL driver with promises |
| **jsonwebtoken** | 9.0.2 | JWT authentication |
| **bcrypt** | 5.1.0 | Password hashing |
| **helmet** | 7.0.0 | Security headers |
| **cors** | 2.8.5 | Cross-origin requests |
| **express-validator** | 7.0.1 | Input validation |
| **express-rate-limit** | 6.10.0 | Rate limiting |
| **dotenv** | 16.3.1 | Environment variables |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **Tailwind CSS** | 3.x (CDN) | Styling framework |
| **Lucide React** | 0.263.1 | Icon library |
| **react-scripts** | 5.0.1 | Build tooling (CRA) |

### Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | Latest | Containerization |
| **Docker Compose** | 3.8 | Multi-container orchestration |
| **Nginx** | Alpine | Reverse proxy & static files |
| **MySQL** | 8.0 | Database server |

---

## Development Workflow

### Initial Setup

1. **Clone Repository:**
   ```bash
   git clone <repository-url>
   cd hmcelular-sistema
   ```

2. **Configure Environment:**
   ```bash
   cp env_example.sh .env
   # Edit .env with your configuration
   ```

3. **Start with Docker (Recommended):**
   ```bash
   docker-compose up -d
   docker-compose logs -f backend
   ```

4. **OR Manual Setup:**
   ```bash
   # Backend
   cd backend
   npm install
   cp .env.example .env
   npm run dev

   # Frontend (new terminal)
   cd frontend
   npm install
   npm start
   ```

### Development Commands

**Backend:**
```bash
cd backend
npm run dev          # Development with nodemon (auto-reload)
npm start            # Production mode
npm test             # Run tests (not implemented yet)
```

**Frontend:**
```bash
cd frontend
npm start            # Development server (port 3000)
npm run build        # Production build
npm test             # Run tests (not implemented yet)
```

**Docker:**
```bash
docker-compose up -d                    # Start all services
docker-compose down                     # Stop all services
docker-compose logs -f backend         # Follow backend logs
docker-compose logs -f frontend        # Follow frontend logs
docker-compose restart backend         # Restart specific service
docker-compose ps                      # Check service status
docker-compose exec mysql mysql -u root -p  # MySQL CLI
```

### Git Workflow

**Branch Naming:**
- Feature: `feature/feature-name` or `claude/session-id`
- Bugfix: `bugfix/issue-description`
- Hotfix: `hotfix/critical-issue`

**Commit Messages (Portuguese):**
```bash
git commit -m "feat: adiciona endpoint de produtos"
git commit -m "fix: corrige validação de login"
git commit -m "refactor: melhora estrutura de controllers"
git commit -m "docs: atualiza documentação da API"
```

**Development Process:**
1. Create feature branch from main
2. Make changes with descriptive commits
3. Test locally (manual or automated)
4. Push to remote with `-u origin <branch-name>`
5. Create pull request (if applicable)

### Testing Workflow

**Current Status:** No automated testing implemented

**Manual Testing:**
1. **Test Credentials** (from seed.sql):
   - Admin: `admin` / `123456`
   - Manager: `gerente1` / `123456`
   - Salesperson: `vendedor1` / `123456`

2. **API Testing:**
   ```bash
   # Health check
   curl http://localhost:3001/api/health

   # Login
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"usuario": "admin", "senha": "123456"}'

   # Get current user (replace TOKEN)
   curl http://localhost:3001/api/auth/me \
     -H "Authorization: Bearer TOKEN"
   ```

3. **Frontend Testing:**
   - Navigate to http://localhost:3000
   - Test all user roles and permissions
   - Verify responsive design (mobile, tablet, desktop)
   - Check error handling and loading states

**Recommended Testing Stack (Future):**
- Backend: Jest + Supertest
- Frontend: React Testing Library + Jest
- E2E: Cypress or Playwright
- API Testing: Postman collections

---

## Key Conventions

### Naming Conventions

**Files:**
- JavaScript: `camelCase.js` (authController.js)
- React Components: `PascalCase.js` (TelaLogin.js) - **Note:** Currently using app.js, should migrate
- Config files: `kebab-case.yml` (docker-compose.yml)
- Database: `snake_case.sql` (schema.sql)

**Variables & Functions:**
- Variables: `camelCase` (currentUser, loginData)
- Functions: `camelCase` (executeQuery, checkPermission)
- Constants: `UPPER_SNAKE_CASE` (API_BASE_URL, JWT_SECRET)
- React Components: `PascalCase` (TelaLogin, MenuLateral)

**Database:**
- Tables: `snake_case` (usuarios, sessoes, logs_sistema)
- Columns: `snake_case` (usuario_id, created_at, ip_address)
- Foreign Keys: `{table}_id` (loja_id, usuario_id)
- Booleans: `ativo`, `exibir`, etc.

**API Routes:**
- REST pattern: `/api/{resource}/{action}`
- Examples: `/api/auth/login`, `/api/produtos/estoque`
- Lowercase with hyphens for multi-word: `/api/produtos-favoritos`

### Code Style

**JavaScript/JSX:**
- ES6+ features: async/await, arrow functions, destructuring, template literals
- 2-space indentation (configured in editor)
- Semicolons: Required
- Quotes: Single quotes for strings, double for JSX attributes
- Comments: Portuguese, explain "why" not "what"

**SQL:**
- UPPERCASE keywords: `SELECT`, `FROM`, `WHERE`
- snake_case identifiers
- Explicit column names (avoid `SELECT *` in production code)
- Parameterized queries ALWAYS (prevent SQL injection)

**React:**
- Functional components with Hooks
- Props destructuring in function parameters
- JSX indentation: 2 spaces
- Conditional rendering: Ternary or && operator
- Event handlers: `handleEventName` (handleLogin, handleSubmit)

### Error Handling

**Backend:**
```javascript
try {
  const result = await executeQuery(query, params);
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Error in operation:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
}
```

**Frontend:**
```javascript
try {
  setLoading(true);
  const response = await authService.login(credentials);
  setUser(response.data.usuario);
} catch (error) {
  setError(error.message || 'Erro ao fazer login');
} finally {
  setLoading(false);
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": { /* payload */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": [ /* validation errors */ ]
}
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Create Route** (backend/routes/):
   ```javascript
   // backend/routes/produtos.js
   const express = require('express');
   const router = express.Router();
   const { auth, checkPermission } = require('../middleware/auth');
   const produtosController = require('../controllers/produtosController');

   router.get('/', auth, checkPermission('produtos'), produtosController.listar);
   router.post('/', auth, checkPermission('produtos'), produtosController.criar);

   module.exports = router;
   ```

2. **Create Controller** (backend/controllers/):
   ```javascript
   // backend/controllers/produtosController.js
   const { executeQuery } = require('../config/database');

   exports.listar = async (req, res) => {
     try {
       const query = 'SELECT * FROM produtos WHERE ativo = 1';
       const produtos = await executeQuery(query);
       res.json({ success: true, data: produtos });
     } catch (error) {
       console.error('Erro ao listar produtos:', error);
       res.status(500).json({ success: false, message: 'Erro ao listar produtos' });
     }
   };
   ```

3. **Register Route** (backend/server.js):
   ```javascript
   const produtosRoutes = require('./routes/produtos');
   app.use('/api/produtos', produtosRoutes);
   ```

4. **Create Frontend Service** (frontend/src/services/api.js):
   ```javascript
   const productService = {
     async list() {
       return apiService.get('/api/produtos');
     },
     async create(produto) {
       return apiService.post('/api/produtos', produto);
     }
   };
   ```

5. **Test:**
   ```bash
   # Test endpoint
   curl http://localhost:3001/api/produtos \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Adding a Database Table

1. **Update Schema** (backend/database/schema.sql):
   ```sql
   CREATE TABLE IF NOT EXISTS nova_tabela (
     id INT PRIMARY KEY AUTO_INCREMENT,
     nome VARCHAR(100) NOT NULL,
     descricao TEXT,
     usuario_id INT,
     ativo BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
     INDEX idx_usuario (usuario_id),
     INDEX idx_ativo (ativo)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```

2. **Add Seed Data** (backend/database/seed.sql):
   ```sql
   INSERT INTO nova_tabela (nome, descricao, usuario_id) VALUES
   ('Item 1', 'Descrição 1', 1),
   ('Item 2', 'Descrição 2', 1);
   ```

3. **Apply Changes:**
   ```bash
   # Docker
   docker-compose exec mysql mysql -u hmcelular -p hmcelular_db < backend/database/schema.sql

   # Manual
   mysql -u hmcelular -p hmcelular_db < backend/database/schema.sql
   ```

### Adding a New React Component

1. **Create Component** (in app.js or separate file):
   ```javascript
   const NovoComponente = ({ propriedade1, propriedade2 }) => {
     const [estado, setEstado] = useState(null);

     useEffect(() => {
       // Initialization logic
     }, []);

     return (
       <div className="p-4 bg-white rounded-lg shadow">
         <h2 className="text-xl font-bold mb-4">Título</h2>
         {/* Component content */}
       </div>
     );
   };
   ```

2. **Use Component:**
   ```javascript
   <NovoComponente
     propriedade1={valor1}
     propriedade2={valor2}
   />
   ```

### Adding Middleware

1. **Create Middleware** (backend/middleware/):
   ```javascript
   // backend/middleware/logging.js
   const logRequest = (req, res, next) => {
     console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
     next();
   };

   module.exports = { logRequest };
   ```

2. **Apply Globally** (server.js):
   ```javascript
   const { logRequest } = require('./middleware/logging');
   app.use(logRequest);
   ```

3. **OR Apply to Specific Route:**
   ```javascript
   router.get('/protected', logRequest, auth, controller.action);
   ```

---

## Database Schema

### Core Tables

#### usuarios (Users)
```sql
id              INT PRIMARY KEY AUTO_INCREMENT
usuario         VARCHAR(50) UNIQUE NOT NULL       -- Username
senha           VARCHAR(255) NOT NULL             -- bcrypt hash
nome            VARCHAR(100) NOT NULL
email           VARCHAR(100) UNIQUE
telefone        VARCHAR(20)
tipo            ENUM('administrador','gerente','vendedor')
loja_id         INT FK -> lojas(id)
permissoes      JSON                              -- ["vendas", "produtos"]
ativo           BOOLEAN DEFAULT TRUE
ultimo_login    TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**Relationships:**
- `loja_id` → `lojas.id` (Many users to one store)

**Indexes:**
- `idx_usuario` on `usuario`
- `idx_email` on `email`
- `idx_loja` on `loja_id`
- `idx_tipo` on `tipo`

#### lojas (Stores)
```sql
id           INT PRIMARY KEY AUTO_INCREMENT
nome         VARCHAR(100) NOT NULL
endereco     TEXT
telefone     VARCHAR(20)
email        VARCHAR(100)
cnpj         VARCHAR(18) UNIQUE
ativo        BOOLEAN DEFAULT TRUE
created_at   TIMESTAMP
updated_at   TIMESTAMP
```

#### sessoes (Sessions)
```sql
id           INT PRIMARY KEY AUTO_INCREMENT
usuario_id   INT FK -> usuarios(id)
token_hash   VARCHAR(255) UNIQUE NOT NULL      -- SHA256(JWT)
expires_at   TIMESTAMP NOT NULL
ip_address   VARCHAR(45)
user_agent   VARCHAR(255)
created_at   TIMESTAMP
```

**Auto-cleanup:** MySQL Event runs every hour to delete expired sessions
**Index:** `idx_usuario_id` on `usuario_id`

#### logs_sistema (Audit Logs)
```sql
id                INT PRIMARY KEY AUTO_INCREMENT
usuario_id        INT FK -> usuarios(id)
acao              VARCHAR(50)                     -- LOGIN, LOGOUT, CREATE, UPDATE, DELETE
tabela_afetada    VARCHAR(50)
registro_id       INT
dados_anteriores  JSON
dados_novos       JSON
ip_address        VARCHAR(45)
created_at        TIMESTAMP
```

**Indexes:**
- `idx_usuario_id` on `usuario_id`
- `idx_acao` on `acao`
- `idx_tabela` on `tabela_afetada`
- `idx_created_at` on `created_at`

### Phase 2 Tables (Schema Ready)

#### produtos (Products)
```sql
id              INT PRIMARY KEY AUTO_INCREMENT
codigo          VARCHAR(50) UNIQUE NOT NULL
nome            VARCHAR(200) NOT NULL
descricao       TEXT
categoria_id    INT FK -> categorias(id)
marca           VARCHAR(100)
modelo          VARCHAR(100)
cor             VARCHAR(50)
tamanho         VARCHAR(50)
preco_custo     DECIMAL(10,2)
preco_venda     DECIMAL(10,2)
margem_lucro    DECIMAL(5,2)
ativo           BOOLEAN DEFAULT TRUE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### estoque (Stock)
```sql
id                  INT PRIMARY KEY AUTO_INCREMENT
produto_id          INT FK -> produtos(id)
loja_id             INT FK -> lojas(id)
quantidade          INT DEFAULT 0
quantidade_minima   INT DEFAULT 5
quantidade_maxima   INT DEFAULT 100
localizacao         VARCHAR(50)
updated_at          TIMESTAMP
UNIQUE(produto_id, loja_id)
```

#### categorias (Categories)
```sql
id           INT PRIMARY KEY AUTO_INCREMENT
nome         VARCHAR(100) NOT NULL
descricao    TEXT
pai_id       INT FK -> categorias(id)          -- Hierarchical categories
ativo        BOOLEAN DEFAULT TRUE
ordem        INT DEFAULT 0
created_at   TIMESTAMP
updated_at   TIMESTAMP
```

### Database Conventions

1. **All tables use InnoDB engine** for foreign key support
2. **UTF8MB4 charset** for full Unicode support (including emojis)
3. **Timestamps:** `created_at` and `updated_at` on all tables
4. **Soft deletes:** Use `ativo` boolean instead of DELETE
5. **Audit trail:** Log all modifications in `logs_sistema`
6. **Foreign keys:** Always with ON DELETE CASCADE or RESTRICT
7. **Indexes:** On all foreign keys and frequently queried columns

---

## API Design

### Current Endpoints

#### Authentication (`/api/auth`)

**POST /api/auth/login**
- **Description:** User login with credentials
- **Authentication:** None (public)
- **Rate Limit:** 5 requests per 15 minutes per IP
- **Request:**
  ```json
  {
    "usuario": "admin",
    "senha": "123456"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Login realizado com sucesso",
    "data": {
      "usuario": {
        "id": 1,
        "usuario": "admin",
        "nome": "Administrador",
        "tipo": "administrador",
        "loja_id": 1,
        "loja_nome": "Matriz",
        "permissoes": ["todas"]
      },
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```
- **Errors:**
  - 400: Missing fields or validation errors
  - 401: Invalid credentials
  - 403: Inactive user
  - 429: Too many login attempts

**POST /api/auth/logout**
- **Description:** Invalidate current session
- **Authentication:** Required (JWT)
- **Request:** Headers only (`Authorization: Bearer <token>`)
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Logout realizado com sucesso"
  }
  ```

**GET /api/auth/me**
- **Description:** Get current authenticated user
- **Authentication:** Required (JWT)
- **Request:** Headers only
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "usuario": "admin",
      "nome": "Administrador",
      "email": "admin@hmcelular.com.br",
      "tipo": "administrador",
      "loja_id": 1,
      "loja_nome": "Matriz",
      "permissoes": ["todas"]
    }
  }
  ```

#### System (`/api`)

**GET /api/health**
- **Description:** API health check
- **Authentication:** None
- **Response (200):**
  ```json
  {
    "status": "OK",
    "timestamp": "2024-12-15T10:30:00.000Z",
    "uptime": 3600,
    "database": "connected"
  }
  ```

**GET /api**
- **Description:** API information
- **Authentication:** None
- **Response (200):**
  ```json
  {
    "nome": "HMCelular API",
    "versao": "1.0.0",
    "endpoints": ["/api/auth", "/api/health"]
  }
  ```

### API Design Principles

1. **RESTful Design:** Use HTTP methods correctly (GET, POST, PUT, DELETE)
2. **Versioning:** Future versions use `/api/v2/` pattern
3. **Pagination:** Use query params `?page=1&limit=20` (future)
4. **Filtering:** Use query params `?categoria=acessorios&ativo=true` (future)
5. **Sorting:** Use query params `?sort=nome&order=asc` (future)
6. **Error Codes:**
   - 200: Success
   - 201: Created
   - 400: Bad request (validation)
   - 401: Unauthorized (missing/invalid token)
   - 403: Forbidden (insufficient permissions)
   - 404: Not found
   - 429: Too many requests
   - 500: Internal server error

---

## Authentication & Authorization

### JWT Token Structure

**Payload:**
```javascript
{
  id: 1,                    // User ID
  usuario: "admin",         // Username
  tipo: "administrador",    // User type
  loja_id: 1,              // Store ID
  iat: 1702648200,         // Issued at
  exp: 1703253000          // Expires at (7 days default)
}
```

**Token Generation:**
```javascript
const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE || '7d'
});
```

**Token Verification:**
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Session Management

1. **Token Creation:**
   - Generate JWT token with user payload
   - Hash token with SHA256
   - Store hash in `sessoes` table with expiry
   - Return token to client

2. **Token Validation:**
   - Extract token from `Authorization: Bearer <token>` header
   - Verify JWT signature and expiry
   - Hash token and look up in `sessoes` table
   - Verify session not expired
   - Load user data from database
   - Inject user into `req.user`

3. **Token Invalidation:**
   - Delete session record from database
   - Client discards token from localStorage

4. **Auto-Cleanup:**
   - MySQL Event runs every 1 hour
   - Deletes sessions where `expires_at < NOW()`

### Permission System

**Permission Types:**
```javascript
const PERMISSIONS = [
  'vendas',        // Sales operations
  'produtos',      // Product management
  'estoque',       // Stock control
  'clientes',      // Customer management
  'relatorios',    // Reports access
  'usuarios',      // User management
  'configuracoes', // System settings
  'todas'          // Full access (admin)
];
```

**Permission Storage:**
- Stored in `usuarios.permissoes` as JSON array
- Example: `["vendas", "produtos", "relatorios"]`
- Admin users: `["todas"]`

**Permission Check Middleware:**
```javascript
const { checkPermission } = require('../middleware/auth');

// Single permission
router.get('/produtos', auth, checkPermission('produtos'), controller.list);

// Admin only
router.delete('/usuarios/:id', auth, checkPermission('todas'), controller.delete);
```

**Permission Logic:**
```javascript
function hasPermission(userPermissions, requiredPermission) {
  return userPermissions.includes('todas') ||
         userPermissions.includes(requiredPermission);
}
```

### User Types

| Type | Portuguese | Typical Permissions | Store Access |
|------|-----------|-------------------|--------------|
| `administrador` | Administrador | `["todas"]` | All stores |
| `gerente` | Gerente | `["vendas", "produtos", "relatorios", "estoque"]` | Assigned store |
| `vendedor` | Vendedor | `["vendas"]` | Assigned store |

### Frontend Auth Flow

1. **Login:**
   ```javascript
   const response = await authService.login({ usuario, senha });
   localStorage.setItem('token', response.data.token);
   ```

2. **Token Persistence:**
   - Stored in `localStorage` as `'token'`
   - Automatically included in all API requests via interceptor

3. **Token Validation on Load:**
   ```javascript
   useEffect(() => {
     const token = localStorage.getItem('token');
     if (token) {
       authService.me()
         .then(response => setUser(response.data))
         .catch(() => localStorage.removeItem('token'));
     }
   }, []);
   ```

4. **Auto-Logout:**
   - On 401 response, remove token and redirect to login
   - On manual logout, call logout endpoint and clear localStorage

---

## Security Considerations

### Implemented Security Measures

1. **Password Security:**
   - bcrypt hashing with salt rounds: 10
   - Never store or log plaintext passwords
   - Minimum length: 6 characters (validation)

2. **JWT Security:**
   - Signed with strong secret (min 32 characters recommended)
   - 7-day expiration by default
   - Token hash stored in database for validation
   - No sensitive data in payload

3. **Session Security:**
   - Database-backed session validation
   - Automatic expiry cleanup
   - IP address and User-Agent tracking
   - Session invalidation on logout

4. **API Security:**
   - Rate limiting: 100 req/15min general, 5 req/15min login
   - Helmet.js security headers (CSP, XSS protection)
   - CORS configured for specific origin
   - Input validation with express-validator
   - SQL injection prevention (parameterized queries)

5. **Authentication:**
   - JWT-based stateless authentication
   - Token in Authorization header (not URL)
   - Permission-based access control
   - Inactive user checks

6. **Audit Logging:**
   - All authentication events logged
   - IP address tracking
   - User action history in `logs_sistema`

7. **Docker Security:**
   - Non-root user (nodejs:nodejs)
   - Read-only volumes where possible
   - Network isolation (bridge network)
   - Health checks for all services

### Security Gotchas

**⚠️ IMPORTANT:**

1. **Default Passwords:** Test users have password `123456` - **MUST CHANGE IN PRODUCTION**

2. **JWT Secret:** Example secret in env_example.sh is weak - **GENERATE RANDOM SECRET**
   ```bash
   # Generate strong secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Environment Variables:** Never commit `.env` file to git

4. **Tailwind CDN:** Using CDN in production is not ideal - consider npm package

5. **HTTPS:** Ensure HTTPS in production (use Nginx with Let's Encrypt)

6. **CORS Origin:** Set `FRONTEND_URL` correctly for production domain

7. **Rate Limiting:** Adjust limits based on actual usage patterns

8. **Database Access:** Use least-privilege MySQL user, not root

9. **Backup Security:** Encrypt backups, secure backup storage

10. **Error Messages:** Don't expose internal details in production errors

### Security Checklist for Production

- [ ] Change all default passwords
- [ ] Generate random JWT_SECRET (64+ characters)
- [ ] Configure HTTPS with valid SSL certificate
- [ ] Set CORS to production domain only
- [ ] Enable MySQL SSL connections
- [ ] Configure firewall (only ports 80, 443 exposed)
- [ ] Set up automated backups with encryption
- [ ] Configure log rotation and monitoring
- [ ] Enable fail2ban or similar intrusion prevention
- [ ] Regular dependency updates (`npm audit`)
- [ ] Database user with minimal permissions
- [ ] Disable MySQL root remote access
- [ ] Set secure session timeout (current: 7 days)
- [ ] Implement password complexity requirements
- [ ] Add 2FA for admin users (Phase 4)
- [ ] Set up monitoring and alerting

---

## Testing Guidelines

### Current Status

**No automated testing infrastructure exists yet.** This is a priority for future development.

### Manual Testing

**Test Users (from seed.sql):**

| Username | Password | Type | Store | Permissions |
|----------|----------|------|-------|-------------|
| `admin` | `123456` | Administrador | Matriz | Todas |
| `gerente1` | `123456` | Gerente | Matriz | vendas, produtos, relatorios, estoque |
| `gerente2` | `123456` | Gerente | Shopping | vendas, produtos, relatorios |
| `vendedor1` | `123456` | Vendedor | Shopping | vendas |
| `vendedor2` | `123456` | Vendedor | Boa Vista | vendas |

**Manual Test Checklist:**

Authentication:
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Login with inactive user (should fail)
- [ ] Logout
- [ ] Token persistence (refresh page while logged in)
- [ ] Token expiry (wait 7 days or modify exp in JWT)
- [ ] Concurrent sessions (login from multiple browsers)

Authorization:
- [ ] Admin can access all features
- [ ] Manager can access permitted features only
- [ ] Salesperson restricted to sales
- [ ] Direct API calls without permission fail (403)

Dashboard:
- [ ] Displays correct user information
- [ ] Shows appropriate menu items based on permissions
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Logout button works

Error Handling:
- [ ] Network error shows user-friendly message
- [ ] API error shows appropriate message
- [ ] Loading states display correctly
- [ ] Form validation works

### API Testing with curl

```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario": "admin", "senha": "123456"}'

# Get current user (replace TOKEN)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Logout
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer TOKEN"

# Rate limit test (should fail after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"usuario": "wrong", "senha": "wrong"}'
  echo ""
done
```

### Recommended Testing Stack (Future Implementation)

**Backend Testing:**
```bash
npm install --save-dev jest supertest
```

**Test Structure:**
```
backend/
├── __tests__/
│   ├── auth.test.js        # Authentication tests
│   ├── database.test.js    # Database connection tests
│   └── middleware.test.js  # Middleware tests
└── jest.config.js
```

**Frontend Testing:**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

**Test Structure:**
```
frontend/src/
├── __tests__/
│   ├── App.test.js
│   ├── Login.test.js
│   └── Dashboard.test.js
└── setupTests.js
```

**E2E Testing:**
```bash
npm install --save-dev cypress
```

---

## Deployment

### Docker Compose (Recommended)

**Services:**
1. **MySQL:** Database server (port 3306)
2. **Backend:** Node.js API (port 3001)
3. **Frontend:** Nginx serving React build (port 80)
4. **Nginx:** Reverse proxy (ports 80, 443)
5. **Backup:** Automated daily backups (2 AM)

**Deployment Steps:**

1. **Configure Environment:**
   ```bash
   cp env_example.sh .env
   # Edit .env with production values
   ```

2. **Start Services:**
   ```bash
   docker-compose up -d
   ```

3. **Verify Health:**
   ```bash
   docker-compose ps
   docker-compose logs -f backend
   curl http://localhost/api/health
   ```

4. **Initialize Database:**
   ```bash
   # If not auto-initialized
   docker-compose exec mysql mysql -u hmcelular -p hmcelular_db < backend/database/schema.sql
   docker-compose exec mysql mysql -u hmcelular -p hmcelular_db < backend/database/seed.sql
   ```

5. **Configure SSL (Production):**
   ```bash
   # Add Let's Encrypt certificates to ./nginx/ssl/
   # Update nginx configuration for HTTPS
   docker-compose restart nginx
   ```

### Manual Deployment (VPS)

1. **Install Dependencies:**
   ```bash
   # Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # MySQL 8.0
   sudo apt-get install -y mysql-server

   # Nginx
   sudo apt-get install -y nginx
   ```

2. **Setup Database:**
   ```bash
   sudo mysql -u root -p
   CREATE DATABASE hmcelular_db;
   CREATE USER 'hmcelular'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL ON hmcelular_db.* TO 'hmcelular'@'localhost';
   FLUSH PRIVILEGES;
   exit;

   mysql -u hmcelular -p hmcelular_db < backend/database/schema.sql
   mysql -u hmcelular -p hmcelular_db < backend/database/seed.sql
   ```

3. **Setup Backend:**
   ```bash
   cd backend
   npm install --production
   cp .env.example .env
   # Edit .env

   # Use PM2 for process management
   sudo npm install -g pm2
   pm2 start server.js --name hmcelular-backend
   pm2 save
   pm2 startup
   ```

4. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   npm run build

   # Copy build to Nginx
   sudo cp -r build/* /var/www/hmcelular/
   ```

5. **Configure Nginx:**
   ```nginx
   server {
     listen 80;
     server_name seudominio.com;

     # Frontend
     location / {
       root /var/www/hmcelular;
       try_files $uri /index.html;
     }

     # Backend API
     location /api {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

6. **Enable and Start:**
   ```bash
   sudo nginx -t
   sudo systemctl enable nginx
   sudo systemctl restart nginx
   ```

### EasyPanel Deployment

1. **Push to Git:**
   ```bash
   git remote add origin https://github.com/usuario/hmcelular-sistema.git
   git push -u origin main
   ```

2. **In EasyPanel:**
   - Create new project: `hmcelular`
   - Add MySQL service (8.0)
   - Add Backend service (Node.js)
     - Repository: your-repo
     - Build command: `cd backend && npm install`
     - Start command: `cd backend && npm start`
     - Port: 3001
   - Add Frontend service (Static Site)
     - Build command: `cd frontend && npm install && npm run build`
     - Output directory: `frontend/build`
   - Configure environment variables
   - Set up domain and SSL

### Environment Configuration

**Required Variables:**
```bash
# Database
DB_HOST=localhost
DB_USER=hmcelular
DB_PASSWORD=<strong-password>
DB_NAME=hmcelular_db
DB_PORT=3306

# JWT
JWT_SECRET=<64-char-random-string>
JWT_EXPIRE=7d

# Server
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://seudominio.com

# Frontend
REACT_APP_API_URL=/api
```

### Monitoring & Maintenance

**Health Checks:**
- API: `curl https://seudominio.com/api/health`
- Database: `docker-compose exec mysql mysqladmin ping`

**Logs:**
```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f mysql

# Manual
pm2 logs hmcelular-backend
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/mysql/error.log
```

**Backups:**
- Automated: Daily at 2 AM (Docker Compose backup service)
- Manual: `mysqldump -u hmcelular -p hmcelular_db > backup.sql`
- Retention: 7 days (configured in docker-compose.yml)

**Updates:**
```bash
# Pull latest code
git pull origin main

# Update dependencies
cd backend && npm install
cd frontend && npm install && npm run build

# Restart services
docker-compose restart backend frontend
# OR
pm2 restart hmcelular-backend
```

---

## Known Issues & Gotchas

### Critical Issues

1. **⚠️ authController.js Corrupted**
   - **Issue:** File contains Dockerfile content instead of actual controller code
   - **Impact:** Authentication endpoints may not work
   - **Location:** `backend/controllers/authController.js`
   - **Fix:** Restore from git history (commit `c486a55^`)
   - **Status:** Needs immediate attention

### Warnings

2. **Missing Nginx Configuration**
   - **Issue:** `docker-compose.yml` references `./nginx/nginx.conf` but file doesn't exist
   - **Impact:** Nginx service may not start correctly
   - **Fix:** Create nginx configuration or remove nginx service

3. **Missing Frontend Dockerfile**
   - **Issue:** Docker Compose expects `./frontend/Dockerfile` but it doesn't exist
   - **Impact:** Frontend container may not build
   - **Fix:** Create Dockerfile or use static build copying

4. **Tailwind CSS via CDN**
   - **Issue:** Using CDN in production is not optimal
   - **Impact:** External dependency, larger bundle, no purging
   - **Fix:** Migrate to npm package with PostCSS

5. **No Test Suite**
   - **Issue:** Zero test coverage
   - **Impact:** Manual testing only, regression risks
   - **Fix:** Implement Jest + Supertest for backend, RTL for frontend

6. **Default Credentials**
   - **Issue:** All test users have password `123456`
   - **Impact:** Security risk if deployed without changing
   - **Fix:** Change passwords immediately after deployment

7. **Weak JWT Secret in Examples**
   - **Issue:** env_example.sh has predictable JWT_SECRET
   - **Impact:** Tokens could be forged if example is used
   - **Fix:** Generate random secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Gotchas

8. **Mixed Naming Conventions**
   - React component file is `app.js` but should be `App.js`
   - Not critical but inconsistent with React conventions

9. **No API Versioning**
   - Current routes: `/api/auth`
   - Future consideration: `/api/v1/auth` for backwards compatibility

10. **Session Cleanup Timing**
    - MySQL Event runs every 1 hour
    - Expired sessions not immediately deleted
    - May accumulate between cleanup runs

11. **CORS Configuration**
    - Configured for single frontend URL
    - Multiple frontends need array configuration

12. **Large JSON Body Limit**
    - Set to 10MB (express.json({limit: '10mb'}))
    - May need adjustment based on actual file upload requirements

13. **No Request Logging**
    - Console.log only in development
    - Production needs proper logging (Winston, Morgan)

14. **Database Connection Pool**
    - Default pool size may need tuning for high traffic
    - Currently: connectionLimit not explicitly set

15. **No Healthcheck for Sessions**
    - Health endpoint checks database connection but not session functionality

### Documentation Gaps

Referenced but not created:
- `docs/DEPLOY_EASYPANEL.md`
- `docs/DEPLOY_DOCKER.md`
- `docs/API_DOCS.md`
- `docs/DEVELOPMENT.md`

---

## Future Development

### Roadmap

**✅ Phase 1 - Foundation (COMPLETE)**
- JWT authentication system
- User management with roles
- Basic dashboard
- REST API foundation
- Docker deployment setup
- Multi-store structure

**🚧 Phase 2 - Products & Stock (IN PROGRESS)**
- [ ] Product CRUD operations
- [ ] Category management (hierarchical)
- [ ] Stock control per store
- [ ] Product variations (color, size)
- [ ] Stock transfer between stores
- [ ] Low stock alerts
- [ ] Barcode scanning support
- [ ] Product images upload

**⏳ Phase 3 - Sales (PLANNED)**
- [ ] Point of Sale (POS) interface
- [ ] Customer management
- [ ] Sales tracking
- [ ] Returns and exchanges
- [ ] Cash register management
- [ ] Payment methods (cash, card, PIX)
- [ ] Receipt printing
- [ ] Sales commission calculation

**⏳ Phase 4 - Reports & Analytics (PLANNED)**
- [ ] Sales reports (daily, weekly, monthly)
- [ ] Stock reports
- [ ] Financial reports
- [ ] Employee performance
- [ ] Advanced dashboard with charts
- [ ] Export to PDF/Excel
- [ ] Email reports
- [ ] Custom report builder

**⏳ Phase 5 - Advanced Features (FUTURE)**
- [ ] Mobile app (React Native)
- [ ] WhatsApp integration
- [ ] Email marketing
- [ ] Customer loyalty program
- [ ] Online catalog
- [ ] Supplier management
- [ ] Purchase orders
- [ ] Multi-currency support

### Technical Debt

**Priority Tasks:**
1. **Fix authController.js corruption** (CRITICAL)
2. **Implement testing infrastructure** (HIGH)
3. **Migrate Tailwind to npm** (MEDIUM)
4. **Add comprehensive logging** (MEDIUM)
5. **Create missing Dockerfiles** (MEDIUM)
6. **Add API documentation** (MEDIUM)
7. **Implement password complexity rules** (LOW)
8. **Add request ID tracking** (LOW)

### Performance Optimizations (Future)

**Backend:**
- Implement Redis caching for frequent queries
- Add database query optimization (EXPLAIN ANALYZE)
- Implement connection pooling tuning
- Add response compression (gzip)
- Implement pagination for large datasets
- Add database indexes based on query patterns

**Frontend:**
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Service Worker for offline capability
- Bundle size optimization
- Implement virtual scrolling for large lists
- Add client-side caching

**Infrastructure:**
- CDN for static assets
- Database read replicas
- Load balancing for multiple backend instances
- Horizontal scaling with Kubernetes
- Monitoring with Prometheus + Grafana

### Security Enhancements (Future)

- 2FA/MFA for admin users
- Password complexity requirements (min 8 chars, uppercase, lowercase, number, symbol)
- Account lockout after failed attempts
- CAPTCHA on login
- Security headers audit
- Dependency vulnerability scanning (Snyk, npm audit)
- Penetration testing
- OWASP Top 10 compliance audit
- Database encryption at rest
- API request signing

---

## Additional Resources

### Useful Commands Reference

**Database:**
```bash
# Backup
mysqldump -u hmcelular -p hmcelular_db > backup_$(date +%Y%m%d).sql

# Restore
mysql -u hmcelular -p hmcelular_db < backup.sql

# Access MySQL CLI
docker-compose exec mysql mysql -u hmcelular -p hmcelular_db

# Check table structure
DESCRIBE usuarios;

# Check indexes
SHOW INDEX FROM usuarios;
```

**Docker:**
```bash
# View all container logs
docker-compose logs

# Follow specific service
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend

# Remove all containers and volumes
docker-compose down -v

# Execute command in container
docker-compose exec backend npm install newpackage
```

**Node.js:**
```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# List outdated packages
npm outdated
```

**Git:**
```bash
# View commit history
git log --oneline --graph --all

# View file history
git log --follow backend/controllers/authController.js

# Restore file from specific commit
git checkout c486a55 -- backend/controllers/authController.js

# View diff
git diff main..feature-branch
```

### External Documentation

**Technologies:**
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [MySQL](https://dev.mysql.com/doc/)
- [Docker](https://docs.docker.com/)
- [JWT](https://jwt.io/)
- [Tailwind CSS](https://tailwindcss.com/)

**Tools:**
- [Postman](https://www.postman.com/) - API testing
- [MySQL Workbench](https://www.mysql.com/products/workbench/) - Database management
- [VS Code](https://code.visualstudio.com/) - Recommended IDE

### Contact & Support

For questions specific to this codebase:
1. Check this CLAUDE.md file first
2. Review readme.md for user-facing documentation
3. Check git history for code examples
4. Review database schema for data structure

---

## Changelog

### 1.0.0 (December 2024)
- ✅ Initial release
- ✅ Phase 1 complete (Authentication & Dashboard)
- ✅ Docker deployment setup
- ✅ Comprehensive documentation

---

**Last Updated:** 2024-12-15
**Document Version:** 1.0.0
**Maintained By:** AI Assistants working on HMCelular Sistema

---

## Quick Start Checklist for New AI Assistants

When starting work on this codebase:

- [ ] Read this entire CLAUDE.md file
- [ ] Review readme.md for project context
- [ ] Check docker-compose.yml for infrastructure understanding
- [ ] Review backend/database/schema.sql for database structure
- [ ] Look at backend/server.js for API setup
- [ ] Review frontend/src/app.js for UI structure
- [ ] Test local environment with `docker-compose up -d`
- [ ] Verify API health at http://localhost:3001/api/health
- [ ] Test login with admin/123456
- [ ] Review current git branch and recent commits
- [ ] Check for any known issues in this document
- [ ] Understand current development phase (Phase 2)

**Ready to code!** 🚀
