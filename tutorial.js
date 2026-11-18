// Dua sumber data tutorial:
//   1) ?analisa=<kode>&ide=<no>  -> ide hasil AI (api/analisa-ide.php)
//   2) localStorage.itemAktifId  -> item bawaan dari Explore/Simpan (get_tutorial.php)
// Bentuk respons keduanya sama: {nama, tipe, gambar, alatBahan[], langkah[]}.
const params = new URLSearchParams(location.search);
const analisaKode = params.get("analisa");
const analisaIde = Number(params.get("ide"));
const modeAnalisa = /^[a-f0-9]{16}$/.test(analisaKode || "") && analisaIde >= 1;
const itemAktifId = Number(localStorage.getItem("itemAktifId"));

function tampilkanPesan(teks) {
    document.querySelector(".tutorial-container").innerHTML =
        '<p class="empty-state">' + teks + "</p>";
}

function isiTutorial(item) {
    document.getElementById("tutorial-nama").textContent = item.nama;
    document.getElementById("tutorial-tipe").textContent = item.tipe;
    if (item.gambar) {
        document.getElementById("tutorial-gambar").src = item.gambar;
    }

    const alatBahanList = document.getElementById("alat-bahan-list");
    item.alatBahan.forEach((bahan) => {
        const li = document.createElement("li");
        li.textContent = bahan;
        alatBahanList.appendChild(li);
    });

    // textContent, bukan innerHTML: langkah dari AI tidak boleh menyisipkan HTML.
    const langkahList = document.getElementById("langkah-list");
    item.langkah.forEach((langkah) => {
        const li = document.createElement("li");
        const dot = document.createElement("span");
        dot.className = "langkah-dot";
        li.appendChild(dot);
        li.appendChild(document.createTextNode(" " + langkah));
        langkahList.appendChild(li);
    });

    if (item.peringatan) {
        const p = document.getElementById("tutorial-peringatan");
        p.textContent = "Perhatian: " + item.peringatan;
        p.hidden = false;
    }
}

if (modeAnalisa) {
    // Ide AI belum ada di tabel items, jadi tombol Simpan disembunyikan.
    document.getElementById("btn-simpan-tutorial").hidden = true;
    document.querySelector("header nav a").href = "hasil.html?k=" + analisaKode;

    // Langkah dibuat AI saat pertama kali dibuka, bisa memakan beberapa detik.
    document.getElementById("tutorial-nama").textContent = "Menyiapkan tutorial...";

    fetch(`api/analisa-ide.php?kode=${analisaKode}&no=${analisaIde}`, { credentials: "same-origin" })
        .then(async (response) => {
            const data = await response.json().catch(() => null);
            if (!response.ok) throw new Error((data && data.error) || "Data gagal diambil dari server");
            return data;
        })
        .then(isiTutorial)
        .catch((error) => {
            console.error(error);
            tampilkanPesan("Gagal menyiapkan tutorial. Kembali ke hasil analisa lalu coba lagi.");
        });
} else if (!itemAktifId) {
    tampilkanPesan("Barang belum dipilih. Silakan pilih dari halaman Explore.");
} else {
    fetch(`get_tutorial.php?id=${itemAktifId}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Data gagal diambil dari server");
            }
            return response.json();
        })
        .then((item) => {
            isiTutorial(item);
            getSavedIds().then((savedIds) => {
                pasangTombolSimpan(
                    document.getElementById("btn-simpan-tutorial"),
                    itemAktifId,
                    savedIds
                );
            });
        })
        .catch((error) => {
            console.error(error);
            tampilkanPesan("Gagal mengambil data tutorial.");
        });
}
