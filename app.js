// === KONFIGURASI URL GOOGLE APPS SCRIPT ===
const API_URL = "https://script.google.com/macros/s/AKfycbxBsk09-lGyWtE_Y6AWVu4eA2iDPfErR4ayUaZe4pZ_iQn0WWe9gy55RmUxaJvzaABg/exec";

// === LOGIN ===
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Isi username dan password!");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });

    const result = await res.json();

    if (result.success) {
      localStorage.setItem("user", JSON.stringify(result.user));
      alert("Login berhasil!");
      window.location.href = "dashboard.html";
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert("Gagal terhubung ke server!");
  }
}

// === REGISTER ===
async function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const nama = document.getElementById("nama").value.trim();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        username,
        password,
        nama,
      }),
    });

    const result = await res.json();
    alert(result.message);
    if (result.success) window.location.href = "login.html";
  } catch (err) {
    alert("Gagal terhubung ke server!");
  }
}

// === LOAD DATA KENDARAAN ===
async function loadKendaraan() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getKendaraan" }),
    });

    const result = await res.json();

    if (result.success) {
      const tbody = document.getElementById("kendaraanBody");
      tbody.innerHTML = "";

      result.kendaraan.forEach((item) => {
        const stnkDate = new Date(item.STNK);
        const kirDate = new Date(item.KIR);
        const servisDate = new Date(item.ServisTerakhir);

        // Perhitungan hari tersisa
        const today = new Date();
        const diffStnk = Math.ceil((stnkDate - today) / (1000 * 60 * 60 * 24));
        const diffKir = Math.ceil((kirDate - today) / (1000 * 60 * 60 * 24));
        const diffServis = Math.ceil((today - servisDate) / (1000 * 60 * 60 * 24));

        // Warna status otomatis
        const warnaStnk = diffStnk < 0 ? "red" : diffStnk <= 7 ? "orange" : "green";
        const warnaKir = diffKir < 0 ? "red" : diffKir <= 7 ? "orange" : "green";

        const row = `<tr>
          <td>${item.Platnomor}</td>
          <td>${item.Letak}</td>
          <td>${item.STNK}</td>
          <td style="color:${warnaStnk}">${diffStnk < 0 ? "Terlambat" : diffStnk + " hari lagi"}</td>
          <td>${item.KIR}</td>
          <td style="color:${warnaKir}">${diffKir < 0 ? "Terlambat" : diffKir + " hari lagi"}</td>
          <td>${item.ServisTerakhir}</td>
          <td>${diffServis} hari sejak servis terakhir</td>
        </tr>`;
        tbody.innerHTML += row;
      });
    } else {
      alert("Gagal memuat data kendaraan!");
    }
  } catch (err) {
    alert("Gagal menghubungi server!");
  }
}

// === TAMBAH DATA KENDARAAN ===
async function tambahKendaraan() {
  const platNomor = document.getElementById("plat").value.trim();
  const letak = document.getElementById("letak").value.trim();
  const stnk = document.getElementById("stnk").value.trim();
  const kir = document.getElementById("kir").value.trim();
  const servisTerakhir = document.getElementById("servis").value.trim();

  if (!platNomor || !letak || !stnk || !kir || !servisTerakhir) {
    alert("Semua kolom harus diisi!");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addKendaraan",
        platNomor,
        letak,
        stnk,
        kir,
        servisTerakhir,
      }),
    });

    const result = await res.json();
    alert(result.message);
    if (result.success) window.location.href = "dashboard.html";
  } catch (err) {
    alert("Gagal menyimpan data kendaraan!");
  }
}

// === LOGOUT ===
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
