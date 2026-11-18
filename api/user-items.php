<?php
// CRUD inventaris barang pribadi.
// GET: daftar milik pengguna | POST: buat | PATCH: ubah | DELETE: hapus.
require __DIR__ . "/bootstrap.php";
$method = require_method(["GET", "POST", "PATCH", "DELETE"]);
$userId = require_login();
$pdo = getDb();

if ($method === "GET") {
    $stmt = $pdo->prepare("SELECT id, nama, kondisi, deskripsi, created_at, updated_at FROM user_barang WHERE user_id = ? ORDER BY created_at DESC, id DESC");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) { $row["id"] = (int)$row["id"]; $row["kondisi"] = (int)$row["kondisi"]; }
    unset($row);
    json_out(["items" => $rows]);
}

$body = read_json_body();
if ($method === "POST") {
    $nama = trim((string)($body["nama"] ?? ""));
    $kondisi = filter_var($body["kondisi"] ?? null, FILTER_VALIDATE_INT);
    $deskripsi = trim((string)($body["deskripsi"] ?? ""));
    if ($nama === "" || mb_strlen($nama) > 120) json_out(["error" => "Nama barang wajib diisi (maksimal 120 karakter)"], 400);
    if ($kondisi === false || $kondisi < 1 || $kondisi > 10) json_out(["error" => "Kondisi harus bernilai 1 sampai 10"], 400);
    $stmt = $pdo->prepare("INSERT INTO user_barang (user_id, nama, kondisi, deskripsi) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $nama, $kondisi, $deskripsi !== "" ? $deskripsi : null]);
    json_out(["id" => (int)$pdo->lastInsertId(), "nama" => $nama, "kondisi" => $kondisi], 201);
}

$id = filter_var($body["id"] ?? null, FILTER_VALIDATE_INT);
if ($id === false || $id <= 0) json_out(["error" => "id tidak valid"], 400);
$stmt = $pdo->prepare("SELECT id FROM user_barang WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $userId]);
if (!$stmt->fetch()) json_out(["error" => "Barang tidak ditemukan"], 404);

if ($method === "PATCH") {
    $allowed = ["nama", "kondisi", "deskripsi"];
    $sets = []; $values = [];
    foreach ($allowed as $field) {
        if (!array_key_exists($field, $body)) continue;
        if ($field === "nama") {
            $value = trim((string)$body[$field]);
            if ($value === "" || mb_strlen($value) > 120) json_out(["error" => "Nama barang wajib diisi (maksimal 120 karakter)"], 400);
        } elseif ($field === "kondisi") {
            $value = filter_var($body[$field], FILTER_VALIDATE_INT);
            if ($value === false || $value < 1 || $value > 10) json_out(["error" => "Kondisi harus bernilai 1 sampai 10"], 400);
        } else { $value = trim((string)$body[$field]); $value = $value === "" ? null : $value; }
        $sets[] = "$field = ?"; $values[] = $value;
    }
    if (!$sets) json_out(["error" => "Tidak ada kolom yang diperbarui"], 400);
    $values[] = $id; $values[] = $userId;
    $stmt = $pdo->prepare("UPDATE user_barang SET " . implode(", ", $sets) . " WHERE id = ? AND user_id = ?");
    $stmt->execute($values);
    json_out(["ok" => true, "id" => $id]);
}

$stmt = $pdo->prepare("DELETE FROM user_barang WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $userId]);
json_out(["ok" => true, "id" => $id]);
