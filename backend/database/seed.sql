USE hmcelular_db;

-- Inserir Lojas (apenas se não existirem)
INSERT IGNORE INTO lojas (id, nome, endereco, telefone, email, cnpj) VALUES
(1, 'Matriz HMCelular', 'Rua Principal, 123 - Centro, Olinda - PE', '(81) 3333-4444', 'matriz@hmcelular.com.br', '12.345.678/0001-90'),
(2, 'HMCelular Shopping', 'Shopping Center, Loja 45 - Recife - PE', '(81) 3333-5555', 'shopping@hmcelular.com.br', '12.345.678/0002-71'),
(3, 'HMCelular Boa Vista', 'Av. Boa Vista, 789 - Recife - PE', '(81) 3333-6666', 'boavista@hmcelular.com.br', '12.345.678/0003-52');

-- Inserir Usuários (apenas se não existirem)
-- Senha padrão para todos: 123456 (hash bcrypt)
INSERT IGNORE INTO usuarios (id, usuario, senha, nome, email, tipo, loja_id, permissoes) VALUES
(1, 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador Sistema', 'admin@hmcelular.com.br', 'administrador', 1, '["todas"]'),
(2, 'gerente1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Gerente Matriz', 'gerente1@hmcelular.com.br', 'gerente', 1, '["vendas", "produtos", "clientes", "relatorios", "estoque"]'),
(3, 'vendedor1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'João Silva', 'joao@hmcelular.com.br', 'vendedor', 2, '["vendas", "consulta_produtos", "cadastro_cliente"]'),
(4, 'vendedor2', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Maria Santos', 'maria@hmcelular.com.br', 'vendedor', 3, '["vendas", "consulta_produtos"]'),
(5, 'gerente2', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Pedro Costa', 'pedro@hmcelular.com.br', 'gerente', 2, '["vendas", "produtos", "clientes", "relatorios", "estoque"]');

-- Inserir Categorias básicas (preparação para Fase 2)
INSERT IGNORE INTO categorias (id, nome, descricao, ordem) VALUES
(1, 'Películas', 'Películas protetoras para tela', 1),
(2, 'Capinhas', 'Capinhas e cases protetores', 2),
(3, 'Carregadores', 'Carregadores e cabos USB', 3),
(4, 'Fones de Ouvido', 'Fones com fio e bluetooth', 4),
(5, 'Acessórios', 'Outros acessórios diversos', 5),
(6, 'Serviços', 'Serviços técnicos e instalação', 6);

-- Subcategorias de Películas
INSERT IGNORE INTO categorias (id, nome, descricao, pai_id, ordem) VALUES
(7, 'Vidro Temperado', 'Películas de vidro temperado', 1, 1),
(8, 'Hidrogel', 'Películas de hidrogel', 1, 2),
(9, 'TPU', 'Películas de TPU flexível', 1, 3),
(10, 'Privacidade', 'Películas com filtro de privacidade', 1, 4);

-- Subcategorias de Capinhas
INSERT IGNORE INTO categorias (id, nome, descricao, pai_id, ordem) VALUES
(11, 'Silicone', 'Capinhas de silicone', 2, 1),
(12, 'Rígida', 'Capinhas rígidas', 2, 2),
(13, 'Carteira', 'Capinhas com porta cartão', 2, 3),
(14, 'Transparente', 'Capinhas transparentes', 2, 4);

-- Subcategorias de Carregadores
INSERT IGNORE INTO categorias (id, nome, descricao, pai_id, ordem) VALUES
(15, 'USB-C', 'Carregadores USB-C', 3, 1),
(16, 'Lightning', 'Carregadores Lightning (iPhone)', 3, 2),
(17, 'Micro USB', 'Carregadores Micro USB', 3, 3),
(18, 'Wireless', 'Carregadores sem fio', 3, 4);

-- Inserir alguns produtos de exemplo (preparação para Fase 2)
INSERT IGNORE INTO produtos (id, codigo, nome, descricao, categoria_id, marca, preco_custo, preco_venda, margem_lucro, ativo) VALUES
(1, 'PEL001', 'Película Vidro Temperado Universal 6.1"', 'Película de vidro temperado para telas de 6.1 polegadas', 7, 'HMCelular', 5.00, 15.00, 200.00, 1),
(2, 'CAP001', 'Capinha Silicone Transparente Universal', 'Capinha de silicone transparente flexível', 14, 'HMCelular', 8.00, 25.00, 212.50, 1),
(3, 'CAR001', 'Carregador USB-C 20W', 'Carregador rápido USB-C 20W', 15, 'Original', 15.00, 45.00, 200.00, 1),
(4, 'FON001', 'Fone Bluetooth 5.0', 'Fone de ouvido sem fio Bluetooth 5.0', 4, 'HMCelular', 25.00, 80.00, 220.00, 1);

-- Inserir estoque inicial para os produtos de exemplo
INSERT IGNORE INTO estoque (produto_id, loja_id, quantidade, quantidade_minima, quantidade_maxima) VALUES
(1, 1, 50, 10, 100),
(1, 2, 30, 10, 100),
(1, 3, 25, 10, 100),
(2, 1, 40, 15, 80),
(2, 2, 35, 15, 80),
(2, 3, 20, 15, 80),
(3, 1, 20, 5, 50),
(3, 2, 15, 5, 50),
(3, 3, 10, 5, 50),
(4, 1, 15, 5, 30),
(4, 2, 12, 5, 30),
(4, 3, 8, 5, 30);

-- Inserir log inicial do sistema
INSERT INTO logs_sistema (usuario_id, acao, tabela_afetada, dados_novos, ip_address) VALUES
(1, 'SYSTEM_SETUP', 'sistema', '{"acao": "Dados iniciais inseridos", "timestamp": "' + NOW() + '"}', '127.0.0.1');

-- Verificar dados inseridos
SELECT 'Lojas inseridas:' as info, COUNT(*) as total FROM lojas;
SELECT 'Usuários inseridos:' as info, COUNT(*) as total FROM usuarios;
SELECT 'Categorias inseridas:' as info, COUNT(*) as total FROM categorias;
SELECT 'Produtos inseridos:' as info, COUNT(*) as total FROM produtos;

-- Exibir usuários criados para referência
SELECT 
    usuario,
    nome,
    tipo,
    l.nome as loja,
    'Senha: 123456' as senha_padrao
FROM usuarios u
LEFT JOIN lojas l ON u.loja_id = l.id
WHERE u.ativo = 1
ORDER BY u.tipo, u.nome;