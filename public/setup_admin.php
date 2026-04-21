<?php
// ============================================================
// setup_admin.php - Rode UMA VEZ para criar/atualizar o admin
// Acesse: https://imobidemo.duckdns.org/setup_admin.php
// APAGUE este arquivo após usar!
// ============================================================

$host   = 'localhost';
$dbname = 'imobidemo';
$user   = 'imobiuser';   // ajuste se necessário
$pass   = 'SuaSenhaAqui'; // ajuste para a sua senha do MySQL

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $senha   = 'demo1234';
    $hash    = password_hash($senha, PASSWORD_BCRYPT);
    $nome    = 'Admin Demo';
    $email   = 'admin@imobidemo.com';

    // Upsert
    $stmt = $pdo->prepare("
        INSERT INTO corretores (nome, email, senha_hash)
        VALUES (:nome, :email, :hash)
        ON DUPLICATE KEY UPDATE senha_hash = :hash2, nome = :nome2
    ");
    $stmt->execute([
        ':nome'  => $nome,
        ':email' => $email,
        ':hash'  => $hash,
        ':hash2' => $hash,
        ':nome2' => $nome,
    ]);

    echo "<h2 style='font-family:sans-serif;color:green'>✔ Admin criado com sucesso!</h2>";
    echo "<p style='font-family:sans-serif'><strong>Email:</strong> $email<br><strong>Senha:</strong> $senha</p>";
    echo "<p style='font-family:sans-serif;color:red'><strong>APAGUE este arquivo agora:</strong> rm /var/www/html/setup_admin.php</p>";

} catch (PDOException $e) {
    echo "<h2 style='font-family:sans-serif;color:red'>Erro: " . htmlspecialchars($e->getMessage()) . "</h2>";
}
