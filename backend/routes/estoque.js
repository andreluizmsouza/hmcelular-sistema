const express = require('express');
const { body } = require('express-validator');
const { auth, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/estoqueController');

const router = express.Router();

const validacaoMovimentacao = [
    body('produto_id').isInt({ min: 1 }).withMessage('Produto inválido'),
    body('loja_id').isInt({ min: 1 }).withMessage('Loja inválida'),
    body('tipo').isIn(['entrada', 'saida', 'ajuste']).withMessage('Tipo inválido'),
    body('quantidade').isInt({ min: 0 }).withMessage('Quantidade deve ser >= 0'),
    body('motivo').optional({ nullable: true }).isLength({ max: 200 }).trim()
];

const validacaoTransferencia = [
    body('produto_id').isInt({ min: 1 }),
    body('loja_origem_id').isInt({ min: 1 }),
    body('loja_destino_id').isInt({ min: 1 }),
    body('quantidade').isInt({ min: 1 })
];

router.get('/resumo', auth, checkPermission('estoque'), ctrl.resumo);
router.get('/historico', auth, checkPermission('estoque'), ctrl.historico);
router.get('/', auth, checkPermission('estoque'), ctrl.listar);
router.put('/:id/limites', auth, checkPermission('estoque'), ctrl.atualizarLimites);
router.post('/movimentar', auth, checkPermission('estoque'), validacaoMovimentacao, ctrl.movimentar);
router.post('/transferir', auth, checkPermission('estoque'), validacaoTransferencia, ctrl.transferir);

module.exports = router;
