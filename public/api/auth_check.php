<?php
// api/auth_check.php — Verifica se sessão do corretor está ativa
require_once __DIR__ . '/config.php';
session_start();

if (!empty($_SESSION['corretor_id'])) {
    jsonResponse([
        'logado'  => true,
        'nome'    => $_SESSION['corretor_nome'],
        'email'   => $_SESSION['corretor_email'],
    ]);
} else {
    jsonResponse(['logado' => false], 401);
}
