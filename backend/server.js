const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: { error: 'Muitas tentativas, tente novamente em 15 minutos' }
});
app.use(limiter);

// Rate limiting para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: { error: 'Muitas tentativas de login, tente novamente em 15 minutos' }
});

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
    next();
});

// Rotas
app.use('/api/auth', loginLimiter, authRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        uptime: Math.floor(process.uptime()),
        service: 'HMCelular Backend'
    });
});

// Info da API
app.get('/api', (req, res) => {
    res.json({
        name: 'HMCelular API',
        version: '1.0.0',
        description: 'Sistema de Gestão Comercial - Acessórios para Celular',
        company: 'HMCelular',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            login: 'POST /api/auth/login',
            logout: 'POST /api/auth/logout',
            me: 'GET /api/auth/me'
        }
    });
});

// Error handler global
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido, finalizando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT recebido, finalizando servidor...');
    process.exit(0);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HMCelular Backend rodando na porta ${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
    console.log(`🔗 Frontend: ${process.env.FRONTEND_URL}`);
    console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);
});

module.exports = app;