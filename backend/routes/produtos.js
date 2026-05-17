const express = require('express');
const { body } = require('express-validator');
const { auth, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/produtosController');

const router = express.Router();

const validacaoProduto = [
    body('nome').notEmpty().withMessage('Nome é obrigatório').isLength({ max: 200 }).trim(),
    body('codigo').optional({ nullable: true }).isLength({ max: 50 }).trim(),
    body('descricao').optional({ nullable: true }).isLength({ max: 2000 }),
    body('categoria_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('marca').optional({ nullable: true }).isLength({ max: 100 }).trim(),
    body('modelo').optional({ nullable: true }).isLength({ max: 100 }).trim(),
    body('cor').optional({ nullable: true }).isLength({ max: 50 }).trim(),
    body('tamanho').optional({ nullable: true }).isLength({ max: 50 }).trim(),
    body('preco_custo').optional({ nullable: true }).isFloat({ min: 0 }),
    body('preco_venda').optional({ nullable: true }).isFloat({ min: 0 })
];

router.get('/marcas', auth, checkPermission('produtos'), ctrl.listarMarcas);
router.get('/', auth, checkPermission('produtos'), ctrl.listar);
router.get('/:id', auth, checkPermission('produtos'), ctrl.obter);
router.post('/', auth, checkPermission('produtos'), validacaoProduto, ctrl.criar);
router.put('/:id', auth, checkPermission('produtos'), validacaoProduto, ctrl.atualizar);
router.delete('/:id', auth, checkPermission('produtos'), ctrl.desativar);

module.exports = router;
