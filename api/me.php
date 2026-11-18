<?php
// Status login. loggedIn: false berarti pengunjung berada di mode guest.
require __DIR__ . "/bootstrap.php";
require_method(["GET"]);

if (empty($_SESSION["user_id"])) {
    json_out(["loggedIn" => false, "user" => null]);
}

$stmt = getDb()->prepare("SELECT id, nama, email FROM users WHERE id = ?");
$stmt->execute([(int) $_SESSION["user_id"]]);
$user = $stmt->fetch();

// Akun sudah terhapus tetapi sesinya masih ada: perlakukan sebagai guest.
if (!$user) {
    logout_session();
    json_out(["loggedIn" => false, "user" => null]);
}

json_out([
    "loggedIn" => true,
    "user" => ["id" => (int) $user["id"], "nama" => $user["nama"], "email" => $user["email"]],
]);
