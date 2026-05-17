const { executeQuery, withTransaction } = require('../config/database');
const { validationResult } = require('express-validator');

// Gera código automático no formato PROD-NNNNNN
const gerarCodigoAutomatico = async (connection) => {
    const [rows] = await connection.execute(
        "SELECT MAX(CAST(SUBSTRING(codigo, 6) AS UNSIGNED)) as max_num FROM produtos WHERE codigo LIKE 'PROD-%'"
    );
    const proximoNumero = (rows[0]?.max_num || 0) + 1;
    return `PROD-${String(proximoNumero).padStart(6, '0')}`;
};

// Listar produtos com filtros e paginação
const listar = async (req, res) => {
    try {
        const {
            busca = '',
            categoria_id,
            marca,
            ativo = 'true',
            page = 1,
            limit = 50,
            sort = 'nome',
            order = 'asc'
        } = req.query;

        const sortAllowed = ['nome', 'codigo', 'preco_venda', 'created_at', 'marca'];
        const sortCol = sortAllowed.includes(sort) ? sort : 'nome';
        const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const wheres = [];
        const params = [];

        if (ativo !== 'all') {
            wheres.push('p.ativo = ?');
            params.push(ativo === 'true' ? 1 : 0);
        }

        if (busca) {
            wheres.push('(p.nome LIKE ? OR p.codigo LIKE ? OR p.marca LIKE ? OR p.modelo LIKE ?)');
            const termo = `%${busca}%`;
            params.push(termo, termo, termo, termo);
        }

        if (categoria_id) {
            wheres.push('p.categoria_id = ?');
            params.push(categoria_id);
        }

        if (marca) {
            wheres.push('p.marca = ?');
            params.push(marca);
        }

        const whereClause = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';

        // Total para paginação
        const totalResult = await executeQuery(
            `SELECT COUNT(*) as total FROM produtos p ${whereClause}`,
            params
        );
        const total = totalResult[0].total;

        const produtos = await executeQuery(
            `SELECT p.*, c.nome as categoria_nome,
                    COALESCE(SUM(e.quantidade), 0) as estoque_total
             FROM produtos p
             LEFT JOIN categorias c ON p.categoria_id = c.id
             LEFT JOIN estoque e ON e.produto_id = p.id
             ${whereClause}
             GROUP BY p.id
             ORDER BY ${sortCol} ${sortOrder}
             LIMIT ${parseInt(limit)} OFFSET ${offset}`,
            params
        );

        res.json({
            success: true,
            produtos,
            paginacao: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                total_paginas: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ error: 'Erro ao listar produtos' });
    }
};

const obter = async (req, res) => {
    try {
        const { id } = req.params;

        const produtos = await executeQuery(
            `SELECT p.*, c.nome as categoria_nome
             FROM produtos p
             LEFT JOIN categorias c ON p.categoria_id = c.id
             WHERE p.id = ?`,
            [id]
        );

        if (produtos.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const estoque = await executeQuery(
            `SELECT e.*, l.nome as loja_nome
             FROM estoque e
             INNER JOIN lojas l ON e.loja_id = l.id
             WHERE e.produto_id = ?
             ORDER BY l.nome`,
            [id]
        );

        res.json({ success: true, produto: produtos[0], estoque });
    } catch (error) {
        console.error('Erro ao obter produto:', error);
        res.status(500).json({ error: 'Erro ao obter produto' });
    }
};

const criar = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
        }

        const {
            codigo, nome, descricao, categoria_id, marca, modelo,
            cor, tamanho, preco_custo, preco_venda, criar_estoque_zerado
        } = req.body;

        const resultado = await withTransaction(async (connection) => {
            let codigoFinal = codigo?.trim();

            if (codigoFinal) {
                const [dup] = await connection.execute(
                    'SELECT id FROM produtos WHERE codigo = ?',
                    [codigoFinal]
                );
                if (dup.length > 0) {
                    const err = new Error('Já existe produto com este código');
                    err.statusCode = 409;
                    throw err;
                }
            } else {
                codigoFinal = await gerarCodigoAutomatico(connection);
            }

            const custo = parseFloat(preco_custo) || 0;
            const venda = parseFloat(preco_venda) || 0;
            const margem = custo > 0 ? ((venda - custo) / custo) * 100 : 0;

            const [insertResult] = await connection.execute(
                `INSERT INTO produtos
                 (codigo, nome, descricao, categoria_id, marca, modelo, cor, tamanho,
                  preco_custo, preco_venda, margem_lucro)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    codigoFinal, nome, descricao || null, categoria_id || null,
                    marca || null, modelo || null, cor || null, tamanho || null,
                    custo, venda, margem.toFixed(2)
                ]
            );

            const produtoId = insertResult.insertId;

            // Cria registros de estoque zerados em todas as lojas ativas
            if (criar_estoque_zerado !== false) {
                const [lojas] = await connection.execute('SELECT id FROM lojas WHERE ativo = 1');
                for (const loja of lojas) {
                    await connection.execute(
                        `INSERT INTO estoque (produto_id, loja_id, quantidade, quantidade_minima, quantidade_maxima)
                         VALUES (?, ?, 0, 0, 0)`,
                        [produtoId, loja.id]
                    );
                }
            }

            return { id: produtoId, codigo: codigoFinal };
        });

        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, tabela_afetada, registro_id, dados_novos, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, 'CREATE', 'produtos', resultado.id, JSON.stringify(req.body), req.ip]
        );

        res.status(201).json({
            success: true,
            message: 'Produto criado com sucesso',
            produto: resultado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ error: error.message });
        }
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
};

const atualizar = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
        }

        const { id } = req.params;
        const {
            codigo, nome, descricao, categoria_id, marca, modelo,
            cor, tamanho, preco_custo, preco_venda, ativo
        } = req.body;

        const existentes = await executeQuery('SELECT * FROM produtos WHERE id = ?', [id]);
        if (existentes.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        if (codigo && codigo !== existentes[0].codigo) {
            const dup = await executeQuery(
                'SELECT id FROM produtos WHERE codigo = ? AND id <> ?',
                [codigo, id]
            );
            if (dup.length > 0) {
                return res.status(409).json({ error: 'Já existe produto com este código' });
            }
        }

        const custo = parseFloat(preco_custo) || 0;
        const venda = parseFloat(preco_venda) || 0;
        const margem = custo > 0 ? ((venda - custo) / custo) * 100 : 0;

        await executeQuery(
            `UPDATE produtos SET
             codigo = ?, nome = ?, descricao = ?, categoria_id = ?,
             marca = ?, modelo = ?, cor = ?, tamanho = ?,
             preco_custo = ?, preco_venda = ?, margem_lucro = ?, ativo = ?
             WHERE id = ?`,
            [
                codigo || existentes[0].codigo,
                nome, descricao || null, categoria_id || null,
                marca || null, modelo || null, cor || null, tamanho || null,
                custo, venda, margem.toFixed(2),
                ativo !== undefined ? (ativo ? 1 : 0) : existentes[0].ativo,
                id
            ]
        );

        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, tabela_afetada, registro_id, dados_anteriores, dados_novos, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'UPDATE', 'produtos', id, JSON.stringify(existentes[0]), JSON.stringify(req.body), req.ip]
        );

        res.json({ success: true, message: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
};

const desativar = async (req, res) => {
    try {
        const { id } = req.params;

        await executeQuery('UPDATE produtos SET ativo = 0 WHERE id = ?', [id]);

        await executeQuery(
            'INSERT INTO logs_sistema (usuario_id, acao, tabela_afetada, registro_id, ip_address) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'DELETE', 'produtos', id, req.ip]
        );

        res.json({ success: true, message: 'Produto desativado com sucesso' });
    } catch (error) {
        console.error('Erro ao desativar produto:', error);
        res.status(500).json({ error: 'Erro ao desativar produto' });
    }
};

// Lista marcas distintas (para autocomplete e filtros)
const listarMarcas = async (req, res) => {
    try {
        const marcas = await executeQuery(
            "SELECT DISTINCT marca FROM produtos WHERE marca IS NOT NULL AND marca <> '' AND ativo = 1 ORDER BY marca"
        );
        res.json({ success: true, marcas: marcas.map(m => m.marca) });
    } catch (error) {
        console.error('Erro ao listar marcas:', error);
        res.status(500).json({ error: 'Erro ao listar marcas' });
    }
};

module.exports = { listar, obter, criar, atualizar, desativar, listarMarcas };
