<?php
require __DIR__ . "/bootstrap.php";
require_method(["POST"]);
$body = read_json_body();

$nama = trim((string) ($body["nama"] ?? ""));
$email = strtolower(trim((string) ($body["email"] ?? "")));
$password = (string) ($body["password"] ?? "");

if ($nama === "" || mb_strlen($nama) > 100) {
    json_out(["error" => "Nama wajib diisi (maksimal 100 karakter)"], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
    json_out(["error" => "Format email tidak valid"], 400);
}
if (strlen($password) < 8) {
    json_out(["error" => "Password minimal 8 karakter"], 400);
}
// bcrypt hanya membaca 72 byte pertama, jadi batasi supaya tidak menyesatkan.
if (strlen($password) > 72) {
    json_out(["error" => "Password maksimal 72 karakter"], 400);
}

$pdo = getDb();

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_out(["error" => "Email sudah terdaftar"], 409);
}

try {
    $stmt = $pdo->prepare("INSERT INTO users (nama, email, password_hash) VALUES (?, ?, ?)");
    $stmt->execute([$nama, $email, password_hash($password, PASSWORD_DEFAULT)]);
} catch (PDOException $e) {
    // Dua pendaftaran email yang sama pada saat bersamaan: UNIQUE yang menang.
    if ($e->getCode() === "23000") {
        json_out(["error" => "Email sudah terdaftar"], 409);
    }
    throw $e;
}

$userId = (int) $pdo->lastInsertId();
login_session($userId);

json_out(["user" => ["id" => $userId, "nama" => $nama, "email" => $email]], 201);
