<?php
// Fungsi bantu bersama untuk semua endpoint di folder api/.
// Setiap endpoint cukup: require __DIR__ . "/bootstrap.php";

require __DIR__ . "/../db.php";

header("Content-Type: application/json; charset=utf-8");

// Nama sesi khusus supaya tidak bentrok dengan proyek PHP lain di localhost.
session_name("reloop_session");
ini_set("session.use_strict_mode", "1"); // tolak ID sesi karangan klien
session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "httponly" => true,
    "samesite" => "Lax",
    "secure" => !empty($_SERVER["HTTPS"]),
]);
// Sesi hanya dilanjutkan kalau browser sudah punya cookie sesi. Guest yang belum
// pernah login tidak dibuatkan sesi sama sekali (tidak ada cookie, tidak ada file sesi).
if (isset($_COOKIE[session_name()])) {
    session_start();
}

// Error tak terduga (mis. database mati) dibalas JSON generik, detailnya tidak bocor ke browser.
set_exception_handler(function (Throwable $e) {
    error_log("[reloop] " . $e->getMessage());
    json_out(["error" => "Terjadi kesalahan pada server"], 500);
});

function json_out($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_method(array $allowed): string {
    $method = $_SERVER["REQUEST_METHOD"];
    if (!in_array($method, $allowed, true)) {
        header("Allow: " . implode(", ", $allowed));
        json_out(["error" => "Metode tidak diizinkan"], 405);
    }
    return $method;
}

// Body wajib JSON. Syarat Content-Type: application/json juga jadi pengaman CSRF
// sederhana, karena form lintas situs tidak bisa mengirim tipe ini tanpa preflight CORS.
function read_json_body(): array {
    $type = $_SERVER["CONTENT_TYPE"] ?? "";
    if (stripos($type, "application/json") !== 0) {
        json_out(["error" => "Content-Type harus application/json"], 415);
    }
    $body = json_decode(file_get_contents("php://input"), true);
    if (!is_array($body)) {
        json_out(["error" => "Body JSON tidak valid"], 400);
    }
    return $body;
}

function login_session(int $userId): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    session_regenerate_id(true);
    $_SESSION["user_id"] = $userId;
}

function logout_session(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return;
    }
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $p = session_get_cookie_params();
        setcookie(session_name(), "", [
            "expires" => time() - 3600,
            "path" => $p["path"],
            "httponly" => true,
            "samesite" => "Lax",
            "secure" => $p["secure"],
        ]);
    }
    session_destroy();
}

// Mengembalikan id pengguna yang login, atau menjawab 401 (guest tidak punya akses).
function require_login(): int {
    if (empty($_SESSION["user_id"])) {
        json_out(["error" => "Silakan login terlebih dahulu"], 401);
    }
    return (int) $_SESSION["user_id"];
}
