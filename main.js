/* ==========================================================
   PT ANISA JAYA UTAMA — BY ROY
   main.js FINAL v4.1 — Stable Version (Login, Register, Dashboard, Kendaraan)
   Terhubung dengan Google Apps Script backend
   ========================================================== */

const API_URL = "https://script.google.com/macros/s/AKfycbx5Ij7T7FBL1cs6327qrkLnQNwI2MSqw27di59sn3ud1pDqRzY3wb2zuBhF_N9wzrEc/exec";
console.log("✅ main.js aktif & terhubung ke:", API_URL);

/* ================= HELPER API TANPA CORS ================= */
async function api(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload })
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("⚠️ Respon bukan JSON:", text);
      return { success: false, message: "Respon tidak valid dari server" };
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return { success: false, message: "Gagal menghubungi server" };
  }
}

/* ================= UTILITAS UMUM ================= */
function toast(msg) { alert(msg); }

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("aj_user")) || null;
  } catch {
    return null;
  }
}

function setSession(user) {
  localStorage.setItem("aj_user", JSON.stringify(user));
}

function logout() {
  localStorage.removeItem("aj_user");
  location.href = "login.html";
}

function fmtDate(d) {
  if (!d) return "-";
  const t = new Date(d);
  if (isNaN(t)) return d;
  return t.toISOString().split("T")[0];
}

/* ================= LOGIN ================= */
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

/* ================= REGISTER ================= */
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

/* ================= DASHBOARD ================= */
async function initDashboard() {
  const user = getSession();
  if (!user) return (location.href = "login.html");

  document.title = "Dashboard — PT ANISA JAYA UTAMA";
  const tbl = document.querySelector("#tblKendaraan tbody");
  tbl.innerHTML = `<tr><td colspan="7" align="center">Memuat data...</td></tr>`;

  const res = await api("getKendaraan");
  if (!res.success || !Array.isArray(res.data)) {
    tbl.innerHTML = `<tr><td colspan="7" align="center">Gagal memuat data kendaraan</td></tr>`;
    return;
  }

  renderTabelKendaraan(res.data, user.role);
}

/* ================= FIX FINAL getStatusKendaraan (Zona Waktu + Format) ================= */
function getStatusKendaraan(k) {
  const now = new Date();

  // Parser aman untuk format YYYY-MM-DD dari Google Sheet
  function parseDate(d) {
    if (!d) return null;
    if (d instanceof Date) return d;
    if (typeof d === "number") return new Date(d);
    if (typeof d === "string") {
      const parts = d.split("-");
      if (parts.length === 3) {
        const [y, m, day] = parts.map(Number);
        // Gunakan UTC agar tidak bergeser karena zona waktu
        return new Date(Date.UTC(y, m - 1, day));
      }
    }
    return new Date(d);
  }

  // Hitung selisih hari dari sekarang
  function daysDiff(tgl) {
    const t = parseDate(tgl);
    if (!t || isNaN(t)) return 9999;
    const diffMs = t.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  let color = "#b2f2bb"; // hijau aman
  let label = "Aman";

  const stnk = daysDiff(k.STNK);
  const kir = daysDiff(k.KIR);
  const pajak5 = daysDiff(k.pajak5tahun);
  const servisDiff = (() => {
    const s = parseDate(k.ServisTerakhir);
    if (!s || isNaN(s)) return 0;
    const diffMs = now.getTime() - s.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  })();

  // ===== Aturan warna =====
  if (stnk <= 0 || kir <= 0 || pajak5 <= 0 || servisDiff >= 120) {
    color = "#ffa8a8"; // merah
    label = "Lewat";
  } else if (stnk <= 10 || kir <= 10 || pajak5 <= 10 || servisDiff >= 90) {
    color = "#fff3bf"; // kuning
    label = "Peringatan";
  }

  return { color, label };
}

/* ================= RENDER TABEL KENDARAAN ================= */
function renderTabelKendaraan(data, role) {
  const tbl = document.querySelector("#tblKendaraan tbody");
  let html = "";

  data.forEach((k) => {
    const status = getStatusKendaraan(k);
    html += `
      <tr style="background:${status.color}">
        <td>${k.Platnomor || "-"}</td>
        <td>${k.Letak || "-"}</td>
        <td>${fmtDate(k.STNK)}</td>
        <td>${fmtDate(k.KIR)}</td>
        <td>${fmtDate(k.ServisTerakhir)}</td>
        <td>${fmtDate(k.pajak5tahun)}</td>
        <td>${status.label}</td>
      </tr>`;
  });

  tbl.innerHTML = html || `<tr><td colspan="7" align="center">Tidak ada data kendaraan</td></tr>`;
}

/* ================= HALAMAN USER ================= */
async function initUser() {
  const user = getSession();
  if (!user) return (location.href = "login.html");

  const tbl = document.querySelector("#tblUser tbody");
  tbl.innerHTML = `<tr><td colspan="3" align="center">Memuat data...</td></tr>`;

  const res = await api("getUsers");
  if (!res.success || !Array.isArray(res.data)) {
    tbl.innerHTML = `<tr><td colspan="3" align="center">Gagal memuat data user</td></tr>`;
    return;
  }

  let html = "";
  res.data.forEach((u) => {
    html += `
      <tr>
        <td>${u.nama || "-"}</td>
        <td>${u.username || "-"}</td>
        <td>${u.role || "-"}</td>
      </tr>`;
  });

  tbl.innerHTML = html || `<tr><td colspan="3" align="center">Tidak ada data user</td></tr>`;
}

/* ================= SIMPAN KENDARAAN (ADMIN) ================= */
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
    Platnomor: plat,
    Letak: letak,
    STNK: stnk,
    KIR: kir,
    ServisTerakhir: servis,
    pajak5tahun: pajak5
  });

  toast(res.message);
  if (res.success) location.href = "kendaraan.html";
}
