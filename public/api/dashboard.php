<?php
// ============================================================
// api/dashboard.php — Dados para o painel do corretor (protegido)
// GET ?aba=leads    → lista de clientes + imóveis que viram
// GET ?aba=imoveis  → todos os imóveis cadastrados
// GET ?aba=stats    → totais rápidos
// ============================================================
require_once __DIR__ . '/config.php';
requireAuth();

$pdo = getPDO();
$aba = $_GET['aba'] ?? 'stats';

// ---- Stats ----
if ($aba === 'stats') {
    $stats = [];

    $stats['total_imoveis']  = (int) $pdo->query("SELECT COUNT(*) FROM imoveis WHERE ativo=1")->fetchColumn();
    $stats['total_leads']    = (int) $pdo->query("SELECT COUNT(*) FROM clientes")->fetchColumn();
    $stats['imoveis_venda']  = (int) $pdo->query("SELECT COUNT(*) FROM imoveis WHERE ativo=1 AND status='venda'")->fetchColumn();
    $stats['imoveis_aluguel']= (int) $pdo->query("SELECT COUNT(*) FROM imoveis WHERE ativo=1 AND status='aluguel'")->fetchColumn();
    $stats['leads_hoje']     = (int) $pdo->query("SELECT COUNT(*) FROM clientes WHERE DATE(criado_em)=CURDATE()")->fetchColumn();

    jsonResponse($stats);
}

// ---- Leads ----
if ($aba === 'leads') {
    $stmt = $pdo->query("SELECT * FROM clientes ORDER BY criado_em DESC");
    $leads = $stmt->fetchAll();

    // Para cada lead, busca títulos dos imóveis visitados
    foreach ($leads as &$lead) {
        $vistos = json_decode($lead['imoveis_vistos'] ?? '[]', true);
        $lead['imoveis_vistos_parsed'] = $vistos;
        $lead['imoveis_detalhes'] = [];

        if (!empty($vistos)) {
            $placeholders = implode(',', array_fill(0, count($vistos), '?'));
            $q = $pdo->prepare("SELECT id, titulo, bairro, preco FROM imoveis WHERE id IN ($placeholders)");
            $q->execute($vistos);
            $lead['imoveis_detalhes'] = $q->fetchAll();
        }
    }
    unset($lead);

    jsonResponse($leads);
}

// ---- Imóveis ----
if ($aba === 'imoveis') {
    $stmt = $pdo->query("
        SELECT i.*,
               (SELECT caminho FROM imovel_fotos f WHERE f.imovel_id = i.id ORDER BY f.ordem LIMIT 1) AS foto_capa,
               (SELECT COUNT(*) FROM imovel_fotos f WHERE f.imovel_id = i.id) AS total_fotos
        FROM imoveis i
        ORDER BY i.criado_em DESC
    ");
    jsonResponse($stmt->fetchAll());
}

jsonResponse(['error' => 'Aba inválida'], 400);
