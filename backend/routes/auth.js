const express = require('express');
const { body } = require('express-validator');
const { login, logout, me } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validações para login
const loginValidation = [
    body('usuario')
        .notEmpty()
        .withMessage('Usuário é obrigatório')
        .isLength({ min: 3, max: 50 })
        .withMessage('Usuário deve ter entre 3 e 50 caracteres')
        .trim(),
    body('senha')
        .notEmpty()
        .withMessage('Senha é obrigatória')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres')
];

// Rotas de autenticação
router.post('/login', loginValidation, login);
router.post('/logout', auth, logout);
router.get('/me', auth, me);

// Rota de teste (apenas para desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    router.get('/test', (req, res) => {
        res.json({
            message: 'Auth routes funcionando!',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
        });
    });
}

module.exports = router;