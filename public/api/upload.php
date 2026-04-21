<?php
// ============================================================
// api/upload.php — Upload de fotos de imóveis (protegido)
// POST multipart/form-data: foto (arquivo)
// Retorna: { caminho: "/uploads/abc123.jpg" }
// ============================================================
require_once __DIR__ . '/config.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Método não suportado'], 405);
}

if (empty($_FILES['foto'])) {
    jsonResponse(['error' => 'Nenhum arquivo enviado'], 400);
}

$file  = $_FILES['foto'];
$tipos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

if (!in_array($file['type'], $tipos)) {
    jsonResponse(['error' => 'Formato inválido. Use JPEG, PNG ou WEBP'], 400);
}

if ($file['size'] > 10 * 1024 * 1024) { // 10 MB
    jsonResponse(['error' => 'Arquivo muito grande. Máximo 10 MB'], 400);
}

$ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$nome     = uniqid('img_', true) . '.' . $ext;
$destino  = UPLOAD_DIR . $nome;

if (!move_uploaded_file($file['tmp_name'], $destino)) {
    jsonResponse(['error' => 'Erro ao salvar arquivo'], 500);
}

jsonResponse(['success' => true, 'caminho' => UPLOAD_URL . $nome]);
