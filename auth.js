// Fungsi bersama untuk semua halaman: panggilan API, status login, tombol Simpan,
// dan menu navigasi (Login / Profil / Logout).
// Pengunjung tanpa login = mode guest: semua halaman tetap bisa dipakai,
// hanya fitur daftar simpan yang butuh akun.

async function apiRequest(path, method = "GET", body = {}) {
    const options = { method, credentials: "same-origin", headers: {} };
    if (method !== "GET") {
        // Server mewajibkan JSON pada request yang mengubah data.
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }
    const response = await fetch("api/" + path, options);
    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        // respons bukan JSON: biarkan data null
    }
    return { ok: response.ok, status: response.status, data: data };
}

// Mengembalikan objek pengguna ({id, nama, email}) atau null kalau guest.
// Hasilnya di-cache supaya satu halaman hanya memanggil me.php sekali.
let currentUserPromise = null;
function getCurrentUser() {
    if (!currentUserPromise) {
        currentUserPromise = apiRequest("me.php")
            .then((res) => (res.ok && res.data && res.data.loggedIn ? res.data.user : null))
            .catch(() => null);
    }
    return currentUserPromise;
}

// Halaman tujuan setelah login, hanya nama file .html di folder yang sama
// (mencegah open redirect lewat parameter ?next=).
function halamanNextAman(next, fallback) {
    return /^[a-z0-9_-]+\.html$/i.test(next || "") ? next : fallback;
}

function keHalamanLogin() {
    const sekarang = location.pathname.split("/").pop() || "index.html";
    location.href = "akun.html?next=" + encodeURIComponent(sekarang);
}

// Set id item yang sudah disimpan pengguna (kosong untuk guest).
async function getSavedIds() {
    const user = await getCurrentUser();
    if (!user) return new Set();
    const res = await apiRequest("saved.php");
    if (!res.ok) return new Set();
    return new Set(res.data.items.map((item) => item.item_id));
}

function tandaiTersimpan(btn) {
    btn.textContent = "Tersimpan";
    btn.disabled = true;
}

// Memasang perilaku tombol "Simpan" pada sebuah tombol.
// Guest yang menekan tombol diarahkan ke halaman login.
function pasangTombolSimpan(btn, itemId, savedIds) {
    if (savedIds.has(itemId)) {
        tandaiTersimpan(btn);
        return;
    }
    btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const user = await getCurrentUser();
        if (!user) {
            keHalamanLogin();
            return;
        }
        btn.disabled = true;
        const res = await apiRequest("saved.php", "POST", { item_id: itemId });
        // 409 = sudah ada di daftar simpan, tetap dianggap berhasil.
        if (res.ok || res.status === 409) {
            tandaiTersimpan(btn);
        } else if (res.status === 401) {
            keHalamanLogin();
        } else {
            btn.disabled = false;
            alert((res.data && res.data.error) || "Gagal menyimpan");
        }
    });
}

async function renderNavAkun() {
    const nav = document.querySelector("header nav");
    if (!nav) return;
    const user = await getCurrentUser();

    if (user) {
        const profil = document.createElement("a");
        profil.href = "profil.html";
        profil.textContent = "Profil";
        nav.appendChild(profil);

        const logout = document.createElement("a");
        logout.href = "#";
        logout.textContent = "Logout";
        logout.title = "Masuk sebagai " + user.nama;
        logout.addEventListener("click", async (e) => {
            e.preventDefault();
            await apiRequest("logout.php", "POST");
            location.href = "index.html";
        });
        nav.appendChild(logout);
    } else {
        const login = document.createElement("a");
        login.href = "akun.html";
        login.textContent = "Login";
        nav.appendChild(login);
    }
}

document.addEventListener("DOMContentLoaded", renderNavAkun);
