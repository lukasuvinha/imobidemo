# ============================================================
# IMOBIDEMO — GUIA COMPLETO DE DEPLOY
# Servidor Ubuntu + Oracle Cloud + Nginx + PHP + MySQL
# URL final: https://imobidemo.duckdns.org/
# ============================================================

## ESTRUTURA DE ARQUIVOS NO SERVIDOR
#
# /var/www/html/               ← root do site
# ├── index.html               ← página do cliente
# ├── imovel.html              ← detalhe do imóvel
# ├── setup_admin.php          ← rodar 1x e apagar
# ├── assets/
# │   ├── css/style.css
# │   ├── css/corretor.css
# │   ├── js/main.js
# │   ├── js/imovel.js
# │   └── js/corretor.js
# ├── api/
# │   ├── config.php
# │   ├── imoveis.php
# │   ├── clientes.php
# │   ├── login.php
# │   ├── logout.php
# │   ├── auth_check.php
# │   ├── upload.php
# │   └── dashboard.php
# ├── corretor/
# │   ├── index.html
# │   └── login.html
# └── uploads/                 ← fotos dos imóveis
#
# /etc/nginx/sites-available/imobidemo  ← config do Nginx


# ============================================================
# PASSO 1 — CONECTAR NO SERVIDOR
# ============================================================

ssh ubuntu@<IP_DO_SEU_SERVIDOR>
# ou com chave:
# ssh -i ~/.ssh/sua_chave.pem ubuntu@<IP>


# ============================================================
# PASSO 2 — INSTALAR DEPENDÊNCIAS
# ============================================================

sudo apt update && sudo apt upgrade -y

# Nginx
sudo apt install -y nginx

# PHP 8.2 + extensões necessárias
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-json php8.2-curl

# MySQL
sudo apt install -y mysql-server

# Certbot (SSL gratuito)
sudo apt install -y certbot python3-certbot-nginx

# Verificar versões instaladas
nginx -v
php -v
mysql --version


# ============================================================
# PASSO 3 — CONFIGURAR MYSQL
# ============================================================

# Rodar wizard de segurança
sudo mysql_secure_installation
# Responda: Y para tudo (remover usuários anônimos, desabilitar root remoto, etc.)

# Entrar no MySQL
sudo mysql -u root

# Dentro do MySQL, executar:
CREATE USER 'imobiuser'@'localhost' IDENTIFIED BY 'SenhaSegura123!';
GRANT ALL PRIVILEGES ON imobidemo.* TO 'imobiuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importar o schema com os dados de demonstração
sudo mysql -u imobiuser -p < /caminho/para/schema.sql
# OU copiando o schema.sql para o servidor primeiro e rodando:
# mysql -u imobiuser -p imobidemo < schema.sql


# ============================================================
# PASSO 4 — COPIAR OS ARQUIVOS DO PROJETO
# ============================================================

# Opção A: SCP do seu computador local (rode no seu PC, não no servidor)
scp -r ./public/* ubuntu@<IP_DO_SERVIDOR>:/var/www/html/

# Opção B: No servidor, criar os arquivos manualmente
# (copie e cole o conteúdo de cada arquivo)

# Ajustar permissões
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
sudo chmod -R 775 /var/www/html/uploads/    # uploads precisa ser gravável
sudo chmod 640 /var/www/html/api/config.php  # config com senha: leitura restrita


# ============================================================
# PASSO 5 — EDITAR config.php COM AS SUAS CREDENCIAIS
# ============================================================

sudo nano /var/www/html/api/config.php

# Altere as linhas:
#   define('DB_USER', 'imobiuser');
#   define('DB_PASS', 'SenhaSegura123!');  ← sua senha real
# Salve: Ctrl+X → Y → Enter


# ============================================================
# PASSO 6 — CONFIGURAR O NGINX
# ============================================================

# Copiar a configuração
sudo cp /caminho/para/nginx/imobidemo.conf /etc/nginx/sites-available/imobidemo

# Verificar qual versão do PHP-FPM está instalada
ls /run/php/
# Se for 8.1 ao invés de 8.2, edite o conf:
sudo nano /etc/nginx/sites-available/imobidemo
# Altere: fastcgi_pass unix:/run/php/php8.2-fpm.sock;
#    para: fastcgi_pass unix:/run/php/php8.1-fpm.sock;

# Ativar o site
sudo ln -s /etc/nginx/sites-available/imobidemo /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # remover site padrão

# Testar configuração
sudo nginx -t

# Recarregar nginx (antes do SSL, sem redirecionar ainda)
# ⚠️ Antes do Certbot, comente temporariamente as linhas SSL no conf
# e mude para listen 80 apenas, depois reative

sudo systemctl reload nginx


# ============================================================
# PASSO 7 — CERTIFICADO SSL (HTTPS gratuito)
# ============================================================

# Certifique-se que a porta 80 está aberta na Oracle Cloud
# (vá em: VCN → Security Lists → Inbound Rules → adicionar porta 80 e 443)
# Também abra no firewall do Ubuntu:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# Obter certificado SSL
sudo certbot --nginx -d imobidemo.duckdns.org
# Siga as instruções, forneça e-mail e aceite os termos

# O Certbot vai editar o nginx.conf automaticamente para HTTPS
# Verificar renovação automática:
sudo certbot renew --dry-run


# ============================================================
# PASSO 8 — CRIAR O USUÁRIO ADMIN
# ============================================================

# Acesse pelo navegador:
https://imobidemo.duckdns.org/setup_admin.php

# Ele vai criar o admin com:
#   Email: admin@imobidemo.com
#   Senha: demo1234

# IMPORTANTE: Apague o arquivo após usar!
sudo rm /var/www/html/setup_admin.php


# ============================================================
# PASSO 9 — TESTAR TUDO
# ============================================================

# Site do cliente:
# https://imobidemo.duckdns.org/

# Detalhe de imóvel:
# https://imobidemo.duckdns.org/imovel.html?id=1

# Login do corretor:
# https://imobidemo.duckdns.org/corretor/login.html
# Email: admin@imobidemo.com | Senha: demo1234

# Painel do corretor (requer login):
# https://imobidemo.duckdns.org/corretor/

# API de imóveis (JSON):
# https://imobidemo.duckdns.org/api/imoveis.php


# ============================================================
# PASSO 10 — VERIFICAR SERVIÇOS
# ============================================================

sudo systemctl status nginx
sudo systemctl status php8.2-fpm
sudo systemctl status mysql

# Ver logs em tempo real:
sudo tail -f /var/log/nginx/imobidemo_error.log
sudo tail -f /var/log/nginx/imobidemo_access.log


# ============================================================
# SOLUÇÃO DE PROBLEMAS COMUNS
# ============================================================

# PROBLEMA: "502 Bad Gateway"
# → PHP-FPM não está rodando
sudo systemctl start php8.2-fpm
sudo systemctl enable php8.2-fpm

# PROBLEMA: "403 Forbidden" nas imagens
# → Permissões dos arquivos
sudo chown -R www-data:www-data /var/www/html/uploads/
sudo chmod -R 755 /var/www/html/uploads/

# PROBLEMA: "500 Internal Server Error" na API
# → Verifique os logs e config.php
sudo tail -50 /var/log/nginx/imobidemo_error.log
# → Verifique se a senha do MySQL está correta em config.php

# PROBLEMA: Upload de fotos não funciona
# → O diretório /uploads/ deve ter permissão de escrita para www-data
sudo chown www-data:www-data /var/www/html/uploads
sudo chmod 775 /var/www/html/uploads

# PROBLEMA: Sessão do corretor não persiste
# → PHP-FPM precisa ter acesso ao diretório de sessões
sudo mkdir -p /var/lib/php/sessions
sudo chown www-data:www-data /var/lib/php/sessions

# PROBLEMA: Certificado SSL não obtido
# → Verifique se o domínio aponta para o IP do servidor
nslookup imobidemo.duckdns.org
# → Verifique se a porta 80 está acessível (Oracle Cloud Security List)


# ============================================================
# COMANDOS ÚTEIS DO DIA A DIA
# ============================================================

# Reiniciar tudo
sudo systemctl restart nginx php8.2-fpm mysql

# Ver imóveis no banco
mysql -u imobiuser -p imobidemo -e "SELECT id, titulo, preco FROM imoveis;"

# Ver leads recebidos
mysql -u imobiuser -p imobidemo -e "SELECT nome, telefone, criado_em FROM clientes ORDER BY criado_em DESC LIMIT 10;"

# Adicionar novo corretor pelo MySQL
mysql -u imobiuser -p imobidemo
# Dentro do mysql:
# SELECT * FROM corretores;
# (use setup_admin.php para criar — ou insira via PHP para ter o hash correto)

# Backup do banco
mysqldump -u imobiuser -p imobidemo > backup_$(date +%Y%m%d).sql

# Espaço em disco
df -h
du -sh /var/www/html/uploads/
