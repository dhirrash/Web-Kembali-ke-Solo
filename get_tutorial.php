<?php
header("Content-Type: application/json; charset=utf-8");
require __DIR__ . "/db.php";

$id = isset($_GET["id"]) ? (int) $_GET["id"] : 0;
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "ID tidak valid"]);
    exit;
}

try {
    $pdo = getDb();

    $stmt = $pdo->prepare("SELECT id, nama, tipe, gambar FROM items WHERE id = ?");
    $stmt->execute([$id]);
    $item = $stmt->fetch();

    if (!$item) {
        http_response_code(404);
        echo json_encode(["error" => "Barang tidak ditemukan"]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT bahan FROM item_bahan WHERE item_id = ? ORDER BY urutan");
    $stmt->execute([$id]);
    $item["alatBahan"] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $stmt = $pdo->prepare("SELECT langkah FROM item_langkah WHERE item_id = ? ORDER BY urutan");
    $stmt->execute([$id]);
    $item["langkah"] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode($item, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Gagal terhubung ke database"]);
}
