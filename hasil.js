// Halaman hasil analisa AI: ?k=<kode> -> api/analisa-hasil.php
// Semua teks dari AI dipasang lewat textContent (bukan innerHTML) supaya aman dari XSS.
const kode = new URLSearchParams(location.search).get("k");
const grid = document.getElementById("rec-grid");
let semuaIde = [];

function el(tag, kelas, teks) {
    const n = document.createElement(tag);
    if (kelas) n.className = kelas;
    if (teks !== undefined) n.textContent = teks;
    return n;
}

function buatKartu(ide) {
    const kartu = el("div", "rec-card");

    const atas = el("div", "rec-card-top");
    atas.appendChild(el("h4", "", ide.nama));
    const badges = el("div", "rec-card-badges");
    badges.appendChild(el("span", "badge badge-outline", ide.level));
    badges.appendChild(el("span", "badge", ide.tipe.charAt(0).toUpperCase() + ide.tipe.slice(1)));
    atas.appendChild(badges);
    kartu.appendChild(atas);

    kartu.appendChild(el("p", "rec-card-ringkasan", ide.ringkasan));
    kartu.appendChild(el("p", "rec-card-butuh", "Butuh: " + (ide.butuh.length ? ide.butuh.join(", ") : "-")));

    const bawah = el("div", "rec-card-bottom");
    const buat = el("button", "btn-small btn-buat", "Buat >");
    buat.type = "button";
    buat.addEventListener("click", () => {
        location.href = "tutorial.html?analisa=" + encodeURIComponent(kode) + "&ide=" + ide.no;
    });
    bawah.appendChild(buat);
    kartu.appendChild(bawah);
    return kartu;
}

function tampilkan(filter) {
    grid.replaceChildren();
    const daftar = semuaIde.filter((i) => filter === "all" || i.tipe === filter);
    if (!daftar.length) {
        grid.appendChild(el("p", "empty-state", "Belum ada ide untuk tipe ini."));
        return;
    }
    daftar.forEach((ide) => grid.appendChild(buatKartu(ide)));
}

function tampilkanError(pesan) {
    document.querySelector(".hasil-container").replaceChildren(el("p", "empty-state", pesan));
}

async function muat() {
    if (!kode) { tampilkanError("Hasil analisa tidak ditemukan. Mulai dari halaman Create."); return; }
    const res = await apiRequest("analisa-hasil.php?kode=" + encodeURIComponent(kode));
    if (!res.ok) {
        tampilkanError((res.data && res.data.error) || "Gagal memuat hasil analisa.");
        return;
    }
    const d = res.data;
    const gambar = document.getElementById("hasil-gambar");
    gambar.src = d.gambar;
    gambar.alt = d.nama;
    document.getElementById("hasil-nama").textContent = d.nama;
    document.getElementById("hasil-skor").textContent = d.kondisi + "/10";
    semuaIde = d.ideas;
    tampilkan("all");

    document.querySelectorAll("#hasil-tabs .tab").forEach((tab) => {
        // Tab untuk tipe yang tidak ada di hasil ini disembunyikan.
        const f = tab.dataset.filter;
        if (f !== "all" && !semuaIde.some((i) => i.tipe === f)) tab.hidden = true;
        tab.addEventListener("click", () => {
            document.querySelectorAll("#hasil-tabs .tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            tampilkan(f);
        });
    });
}

muat();
