-- ============================================================
-- IMOBIDEMO - Schema do Banco de Dados
-- Execute: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS imobidemo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE imobidemo;

-- ---- Corretores ----
CREATE TABLE IF NOT EXISTS corretores (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---- Imóveis ----
CREATE TABLE IF NOT EXISTS imoveis (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    titulo      VARCHAR(200) NOT NULL,
    descricao   TEXT,
    preco       DECIMAL(14,2) NOT NULL,
    endereco    VARCHAR(200) NOT NULL,
    bairro      VARCHAR(100) NOT NULL,
    cidade      VARCHAR(100) NOT NULL,
    area        DECIMAL(8,2),
    quartos     TINYINT UNSIGNED,
    banheiros   TINYINT UNSIGNED,
    vagas       TINYINT UNSIGNED,
    tipo        ENUM('casa','apartamento','terreno','comercial') DEFAULT 'casa',
    status      ENUM('venda','aluguel') DEFAULT 'venda',
    destaque    TINYINT(1) DEFAULT 0,
    ativo       TINYINT(1) DEFAULT 1,
    corretor_id INT,
    criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (corretor_id) REFERENCES corretores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---- Fotos dos Imóveis ----
CREATE TABLE IF NOT EXISTS imovel_fotos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    imovel_id   INT NOT NULL,
    caminho     VARCHAR(300) NOT NULL,
    ordem       TINYINT DEFAULT 0,
    FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---- Leads (clientes que deixaram contato) ----
CREATE TABLE IF NOT EXISTS clientes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    telefone        VARCHAR(30) NOT NULL,
    email           VARCHAR(150),
    mensagem        TEXT,
    imoveis_vistos  JSON,
    criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- DADOS DE DEMONSTRAÇÃO
-- ============================================================

-- Corretor padrão  (senha: demo1234)
INSERT INTO corretores (nome, email, senha_hash) VALUES (
  'Admin Demo',
  'admin@imobidemo.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);
-- ATENÇÃO: o hash acima é para "password" (Laravel default).
-- Rode setup_admin.php para gerar o hash correto para "demo1234".

-- Imóvel 1
INSERT INTO imoveis (titulo, descricao, preco, endereco, bairro, cidade, area, quartos, banheiros, vagas, tipo, status, destaque, corretor_id) VALUES (
  'Casa Beira-Mar com Vista Privilegiada',
  'Encantadora casa de praia com estilo tropical brasileiro, sala ampla com vigas de madeira nobre, sofá floral clássico, tapete persa e acesso direto à varanda com piscina e vista inesquecível para o mar. Decoração impecável com obras de arte originais. Jardim tropical cercado por vegetação exuberante. Mesa de jantar ao ar livre com guarda-sol azul. Perfeita para quem busca sofisticação com conforto à beira-mar, ideal para família com crianças.',
  4500000.00,
  'Rua de Demonstração, 100', 'Bairro de Demonstração', 'Cidade Demo',
  320.00, 4, 3, 2, 'casa', 'venda', 1, 1
);

-- Imóvel 2
INSERT INTO imoveis (titulo, descricao, preco, endereco, bairro, cidade, area, quartos, banheiros, vagas, tipo, status, destaque, corretor_id) VALUES (
  'Mansão Frente ao Mar com Piscina e Jacuzzi',
  'Magnífica mansão com piscina de borda livre e jacuzzi integrada, deck amplo com áreas de convivência, espreguiçadeiras e sombras sob palmeiras imperiais. Sala íntima gourmet com lareira, home theater completo e bar. Vista direta e sem obstáculos para o oceano a partir de todos os ambientes sociais. Jardim tropical profissional, área de churrasco e garagem para 4 veículos. Uma propriedade única para quem exige o melhor.',
  8900000.00,
  'Rua de Demonstração, 250', 'Bairro de Demonstração', 'Cidade Demo',
  650.00, 5, 5, 4, 'casa', 'venda', 1, 1
);

-- Imóvel 3
INSERT INTO imoveis (titulo, descricao, preco, endereco, bairro, cidade, area, quartos, banheiros, vagas, tipo, status, destaque, corretor_id) VALUES (
  'Casa Moderna com Arquitetura Contemporânea',
  'Residência contemporânea de dois andares com fachada arrojada em tons terrosos e cimento queimado, piscina com deck de madeira cumaru, jardim impecável em grama esmeralda e varanda gourmet integrada. Interior com escada flutuante em madeira maciça, pé-direito duplo na sala, living minimalista e integração total com o exterior por esquadrias de vidro. Acabamento de alto padrão, domótica instalada e energia solar.',
  2800000.00,
  'Rua de Demonstração, 45', 'Bairro de Demonstração', 'Cidade Demo',
  280.00, 3, 3, 2, 'casa', 'venda', 0, 1
);

-- Imóvel 4
INSERT INTO imoveis (titulo, descricao, preco, endereco, bairro, cidade, area, quartos, banheiros, vagas, tipo, status, destaque, corretor_id) VALUES (
  'Residência de Luxo com Espelho d''Água',
  'Casa sofisticada com living integrado à área externa por janelas de vidro do piso ao teto, espelho d''água com cascata de pedras naturais na lateral da sala, jardim vertical vivo e terraço com bancada em madeira maciça de peroba. Acabamentos premium, ambiente sereno e design de alto padrão assinado. Localização privilegiada em condomínio fechado com guarita 24h, academia e salão de festas. A residência perfeita para quem valoriza design, natureza e privacidade.',
  3600000.00,
  'Rua de Demonstração, 78', 'Bairro de Demonstração', 'Cidade Demo',
  380.00, 4, 4, 3, 'casa', 'venda', 1, 1
);

-- Fotos dos imóveis
INSERT INTO imovel_fotos (imovel_id, caminho, ordem) VALUES
(1, '/uploads/casa1_1.jpg', 0),
(1, '/uploads/casa1_2.jpg', 1),
(1, '/uploads/casa1_3.jpg', 2),
(2, '/uploads/casa2_1.jpg', 0),
(2, '/uploads/casa2_2.jpg', 1),
(2, '/uploads/casa2_3.jpg', 2),
(3, '/uploads/casa3_1.jpg', 0),
(3, '/uploads/casa3_2.jpg', 1),
(3, '/uploads/casa3_3.jpg', 2),
(4, '/uploads/casa4_1.jpg', 0),
(4, '/uploads/casa4_2.jpg', 1),
(4, '/uploads/casa4_3.jpg', 2);
