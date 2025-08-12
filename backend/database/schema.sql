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

-- Tabela de Produtos (preparação para Fase 2)
CREATE TABLE IF NOT EXISTS produtos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    categoria_id INT,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    cor VARCHAR(50),
    tamanho VARCHAR(50),
    preco_custo DECIMAL(10,2),
    preco_venda DECIMAL(10,2),
    margem_lucro DECIMAL(5,2),
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