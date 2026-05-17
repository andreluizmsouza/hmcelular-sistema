const { executeQuery, withTransaction } = require('../config/database');
const { validationResult } = require('express-validator');

// Lista estoque (com filtros: loja, baixo_estoque, busca)
const listar = async (req, res) => {
    try {
        const {
            loja_id,
            baixo_estoque,
            busca = '',
            categoria_id,
            page = 1,
            limit = 50
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const wheres = ['p.ativo = 1'];
        const params = [];

        if (loja_id) {
            wheres.push('e.loja_id = ?');
            params.push(loja_id);
        }

        if (baixo_estoque === 'true') {
            wheres.push('e.quantidade <= e.quantidade_minima AND e.quantidade_minima > 0');
        }

        if (busca) {
            wheres.push('(p.nome LIKE ? OR p.codigo LIKE ?)');
            const termo = `%${busca}%`;
            params.push(termo, termo);
        }

        if (categoria_id) {
            wheres.push('p.categoria_id = ?');
            params.push(categoria_id);
        }

        const whereClause = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';

        const totalResult = await executeQuery(
            `SELECT COUNT(*) as total
             FROM estoque e
             INNER JOIN produtos p ON e.produto_id = p.id
             ${whereClause}`,
            params
        );

        const estoque = await executeQuery(
            `SELECT e.*, p.nome as produto_nome, p.codigo as produto_codigo,
                    p.marca, p.modelo, p.preco_venda,
                    l.nome as loja_nome, c.nome as categoria_nome,
                    (e.quantidade <= e.quantidade_minima AND e.quantidade_minima > 0) as alerta_baixo
             FROM estoque e
             INNER JOIN produtos p ON e.produto_id = p.id
             INNER JOIN lojas l ON e.loja_id = l.id
             LEFT JOIN categorias c ON p.categoria_id = c.id
             ${whereClause}
             ORDER BY l.nome, p.nome
             LIMIT ${parseInt(limit)} OFFSET ${offset}`,
            params
        );

        res.json({
            success: true,
            estoque,
            paginacao: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult[0].total,
                total_paginas: Math.ceil(totalResult[0].total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao listar estoque:', error);
        res.status(500).json({ error: 'Erro ao listar estoque' });
    }
};

// Atualiza limites min/max do estoque
const atualizarLimites = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantidade_minima, quantidade_maxima, localizacao } = req.body;

        const existente = await executeQuery('SELECT * FROM estoque WHERE id = ?', [id]);
        if (existente.length === 0) {
            return res.status(404).json({ error: 'Registro de estoque não encontrado' });
        }

        await executeQuery(
            `UPDATE estoque SET
             quantidade_minima = ?, quantidade_maxima = ?, localizacao = ?
             WHERE id = ?`,
            [
                parseInt(quantidade_minima) || 0,
                parseInt(quantidade_maxima) || 0,
                localizacao || null,
                id
            ]
        );

        res.json({ success: true, message: 'Limites de estoque atualizados' });
    } catch (error) {
        console.error('Erro ao atualizar limites:', error);
        res.status(500).json({ error: 'Erro ao atualizar limites' });
    }
};

// Movimentação genérica de estoque (entrada/saida/ajuste)
// Tipos suportados: entrada, saida, ajuste
const movimentar = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
        }

        const { produto_id, loja_id, tipo, quantidade, motivo, observacoes } = req.body;
        const qtd = parseInt(quantidade);

        if (!['entrada', 'saida', 'ajuste'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de movimentação inválido' });
        }

        if (qtd < 0) {
            return res.status(400).json({ error: 'Quantidade deve ser positiva' });
        }

        const resultado = await withTransaction(async (connection) => {
            // Lock da linha de estoque para evitar race condition
            const [rows] = await connection.execute(
                'SELECT * FROM estoque WHERE produto_id = ? AND loja_id = ? FOR UPDATE',
                [produto_id, loja_id]
            );

            let registro;
            if (rows.length === 0) {
                // Criar registro de estoque se não existir
                const [insert] = await connection.execute(
                    `INSERT INTO estoque (produto_id, loja_id, quantidade) VALUES (?, ?, 0)`,
                    [produto_id, loja_id]
                );
                registro = { id: insert.insertId, quantidade: 0 };
            } else {
                registro = rows[0];
            }

            const quantidadeAntes = registro.quantidade;
            let quantidadeDepois;

            if (tipo === 'entrada') {
                quantidadeDepois = quantidadeAntes + qtd;
            } else if (tipo === 'saida') {
                if (quantidadeAntes < qtd) {
                    const err = new Error(`Estoque insuficiente. Disponível: ${quantidadeAntes}, solicitado: ${qtd}`);
                    err.statusCode = 400;
                    throw err;
                }
                quantidadeDepois = quantidadeAntes - qtd;
            } else {
                // ajuste: define o valor absoluto
                quantidadeDepois = qtd;
            }

            await connection.execute(
                'UPDATE estoque SET quantidade = ? WHERE id = ?',
                [quantidadeDepois, registro.id]
            );

            await connection.execute(
                `INSERT INTO movimentacoes_estoque
                 (produto_id, loja_id, tipo, quantidade, quantidade_antes, quantidade_depois,
                  motivo, observacoes, usuario_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    produto_id, loja_id, tipo,
                    Math.abs(quantidadeDepois - quantidadeAntes),
                    quantidadeAntes, quantidadeDepois,
                    motivo || null, observacoes || null, req.user.id
                ]
            );

            return { quantidade_antes: quantidadeAntes, quantidade_depois: quantidadeDepois };
        });

        res.json({
            success: true,
            message: 'Movimentação registrada com sucesso',
            ...resultado
        });
    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ error: error.message });
        }
        console.error('Erro ao movimentar estoque:', error);
        res.status(500).json({ error: 'Erro ao movimentar estoque' });
    }
};

// Transferência entre lojas (atômica)
const transferir = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
        }

        const { produto_id, loja_origem_id, loja_destino_id, quantidade, observacoes } = req.body;
        const qtd = parseInt(quantidade);

        if (loja_origem_id === loja_destino_id) {
            return res.status(400).json({ error: 'Loja de origem e destino devem ser diferentes' });
        }

        if (qtd <= 0) {
            return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
        }

        const resultado = await withTransaction(async (connection) => {
            // Lock origem
            const [origemRows] = await connection.execute(
                'SELECT * FROM estoque WHERE produto_id = ? AND loja_id = ? FOR UPDATE',
                [produto_id, loja_origem_id]
            );

            if (origemRows.length === 0 || origemRows[0].quantidade < qtd) {
                const err = new Error(`Estoque insuficiente na loja de origem. Disponível: ${origemRows[0]?.quantidade || 0}`);
                err.statusCode = 400;
                throw err;
            }

            // Lock destino (criando se não existir)
            const [destinoRows] = await connection.execute(
                'SELECT * FROM estoque WHERE produto_id = ? AND loja_id = ? FOR UPDATE',
                [produto_id, loja_destino_id]
            );

            let destino;
            if (destinoRows.length === 0) {
                const [insert] = await connection.execute(
                    `INSERT INTO estoque (produto_id, loja_id, quantidade) VALUES (?, ?, 0)`,
                    [produto_id, loja_destino_id]
                );
                destino = { id: insert.insertId, quantidade: 0 };
            } else {
                destino = destinoRows[0];
            }

            const origemAntes = origemRows[0].quantidade;
            const origemDepois = origemAntes - qtd;
            const destinoAntes = destino.quantidade;
            const destinoDepois = destinoAntes + qtd;

            await connection.execute(
                'UPDATE estoque SET quantidade = ? WHERE id = ?',
                [origemDepois, origemRows[0].id]
            );

            await connection.execute(
                'UPDATE estoque SET quantidade = ? WHERE id = ?',
                [destinoDepois, destino.id]
            );

            // Log saída da origem
            await connection.execute(
                `INSERT INTO movimentacoes_estoque
                 (produto_id, loja_id, tipo, quantidade, quantidade_antes, quantidade_depois,
                  motivo, observacoes, loja_origem_id, loja_destino_id, usuario_id)
                 VALUES (?, ?, 'transferencia_saida', ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    produto_id, loja_origem_id, qtd, origemAntes, origemDepois,
                    'Transferência entre lojas', observacoes || null,
                    loja_origem_id, loja_destino_id, req.user.id
                ]
            );

            // Log entrada no destino
            await connection.execute(
                `INSERT INTO movimentacoes_estoque
                 (produto_id, loja_id, tipo, quantidade, quantidade_antes, quantidade_depois,
                  motivo, observacoes, loja_origem_id, loja_destino_id, usuario_id)
                 VALUES (?, ?, 'transferencia_entrada', ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    produto_id, loja_destino_id, qtd, destinoAntes, destinoDepois,
                    'Transferência entre lojas', observacoes || null,
                    loja_origem_id, loja_destino_id, req.user.id
                ]
            );

            return { origem_depois: origemDepois, destino_depois: destinoDepois };
        });

        res.json({
            success: true,
            message: 'Transferência realizada com sucesso',
            ...resultado
        });
    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ error: error.message });
        }
        console.error('Erro ao transferir estoque:', error);
        res.status(500).json({ error: 'Erro ao transferir estoque' });
    }
};

// Histórico de movimentações
const historico = async (req, res) => {
    try {
        const {
            produto_id,
            loja_id,
            tipo,
            data_inicio,
            data_fim,
            page = 1,
            limit = 50
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const wheres = [];
        const params = [];

        if (produto_id) { wheres.push('m.produto_id = ?'); params.push(produto_id); }
        if (loja_id) { wheres.push('m.loja_id = ?'); params.push(loja_id); }
        if (tipo) { wheres.push('m.tipo = ?'); params.push(tipo); }
        if (data_inicio) { wheres.push('m.created_at >= ?'); params.push(data_inicio); }
        if (data_fim) { wheres.push('m.created_at <= ?'); params.push(data_fim); }

        const whereClause = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';

        const totalResult = await executeQuery(
            `SELECT COUNT(*) as total FROM movimentacoes_estoque m ${whereClause}`,
            params
        );

        const movimentacoes = await executeQuery(
            `SELECT m.*,
                    p.nome as produto_nome, p.codigo as produto_codigo,
                    l.nome as loja_nome,
                    lo.nome as loja_origem_nome,
                    ld.nome as loja_destino_nome,
                    u.nome as usuario_nome
             FROM movimentacoes_estoque m
             INNER JOIN produtos p ON m.produto_id = p.id
             INNER JOIN lojas l ON m.loja_id = l.id
             LEFT JOIN lojas lo ON m.loja_origem_id = lo.id
             LEFT JOIN lojas ld ON m.loja_destino_id = ld.id
             LEFT JOIN usuarios u ON m.usuario_id = u.id
             ${whereClause}
             ORDER BY m.created_at DESC
             LIMIT ${parseInt(limit)} OFFSET ${offset}`,
            params
        );

        res.json({
            success: true,
            movimentacoes,
            paginacao: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult[0].total,
                total_paginas: Math.ceil(totalResult[0].total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
};

// Resumo / KPIs do estoque
const resumo = async (req, res) => {
    try {
        const totalProdutos = await executeQuery(
            'SELECT COUNT(*) as total FROM produtos WHERE ativo = 1'
        );

        const totalEstoque = await executeQuery(
            `SELECT COALESCE(SUM(e.quantidade), 0) as total_unidades,
                    COALESCE(SUM(e.quantidade * p.preco_custo), 0) as valor_custo,
                    COALESCE(SUM(e.quantidade * p.preco_venda), 0) as valor_venda
             FROM estoque e
             INNER JOIN produtos p ON e.produto_id = p.id
             WHERE p.ativo = 1`
        );

        const estoqueBaixo = await executeQuery(
            `SELECT COUNT(*) as total
             FROM estoque e
             INNER JOIN produtos p ON e.produto_id = p.id
             WHERE p.ativo = 1
               AND e.quantidade <= e.quantidade_minima
               AND e.quantidade_minima > 0`
        );

        const semEstoque = await executeQuery(
            `SELECT COUNT(DISTINCT e.produto_id) as total
             FROM estoque e
             INNER JOIN produtos p ON e.produto_id = p.id
             WHERE p.ativo = 1 AND e.quantidade = 0`
        );

        res.json({
            success: true,
            resumo: {
                total_produtos: totalProdutos[0].total,
                total_unidades: parseInt(totalEstoque[0].total_unidades) || 0,
                valor_custo: parseFloat(totalEstoque[0].valor_custo) || 0,
                valor_venda: parseFloat(totalEstoque[0].valor_venda) || 0,
                produtos_estoque_baixo: estoqueBaixo[0].total,
                produtos_sem_estoque: semEstoque[0].total
            }
        });
    } catch (error) {
        console.error('Erro ao gerar resumo:', error);
        res.status(500).json({ error: 'Erro ao gerar resumo' });
    }
};

module.exports = { listar, atualizarLimites, movimentar, transferir, historico, resumo };
