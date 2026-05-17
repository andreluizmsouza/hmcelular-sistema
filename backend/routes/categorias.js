const express = require('express');
const { body } = require('express-validator');
const { auth, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/categoriasController');

const router = express.Router();

const validacaoCategoria = [
    body('nome').notEmpty().withMessage('Nome é obrigatório').isLength({ max: 100 }).trim(),
    body('descricao').optional({ nullable: true }).isLength({ max: 1000 }),
    body('pai_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('ordem').optional().isInt({ min: 0 })
];

router.get('/', auth, checkPermission('produtos'), ctrl.listar);
router.get('/:id', auth, checkPermission('produtos'), ctrl.obter);
router.post('/', auth, checkPermission('produtos'), validacaoCategoria, ctrl.criar);
router.put('/:id', auth, checkPermission('produtos'), validacaoCategoria, ctrl.atualizar);
router.delete('/:id', auth, checkPermission('produtos'), ctrl.desativar);

module.exports = router;
