<?php
// Pembungkus pemanggilan Gemini (REST) dengan structured output (JSON sesuai schema).
// Dipakai oleh analisa.php dan analisa-ide.php. Butuh ekstensi curl.

if (file_exists(__DIR__ . "/config.local.php")) {
    require_once __DIR__ . "/config.local.php";
}
if (!defined("GEMINI_API_KEY")) define("GEMINI_API_KEY", getenv("GEMINI_API_KEY") ?: "");
if (!defined("GEMINI_MODEL"))   define("GEMINI_MODEL", getenv("GEMINI_MODEL") ?: "gemini-3.6-flash");

/**
 * @param array  $parts       isi pesan user: [["text"=>...], ["inline_data"=>[...]]]
 * @param array  $schema      responseSchema (format OpenAPI-subset milik Gemini)
 * @param string $system      system prompt
 * @return array              JSON hasil, sudah di-decode
 * @throws RuntimeException   pesan aman untuk ditampilkan ke user
 */
function gemini_generate(array $parts, array $schema, string $system, float $temperature = 0.8): array {
    if (GEMINI_API_KEY === "") {
        error_log("[reloop] GEMINI_API_KEY belum diisi");
        throw new RuntimeException("Layanan AI belum dikonfigurasi");
    }

    $body = [
        "systemInstruction" => ["parts" => [["text" => $system]]],
        "contents" => [["role" => "user", "parts" => $parts]],
        "generationConfig" => [
            "temperature" => $temperature,
            "responseMimeType" => "application/json",
            "responseSchema" => $schema,
        ],
    ];

    $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/" . GEMINI_MODEL . ":generateContent");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 75,
        CURLOPT_HTTPHEADER => ["Content-Type: application/json", "x-goog-api-key: " . GEMINI_API_KEY],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($res === false) {
        error_log("[reloop] Gemini curl: $err");
        throw new RuntimeException("Gagal menghubungi layanan AI, coba lagi");
    }
    if ($code === 429) throw new RuntimeException("Layanan AI sedang penuh, coba lagi sebentar lagi");
    if ($code >= 400) {
        error_log("[reloop] Gemini HTTP $code: $res"); // detail hanya di log server
        throw new RuntimeException("Layanan AI sedang bermasalah");
    }

    $data = json_decode($res, true);
    if (!empty($data["promptFeedback"]["blockReason"])) {
        throw new RuntimeException("Gambar atau deskripsi tidak dapat diproses");
    }
    $text = "";
    foreach ($data["candidates"][0]["content"]["parts"] ?? [] as $p) {
        if (empty($p["thought"])) $text .= $p["text"] ?? "";
    }
    $json = json_decode($text, true);
    if (!is_array($json)) {
        error_log("[reloop] Output Gemini bukan JSON: " . substr($res, 0, 2000));
        throw new RuntimeException("Respons AI tidak valid, coba lagi");
    }
    return $json;
}
