<?php
// CRUD daftar simpan. Semua operasi dibatasi ke pengguna yang sedang login.
//   GET    -> lihat daftar simpan
//   POST   -> simpan item            {"item_id": 7}
//   PATCH  -> tandai sudah dibuat    {"item_id": 7, "sudah_dibuat": true}
//   DELETE -> hapus dari daftar      {"item_id": 7}
require __DIR__ . "/bootstrap.php";

$method = require_method(["GET", "POST", "PATCH", "DELETE"]);
$userId = require_login();
$pdo = getDb();

if ($method === "GET") {
    $stmt = $pdo->prepare(
        "SELECT ds.item_id, ds.sudah_dibuat, ds.disimpan_pada, i.nama, i.tipe, i.gambar
         FROM daftar_simpan ds
         JOIN items i ON i.id = ds.item_id
         WHERE ds.user_id = ?
         ORDER BY ds.disimpan_pada DESC, ds.id DESC"
    );
    $stmt->execute([$userId]);
    $items = array_map(function ($row) {
        $row["item_id"] = (int) $row["item_id"];
        $row["sudah_dibuat"] = (bool) $row["sudah_dibuat"];
        return $row;
    }, $stmt->fetchAll());
    json_out(["items" => $items]);
}

$body = read_json_body();
$itemId = filter_var($body["item_id"] ?? null, FILTER_VALIDATE_INT);
if ($itemId === false || $itemId <= 0) {
    json_out(["error" => "item_id tidak valid"], 400);
}

if ($method === "POST") {
    $stmt = $pdo->prepare("SELECT id FROM items WHERE id = ?");
    $stmt->execute([$itemId]);
    if (!$stmt->fetch()) {
        json_out(["error" => "Barang tidak ditemukan"], 404);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO daftar_simpan (user_id, item_id) VALUES (?, ?)");
        $stmt->execute([$userId, $itemId]);
    } catch (PDOException $e) {
        // UNIQUE (user_id, item_id) -> sudah pernah disimpan.
        if ($e->getCode() === "23000") {
            json_out(["error" => "Sudah ada di daftar simpan"], 409);
        }
        throw $e;
    }
    json_out(["item_id" => $itemId, "sudah_dibuat" => false], 201);
}

if ($method === "PATCH") {
    if (!array_key_exists("sudah_dibuat", $body) || !is_bool($body["sudah_dibuat"])) {
        json_out(["error" => "sudah_dibuat harus true atau false"], 400);
    }
    $sudahDibuat = $body["sudah_dibuat"] ? 1 : 0;

    // Cek keberadaan dulu: MySQL melaporkan 0 baris terubah kalau nilainya sama,
    // jadi rowCount() tidak bisa dipakai untuk membedakan "tidak ada" dan "tidak berubah".
    $stmt = $pdo->prepare("SELECT id FROM daftar_simpan WHERE user_id = ? AND item_id = ?");
    $stmt->execute([$userId, $itemId]);
    if (!$stmt->fetch()) {
        json_out(["error" => "Item tidak ada di daftar simpan"], 404);
    }

    $stmt = $pdo->prepare("UPDATE daftar_simpan SET sudah_dibuat = ? WHERE user_id = ? AND item_id = ?");
    $stmt->execute([$sudahDibuat, $userId, $itemId]);
    json_out(["item_id" => $itemId, "sudah_dibuat" => (bool) $sudahDibuat]);
}

// DELETE
$stmt = $pdo->prepare("DELETE FROM daftar_simpan WHERE user_id = ? AND item_id = ?");
$stmt->execute([$userId, $itemId]);
if ($stmt->rowCount() === 0) {
    json_out(["error" => "Item tidak ada di daftar simpan"], 404);
}
json_out(["ok" => true]);
