<?php
// ============================================================
// api/login.php — Autenticação do corretor
// POST: email, senha
// ============================================================
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Método não suportado'], 405);
}

session_start();

$data  = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
$senha = $data['senha'] ?? '';

if (!$email || !$senha) {
    jsonResponse(['error' => 'Email e senha são obrigatórios'], 400);
}

$pdo  = getPDO();
$stmt = $pdo->prepare("SELECT id, nome, email, senha_hash FROM corretores WHERE email = ?");
$stmt->execute([$email]);
$corretor = $stmt->fetch();

if (!$corretor || !password_verify($senha, $corretor['senha_hash'])) {
    jsonResponse(['error' => 'Email ou senha incorretos'], 401);
}

$_SESSION['corretor_id']    = $corretor['id'];
$_SESSION['corretor_nome']  = $corretor['nome'];
$_SESSION['corretor_email'] = $corretor['email'];

jsonResponse([
    'success' => true,
    'corretor' => [
        'id'    => $corretor['id'],
        'nome'  => $corretor['nome'],
        'email' => $corretor['email'],
    ]
]);
