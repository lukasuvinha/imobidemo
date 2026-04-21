<?php
// ============================================================
// api/clientes.php — Salva o contato do visitante
// POST: nome, telefone, email, mensagem, imoveis_vistos[]
// ============================================================
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Método não suportado'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['nome']) || empty($data['telefone'])) {
    jsonResponse(['error' => 'Nome e telefone são obrigatórios'], 400);
}

// Sanitize
$nome     = mb_substr(strip_tags($data['nome']),     0, 100);
$telefone = mb_substr(strip_tags($data['telefone']), 0, 30);
$email    = mb_substr(strip_tags($data['email']    ?? ''), 0, 150);
$mensagem = mb_substr(strip_tags($data['mensagem'] ?? ''), 0, 1000);
$vistos   = $data['imoveis_vistos'] ?? [];

// Garante que imoveis_vistos é array de ints
if (!is_array($vistos)) $vistos = [];
$vistos = array_map('intval', $vistos);
$vistos = array_unique(array_filter($vistos));

$pdo  = getPDO();
$stmt = $pdo->prepare("
    INSERT INTO clientes (nome, telefone, email, mensagem, imoveis_vistos)
    VALUES (:nome, :telefone, :email, :mensagem, :vistos)
");
$stmt->execute([
    ':nome'     => $nome,
    ':telefone' => $telefone,
    ':email'    => $email,
    ':mensagem' => $mensagem,
    ':vistos'   => json_encode(array_values($vistos)),
]);

jsonResponse(['success' => true, 'message' => 'Contato recebido! Em breve um corretor entrará em contato.']);
