const params = new URLSearchParams(location.search);
const tujuan = halamanNextAman(params.get("next"), "profil.html");

const formLogin = document.getElementById("form-login");
const formRegister = document.getElementById("form-register");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const pesan = document.getElementById("akun-pesan");

function tampilkanTab(mode) {
    const login = mode === "login";
    formLogin.hidden = !login;
    formRegister.hidden = login;
    tabLogin.classList.toggle("active", login);
    tabRegister.classList.toggle("active", !login);
    pesan.textContent = "";
}

tabLogin.addEventListener("click", () => tampilkanTab("login"));
tabRegister.addEventListener("click", () => tampilkanTab("register"));

// Sudah login? Langsung ke tujuan.
getCurrentUser().then((user) => {
    if (user) location.href = tujuan;
});

async function kirim(form, endpoint, body) {
    const tombol = form.querySelector("button[type=submit]");
    tombol.disabled = true;
    pesan.textContent = "";

    const res = await apiRequest(endpoint, "POST", body);
    if (res.ok) {
        location.href = tujuan;
        return;
    }
    pesan.textContent = (res.data && res.data.error) || "Terjadi kesalahan, coba lagi";
    tombol.disabled = false;
}

formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    kirim(formLogin, "login.php", {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
    });
});

formRegister.addEventListener("submit", (e) => {
    e.preventDefault();
    kirim(formRegister, "register.php", {
        nama: document.getElementById("register-nama").value,
        email: document.getElementById("register-email").value,
        password: document.getElementById("register-password").value,
    });
});
