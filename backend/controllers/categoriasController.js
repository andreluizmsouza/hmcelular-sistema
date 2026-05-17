const { executeQuery } = require('../config/database');
const { validationResult } = require('express-validator');

// Listar todas as categorias (com hierarquia opcional)
const listar = async (req, res) => {
    try {
        const { incluir_inativas } = req.query;
        const filtroAtivo = incluir_inativas === 'true' ? '' : 'WHERE c.ativo = 1';

        const categorias = await executeQuery(
            `SELECT c.*, p.nome as pai_nome,
                    (SELECT COUNT(*) FROM produtos WHERE categoria_id = c.id AND ativo = 1) as total_produtos
             FROM categorias c
             LEFT JOIN categorias p ON c.pai_id = p.id
             ${filtroAtivo}
             ORDER BY COALESCE(c.pai_id, c.id), c.ordem, c.nome`
        );

        res.json({ success: true, categorias });
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ error: 'Erro ao listar categorias' });
    }
};

const obter = async (req, res) => {
    try {
        const { id } = req.params;
        const categorias = await executeQuery(
            `SELECT c.*, p.nome as pai_nome
             FROM categorias c
             LEFT JOIN categorias p ON c.pai_id = p.id
             WHERE c.id = ?`,
            [id]
        );

        if (categorias.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        res.json({ success: true, categoria: categorias[0] });
    } catch (error) {
        console.error('Erro ao obter categoria:', error);
        res.status(500).json({ error: 'Erro ao obter categoria' });
    }
};

const criar = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
        }

        const { nome, descricao, pai_id, ordem } = req.body;

        const result = await executeQuery(
            `INSERT INTO categorias (nome, descricao, pai_id, ordem)
             VALUES (?, ?, ?, ?)`,
            [nome, descricao || null, pai_id || null, ordem || 0]
        );

        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, tabela_afetada, registro_id, dados_novos, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, 'CREATE', 'categorias', result.insertId, JSON.stringify(req.body), req.ip]
        );

        res.status(201).json({
            success: true,
            message: 'Categoria criada com sucesso',
            categoria: { id: result.insertId, nome, descricao, pai_id, ordem }
        });
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ error: 'Erro ao criar categoria' });
    }
};

const atualizar = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
        }

        const { id } = req.params;
        const { nome, descricao, pai_id, ordem, ativo } = req.body;

        if (pai_id && parseInt(pai_id) === parseInt(id)) {
            return res.status(400).json({ error: 'Uma categoria não pode ser pai dela mesma' });
        }

        const existentes = await executeQuery('SELECT * FROM categorias WHERE id = ?', [id]);
        if (existentes.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        await executeQuery(
            `UPDATE categorias
             SET nome = ?, descricao = ?, pai_id = ?, ordem = ?, ativo = ?
             WHERE id = ?`,
            [nome, descricao || null, pai_id || null, ordem || 0, ativo !== undefined ? ativo : 1, id]
        );

        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, tabela_afetada, registro_id, dados_anteriores, dados_novos, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'UPDATE', 'categorias', id, JSON.stringify(existentes[0]), JSON.stringify(req.body), req.ip]
        );

        res.json({ success: true, message: 'Categoria atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
};

const desativar = async (req, res) => {
    try {
        const { id } = req.params;

        const produtosAtivos = await executeQuery(
            'SELECT COUNT(*) as total FROM produtos WHERE categoria_id = ? AND ativo = 1',
            [id]
        );

        if (produtosAtivos[0].total > 0) {
            return res.status(400).json({
                error: 'Não é possível desativar uma categoria com produtos ativos',
                produtos_ativos: produtosAtivos[0].total
            });
        }

        await executeQuery('UPDATE categorias SET ativo = 0 WHERE id = ?', [id]);

        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, tabela_afetada, registro_id, ip_address) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'DELETE', 'categorias', id, req.ip]
        );

        res.json({ success: true, message: 'Categoria desativada com sucesso' });
    } catch (error) {
        console.error('Erro ao desativar categoria:', error);
        res.status(500).json({ error: 'Erro ao desativar categoria' });
    }
};

module.exports = { listar, obter, criar, atualizar, desativar };
