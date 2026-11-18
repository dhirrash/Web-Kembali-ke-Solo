const list = document.getElementById("simpan-list");
const statusEl = document.getElementById("simpan-status");

function tampilkanStatus(teks) {
    statusEl.hidden = !teks;
    statusEl.textContent = teks;
}

function buatBaris(item) {
    const li = document.createElement("li");
    li.className = "simpan-item" + (item.sudah_dibuat ? " selesai" : "");

    if (item.gambar) {
        const img = document.createElement("img");
        img.className = "simpan-thumb";
        img.src = item.gambar;
        img.alt = item.nama;
        li.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "simpan-info";

    const judul = document.createElement("h4");
    judul.textContent = item.nama;
    info.appendChild(judul);

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = item.tipe;
    info.appendChild(badge);

    const lihat = document.createElement("button");
    lihat.type = "button";
    lihat.className = "btn-small";
    lihat.textContent = "Lihat tutorial";
    lihat.addEventListener("click", () => {
        localStorage.setItem("itemAktifId", item.item_id);
        location.href = "tutorial.html";
    });
    info.appendChild(lihat);
    li.appendChild(info);

    const aksi = document.createElement("div");
    aksi.className = "simpan-aksi";

    // UPDATE: tandai sudah dibuat / belum
    const label = document.createElement("label");
    const cek = document.createElement("input");
    cek.type = "checkbox";
    cek.checked = item.sudah_dibuat;
    label.appendChild(cek);
    label.appendChild(document.createTextNode(" Sudah dibuat"));
    cek.addEventListener("change", async () => {
        const nilaiBaru = cek.checked;
        cek.disabled = true;
        const res = await apiRequest("saved.php", "PATCH", {
            item_id: item.item_id,
            sudah_dibuat: nilaiBaru,
        });
        cek.disabled = false;
        if (res.ok) {
            li.classList.toggle("selesai", nilaiBaru);
        } else {
            cek.checked = !nilaiBaru;
            alert((res.data && res.data.error) || "Gagal memperbarui");
        }
    });
    aksi.appendChild(label);

    // DELETE: hapus dari daftar simpan
    const hapus = document.createElement("button");
    hapus.type = "button";
    hapus.className = "btn-small btn-hapus";
    hapus.textContent = "Hapus";
    hapus.addEventListener("click", async () => {
        if (!confirm('Hapus "' + item.nama + '" dari daftar simpan?')) return;
        hapus.disabled = true;
        const res = await apiRequest("saved.php", "DELETE", { item_id: item.item_id });
        // 404 = sudah tidak ada (mis. dihapus dari tab lain), tampilan tetap dirapikan.
        if (res.ok || res.status === 404) {
            li.remove();
            if (!list.children.length) tampilkanStatus("Daftar simpan masih kosong. Jelajahi ide di Explore lalu simpan.");
        } else {
            hapus.disabled = false;
            alert((res.data && res.data.error) || "Gagal menghapus");
        }
    });
    aksi.appendChild(hapus);

    li.appendChild(aksi);
    return li;
}

async function muat() {
    const user = await getCurrentUser();
    if (!user) {
        statusEl.hidden = false;
        statusEl.textContent = "Daftar simpan hanya tersedia untuk akun. ";
        const link = document.createElement("a");
        link.href = "akun.html?next=simpan.html";
        link.textContent = "Login atau daftar";
        statusEl.appendChild(link);
        return;
    }

    const res = await apiRequest("saved.php");
    if (!res.ok) {
        tampilkanStatus("Gagal memuat daftar simpan.");
        return;
    }
    if (!res.data.items.length) {
        tampilkanStatus("Daftar simpan masih kosong. Jelajahi ide di Explore lalu simpan.");
        return;
    }
    tampilkanStatus("");
    res.data.items.forEach((item) => list.appendChild(buatBaris(item)));
}

muat();
