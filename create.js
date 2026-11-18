const imageUpload = document.getElementById('image-upload');
const uploadBox = document.getElementById('upload-box');
const itemForm = document.querySelector('.item-form');
let uploadedFile = null;

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadBox.innerHTML = `<img src="${e.target.result}" alt="Preview"
            style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
    };
    reader.readAsDataURL(file);
}

imageUpload.addEventListener('change', (e) => handleFile(e.target.files[0]));
['dragenter', 'dragover'].forEach(evt => uploadBox.addEventListener(evt, (e) => {
    e.preventDefault(); e.stopPropagation(); uploadBox.classList.add('drag-over');
}));
['dragleave', 'drop'].forEach(evt => uploadBox.addEventListener(evt, (e) => {
    e.preventDefault(); e.stopPropagation(); uploadBox.classList.remove('drag-over');
}));
uploadBox.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0]; handleFile(file); imageUpload.files = e.dataTransfer.files;
});

// Submit form: kirim foto + data ke AI (api/analisa.php), lalu buka halaman hasil.
// Guest boleh menganalisa. Kalau sedang login, server juga menyimpan barang ke inventaris akun.
const overlay = document.getElementById('loading-overlay');

// Tombol Back browser dari hasil.html bisa memunculkan halaman ini dengan overlay masih tampil.
window.addEventListener('pageshow', () => { overlay.hidden = true; });

itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nama = document.getElementById('nama').value.trim();
    if (!uploadedFile) { alert('Upload gambar barang dulu.'); return; }
    if (!nama) { alert('Nama barang wajib diisi.'); return; }
    if (uploadedFile.size > 5 * 1024 * 1024) { alert('Ukuran gambar maksimal 5 MB.'); return; }

    const fd = new FormData();
    fd.append('image', uploadedFile);
    fd.append('nama', nama);
    fd.append('kondisi', document.getElementById('kondisi').value || '5');
    fd.append('deskripsi', document.getElementById('deskripsi').value.trim());

    const submit = itemForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    overlay.hidden = false;
    try {
        // Bukan apiRequest(): itu selalu JSON, sedangkan upload file memakai multipart.
        const res = await fetch('api/analisa.php', {
            method: 'POST',
            body: fd,
            credentials: 'same-origin',
            headers: { 'X-Requested-With': 'fetch' }
        });
        let data = null;
        try { data = await res.json(); } catch (err) { /* bukan JSON */ }
        if (!res.ok || !data || !data.kode) {
            throw new Error((data && data.error) || 'Analisa gagal, coba lagi.');
        }
        location.href = 'hasil.html?k=' + encodeURIComponent(data.kode);
    } catch (err) {
        overlay.hidden = true;
        submit.disabled = false;
        alert(err.message);
    }
});
