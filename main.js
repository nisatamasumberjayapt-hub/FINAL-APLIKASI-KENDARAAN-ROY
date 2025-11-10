/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v4.2 — STABIL + Pajak 5 Tahunan
 * Kombinasi logika versi 1.4 dan struktur data v3.9
 ****************************************************/

// === GANTI DENGAN URL GOOGLE APPS SCRIPT TERBARU ANDA ===
const API_URL = "https://script.google.com/macros/s/AKfycbx5Ij7T7FBL1cs6327qrkLnQNwI2MSqw27di59sn3ud1pDqRzY3wb2zuBhF_N9wzrEc/exec";
console.log("✅ main.js aktif — versi 4.2 stabil dengan pajak 5 tahun");

// ===== Helper Umum =====
async function api(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    console.error("❌ Fetch error:", e);
    return { success: false, message: "Server tidak dapat dihubungi." };
  }
}

function toast(msg) {
  alert(msg);
}
function getSession() {
  return JSON.parse(localStorage.getItem("aj_user") || "null");
}
function setSession(u) {
  localStorage.setItem("aj_user", JSON.stringify(u));
}
function logout() {
  localStorage.removeItem("aj_user");
  location.href = "login.html";
}

// ===== Format Tanggal =====
function fmtDate(isoDate) {
  if (!isoDate) return "-";
  const d = new Date(isoDate);
  if (isNaN(d)) return isoDate;
  return d.toISOString().split("T")[0];
}

// ===== Hitung Selisih Hari =====
function hitungSelisihHari(isoDate) {
  if (!isoDate) return null;
  const now = new Date();
  const tgl = new Date(isoDate);
  return Math.floor((tgl - now) / (1000 * 60 * 60 * 24));
}

function hitungSejakServis(isoDate) {
  if (!isoDate) return null;
  const now = new Date();
  const last = new Date(isoDate);
  const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  const bulan = Math.floor(diff / 30);
  const hari = diff % 30;
  return { bulan, hari, total: diff };
}

// ===== LOGIN =====
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return toast("Isi username dan password!");

  const res = await api("login", { username, password });
  if (res.success) {
    setSession(res.user);
    toast("Selamat datang, " + res.user.nama);
    location.href = "dashboard.html";
  } else {
    toast(res.message || "Username atau password salah");
  }
}

// ===== REGISTER =====
async function register() {
  const username = document.getElementById("username").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !nama || !password)
    return toast("Semua kolom wajib diisi!");

  const res = await api("register", { username, nama, password });
  toast(res.message);
  if (res.success) location.href = "login.html";
}

// ===== RENDER DASHBOARD =====
async function initDashboard() {
  const user = getSession();
  if (!user) return (location.href = "login.html");

  const tbl = document.querySelector("#tblKendaraan tbody");
  tbl.innerHTML = `<tr><td colspan="7" align="center">Memuat data...</td></tr>`;

  const res = await api("getKendaraan");
  if (!res.success || !Array.isArray(res.data)) {
    tbl.innerHTML = `<tr><td colspan="7" align="center">Gagal memuat data kendaraan</td></tr>`;
    return;
  }

  renderTabelKendaraan(res.data);
}

// ===== LOGIKA STATUS =====
function getStatusKendaraan(k) {
  const now = new Date();

  const sisaSTNK = hitungSelisihHari(k.STNK);
  const sisaKIR = hitungSelisihHari(k.KIR);
  const sisaPajak = hitungSelisihHari(k.pajak5tahun);

  const servis = hitungSejakServis(k.ServisTerakhir);
  const hariServis = servis ? servis.total : 0;

  let color = "#e9f9e9";
  let label = "Aman";

  // Prioritas warna: Merah > Kuning > Hijau
  if (
    sisaSTNK <= 0 ||
    sisaKIR <= 0 ||
    sisaPajak <= 0 ||
    hariServis >= 120
  ) {
    color = "#ffd8d8"; // merah
    label = "Lewat";
  } else if (
    sisaSTNK <= 10 ||
    sisaKIR <= 10 ||
    sisaPajak <= 10 ||
    hariServis >= 90
  ) {
    color = "#fff3c6"; // kuning
    label = "Peringatan";
  }

  return { color, label };
}

// ===== RENDER TABEL =====
function renderTabelKendaraan(rows) {
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!rows?.length) {
    tbody.innerHTML = `<tr><td colspan="7" align="center">🚫 Tidak ada data kendaraan</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((k) => {
      const status = getStatusKendaraan(k);
      const servis = hitungSejakServis(k.ServisTerakhir);
      const sisaSTNK = hitungSelisihHari(k.STNK);
      const sisaKIR = hitungSelisihHari(k.KIR);
      const sisaPajak = hitungSelisihHari(k.pajak5tahun);

      return `
        <tr style="background:${status.color}">
          <td>${k.Platnomor || "-"}</td>
          <td>${k.Letak || "-"}</td>
          <td>${fmtDate(k.STNK)}<br><small>${sisaSTNK > 0 ? sisaSTNK + " hari lagi" : "Telah lewat " + Math.abs(sisaSTNK) + " hari"}</small></td>
          <td>${fmtDate(k.KIR)}<br><small>${sisaKIR > 0 ? sisaKIR + " hari lagi" : "Telah lewat " + Math.abs(sisaKIR) + " hari"}</small></td>
          <td>${fmtDate(k.ServisTerakhir)}<br><small>Sudah ${servis.bulan} bulan ${servis.hari} hari</small></td>
          <td>${fmtDate(k.pajak5tahun)}<br><small>${sisaPajak > 0 ? sisaPajak + " hari lagi" : "Telah lewat " + Math.abs(sisaPajak) + " hari"}</small></td>
          <td>${status.label}</td>
        </tr>`;
    })
    .join("");
}

// ===== SIMPAN KENDARAAN (ADMIN) =====
async function simpanKendaraan() {
  const plat = document.getElementById("plat").value.trim();
  const letak = document.getElementById("letak").value.trim();
  const stnk = document.getElementById("stnk").value;
  const kir = document.getElementById("kir").value;
  const servis = document.getElementById("servis").value;
  const pajak5 = document.getElementById("pajak5").value;

  if (!plat || !letak)
    return toast("Plat nomor dan lokasi harus diisi!");

  const res = await api("addKendaraan", {
    plat,
    letak,
    stnk,
    kir,
    servis,
    pajak5,
  });

  toast(res.message);
  if (res.success) location.href = "dashboard.html";
}
