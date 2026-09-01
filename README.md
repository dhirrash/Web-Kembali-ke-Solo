# Web-Kembali-ke-Solo

# RE:LOOP

Web app berbasis AI yang membantu pengguna memaksimalkan kegunaan barang bekas melalui rekomendasi **reuse** dan **upcycle** untuk mendukung program **SDG 12.5**.

## 🌱 Latar Belakang

**Masalah:** Banyak barang bekas dibuang begitu saja padahal masih bisa dimanfaatkan kembali (*reuse*) atau diubah jadi barang baru (*upcycle*). Kebanyakan orang tidak tahu barang bekas yang mereka miliki sebenarnya bisa "jadi apa".

**Solusi:** Pengguna cukup memberi tahu barang apa yang mereka miliki (foto + nama + kondisi), lalu AI menganalisis dan memberi rekomendasi arah pemanfaatan terbaik — lengkap dengan contoh ide. Tersedia juga jalur sebaliknya: menjelajahi ide/tutorial berdasarkan **produk** yang ingin dibuat.

**Prinsip desain:**
- Tidak perlu login — siapa pun bisa langsung pakai.
- Struktur database mengikuti fitur & alur yang benar-benar dipakai, bukan dirancang menampung segala kemungkinan sejak awal.
- AI dipakai sebagai *layanan* (Gemini API), bukan dibangun/dilatih sendiri.
- Hasil analisis AI disimpan sebagai riwayat/cache bersama, bukan data pribadi user.

---

## 🎯 Kaitan dengan SDG 12.5

> **SDG 12.5:** *"By 2030, substantially reduce waste generation through prevention, reduction, recycling and reuse."*

| Target SDG | Implementasi di aplikasi |
|---|---|
| Prevention & reduction | Barang yang tadinya akan dibuang, dicegah menjadi sampah lewat rekomendasi reuse |
| Reuse | Barang dipakai ulang sesuai/mendekati fungsi awalnya |
| Recycling | Barang yang sudah tidak bisa diselamatkan tetap diarahkan ke jalur daur ulang yang benar |

---

## ✨ Fitur Utama

| # | Fitur | Deskripsi |
|---|---|---|
| 1 | **Analisis barang via AI** | Upload foto, isi nama barang & kondisi (1–10). Gemini Vision + LLM mengidentifikasi jenis barang & material, lalu memberi rekomendasi. |
| 2 | **Rekomendasi berlapis** | Ditampilkan opsi di ketiga kategori (reuse/upcycle/recycle) sekaligus, beserta tingkat kesulitan & bahan tambahan yang dibutuhkan. |
| 3 | **Jelajah dari produk (Hub)** | Jalur sebaliknya — cari "mau bikin apa" dan lihat tutorial lengkap tanpa harus punya barang spesifik di tangan. |
| 4 | **Riwayat publik / cache** | Setiap hasil analisis tersimpan sebagai riwayat bersama sekaligus cache, agar kombinasi barang yang sama tidak perlu berulang kali memanggil API AI. |

---

## 🔄 Alur Pengguna

Ada dua pintu masuk yang bermuara ke sumber data yang sama:

1. **"Saya punya barang, bisa jadi apa?"**
   Upload foto + nama barang + kondisi → cek cache di `analysis_log` → jika belum ada, panggil Gemini API → gabungkan hasil AI dengan aturan kondisi → simpan ke `analysis_log` & `recommendations` → tampilkan hasil.

2. **"Saya mau membuat sesuatu"**
   Cari/telusuri nama atau kategori produk → query tabel `articles` → tampilkan daftar tutorial → halaman detail (bahan, alat, langkah pembuatan).

> Mekanisme **cache**: jika sebelumnya sudah ada yang menganalisis kombinasi bahan + kondisi yang sama, hasilnya langsung dipakai ulang tanpa memanggil API AI dari nol — menghemat kuota/biaya API sekaligus mempercepat aplikasi.

---

## 🧠 Logika Rekomendasi

Kondisi 1–10 dipakai sebagai **panduan awal**, bukan aturan mutlak — keputusan akhir tetap mempertimbangkan jenis material dari hasil analisis AI.

| Kondisi | Kecenderungan arah | Alasan |
|---|---|---|
| 8–10 | Reuse diutamakan | Barang masih sangat layak pakai mendekati fungsi aslinya |
| 4–7 | Upcycle diutamakan | Tidak lagi ideal untuk fungsi awal, tapi bentuknya masih bisa diubah jadi sesuatu yang baru |
| 1–3 | Recycle diutamakan | Rusak berat, lebih realistis diproses ulang jadi bahan baku |

**Pengecualian:** material tertentu (kaca pecah, elektronik dengan baterai, dsb.) tetap diarahkan ke *recycle*/penanganan khusus meskipun skor kondisinya tinggi, demi aspek keamanan.

---

## 🛠 Tech Stack

| Komponen | Teknologi | Peran |
|---|---|---|
| Frontend | HTML/CSS + Blade | Form upload, halaman hasil, halaman jelajah produk |
| Backend | Laravel (PHP) | Menerima input, cek cache, panggil Gemini API, simpan & tampilkan hasil |
| AI Service | Gemini API (Vision + LLM) | Identifikasi barang dari foto + rekomendasi reuse/upcycle/recycle |
| Database | MySQL | Menyimpan `categories_bahan`, `categories_produk`, `analysis_log`, `recommendations`, `articles` |
| Environment | Localhost/laptop | Lingkungan pengembangan |

---

## 🏗 Arsitektur Sistem

```
                 WEB APP
                    │
              ┌─────▼─────┐
              │  Laravel  │
              │  (Blade)  │
              └─────┬─────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      ┌────────┐        ┌────────────┐
      │ MySQL  │        │ Gemini API │
      │(cache/ │        │(Vision+LLM)│
      │history)│        └─────┬──────┘
      └────────┘              │
                          Analisis Barang
                          + Rekomendasi
```

---

## 🗄 Struktur Database

5 tabel inti — sengaja dijaga tetap ramping mengikuti prinsip "struktur mengikuti kebutuhan nyata":

- **`categories_bahan`** — daftar jenis bahan/material (plastik PET, kain, kayu, kertas, kaca, logam, dst).
- **`categories_produk`** — daftar kategori produk hasil akhir (dekorasi rumah, aksesoris, wadah, mainan, dst).
- **`analysis_log`** — riwayat setiap analisis barang; bukan data pribadi (tanpa kolom user), sekaligus berfungsi sebagai cache. Menyimpan `rekomendasi_dominan`.
- **`recommendations`** — ide-ide konkret hasil AI untuk satu entri `analysis_log`, dengan `tipe` berisi `reuse`/`upcycle`/`recycle` (relasi satu-ke-banyak).
- **`articles`** — konten tutorial untuk jalur "jelajah dari produk", bisa diisi manual (kurasi) atau otomatis dari hasil AI (kolom `sumber` menandai asalnya). Titik pertemuan jalur bahan (`bahan_id`) dan produk (`produk_id`).

> Laravel secara default menambahkan kolom `created_at` dan `updated_at` di setiap tabel, jadi tidak perlu ditulis manual di migration.

Diagram ER lengkap tersedia di dokumen konsep proyek.

---

## 🚀 Instalasi & Menjalankan Proyek

```bash
# 1. Clone repository
git clone <url-repo-anda>
cd gunaulang

# 2. Install dependency PHP
composer install

# 3. Salin file environment & generate app key
cp .env.example .env
php artisan key:generate

# 4. Atur koneksi database & API key Gemini di .env
DB_DATABASE=gunaulang
DB_USERNAME=root
DB_PASSWORD=
GEMINI_API_KEY=isi_api_key_anda

# 5. Jalankan migration (dan seeder jika ada data awal articles)
php artisan migrate --seed

# 6. Jalankan server lokal
php artisan serve
```

Aplikasi dapat diakses di `http://127.0.0.1:8000`.

---

## 📋 Ruang Lingkup (Scope)

### ✅ Wajib ada (MVP)
- [ ] Form upload foto + nama barang + kondisi (1–10)
- [ ] Integrasi Gemini API untuk identifikasi & rekomendasi
- [ ] Penyimpanan hasil ke `analysis_log` & `recommendations`
- [ ] Tampilan hasil rekomendasi (reuse/upcycle/recycle + ide)
- [ ] Jalur jelajah dari produk (`articles`), minimal beberapa entri kurasi manual

### 🔜 Bisa menyusul kalau waktu memungkinkan
- [ ] Mekanisme cache yang lebih pintar (mencocokkan kombinasi bahan+kondisi yang mirip)
- [ ] Pencocokan otomatis hasil AI bagus → "naik kelas" jadi entri `articles`
- [ ] Statistik ringkas di landing page (mis. "sudah X barang dianalisis")

---

## ⚠️ Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| API Gemini gagal/kuota habis saat demo | Siapkan pesan error yang jelas + beberapa data `analysis_log` contoh sebagai fallback demo |
| AI menjawab di luar kategori `categories_bahan` | Batasi prompt AI agar menjawab hanya dari daftar kategori yang dikirim, bukan teks bebas |
| Rekomendasi AI kurang relevan/aneh | Sertakan tingkat kesulitan & deskripsi jelas, uji dengan beberapa contoh barang umum sebelum demo |
| Ukuran foto besar memperlambat upload | Kompres/resize gambar di sisi frontend sebelum dikirim ke server |

---

## 👥 Kontributor

| Nama | Peran |
|---|---|
| — | — |

---

## 📄 Lisensi

