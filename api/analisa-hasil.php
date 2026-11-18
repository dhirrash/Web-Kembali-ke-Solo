<?php
// GET ?kode=<16 hex>  -> data barang + daftar ide untuk hasil.html
require __DIR__ . "/bootstrap.php";
require_method(["GET"]);

$kode = $_GET["kode"] ?? "";
if (!preg_match('/^[a-f0-9]{16}$/', $kode)) json_out(["error" => "Kode tidak valid"], 400);

$pdo = getDb();
$stmt = $pdo->prepare("SELECT id, nama, kondisi, gambar FROM analisis WHERE kode = ?");
$stmt->execute([$kode]);
$a = $stmt->fetch();
if (!$a) json_out(["error" => "Hasil analisa tidak ditemukan"], 404);

$stmt = $pdo->prepare("SELECT urutan, nama, tipe, level, butuh, ringkasan FROM analisis_ide WHERE analisis_id = ? ORDER BY urutan");
$stmt->execute([$a["id"]]);
$ideas = array_map(function ($r) {
    return [
        "no"        => (int) $r["urutan"],
        "nama"      => $r["nama"],
        "tipe"      => $r["tipe"],
        "level"     => $r["level"],
        "butuh"     => json_decode($r["butuh"], true) ?: [],
        "ringkasan" => $r["ringkasan"],
    ];
}, $stmt->fetchAll());

json_out([
    "kode"    => $kode,
    "nama"    => $a["nama"],
    "kondisi" => (int) $a["kondisi"],
    "gambar"  => $a["gambar"],
    "ideas"   => $ideas,
]);
