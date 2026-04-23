# 🏡 ImobiDemo

> Site de imobiliária fullstack hospedado em infraestrutura de nuvem gratuita, desenvolvido como projeto de demonstração técnica de servidores Linux em produção.

**🔗 [Ver site ao vivo →](https://imobidemo.duckdns.org)**  
**📋 [Painel do corretor →](https://imobidemo.duckdns.org/corretor/login.html)** _(login: admin@imobidemo.com / demo1234)_

---

## 📸 Preview

| Portal do Cliente | Painel do Corretor |
|---|---|
| Listagem com filtros, galeria de fotos e formulário de contato | Dashboard com leads, cadastro de imóveis e gestão do portfólio |

---

## 🎯 Sobre o Projeto

O foco principal deste projeto **não é o site em si, mas a infraestrutura**. O objetivo foi demonstrar capacidade de:

- Provisionar e configurar um servidor Linux do zero em nuvem
- Resolver problemas reais de rede, firewall e autenticação em produção
- Configurar um stack web completo (Nginx + PHP-FPM + MySQL)
- Publicar uma aplicação acessível publicamente com HTTPS válido

O site de imobiliária foi escolhido por ser funcional o suficiente para demonstrar integração frontend/backend/banco de dados, com duas áreas distintas (cliente e corretor) interagindo com o mesmo banco.

---

## 🏗️ Arquitetura

```
Internet
    │
    ▼
Oracle Cloud (OCI)
    │
    ├── Security Lists (VCN) ──── portas 22, 80, 443
    │
    ▼
Ubuntu Server 24.04 LTS
    │
    ├── FirewallD ──────────────── zonas public (http/https)
    │
    ├── Nginx 1.24
    │   ├── serve arquivos estáticos (HTML, CSS, JS, imagens)
    │   ├── proxy PHP via unix socket
    │   └── SSL termination (Let's Encrypt)
    │
    ├── PHP 8.2-FPM ─────────────── processa as APIs
    │
    └── MySQL 8.0 ───────────────── persiste dados
            ├── imoveis
            ├── imovel_fotos
            ├── corretores
            └── clientes (leads)
```

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| **Cloud** | Oracle Cloud Infrastructure (Always Free) |
| **SO** | Ubuntu Server 24.04 LTS |
| **Web Server** | Nginx 1.24 |
| **Backend** | PHP 8.3-FPM |
| **Banco de Dados** | MySQL 8.0 |
| **Domínio** | DuckDNS (DNS dinâmico gratuito) |
| **SSL** | Let's Encrypt via Certbot |
| **Firewall** | FirewallD + OCI Security Lists |
| **Frontend** | HTML5, CSS3 (custom), JavaScript vanilla |

---

## 📁 Estrutura do Projeto

```
imobidemo/
├── public/                    # Root do servidor web (/var/www/html)
│   ├── index.html             # Portal do cliente
│   ├── imovel.html            # Página de detalhe do imóvel
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css      # Estilos do portal cliente
│   │   │   └── corretor.css   # Estilos do painel corretor
│   │   └── js/
│   │       ├── main.js        # Lógica do portal cliente
│   │       ├── imovel.js      # Lógica da página de detalhe
│   │       └── corretor.js    # Lógica do painel corretor
│   ├── api/
│   │   ├── config.php         # Conexão PDO com MySQL
│   │   ├── imoveis.php        # GET lista/detalhe, POST novo imóvel
│   │   ├── clientes.php       # POST salva lead do visitante
│   │   ├── login.php          # Autenticação do corretor (bcrypt)
│   │   ├── logout.php         # Encerra sessão
│   │   ├── auth_check.php     # Verifica sessão ativa
│   │   ├── upload.php         # Upload de fotos (protegido)
│   │   └── dashboard.php      # Dados do painel (stats, leads, imóveis)
│   ├── corretor/
│   │   ├── index.html         # Dashboard do corretor
│   │   └── login.html         # Tela de login
│   └── uploads/               # Fotos dos imóveis
├── nginx/
│   └── imobidemo.conf         # Configuração completa do Nginx
├── schema.sql                 # Schema do banco + dados de demonstração
├── DEPLOY.md                  # Guia de deploy passo a passo
└── README.md                  # Este arquivo
```

---

## ✨ Funcionalidades

### Portal do Cliente (`/`)
- Listagem de imóveis com foto de capa, preço e características
- Filtros por tipo, transação (venda/aluguel), número de quartos e preço máximo
- Busca livre por bairro, cidade ou título
- Página de detalhe com galeria de fotos navegável (teclado e clique)
- Formulário de contato que salva o lead no banco **junto com os IDs dos imóveis visualizados**
- Design responsivo com menu hambúrguer para mobile
- Animações de scroll com IntersectionObserver

### Painel do Corretor (`/corretor/`)
- Autenticação com sessão PHP e senha armazenada em **bcrypt**
- Dashboard com totais: imóveis ativos, leads totais, leads do dia
- **Tabela de leads** mostrando nome, telefone, mensagem e quais imóveis o visitante estava vendo quando deixou o contato
- Cadastro de novos imóveis com upload de múltiplas fotos
- Gestão do portfólio com visualização e remoção

---

## 🚀 Infrastructure & Deploy

### Por que Oracle Cloud?

A OCI oferece recursos **Always Free permanentes** — diferente de créditos temporários de outros provedores. A instância não expira, tornando-a ideal para projetos de demonstração sem custos recorrentes.

**Recursos utilizados (sempre gratuitos):**
- VM.Standard.E2.1.Micro: 1 OCPU + 1 GB RAM
- IP público estático incluso
- 50 GB de armazenamento em bloco
- 10 TB de transferência de dados/mês

### Por que DuckDNS?

DuckDNS é um serviço de **DNS dinâmico gratuito** que fornece subdomínios reais no formato `*.duckdns.org`. Funciona como qualquer domínio registrado — o browser consulta o DNS, resolve para o IP e conecta normalmente. O IP das instâncias OCI Always Free é estático, então não é necessário configurar atualização automática.

---

## 🔧 Problemas Reais Resolvidos

Este projeto envolveu resolução de problemas reais em produção, documentados aqui:

### 1. Firewall bloqueando porta 80 (iptables vs OCI)
A OCI usa dois níveis de firewall: as Security Lists da VCN (console web) e o iptables dentro do Ubuntu. Mesmo com as regras de ingress configuradas no console, o kernel do servidor descartava os pacotes.

**Solução:** Limpar as regras do iptables e substituir pelo FirewallD:
```bash
sudo iptables -F
sudo iptables -P INPUT ACCEPT
sudo systemctl disable netfilter-persistent
sudo apt install firewalld
sudo firewall-cmd --zone=public --add-service=http --add-service=https
sudo firewall-cmd --runtime-to-permanent
```

### 2. Nginx não subia após o Certbot (`Is a directory`)
O Certbot criou um diretório em `sites-enabled/` onde deveria haver um symlink, corrompendo a configuração.

**Solução:**
```bash
sudo rm -rf /etc/nginx/sites-enabled/imobidemo
sudo tee /etc/nginx/sites-available/imobidemo > /dev/null << 'EOF'
[conf]
EOF
sudo ln -s /etc/nginx/sites-available/imobidemo /etc/nginx/sites-enabled/imobidemo
sudo nginx -t && sudo systemctl restart nginx
```

### 3. Acesso root MySQL bloqueado
O `mysql_secure_installation` alterou o plugin de autenticação do root. Os plugins `auth_socket` e `unix_socket` não estavam disponíveis nesta instalação.

**Solução:** Recuperação via `--skip-grant-tables`:
```bash
sudo systemctl stop mysql
sudo mkdir -p /var/run/mysqld && sudo chown mysql:mysql /var/run/mysqld
sudo mysqld_safe --skip-grant-tables --skip-networking &
mysql -u root   # entra sem senha
# FLUSH PRIVILEGES; ALTER USER 'root'@... IDENTIFIED BY 'senha'; EXIT;
sudo pkill mysqld_safe && sudo systemctl start mysql
```

### 4. Hash bcrypt corrompido pelo bash
Ao inserir o hash via linha de comando, o bash expandia os `$` do hash bcrypt como variáveis de ambiente, corrompendo completamente o valor.

**Solução:** Heredoc com aspas simples desativa a expansão:
```bash
cat > /tmp/fix.sql << 'EOF'
UPDATE corretores SET senha_hash = '$2y$10$hash_completo_aqui' WHERE email = 'admin@...';
EOF
mysql -u root -p'senha' imobidemo < /tmp/fix.sql
```

---

## 📦 Deploy (resumo)

> Para o guia completo com todos os comandos, veja [`DEPLOY.md`](./DEPLOY.md)

```bash
# 1. Instalar dependências
sudo apt install -y nginx php8.2 php8.2-fpm php8.2-mysql mysql-server certbot python3-certbot-nginx git

# 2. Clonar o repositório
sudo git clone https://github.com/lukasuvinha/imobidemo.git /var/www/html

# 3. Configurar banco
mysql -u root -p < schema.sql

# 4. Configurar Nginx
sudo cp nginx/imobidemo.conf /etc/nginx/sites-available/imobidemo
sudo ln -s /etc/nginx/sites-available/imobidemo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. SSL
sudo certbot --nginx -d imobidemo.duckdns.org

# 6. Permissões
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 775 /var/www/html/uploads/
```

---

## 🧪 Verificação rápida

```bash
# Serviços ativos
sudo systemctl status nginx php8.2-fpm mysql

# API respondendo
curl -k https://localhost/api/imoveis.php

# SSL válido
curl -I https://imobidemo.duckdns.org/
```

---

## 📄 Licença

Projeto de demonstração — livre para uso como referência.

---

<div align="center">
  <strong>ImobiDemo</strong> · Lukas · 
  <a href="https://imobidemo.duckdns.org">imobidemo.duckdns.org</a>
</div>
