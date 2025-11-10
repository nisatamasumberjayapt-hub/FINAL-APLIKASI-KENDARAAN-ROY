/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v4.4 — FINAL STABIL (warna fix + format bulan/hari)
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbx5Ij7T7FBL1cs6327qrkLnQNwI2MSqw27di59sn3ud1pDqRzY3wb2zuBhF_N9wzrEc/exec";
console.log("✅ main.js aktif — versi 4.4 warna fix total");

// ===== Helper umum =====
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
    console.error("Fetch error:", e);
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

// ===== Format tanggal =====
function fmtDate(isoDate) {
  if (!isoDate) return "-";
  const d = new Date(isoDate);
  if (isNaN(d)) return isoDate;
  return d.toISOString().split("T")[0];
}

// ===== Hitung selisih hari (pakai UTC agar akurat zona waktu) =====
function daysDiff(tgl) {
  if (!tgl) return null;
  const t = new Date(tgl + "T00:00:00Z"); // tambahkan UTC agar tidak geser zona waktu
  const now = new Date();
  const diff = Math.floor((t - now) / (1000 * 60 * 60 * 24));
  return diff;
}

// ===== Format selisih jadi bulan + hari =====
function formatSelisih(tgl) {
  const diff = daysDiff(tgl);
  if (diff === null) return "-";
  const abs = Math.abs(diff);
  const bulan = Math.floor(abs / 30);
  const hari = abs % 30;
  if (diff > 0) return `${bulan > 0 ? bulan + " bulan " : ""}${hari} hari lagi`;
  if (diff < 0) return `Telah lewat ${bulan > 0 ? bulan + " bulan " : ""}${hari} hari`;
  return "Hari ini";
}

// ===== Format servis =====
function formatServis(tgl) {
  if (!tgl) return "-";
  const now = new Date();
  const s = new Date(tgl + "T00:00:00Z");
  const diff = Math.floor((now - s) / (1000 * 60 * 60 * 24));
  const bulan = Math.floor(diff / 30);
  const hari = diff % 30;
  return `Sudah ${bulan} bulan ${hari} hari`;
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
  if (!username || !nama || !password) return toast("Semua kolom wajib diisi!");

  const res = await api("register", { username, nama, password });
  toast(res.message);
  if (res.success) location.href = "login.html";
}

// ===== DASHBOARD =====
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

// ===== Status kendaraan (fix warna) =====
function getStatusKendaraan(k) {
  const stnk = daysDiff(k.STNK);
  const kir = daysDiff(k.KIR);
  const pajak = daysDiff(k.pajak5tahun);

  const servis = (() => {
    const s = new Date(k.ServisTerakhir + "T00:00:00Z");
    const now = new Date();
    return Math.floor((now - s) / (1000 * 60 * 60 * 24));
  })();

  let color = "#e9f9e9";
  let label = "Aman";

  // merah (lewat)
  if (stnk <= 0 || kir <= 0 || pajak <= 0 || servis >= 120) {
    color = "#ffd8d8";
    label = "Lewat";
  }
  // kuning (peringatan)
  else if (stnk <= 10 || kir <= 10 || pajak <= 10 || servis >= 90) {
    color = "#fff3c6";
    label = "Peringatan";
  }
  // hijau (aman)
  else {
    color = "#e9f9e9";
    label = "Aman";
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
      return `
        <tr style="background:${status.color}">
          <td>${k.Platnomor || "-"}</td>
          <td>${k.Letak || "-"}</td>
          <td>${fmtDate(k.STNK)}<br><small>${formatSelisih(k.STNK)}</small></td>
          <td>${fmtDate(k.KIR)}<br><small>${formatSelisih(k.KIR)}</small></td>
          <td>${fmtDate(k.ServisTerakhir)}<br><small>${formatServis(k.ServisTerakhir)}</small></td>
          <td>${fmtDate(k.pajak5tahun)}<br><small>${formatSelisih(k.pajak5tahun)}</small></td>
          <td>${status.label}</td>
        </tr>`;
    })
    .join("");
}

// ===== SIMPAN KENDARAAN =====
async function simpanKendaraan() {
  const plat = document.getElementById("plat").value.trim();
  const letak = document.getElementById("letak").value.trim();
  const stnk = document.getElementById("stnk").value;
  const kir = document.getElementById("kir").value;
  const servis = document.getElementById("servis").value;
  const pajak5 = document.getElementById("pajak5").value;

  if (!plat || !letak) return toast("Plat nomor dan lokasi harus diisi!");

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
