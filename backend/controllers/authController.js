const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');

const login = async (req, res) => {
    try {
        // Verificar validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Dados inválidos', 
                details: errors.array() 
            });
        }

        const { usuario, senha } = req.body;
        console.log(`🔐 Tentativa de login: ${usuario}`);

        // Buscar usuário
        const users = await executeQuery(
            `SELECT u.*, l.nome as loja_nome 
             FROM usuarios u 
             LEFT JOIN lojas l ON u.loja_id = l.id 
             WHERE u.usuario = ? AND u.ativo = 1`,
            [usuario]
        );

        if (users.length === 0) {
            console.log(`❌ Usuário não encontrado: ${usuario}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = users[0];

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) {
            console.log(`❌ Senha inválida para usuário: ${usuario}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gerar JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                usuario: user.usuario, 
                tipo: user.tipo,
                loja_id: user.loja_id
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Salvar sessão
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

        await executeQuery(
            'INSERT INTO sessoes (usuario_id, token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [user.id, tokenHash, expiresAt, req.ip, req.get('User-Agent')]
        );

        // Atualizar último login
        await executeQuery(
            'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Log da ação
        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, ip_address) VALUES (?, ?, ?)',
            [user.id, 'LOGIN', req.ip]
        );

        console.log(`✅ Login bem-sucedido: ${usuario} (${user.tipo})`);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                usuario: user.usuario,
                nome: user.nome,
                email: user.email,
                tipo: user.tipo,
                loja_id: user.loja_id,
                loja_nome: user.loja_nome,
                permissoes: JSON.parse(user.permissoes || '[]'),
                ultimo_login: user.ultimo_login
            }
        });

    } catch (error) {
        console.error('❌ Erro no login:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            await executeQuery(
                'DELETE FROM sessoes WHERE token_hash = ?',
                [tokenHash]
            );
        }

        // Log da ação
        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, ip_address) VALUES (?, ?, ?)',
            [req.user.id, 'LOGOUT', req.ip]
        );

        console.log(`🚪 Logout: ${req.user.usuario}`);

        res.json({ 
            success: true,
            message: 'Logout realizado com sucesso' 
        });
    } catch (error) {
        console.error('❌ Erro no logout:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

const me = async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user.id,
                usuario: req.user.usuario,
                nome: req.user.nome,
                email: req.user.email,
                tipo: req.user.tipo,
                loja_id: req.user.loja_id,
                loja_nome: req.user.loja_nome,
                permissoes: JSON.parse(req.user.permissoes || '[]'),
                ultimo_login: req.user.ultimo_login
            }
        });
    } catch (error) {
        console.error('❌ Erro em /me:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

module.exports = { login, logout, me };
