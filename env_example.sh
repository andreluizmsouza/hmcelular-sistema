# Configurações do Sistema HMCelular
# Copie este arquivo para .env e configure com seus valores

# =================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# =================================
DB_HOST=localhost
DB_USER=hmcelular
DB_PASSWORD=sua_senha_muito_segura_2024
DB_NAME=hmcelular_db
DB_PORT=3306

# Para Docker (MySQL Root)
MYSQL_ROOT_PASSWORD=root_password_muito_segura_2024

# =================================
# CONFIGURAÇÕES JWT
# =================================
# IMPORTANTE: Use uma chave muito segura em produção
JWT_SECRET=jwt_secret_muito_muito_segura_hmcelular_2024
JWT_EXPIRE=7d

# =================================
# CONFIGURAÇÕES DO SERVIDOR
# =================================
NODE_ENV=production
PORT=3001

# =================================
# URLS E DOMÍNIOS
# =================================
# URL do frontend (para CORS)
FRONTEND_URL=https://meusite.com

# URL da API para o frontend
REACT_APP_API_URL=/api

# Domínio principal (para SSL)
DOMAIN=meusite.com

# =================================
# CONFIGURAÇÕES DE EMAIL (Futuro)
# =================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=seuemail@gmail.com
# SMTP_PASS=suasenha
# EMAIL_FROM=noreply@hmcelular.com.br

# =================================
# CONFIGURAÇÕES DE UPLOAD (Futuro)
# =================================
# UPLOAD_MAX_SIZE=10485760
# UPLOAD_PATH=/uploads
# ALLOWED_TYPES=jpg,jpeg,png,pdf

# =================================
# CONFIGURAÇÕES DE BACKUP (Futuro)
# =================================
# BACKUP_ENABLED=true
# BACKUP_SCHEDULE=0 2 * * *
# BACKUP_RETENTION=7
# BACKUP_PATH=/backups

# =================================
# CONFIGURAÇÕES DE LOGS
# =================================
LOG_LEVEL=info
LOG_FILE_ERROR=/app/logs/error.log
LOG_FILE_COMBINED=/app/logs/combined.log

# =================================
# CONFIGURAÇÕES DE SEGURANÇA
# =================================
# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_LOGIN_MAX=5

# Session
SESSION_CLEANUP_INTERVAL=3600000

# =================================
# CONFIGURAÇÕES DE DESENVOLVIMENTO
# =================================
# DEBUG=hmcelular:*
# ENABLE_CORS=true
# ENABLE_MORGAN=true

# =================================
# CONFIGURAÇÕES ESPECÍFICAS POR AMBIENTE
# =================================

# PRODUÇÃO:
# NODE_ENV=production
# FRONTEND_URL=https://sistema.hmcelular.com.br
# DB_HOST=mysql.servidor.com

# DESENVOLVIMENTO:
# NODE_ENV=development  
# FRONTEND_URL=http://localhost:3000
# DB_HOST=localhost

# DOCKER:
# DB_HOST=mysql
# FRONTEND_URL=http://localhost