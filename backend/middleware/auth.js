const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeQuery } = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar se a sessão ainda existe
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const sessions = await executeQuery(
            'SELECT * FROM sessoes WHERE usuario_id = ? AND token_hash = ? AND expires_at > NOW()',
            [decoded.id, tokenHash]
        );

        if (sessions.length === 0) {
            return res.status(401).json({ error: 'Sessão expirada' });
        }

        // Buscar dados do usuário
        const users = await executeQuery(
            `SELECT u.*, l.nome as loja_nome 
             FROM usuarios u 
             LEFT JOIN lojas l ON u.loja_id = l.id 
             WHERE u.id = ? AND u.ativo = 1`,
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        console.error('❌ Erro de autenticação:', error);
        res.status(401).json({ error: 'Erro de autenticação' });
    }
};

const checkPermission = (permission) => {
    return (req, res, next) => {
        const userPermissions = JSON.parse(req.user.permissoes || '[]');
        
        if (userPermissions.includes('todas') || userPermissions.includes(permission)) {
            next();
        } else {
            res.status(403).json({ 
                error: 'Permissão negada',
                required: permission,
                user_permissions: userPermissions
            });
        }
    };
};

module.exports = { auth, checkPermission };