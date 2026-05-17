const express = require('express');
const { body } = require('express-validator');
const { auth, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/inventariosController');

const router = express.Router();

const validacaoCriacao = [
    body('loja_id').isInt({ min: 1 }).withMessage('Loja é obrigatória'),
    body('categoria_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('observacoes').optional({ nullable: true }).isLength({ max: 1000 })
];

router.get('/', auth, checkPermission('estoque'), ctrl.listar);
router.get('/:id', auth, checkPermission('estoque'), ctrl.obter);
router.get('/:id/itens', auth, checkPermission('estoque'), ctrl.listarItens);
router.get('/:id/preview-fechamento', auth, checkPermission('estoque'), ctrl.previewFechamento);
router.post('/', auth, checkPermission('estoque'), validacaoCriacao, ctrl.criar);
router.put('/:id/itens/:itemId', auth, checkPermission('estoque'), ctrl.contarItem);
router.post('/:id/fechar', auth, checkPermission('estoque'), ctrl.fechar);
router.post('/:id/cancelar', auth, checkPermission('estoque'), ctrl.cancelar);

module.exports = router;
