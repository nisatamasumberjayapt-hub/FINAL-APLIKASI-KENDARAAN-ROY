/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v5.0 — FIX WARNA 100% (Aman, Kuning, Merah)
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbx5Ij7T7FBL1cs6327qrkLnQNwI2MSqw27di59sn3ud1pDqRzY3wb2zuBhF_N9wzrEc/exec";
console.log("✅ main.js aktif — v5.0 FINAL");

/* ================= HELPER API ================= */
async function api(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
    return await res.json();
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return { success: false, message: "Gagal menghubungi server" };
  }
}

/* ================= UTILITAS ================= */
function toast(msg) { alert(msg); }
function getSession() { try { return JSON.parse(localStorage.getItem("aj_user")) || null; } catch { return null; } }
function setSession(u) { localStorage.setItem("aj_user", JSON.stringify(u)); }
function logout() { localStorage.removeItem("aj_user"); location.href = "login.html"; }
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
    location.href = "dashboard.html";
  } else toast(res.message || "Username atau password salah");
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
  const tbl = document.querySelector("#tblKendaraan tbody");
  tbl.innerHTML = `<tr><td colspan="7" align="center">Memuat data...</td></tr>`;
  const res = await api("getKendaraan");
  if (!res.success || !Array.isArray(res.data)) {
    tbl.innerHTML = `<tr><td colspan="7" align="center">Gagal memuat data kendaraan</td></tr>`;
    return;
  }
  renderTabelKendaraan(res.data);
}

/* ================= FIX WARNA ================= */
function getStatusKendaraan(k) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  function parseDateSafe(tgl) {
    if (!tgl) return null;
    const parts = tgl.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(tgl);
  }

  function selisihHari(tgl) {
    const t = parseDateSafe(tgl);
    if (!t || isNaN(t)) return 9999;
    t.setHours(0, 0, 0, 0);
    return Math.floor((t - now) / (1000 * 60 * 60 * 24));
  }

  const stnk = selisihHari(k.STNK);
  const kir = selisihHari(k.KIR);
  const pajak5 = selisihHari(k.pajak5tahun);
  const servis = (() => {
    const s = parseDateSafe(k.ServisTerakhir);
    if (!s || isNaN(s)) return 0;
    return Math.floor((now - s) / (1000 * 60 * 60 * 24));
  })();

  let color = "#e9f9e9"; // Hijau default
  let label = "Aman";

  if (stnk <= 0 || kir <= 0 || pajak5 <= 0 || servis >= 120) {
    color = "#ffd8d8"; label = "Lewat";
  } else if (
    stnk <= 30 || kir <= 30 || pajak5 <= 30 || (servis >= 90 && servis < 120)
  ) {
    color = "#fff3c6"; label = "Peringatan";
  }
  return { color, label };
}

/* ================= FORMAT TANGGAL ================= */
function formatSelisih(tgl) {
  if (!tgl) return "-";
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(tgl); d.setHours(0, 0, 0, 0);
  const diff = Math.floor((d - now) / (1000 * 60 * 60 * 24));
  const abs = Math.abs(diff);
  const bulan = Math.floor(abs / 30);
  const hari = abs % 30;
  if (diff < 0) return `Telah lewat ${bulan} bulan ${hari} hari`;
  if (diff > 0) return `${bulan} bulan ${hari} hari lagi`;
  return "Hari ini";
}

function formatServis(tgl) {
  if (!tgl) return "-";
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(tgl); d.setHours(0, 0, 0, 0);
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  const bulan = Math.floor(diff / 30);
  const hari = diff % 30;
  return `Sudah ${bulan} bulan ${hari} hari`;
}

/* ================= RENDER ================= */
function renderTabelKendaraan(data) {
  const tbl = document.querySelector("#tblKendaraan tbody");
  let html = "";
  data.forEach((k) => {
    const s = getStatusKendaraan(k);
    html += `
      <tr style="background:${s.color}">
        <td>${k.Platnomor || "-"}</td>
        <td>${k.Letak || "-"}</td>
        <td>${fmtDate(k.STNK)}<br><small>${formatSelisih(k.STNK)}</small></td>
        <td>${fmtDate(k.KIR)}<br><small>${formatSelisih(k.KIR)}</small></td>
        <td>${fmtDate(k.ServisTerakhir)}<br><small>${formatServis(k.ServisTerakhir)}</small></td>
        <td>${fmtDate(k.pajak5tahun)}<br><small>${formatSelisih(k.pajak5tahun)}</small></td>
        <td></td>
      </tr>`;
  });
  tbl.innerHTML = html || `<tr><td colspan="7" align="center">Tidak ada data kendaraan</td></tr>`;
}

/* ================= USER ================= */
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
  res.data.forEach(u => {
    html += `<tr><td>${u.nama || "-"}</td><td>${u.username || "-"}</td><td>${u.role || "-"}</td></tr>`;
  });
  tbl.innerHTML = html || `<tr><td colspan="3" align="center">Tidak ada data user</td></tr>`;
}

/* ================= SIMPAN ================= */
async function simpanKendaraan() {
  const plat = document.getElementById("plat").value.trim();
  const letak = document.getElementById("letak").value.trim();
  const stnk = document.getElementById("stnk").value;
  const kir = document.getElementById("kir").value;
  const servis = document.getElementById("servis").value;
  const pajak5 = document.getElementById("pajak5").value;
  if (!plat || !letak) return toast("Plat nomor dan lokasi harus diisi!");
  const res = await api("addKendaraan", {
    Platnomor: plat, Letak: letak,
    STNK: stnk, KIR: kir, ServisTerakhir: servis, pajak5tahun: pajak5
  });
  toast(res.message);
  if (res.success) location.href = "kendaraan.html";
}
