# 🏪 Sistema HMCelular - Gestão Comercial

Sistema completo de gestão para lojas de acessórios de celular e serviços.

## 🚀 Features Implementadas

- ✅ **Sistema de Login** - Autenticação JWT segura
- ✅ **Controle de Permissões** - Admin/Gerente/Vendedor
- ✅ **Dashboard Interativo** - Métricas em tempo real
- ✅ **Sistema Multilojas** - Gestão separada por unidade
- ✅ **API REST Completa** - Backend robusto
- ✅ **Interface Responsiva** - Design moderno
- 🚧 **Gestão de Produtos** - Fase 2 (em desenvolvimento)
- 🚧 **Controle de Estoque** - Fase 2 (em desenvolvimento)
- 🚧 **Sistema de Vendas** - Fase 3 (planejado)

## 🛠️ Tecnologias

### Backend
- **Node.js** + Express
- **MySQL** 8.0
- **JWT** para autenticação
- **bcrypt** para senhas
- **Winston** para logs

### Frontend
- **React** 18
- **Tailwind CSS**
- **Lucide React** (ícones)
- **Axios** para API

### Deploy
- **EasyPanel** (recomendado)
- **Docker** + Docker Compose
- **VPS** tradicional

## 📦 Estrutura do Projeto

```
hmcelular-sistema/
├── backend/                 # API Node.js
│   ├── config/             # Configurações
│   ├── controllers/        # Controladores
│   ├── middleware/         # Middlewares
│   ├── routes/            # Rotas da API
│   ├── database/          # Scripts SQL
│   ├── package.json
│   └── server.js
├── frontend/               # Interface React
│   ├── public/
│   ├── src/
│   │   ├── services/      # Serviços da API
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── docs/                   # Documentação
├── docker-compose.yml      # Docker
├── .env.example           # Variáveis de ambiente
└── README.md
```

## 🚀 Instalação Rápida

### Opção 1: EasyPanel (Recomendado)

1. **Upload para Git:**
   ```bash
   git init
   git add .
   git commit -m "HMCelular Sistema"
   git remote add origin https://github.com/SEU_USUARIO/hmcelular-sistema.git
   git push -u origin main
   ```

2. **EasyPanel:**
   - Criar projeto: `hmcelular`
   - Adicionar MySQL service
   - Adicionar Backend service (Node.js)
   - Adicionar Frontend service (Static Site)
   - Configurar domínio e SSL

3. **Configurar banco:**
   ```sql
   -- Executar no MySQL do EasyPanel
   source backend/database/schema.sql
   source backend/database/seed.sql
   ```

### Opção 2: Docker

```bash
# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

### Opção 3: Manual

1. **Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configurar .env
   npm start
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **MySQL:**
   ```bash
   # Executar scripts SQL
   mysql -u root -p < backend/database/schema.sql
   mysql -u root -p < backend/database/seed.sql
   ```

## 🔑 Credenciais de Teste

| Usuário | Senha | Tipo | Loja | Permissões |
|---------|-------|------|------|------------|
| `admin` | `123456` | Administrador | Matriz | Todas |
| `gerente1` | `123456` | Gerente | Matriz | Vendas, Produtos, Relatórios |
| `vendedor1` | `123456` | Vendedor | Shopping | Vendas, Consultas |
| `vendedor2` | `123456` | Vendedor | Boa Vista | Vendas básicas |

## 🌐 URLs de Acesso

- **Frontend:** http://localhost:3000 ou https://seudominio.com
- **API Health:** http://localhost:3001/api/health
- **API Docs:** http://localhost:3001/api

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# Database
DB_HOST=localhost
DB_USER=hmcelular
DB_PASSWORD=sua_senha_segura
DB_NAME=hmcelular_db
DB_PORT=3306

# JWT
JWT_SECRET=jwt_secret_muito_segura
JWT_EXPIRE=7d

# Server
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://seudominio.com

# Frontend
REACT_APP_API_URL=/api
```

## 📊 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual

### Sistema
- `GET /api/health` - Status da API
- `GET /api` - Informações da API

## 🔧 Desenvolvimento

### Comandos Úteis

```bash
# Backend
cd backend
npm run dev          # Modo desenvolvimento
npm start           # Modo produção
npm test            # Executar testes

# Frontend
cd frontend
npm start           # Desenvolvimento
npm run build       # Build produção
npm test           # Executar testes

# Docker
docker-compose up -d              # Iniciar
docker-compose logs -f            # Ver logs
docker-compose down               # Parar
docker-compose restart backend   # Reiniciar serviço
```

### Estrutura de Logs

```bash
backend/logs/
├── error.log       # Erros do sistema
├── combined.log    # Todos os logs
└── access.log      # Logs de acesso
```

## 📚 Documentação

- [Deploy EasyPanel](docs/DEPLOY_EASYPANEL.md)
- [Deploy Docker](docs/DEPLOY_DOCKER.md)
- [API Documentation](docs/API_DOCS.md)
- [Desenvolvimento](docs/DEVELOPMENT.md)

## 🔄 Roadmap

### ✅ Fase 1 - Fundação (CONCLUÍDA)
- Sistema de login e autenticação
- Dashboard básico
- API REST base
- Deploy automatizado

### 🚧 Fase 2 - Produtos e Estoque (EM DESENVOLVIMENTO)
- Cadastro de produtos
- Categorias e variações
- Controle de estoque
- Sistema multilojas
- Transferências entre lojas

### ⏳ Fase 3 - Vendas (PLANEJADO)
- PDV completo
- Gestão de clientes
- Trocas e devoluções
- Fechamento de caixa

### ⏳ Fase 4 - Relatórios (PLANEJADO)
- Relatórios de vendas
- Auditoria de estoque
- Dashboard avançado
- Analytics e métricas

## 🛡️ Segurança

- **Autenticação JWT** com expiração
- **Senhas criptografadas** com bcrypt
- **Rate limiting** nas APIs
- **Validação de dados** entrada/saída
- **Logs de auditoria** completos
- **Sessões controladas** no banco

## 🚀 Performance

- **Cache de queries** MySQL
- **Compressão gzip** Nginx
- **Assets otimizados** React
- **Lazy loading** componentes
- **Connection pooling** database

## 🐛 Troubleshooting

### Problemas Comuns

**Backend não inicia:**
```bash
# Verificar MySQL
mysqladmin ping -h localhost -u root -p

# Verificar variáveis
cat .env

# Logs detalhados
npm run dev
```

**Frontend não conecta:**
```bash
# Verificar proxy
curl http://localhost:3001/api/health

# Verificar CORS
cat backend/.env | grep FRONTEND_URL
```

**Erro de permissão:**
- Verificar usuário logado
- Conferir permissões no banco
- Validar JWT token

## 📞 Suporte

### Contato
- **Email:** suporte@hmcelular.com.br
- **Telefone:** (81) 3333-4444
- **WhatsApp:** (81) 99999-9999

### Issues
Para reportar bugs ou solicitar features:
1. Abrir issue no GitHub
2. Descrever o problema detalhadamente
3. Incluir logs relevantes
4. Especificar ambiente (EasyPanel/Docker/Manual)

## 📄 Licença

Este projeto é propriedade da **HMCelular** - Acessórios para Celular e Serviços.
Todos os direitos reservados.

---

## 🏆 Créditos

Sistema desenvolvido com foco em:
- ✅ **Simplicidade** de uso
- ✅ **Robustez** técnica  
- ✅ **Escalabilidade** futura
- ✅ **Manutenibilidade** código

**Versão:** 1.0.0  
**Última atualização:** Dezembro 2024  
**Status:** Produção - Fase 1 Completa