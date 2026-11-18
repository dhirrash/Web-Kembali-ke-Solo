CREATE DATABASE IF NOT EXISTS reloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reloop;

-- PERINGATAN: file ini membuat ulang semua tabel. Meng-import ulang akan
-- menghapus akun (users) dan daftar simpan yang sudah ada.
DROP TABLE IF EXISTS analisis_ide;
DROP TABLE IF EXISTS analisis;
DROP TABLE IF EXISTS daftar_simpan;
DROP TABLE IF EXISTS user_barang;
DROP TABLE IF EXISTS item_langkah;
DROP TABLE IF EXISTS item_bahan;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;

CREATE TABLE items (
    id INT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    tipe VARCHAR(50) NOT NULL,
    gambar VARCHAR(255) DEFAULT NULL
);

CREATE TABLE item_bahan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    bahan VARCHAR(150) NOT NULL,
    urutan INT NOT NULL DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE item_langkah (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    langkah TEXT NOT NULL,
    urutan INT NOT NULL DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Akun pengguna. Mode guest = tidak punya baris di tabel ini (tanpa sesi login).
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inventaris barang milik pengguna (CRUD tambahan untuk demonstrasi database).
-- Data selalu dibatasi berdasarkan user_id pemiliknya.
CREATE TABLE user_barang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nama VARCHAR(120) NOT NULL,
    kondisi TINYINT UNSIGNED NOT NULL,
    deskripsi TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_barang_user_created (user_id, created_at),
    CONSTRAINT chk_user_barang_kondisi CHECK (kondisi BETWEEN 1 AND 10),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daftar simpan: relasi many-to-many antara users dan items.
-- Satu pengguna hanya bisa menyimpan satu item sekali (UNIQUE user_id + item_id).
-- sudah_dibuat: 0 = belum dibuat, 1 = sudah dibuat.
CREATE TABLE daftar_simpan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    sudah_dibuat TINYINT(1) NOT NULL DEFAULT 0,
    disimpan_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_item (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Analisa AI (hasil rekomendasi per upload).

CREATE TABLE analisis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode CHAR(16) NOT NULL UNIQUE,              -- ID publik acak untuk URL hasil (guest tanpa akun pun bisa buka)
    user_id INT DEFAULT NULL,                   -- NULL = dibuat oleh guest
    nama VARCHAR(120) NOT NULL,
    kondisi TINYINT UNSIGNED NOT NULL,
    deskripsi TEXT DEFAULT NULL,
    gambar VARCHAR(255) NOT NULL,
    ip_hash CHAR(64) NOT NULL,                  -- untuk pembatasan pemakaian; bukan IP asli
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analisis_ip_waktu (ip_hash, created_at),
    CONSTRAINT chk_analisis_kondisi CHECK (kondisi BETWEEN 1 AND 10),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE analisis_ide (
    id INT AUTO_INCREMENT PRIMARY KEY,
    analisis_id INT NOT NULL,
    urutan TINYINT UNSIGNED NOT NULL,           -- 1..6, dipakai di URL tutorial
    nama VARCHAR(150) NOT NULL,
    tipe ENUM('reuse','upcycle') NOT NULL,
    level ENUM('Mudah','Sedang','Sulit') NOT NULL,
    butuh TEXT NOT NULL,                        -- JSON array, ringkasan alat/bahan untuk kartu
    ringkasan TEXT NOT NULL,
    langkah TEXT DEFAULT NULL,                  -- JSON array; NULL sampai tutorial pertama kali dibuka
    bahan TEXT DEFAULT NULL,                    -- JSON array alat & bahan lengkap
    peringatan VARCHAR(255) DEFAULT NULL,
    UNIQUE KEY uq_analisis_urutan (analisis_id, urutan),
    FOREIGN KEY (analisis_id) REFERENCES analisis(id) ON DELETE CASCADE
);

INSERT INTO items (id, nama, tipe, gambar) VALUES
(7,  'Lampu Hias Sendok Plastik', 'Plastik', 'assets/lampu hias sendok plastik.jpg'),
(8,  'Pot Bunga Plastik',         'Plastik', 'assets/pot bunga plastik.jpg'),
(9,  'Tempat Pensil Kaleng',      'Logam',   'assets/tempat pensil kaleng.jpg'),
(10, 'Tas Kaus Bekas',            'Kain',    'assets/tas kaus bekas.jpg');

INSERT INTO item_bahan (item_id, bahan, urutan) VALUES
(7, 'Sendok plastik bekas (±40 buah)', 1),
(7, 'Botol plastik bekas', 2),
(7, 'Lem tembak', 3),
(7, 'Gunting / cutter', 4),
(7, 'Fitting lampu & kabel', 5),

(8, 'Botol plastik bekas', 1),
(8, 'Cutter / gunting', 2),
(8, 'Cat akrilik', 3),
(8, 'Tanah & tanaman kecil', 4),

(9, 'Kaleng bekas', 1),
(9, 'Amplas', 2),
(9, 'Cat / kertas kado', 3),
(9, 'Lem', 4),

(10, 'Kaus bekas', 1),
(10, 'Gunting', 2),
(10, 'Jarum & benang (atau mesin jahit)', 3),
(10, 'Penggaris & spidol kain', 4);

INSERT INTO item_langkah (item_id, langkah, urutan) VALUES
(7, 'Cuci dan keringkan semua sendok plastik.', 1),
(7, 'Potong bagian gagang sendok, sisakan bagian cekungnya.', 2),
(7, 'Potong botol plastik sebagai rangka lampu.', 3),
(7, 'Tempel sendok satu per satu dari bawah ke atas dengan lem tembak, bertumpuk seperti sisik.', 4),
(7, 'Pasang fitting lampu di bagian dalam rangka.', 5),
(7, 'Nyalakan lampu dan nikmati cahayanya.', 6),

(8, 'Bersihkan botol plastik dari label dan sisa isi.', 1),
(8, 'Potong botol pada ±1/3 bagian atas dengan cutter.', 2),
(8, 'Haluskan tepi potongan agar tidak tajam.', 3),
(8, 'Hias dengan cat akrilik sesuai selera, lalu keringkan.', 4),
(8, 'Isi dengan tanah dan tanam tanaman kecilmu.', 5),

(9, 'Cuci kaleng dan pastikan tepinya tidak tajam.', 1),
(9, 'Amplas permukaan kaleng agar cat menempel.', 2),
(9, 'Cat atau bungkus kaleng dengan kertas kado.', 3),
(9, 'Keringkan, lalu hias sesuai selera.', 4),
(9, 'Taruh pensil dan alat tulismu di dalamnya.', 5),

(10, 'Letakkan kaus di permukaan datar, lalu potong lengan dan bagian leher.', 1),
(10, 'Balik kaus, jahit bagian bawah hingga tertutup.', 2),
(10, 'Rapikan tepi bukaan leher sebagai bukaan tas.', 3),
(10, 'Balik kembali kaus ke sisi luar.', 4),
(10, 'Tas siap dipakai berbelanja.', 5);
