const searchInput = document.querySelector(".search-input");
const ideaCards = document.querySelectorAll(".idea-card");

searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.trim().toLowerCase();

    ideaCards.forEach((card) => {
        const judul = card.querySelector("h4").textContent.toLowerCase();
        const deskripsi = card.querySelector("p").textContent.toLowerCase();
        const cocok = judul.includes(keyword) || deskripsi.includes(keyword);
        card.style.display = cocok ? "" : "none";
    });
});

document.querySelectorAll(".btn-buat").forEach((btn) => {
    btn.addEventListener("click", () => {
        localStorage.setItem("itemAktifId", btn.dataset.id);
        localStorage.removeItem("barangAktif");
        window.location.href = "tutorial.html";
    });
});
// Tombol Simpan: guest diarahkan ke login, pengguna login menyimpan ke daftar simpan.
getSavedIds().then((savedIds) => {
    document.querySelectorAll(".btn-simpan").forEach((btn) => {
        pasangTombolSimpan(btn, Number(btn.dataset.id), savedIds);
    });
});
