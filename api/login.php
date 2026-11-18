<?php
require __DIR__ . "/bootstrap.php";
require_method(["POST"]);
$body = read_json_body();

$email = strtolower(trim((string) ($body["email"] ?? "")));
$password = (string) ($body["password"] ?? "");

if ($email === "" || $password === "") {
    json_out(["error" => "Email dan password wajib diisi"], 400);
}

$pdo = getDb();
$stmt = $pdo->prepare("SELECT id, nama, email, password_hash FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

// Selalu menjalankan password_verify (walau email tidak ada) supaya waktu respons
// tidak membocorkan email mana yang terdaftar.
$hash = $user["password_hash"] ?? password_hash("dummy-password", PASSWORD_DEFAULT);
$cocok = password_verify($password, $hash);

if (!$user || !$cocok) {
    json_out(["error" => "Email atau password salah"], 401);
}

login_session((int) $user["id"]);
json_out(["user" => ["id" => (int) $user["id"], "nama" => $user["nama"], "email" => $user["email"]]]);
