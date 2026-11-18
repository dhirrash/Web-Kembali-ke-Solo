<?php
// Sesuaikan dengan konfigurasi MySQL kamu (XAMPP default: root tanpa password)
$DB_HOST = "localhost";
$DB_NAME = "reloop";
$DB_USER = "root";
$DB_PASS = "";

function getDb() {
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    return new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
}
