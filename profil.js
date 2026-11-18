const namaEl = document.getElementById("profil-nama");
const emailEl = document.getElementById("profil-email");
const barangList = document.getElementById("barang-list");
const barangStatus = document.getElementById("barang-status");
const simpanList = document.getElementById("simpan-list");
const simpanStatus = document.getElementById("simpan-status");

function setStatus(element, message) {
    element.hidden = !message;
    element.textContent = message;
}

function buatTombol(teks, kelas, aksi) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn-small" + (kelas ? " " + kelas : "");
    button.textContent = teks;
    button.addEventListener("click", aksi);
    return button;
}

function buatItemBarang(item) {
    const li = document.createElement("li");
    li.className = "simpan-item profil-item";

    const info = document.createElement("div");
    info.className = "simpan-info";
    const title = document.createElement("h4");
    title.textContent = item.nama;
    const kondisi = document.createElement("span");
    kondisi.className = "badge";
    kondisi.textContent = "Kondisi " + item.kondisi + "/10";
    info.append(title, kondisi);
    if (item.deskripsi) {
        const deskripsi = document.createElement("p");
        deskripsi.className = "profil-deskripsi";
        deskripsi.textContent = item.deskripsi;
        info.appendChild(deskripsi);
    }

    const actions = document.createElement("div");
    actions.className = "simpan-aksi profil-actions";
    const edit = buatTombol("Edit", "", () => tampilkanFormEdit(li, item));
    const hapus = buatTombol("Hapus", "btn-hapus", async () => {
        if (!confirm('Hapus barang "' + item.nama + '" dari inventaris?')) return;
        hapus.disabled = true;
        const res = await apiRequest("user-items.php", "DELETE", { id: item.id });
        if (res.ok) {
            li.remove();
            if (!barangList.children.length) setStatus(barangStatus, "Belum ada barang di inventaris. Tambahkan barang melalui halaman Create.");
        } else {
            hapus.disabled = false;
            alert((res.data && res.data.error) || "Gagal menghapus barang.");
        }
    });
    actions.append(edit, hapus);
    li.append(info, actions);
    return li;
}

function tampilkanFormEdit(li, item) {
    if (li.querySelector(".profil-edit-form")) return;
    const form = document.createElement("form");
    form.className = "profil-edit-form";

    const namaLabel = document.createElement("label");
    namaLabel.textContent = "Nama barang";
    const namaInput = document.createElement("input");
    namaInput.type = "text";
    namaInput.maxLength = 120;
    namaInput.required = true;
    namaInput.value = item.nama;
    namaLabel.appendChild(namaInput);

    const kondisiLabel = document.createElement("label");
    kondisiLabel.textContent = "Kondisi (1–10)";
    const kondisiInput = document.createElement("input");
    kondisiInput.type = "number";
    kondisiInput.min = 1;
    kondisiInput.max = 10;
    kondisiInput.step = 1;
    kondisiInput.required = true;
    kondisiInput.value = item.kondisi;
    kondisiLabel.appendChild(kondisiInput);

    const deskLabel = document.createElement("label");
    deskLabel.textContent = "Deskripsi";
    const deskInput = document.createElement("textarea");
    deskInput.rows = 2;
    deskInput.value = item.deskripsi || "";
    deskLabel.appendChild(deskInput);

    const actions = document.createElement("div");
    actions.className = "profil-edit-actions";
    const save = document.createElement("button");
    save.type = "submit";
    save.className = "btn-small";
    save.textContent = "Simpan perubahan";
    const cancel = buatTombol("Batal", "btn-hapus", () => form.remove());
    actions.append(save, cancel);
    form.append(namaLabel, kondisiLabel, deskLabel, actions);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        save.disabled = true;
        const res = await apiRequest("user-items.php", "PATCH", {
            id: item.id,
            nama: namaInput.value.trim(),
            kondisi: Number(kondisiInput.value),
            deskripsi: deskInput.value.trim()
        });
        if (res.ok) {
            await muatBarang();
        } else {
            save.disabled = false;
            alert((res.data && res.data.error) || "Gagal memperbarui barang.");
        }
    });
    li.appendChild(form);
    namaInput.focus();
}

function buatItemSimpan(item) {
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
    const title = document.createElement("h4");
    title.textContent = item.nama;
    const tipe = document.createElement("span");
    tipe.className = "badge";
    tipe.textContent = item.tipe;
    const lihat = buatTombol("Lihat tutorial", "", () => {
        localStorage.setItem("itemAktifId", item.item_id);
        location.href = "tutorial.html";
    });
    info.append(title, tipe, lihat);

    const actions = document.createElement("div");
    actions.className = "simpan-aksi";
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.sudah_dibuat;
    label.append(checkbox, document.createTextNode(" Sudah dibuat"));
    checkbox.addEventListener("change", async () => {
        const value = checkbox.checked;
        checkbox.disabled = true;
        const res = await apiRequest("saved.php", "PATCH", { item_id: item.item_id, sudah_dibuat: value });
        checkbox.disabled = false;
        if (res.ok) li.classList.toggle("selesai", value);
        else {
            checkbox.checked = !value;
            alert((res.data && res.data.error) || "Gagal memperbarui status.");
        }
    });
    const remove = buatTombol("Hapus", "btn-hapus", async () => {
        if (!confirm('Hapus "' + item.nama + '" dari daftar simpan?')) return;
        remove.disabled = true;
        const res = await apiRequest("saved.php", "DELETE", { item_id: item.item_id });
        if (res.ok || res.status === 404) {
            li.remove();
            if (!simpanList.children.length) setStatus(simpanStatus, "Daftar simpan masih kosong. Jelajahi ide di Explore lalu simpan.");
        } else {
            remove.disabled = false;
            alert((res.data && res.data.error) || "Gagal menghapus dari daftar simpan.");
        }
    });
    actions.append(label, remove);
    li.append(info, actions);
    return li;
}

async function muatBarang() {
    setStatus(barangStatus, "Memuat barang...");
    barangList.replaceChildren();
    const res = await apiRequest("user-items.php");
    if (!res.ok) {
        setStatus(barangStatus, "Gagal memuat inventaris barang.");
        return;
    }
    if (!res.data.items || !res.data.items.length) {
        setStatus(barangStatus, "Belum ada barang di inventaris. Tambahkan barang melalui halaman Create.");
        return;
    }
    setStatus(barangStatus, "");
    res.data.items.forEach((item) => barangList.appendChild(buatItemBarang(item)));
}

async function muatSimpan() {
    setStatus(simpanStatus, "Memuat daftar simpan...");
    simpanList.replaceChildren();
    const res = await apiRequest("saved.php");
    if (!res.ok) {
        setStatus(simpanStatus, "Gagal memuat daftar simpan.");
        return;
    }
    if (!res.data.items || !res.data.items.length) {
        setStatus(simpanStatus, "Daftar simpan masih kosong. Jelajahi ide di Explore lalu simpan.");
        return;
    }
    setStatus(simpanStatus, "");
    res.data.items.forEach((item) => simpanList.appendChild(buatItemSimpan(item)));
}

async function initProfil() {
    const user = await getCurrentUser();
    if (!user) {
        location.href = "akun.html?next=profil.html";
        return;
    }
    namaEl.textContent = user.nama;
    emailEl.textContent = user.email;
    await Promise.all([muatBarang(), muatSimpan()]);
}

initProfil();
