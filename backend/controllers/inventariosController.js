const { executeQuery, withTransaction } = require('../config/database');
const { validationResult } = require('express-validator');

// Listar inventários (com filtros)
const listar = async (req, res) => {
    try {
        const { loja_id, status, page = 1, limit = 30 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const wheres = [];
        const params = [];
        if (loja_id) { wheres.push('i.loja_id = ?'); params.push(loja_id); }
        if (status) { wheres.push('i.status = ?'); params.push(status); }
        const whereClause = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';

        const totalResult = await executeQuery(
            `SELECT COUNT(*) as total FROM inventarios i ${whereClause}`,
            params
        );

        const inventarios = await executeQuery(
            `SELECT i.*,
                    l.nome as loja_nome,
                    c.nome as categoria_nome,
                    ua.nome as usuario_abertura_nome,
                    uf.nome as usuario_fechamento_nome
             FROM inventarios i
             INNER JOIN lojas l ON i.loja_id = l.id
             LEFT JOIN categorias c ON i.categoria_id = c.id
             LEFT JOIN usuarios ua ON i.usuario_abertura_id = ua.id
             LEFT JOIN usuarios uf ON i.usuario_fechamento_id = uf.id
             ${whereClause}
             ORDER BY i.iniciado_em DESC
             LIMIT ${parseInt(limit)} OFFSET ${offset}`,
            params
        );

        res.json({
            success: true,
            inventarios,
            paginacao: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult[0].total,
                total_paginas: Math.ceil(totalResult[0].total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao listar inventários:', error);
        res.status(500).json({ error: 'Erro ao listar inventários' });
    }
};

// Detalhe do inventário (sem itens)
const obter = async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await executeQuery(
            `SELECT i.*,
                    l.nome as loja_nome,
                    c.nome as categoria_nome,
                    ua.nome as usuario_abertura_nome,
                    uf.nome as usuario_fechamento_nome
             FROM inventarios i
             INNER JOIN lojas l ON i.loja_id = l.id
             LEFT JOIN categorias c ON i.categoria_id = c.id
             LEFT JOIN usuarios ua ON i.usuario_abertura_id = ua.id
             LEFT JOIN usuarios uf ON i.usuario_fechamento_id = uf.id
             WHERE i.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Inventário não encontrado' });
        }

        res.json({ success: true, inventario: rows[0] });
    } catch (error) {
        console.error('Erro ao obter inventário:', error);
        res.status(500).json({ error: 'Erro ao obter inventário' });
    }
};

// Listar itens do inventário (com filtros: status da contagem, busca)
const listarItens = async (req, res) => {
    try {
        const { id } = req.params;
        const { busca = '', status_contagem, page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const wheres = ['ii.inventario_id = ?'];
        const params = [id];

        if (busca) {
            wheres.push('(p.nome LIKE ? OR p.codigo LIKE ?)');
            const t = `%${busca}%`;
            params.push(t, t);
        }

        if (status_contagem === 'contados') {
            wheres.push('ii.quantidade_contada IS NOT NULL');
        } else if (status_contagem === 'pendentes') {
            wheres.push('ii.quantidade_contada IS NULL');
        } else if (status_contagem === 'divergencias') {
            wheres.push('ii.quantidade_contada IS NOT NULL AND ii.diferenca <> 0');
        }

        const whereClause = `WHERE ${wheres.join(' AND ')}`;

        const totalResult = await executeQuery(
            `SELECT COUNT(*) as total
             FROM inventario_itens ii
             INNER JOIN produtos p ON ii.produto_id = p.id
             ${whereClause}`,
            params
        );

        const itens = await executeQuery(
            `SELECT ii.*,
                    p.nome as produto_nome,
                    p.codigo as produto_codigo,
                    p.marca, p.modelo,
                    p.preco_custo, p.preco_venda,
                    c.nome as categoria_nome,
                    u.nome as contado_por_nome
             FROM inventario_itens ii
             INNER JOIN produtos p ON ii.produto_id = p.id
             LEFT JOIN categorias c ON p.categoria_id = c.id
             LEFT JOIN usuarios u ON ii.contado_por = u.id
             ${whereClause}
             ORDER BY p.nome
             LIMIT ${parseInt(limit)} OFFSET ${offset}`,
            params
        );

        res.json({
            success: true,
            itens,
            paginacao: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult[0].total,
                total_paginas: Math.ceil(totalResult[0].total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao listar itens:', error);
        res.status(500).json({ error: 'Erro ao listar itens do inventário' });
    }
};

// Criar inventário: snapshot dos produtos da loja (opcionalmente filtrado por categoria)
const criar = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
        }

        const { loja_id, categoria_id, observacoes } = req.body;

        const resultado = await withTransaction(async (connection) => {
            // Bloquear novo inventário se já existe um aberto pra mesma loja
            const [abertos] = await connection.execute(
                `SELECT id FROM inventarios WHERE loja_id = ? AND status = 'aberto'`,
                [loja_id]
            );
            if (abertos.length > 0) {
                const err = new Error(`Já existe inventário aberto nesta loja (ID #${abertos[0].id}). Feche ou cancele antes de abrir outro.`);
                err.statusCode = 400;
                throw err;
            }

            // Validar loja
            const [lojas] = await connection.execute(
                'SELECT id FROM lojas WHERE id = ? AND ativo = 1',
                [loja_id]
            );
            if (lojas.length === 0) {
                const err = new Error('Loja inválida ou inativa');
                err.statusCode = 400;
                throw err;
            }

            // Cria cabeçalho
            const [insertHeader] = await connection.execute(
                `INSERT INTO inventarios (loja_id, categoria_id, observacoes, usuario_abertura_id)
                 VALUES (?, ?, ?, ?)`,
                [loja_id, categoria_id || null, observacoes || null, req.user.id]
            );
            const inventarioId = insertHeader.insertId;

            // Snapshot dos produtos ativos com estoque na loja
            // Filtra por categoria se especificado (incluindo subcategorias)
            let snapshotQuery, snapshotParams;

            if (categoria_id) {
                // Inclui produtos da categoria E de suas subcategorias diretas
                snapshotQuery = `
                    INSERT INTO inventario_itens (inventario_id, produto_id, quantidade_sistema)
                    SELECT ?, p.id, COALESCE(e.quantidade, 0)
                    FROM produtos p
                    LEFT JOIN estoque e ON e.produto_id = p.id AND e.loja_id = ?
                    WHERE p.ativo = 1
                      AND (p.categoria_id = ? OR p.categoria_id IN (
                          SELECT id FROM categorias WHERE pai_id = ?
                      ))
                `;
                snapshotParams = [inventarioId, loja_id, categoria_id, categoria_id];
            } else {
                snapshotQuery = `
                    INSERT INTO inventario_itens (inventario_id, produto_id, quantidade_sistema)
                    SELECT ?, p.id, COALESCE(e.quantidade, 0)
                    FROM produtos p
                    LEFT JOIN estoque e ON e.produto_id = p.id AND e.loja_id = ?
                    WHERE p.ativo = 1
                `;
                snapshotParams = [inventarioId, loja_id];
            }

            await connection.execute(snapshotQuery, snapshotParams);

            // Atualiza contagem total no cabeçalho
            const [totals] = await connection.execute(
                'SELECT COUNT(*) as total FROM inventario_itens WHERE inventario_id = ?',
                [inventarioId]
            );
            await connection.execute(
                'UPDATE inventarios SET total_itens = ? WHERE id = ?',
                [totals[0].total, inventarioId]
            );

            return { id: inventarioId, total_itens: totals[0].total };
        });

        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, tabela_afetada, registro_id, dados_novos, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, 'CREATE', 'inventarios', resultado.id, JSON.stringify(req.body), req.ip]
        );

        res.status(201).json({
            success: true,
            message: `Inventário aberto com ${resultado.total_itens} produtos para contar`,
            inventario: resultado
        });
    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ error: error.message });
        }
        console.error('Erro ao criar inventário:', error);
        res.status(500).json({ error: 'Erro ao criar inventário' });
    }
};

// Registrar contagem de um item
const contarItem = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const { quantidade_contada, observacoes } = req.body;

        const qtd = parseInt(quantidade_contada);
        if (isNaN(qtd) || qtd < 0) {
            return res.status(400).json({ error: 'Quantidade contada inválida' });
        }

        const resultado = await withTransaction(async (connection) => {
            // Valida inventário aberto
            const [inv] = await connection.execute(
                'SELECT * FROM inventarios WHERE id = ?',
                [id]
            );
            if (inv.length === 0) {
                const err = new Error('Inventário não encontrado');
                err.statusCode = 404;
                throw err;
            }
            if (inv[0].status !== 'aberto') {
                const err = new Error('Não é possível contar em inventário fechado ou cancelado');
                err.statusCode = 400;
                throw err;
            }

            // Valida item pertence ao inventário
            const [item] = await connection.execute(
                'SELECT * FROM inventario_itens WHERE id = ? AND inventario_id = ?',
                [itemId, id]
            );
            if (item.length === 0) {
                const err = new Error('Item não pertence a este inventário');
                err.statusCode = 404;
                throw err;
            }

            const diferenca = qtd - item[0].quantidade_sistema;
            const eraContado = item[0].quantidade_contada !== null;

            await connection.execute(
                `UPDATE inventario_itens
                 SET quantidade_contada = ?, diferenca = ?, observacoes = ?,
                     contado_em = NOW(), contado_por = ?
                 WHERE id = ?`,
                [qtd, diferenca, observacoes || null, req.user.id, itemId]
            );

            // Recalcula totais do cabeçalho
            const [stats] = await connection.execute(
                `SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN quantidade_contada IS NOT NULL THEN 1 ELSE 0 END) as contados,
                    SUM(CASE WHEN quantidade_contada IS NOT NULL AND diferenca <> 0 THEN 1 ELSE 0 END) as divergencias
                 FROM inventario_itens WHERE inventario_id = ?`,
                [id]
            );

            await connection.execute(
                `UPDATE inventarios
                 SET itens_contados = ?, itens_com_divergencia = ?
                 WHERE id = ?`,
                [stats[0].contados, stats[0].divergencias, id]
            );

            return { diferenca, era_contado: eraContado };
        });

        res.json({
            success: true,
            message: 'Contagem registrada',
            diferenca: resultado.diferenca
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Erro ao contar item:', error);
        res.status(500).json({ error: 'Erro ao registrar contagem' });
    }
};

// Fechar inventário: gera ajustes para itens contados com diferença
const fechar = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await withTransaction(async (connection) => {
            const [inv] = await connection.execute(
                'SELECT * FROM inventarios WHERE id = ? FOR UPDATE',
                [id]
            );
            if (inv.length === 0) {
                const err = new Error('Inventário não encontrado');
                err.statusCode = 404;
                throw err;
            }
            if (inv[0].status !== 'aberto') {
                const err = new Error('Inventário já foi fechado ou cancelado');
                err.statusCode = 400;
                throw err;
            }

            const lojaId = inv[0].loja_id;

            // Busca apenas itens com contagem registrada (ignora pendentes)
            const [itens] = await connection.execute(
                `SELECT ii.*, p.nome as produto_nome
                 FROM inventario_itens ii
                 INNER JOIN produtos p ON ii.produto_id = p.id
                 WHERE ii.inventario_id = ? AND ii.quantidade_contada IS NOT NULL`,
                [id]
            );

            let ajustesAplicados = 0;
            let totalAjustePositivo = 0;
            let totalAjusteNegativo = 0;

            for (const item of itens) {
                // Buscar saldo ATUAL (não o snapshot), com lock
                const [estoqueRows] = await connection.execute(
                    'SELECT * FROM estoque WHERE produto_id = ? AND loja_id = ? FOR UPDATE',
                    [item.produto_id, lojaId]
                );

                let estoqueId;
                let saldoAtual;
                if (estoqueRows.length === 0) {
                    const [ins] = await connection.execute(
                        'INSERT INTO estoque (produto_id, loja_id, quantidade) VALUES (?, ?, 0)',
                        [item.produto_id, lojaId]
                    );
                    estoqueId = ins.insertId;
                    saldoAtual = 0;
                } else {
                    estoqueId = estoqueRows[0].id;
                    saldoAtual = estoqueRows[0].quantidade;
                }

                // Pula se não há diferença em relação ao saldo atual
                if (item.quantidade_contada === saldoAtual) continue;

                const novoSaldo = item.quantidade_contada;
                const delta = novoSaldo - saldoAtual;

                await connection.execute(
                    'UPDATE estoque SET quantidade = ? WHERE id = ?',
                    [novoSaldo, estoqueId]
                );

                await connection.execute(
                    `INSERT INTO movimentacoes_estoque
                     (produto_id, loja_id, tipo, quantidade, quantidade_antes, quantidade_depois,
                      motivo, observacoes, usuario_id, referencia_id, referencia_tipo)
                     VALUES (?, ?, 'ajuste', ?, ?, ?, ?, ?, ?, ?, 'inventario')`,
                    [
                        item.produto_id, lojaId,
                        Math.abs(delta), saldoAtual, novoSaldo,
                        `Inventário #${id}`,
                        `Ajuste por contagem de inventário. Snapshot inicial: ${item.quantidade_sistema}`,
                        req.user.id, id
                    ]
                );

                ajustesAplicados++;
                if (delta > 0) totalAjustePositivo += delta;
                else totalAjusteNegativo += Math.abs(delta);
            }

            await connection.execute(
                `UPDATE inventarios
                 SET status = 'fechado', usuario_fechamento_id = ?, finalizado_em = NOW()
                 WHERE id = ?`,
                [req.user.id, id]
            );

            return {
                ajustes_aplicados: ajustesAplicados,
                unidades_acrescentadas: totalAjustePositivo,
                unidades_removidas: totalAjusteNegativo
            };
        });

        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, tabela_afetada, registro_id, dados_novos, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, 'CLOSE_INVENTORY', 'inventarios', id, JSON.stringify(resultado), req.ip]
        );

        res.json({
            success: true,
            message: 'Inventário fechado com sucesso',
            ...resultado
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Erro ao fechar inventário:', error);
        res.status(500).json({ error: 'Erro ao fechar inventário' });
    }
};

const cancelar = async (req, res) => {
    try {
        const { id } = req.params;

        const inv = await executeQuery('SELECT * FROM inventarios WHERE id = ?', [id]);
        if (inv.length === 0) {
            return res.status(404).json({ error: 'Inventário não encontrado' });
        }
        if (inv[0].status !== 'aberto') {
            return res.status(400).json({ error: 'Apenas inventários abertos podem ser cancelados' });
        }

        await executeQuery(
            `UPDATE inventarios
             SET status = 'cancelado', usuario_fechamento_id = ?, finalizado_em = NOW()
             WHERE id = ?`,
            [req.user.id, id]
        );

        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, tabela_afetada, registro_id, ip_address) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'CANCEL_INVENTORY', 'inventarios', id, req.ip]
        );

        res.json({ success: true, message: 'Inventário cancelado' });
    } catch (error) {
        console.error('Erro ao cancelar inventário:', error);
        res.status(500).json({ error: 'Erro ao cancelar inventário' });
    }
};

// Preview do que seria ajustado se o inventário fosse fechado agora
const previewFechamento = async (req, res) => {
    try {
        const { id } = req.params;

        const inv = await executeQuery('SELECT * FROM inventarios WHERE id = ?', [id]);
        if (inv.length === 0) {
            return res.status(404).json({ error: 'Inventário não encontrado' });
        }

        const itens = await executeQuery(
            `SELECT ii.id, ii.produto_id, ii.quantidade_sistema, ii.quantidade_contada, ii.diferenca,
                    p.nome as produto_nome, p.codigo as produto_codigo, p.preco_custo, p.preco_venda,
                    COALESCE(e.quantidade, 0) as quantidade_atual
             FROM inventario_itens ii
             INNER JOIN produtos p ON ii.produto_id = p.id
             LEFT JOIN estoque e ON e.produto_id = ii.produto_id AND e.loja_id = ?
             WHERE ii.inventario_id = ? AND ii.quantidade_contada IS NOT NULL
               AND ii.quantidade_contada <> COALESCE(e.quantidade, 0)
             ORDER BY ABS(ii.quantidade_contada - COALESCE(e.quantidade, 0)) DESC`,
            [inv[0].loja_id, id]
        );

        const pendentes = await executeQuery(
            'SELECT COUNT(*) as total FROM inventario_itens WHERE inventario_id = ? AND quantidade_contada IS NULL',
            [id]
        );

        const valorImpacto = itens.reduce((acc, item) => {
            const delta = item.quantidade_contada - item.quantidade_atual;
            return acc + (delta * parseFloat(item.preco_custo || 0));
        }, 0);

        res.json({
            success: true,
            divergencias: itens,
            total_divergencias: itens.length,
            itens_pendentes: pendentes[0].total,
            valor_impacto_custo: valorImpacto
        });
    } catch (error) {
        console.error('Erro no preview:', error);
        res.status(500).json({ error: 'Erro ao gerar preview' });
    }
};

module.exports = {
    listar, obter, listarItens, criar, contarItem,
    fechar, cancelar, previewFechamento
};
