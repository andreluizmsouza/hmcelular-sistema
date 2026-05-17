-- Criação do banco de dados (se não existir)
CREATE DATABASE IF NOT EXISTS hmcelular_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hmcelular_db;

-- Tabela de Lojas
CREATE TABLE IF NOT EXISTS lojas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    endereco TEXT,
    telefone VARCHAR(20),
    email VARCHAR(100),
    cnpj VARCHAR(18),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ativo (ativo),
    INDEX idx_nome (nome)
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20),
    tipo ENUM('administrador', 'vendedor', 'gerente') NOT NULL DEFAULT 'vendedor',
    loja_id INT,
    permissoes JSON,
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario),
    INDEX idx_tipo (tipo),
    INDEX idx_ativo (ativo),
    INDEX idx_loja (loja_id)
);

-- Tabela de Sessões (para controle de login)
CREATE TABLE IF NOT EXISTS sessoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_usuario (usuario_id),
    INDEX idx_expires (expires_at)
);

-- Tabela de Logs do Sistema
CREATE TABLE IF NOT EXISTS logs_sistema (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(50),
    registro_id INT,
    dados_anteriores JSON,
    dados_novos JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_acao (acao),
    INDEX idx_data (created_at),
    INDEX idx_tabela (tabela_afetada)
);

-- Tabela de Categorias (preparação para Fase 2)
CREATE TABLE IF NOT EXISTS categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    pai_id INT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    ordem INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pai_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_nome (nome),
    INDEX idx_ativo (ativo),
    INDEX idx_pai (pai_id)
);

-- Tabela de Produtos (Fase 2)
CREATE TABLE IF NOT EXISTS produtos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE,
    tipo ENUM('produto','servico') DEFAULT 'produto',
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    categoria_id INT,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    cor VARCHAR(50),
    tamanho VARCHAR(50),
    unidade_medida VARCHAR(20) DEFAULT 'UN',
    preco_custo DECIMAL(10,2) DEFAULT 0,
    preco_venda DECIMAL(10,2) DEFAULT 0,
    margem_lucro DECIMAL(5,2) DEFAULT 0,
    comissao DECIMAL(5,2) DEFAULT 0,
    enviar_sms_previsao BOOLEAN DEFAULT FALSE,
    previsao_retorno_dias INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_codigo (codigo),
    INDEX idx_nome (nome),
    INDEX idx_categoria (categoria_id),
    INDEX idx_ativo (ativo),
    INDEX idx_marca_modelo (marca, modelo)
);

-- Migração: adiciona colunas se a tabela já existir sem elas (ignora erro se coluna já existe)
-- Estas linhas falham silenciosamente em MySQL 8+ se a coluna já existe
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tipo ENUM('produto','servico') DEFAULT 'produto' AFTER codigo;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(20) DEFAULT 'UN' AFTER tamanho;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS comissao DECIMAL(5,2) DEFAULT 0 AFTER margem_lucro;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS enviar_sms_previsao BOOLEAN DEFAULT FALSE AFTER comissao;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS previsao_retorno_dias INT DEFAULT 0 AFTER enviar_sms_previsao;


-- Tabela de Estoque (preparação para Fase 2)
CREATE TABLE IF NOT EXISTS estoque (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produto_id INT NOT NULL,
    loja_id INT NOT NULL,
    quantidade INT DEFAULT 0,
    quantidade_minima INT DEFAULT 0,
    quantidade_maxima INT DEFAULT 0,
    localizacao VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_produto_loja (produto_id, loja_id),
    INDEX idx_produto (produto_id),
    INDEX idx_loja (loja_id),
    INDEX idx_quantidade (quantidade)
);

-- Tabela de Movimentações de Estoque (Fase 2)
-- Registra TODA alteração de estoque para auditoria e rastreabilidade
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produto_id INT NOT NULL,
    loja_id INT NOT NULL,
    tipo ENUM('entrada','saida','transferencia_saida','transferencia_entrada','ajuste','venda','devolucao') NOT NULL,
    quantidade INT NOT NULL,
    quantidade_antes INT NOT NULL,
    quantidade_depois INT NOT NULL,
    motivo VARCHAR(200),
    observacoes TEXT,
    loja_origem_id INT NULL,
    loja_destino_id INT NULL,
    usuario_id INT,
    referencia_id INT NULL,
    referencia_tipo VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (loja_origem_id) REFERENCES lojas(id) ON DELETE SET NULL,
    FOREIGN KEY (loja_destino_id) REFERENCES lojas(id) ON DELETE SET NULL,
    INDEX idx_produto (produto_id),
    INDEX idx_loja (loja_id),
    INDEX idx_tipo (tipo),
    INDEX idx_created_at (created_at),
    INDEX idx_usuario (usuario_id)
);

-- ============================================
-- INVENTÁRIO FÍSICO (Fase 2)
-- ============================================
-- Cabeçalho do inventário: representa uma sessão de contagem
CREATE TABLE IF NOT EXISTS inventarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    loja_id INT NOT NULL,
    categoria_id INT NULL,
    status ENUM('aberto', 'fechado', 'cancelado') DEFAULT 'aberto',
    observacoes TEXT,
    usuario_abertura_id INT,
    usuario_fechamento_id INT NULL,
    total_itens INT DEFAULT 0,
    itens_contados INT DEFAULT 0,
    itens_com_divergencia INT DEFAULT 0,
    iniciado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finalizado_em TIMESTAMP NULL,
    FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_abertura_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_fechamento_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_loja (loja_id),
    INDEX idx_status (status),
    INDEX idx_iniciado_em (iniciado_em)
);

-- Itens do inventário: snapshot do saldo no início + contagem
CREATE TABLE IF NOT EXISTS inventario_itens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventario_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade_sistema INT NOT NULL,
    quantidade_contada INT NULL,
    diferenca INT NULL,
    observacoes TEXT,
    contado_em TIMESTAMP NULL,
    contado_por INT NULL,
    FOREIGN KEY (inventario_id) REFERENCES inventarios(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (contado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE KEY uk_inventario_produto (inventario_id, produto_id),
    INDEX idx_inventario (inventario_id),
    INDEX idx_produto (produto_id)
);

-- Limpar sessões expiradas automaticamente
-- Criar evento para limpeza automática (se suportado)
SET GLOBAL event_scheduler = ON;

DELIMITER //
CREATE EVENT IF NOT EXISTS clean_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM sessoes WHERE expires_at < NOW();
END //
DELIMITER ;

-- Inserir dados básicos se não existirem
-- Isso será feito no arquivo seed.sql