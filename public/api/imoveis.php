<?php
// ============================================================
// api/imoveis.php
// GET  ?id=X         → imóvel individual com fotos
// GET  (sem id)      → lista com filtros: tipo, status, quartos, preco_max, busca
// POST (protegido)   → cria novo imóvel
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ---------- GET ----------
if ($method === 'GET') {
    $pdo = getPDO();

    // Imóvel individual
    if (!empty($_GET['id'])) {
        $id   = (int) $_GET['id'];
        $stmt = $pdo->prepare("SELECT * FROM imoveis WHERE id = ? AND ativo = 1");
        $stmt->execute([$id]);
        $imovel = $stmt->fetch();

        if (!$imovel) {
            jsonResponse(['error' => 'Imóvel não encontrado'], 404);
        }

        $stmt2 = $pdo->prepare("SELECT caminho FROM imovel_fotos WHERE imovel_id = ? ORDER BY ordem ASC");
        $stmt2->execute([$id]);
        $imovel['fotos'] = array_column($stmt2->fetchAll(), 'caminho');

        jsonResponse($imovel);
    }

    // Lista com filtros
    $where  = ['i.ativo = 1'];
    $params = [];

    if (!empty($_GET['tipo'])) {
        $where[] = 'i.tipo = ?';
        $params[] = $_GET['tipo'];
    }
    if (!empty($_GET['status'])) {
        $where[] = 'i.status = ?';
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['quartos'])) {
        $where[] = 'i.quartos >= ?';
        $params[] = (int) $_GET['quartos'];
    }
    if (!empty($_GET['preco_max'])) {
        $where[] = 'i.preco <= ?';
        $params[] = (float) $_GET['preco_max'];
    }
    if (!empty($_GET['busca'])) {
        $where[] = '(i.titulo LIKE ? OR i.bairro LIKE ? OR i.cidade LIKE ?)';
        $term = '%' . $_GET['busca'] . '%';
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }
    if (!empty($_GET['destaque'])) {
        $where[] = 'i.destaque = 1';
    }

    $whereSQL = 'WHERE ' . implode(' AND ', $where);
    $sql = "
        SELECT i.*,
               (SELECT caminho FROM imovel_fotos f WHERE f.imovel_id = i.id ORDER BY f.ordem LIMIT 1) AS foto_capa
        FROM imoveis i
        $whereSQL
        ORDER BY i.destaque DESC, i.criado_em DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());
}

// ---------- POST (criar imóvel) ----------
if ($method === 'POST') {
    requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['titulo']) || empty($data['preco'])) {
        jsonResponse(['error' => 'Título e preço são obrigatórios'], 400);
    }

    $pdo  = getPDO();
    $stmt = $pdo->prepare("
        INSERT INTO imoveis
          (titulo, descricao, preco, endereco, bairro, cidade, area, quartos, banheiros, vagas, tipo, status, destaque, corretor_id)
        VALUES
          (:titulo, :descricao, :preco, :endereco, :bairro, :cidade, :area, :quartos, :banheiros, :vagas, :tipo, :status, :destaque, :corretor_id)
    ");
    $stmt->execute([
        ':titulo'       => $data['titulo'],
        ':descricao'    => $data['descricao']  ?? '',
        ':preco'        => $data['preco'],
        ':endereco'     => $data['endereco']   ?? '',
        ':bairro'       => $data['bairro']     ?? '',
        ':cidade'       => $data['cidade']     ?? '',
        ':area'         => $data['area']       ?? null,
        ':quartos'      => $data['quartos']    ?? null,
        ':banheiros'    => $data['banheiros']  ?? null,
        ':vagas'        => $data['vagas']      ?? null,
        ':tipo'         => $data['tipo']       ?? 'casa',
        ':status'       => $data['status']     ?? 'venda',
        ':destaque'     => (int)($data['destaque'] ?? 0),
        ':corretor_id'  => $_SESSION['corretor_id'],
    ]);

    $novoId = (int) $pdo->lastInsertId();

    // Associar fotos já enviadas
    if (!empty($data['fotos']) && is_array($data['fotos'])) {
        $ins = $pdo->prepare("INSERT INTO imovel_fotos (imovel_id, caminho, ordem) VALUES (?, ?, ?)");
        foreach ($data['fotos'] as $ordem => $caminho) {
            $ins->execute([$novoId, $caminho, $ordem]);
        }
    }

    jsonResponse(['success' => true, 'id' => $novoId], 201);
}

jsonResponse(['error' => 'Método não suportado'], 405);
