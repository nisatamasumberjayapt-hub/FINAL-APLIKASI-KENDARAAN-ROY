/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v4.6 — FINAL STABIL (Tulisan benar + Warna akurat)
 * Kompatibel pajak5tahun & servis
 ****************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbx5Ij7T7FBL1cs6327qrkLnQNwI2MSqw27di59sn3ud1pDqRzY3wb2zuBhF_N9wzrEc/exec";
console.log("✅ main.js aktif — v4.6 FINAL");

/* ================= HELPER API ================= */
async function api(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
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

/* ================= UTILITAS ================= */
function toast(msg) {
  alert(msg);
}
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

/* ===== Parse tanggal Y-M-D secara aman (tanpa geser zona waktu) ===== */
function parseYMD(d) {
  if (!d) return null;
  if (d instanceof Date) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  if (typeof d === "number") {
    const tmp = new Date(d);
    return new Date(Date.UTC(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate()));
  }
  if (typeof d === "string") {
    const s = d.trim();
    const parts = s.split(/[-/]/).map((x) => Number(x));
    if (parts.length === 3) {
      // asumsikan format Google Sheet: YYYY-MM-DD
      const [y, m, day] = parts[0] > 31 ? parts : [parts[2], parts[1], parts[0]]; // fallback bila dd-mm-yyyy
      return new Date(Date.UTC(y, m - 1, day));
    }
    // fallback
    const tmp = new Date(s);
    if (isNaN(tmp)) return null;
    return new Date(Date.UTC(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate()));
  }
  return null;
}

/* Hitung selisih hari UTC (tanpa jam) */
function diffDaysUTC(a, b) {
  if (!a || !b) return NaN;
  const Au = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const Bu = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((Au - Bu) / 86400000);
}

/* Format YYYY-MM-DD untuk tampilan kolom tanggal */
function fmtDate(d) {
  const t = parseYMD(d);
  if (!t) return "-";
  const y = t.getUTCFullYear();
  const m = String(t.getUTCMonth() + 1).padStart(2, "0");
  const day = String(t.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ================= LOGIN / REGISTER ================= */
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

async function register() {
  const username = document.getElementById("username").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !nama || !password) return toast("Semua kolom wajib diisi!");

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
  renderTabelKendaraan(res.data, user.role);
}

/* ================= STATUS WARNA ================= */
function getStatusKendaraan(k) {
  const now = parseYMD(new Date());

  const dSTNK = parseYMD(k.STNK);
  const dKIR = parseYMD(k.KIR);
  const dPajak = parseYMD(k.pajak5tahun);
  const dServ = parseYMD(k.ServisTerakhir);

  const stnk = Number.isNaN(diffDaysUTC(dSTNK, now)) ? 9999 : diffDaysUTC(dSTNK, now);
  const kir = Number.isNaN(diffDaysUTC(dKIR, now)) ? 9999 : diffDaysUTC(dKIR, now);
  const pajak5 = Number.isNaN(diffDaysUTC(dPajak, now)) ? 9999 : diffDaysUTC(dPajak, now);
  const servisHari = Number.isNaN(diffDaysUTC(now, dServ)) ? 0 : diffDaysUTC(now, dServ); // hari sejak servis

  let color = "#e9f9e9"; // aman (hijau)
  let label = "Aman";
  if (stnk <= 0 || kir <= 0 || pajak5 <= 0 || servisHari >= 120) {
    color = "#ffd8d8"; // merah
    label = "Lewat";
  } else if (stnk <= 10 || kir <= 10 || pajak5 <= 10 || servisHari >= 90) {
    color = "#fff3c6"; // kuning
    label = "Peringatan";
  }
  return { color, label };
}

/* ================= FORMAT SELISIH UNTUK TULISAN ================= */
function formatSelisih(isoDate) {
  const now = parseYMD(new Date());
  const t = parseYMD(isoDate);
  if (!t || !now) return "-";

  const selisih = diffDaysUTC(t, now); // t - now
  const abs = Math.abs(selisih);
  const bulan = Math.floor(abs / 30);
  const hari = abs % 30;

  if (selisih < 0) return `Telah lewat ${bulan} bulan ${hari} hari`;
  if (selisih > 0) return `${bulan} bulan ${hari} hari lagi`;
  return "Hari ini";
}

function formatServis(isoDate) {
  const now = parseYMD(new Date());
  const last = parseYMD(isoDate);
  if (!last || !now) return "-";

  const sejak = diffDaysUTC(now, last); // now - last
  const abs = Math.max(0, sejak);
  const bulan = Math.floor(abs / 30);
  const hari = abs % 30;

  return `Sudah ${bulan} bulan ${hari} hari`;
}

/* ================= RENDER TABEL ================= */
function renderTabelKendaraan(data, role) {
  const tbl = document.querySelector("#tblKendaraan tbody");
  let html = "";

  data.forEach((k) => {
    const status = getStatusKendaraan(k);
    html += `
      <tr style="background:${status.color}">
        <td>${k.Platnomor || "-"}</td>
        <td>${k.Letak || "-"}</td>
        <td>${fmtDate(k.STNK)}<br><small>${formatSelisih(k.STNK)}</small></td>
        <td>${fmtDate(k.KIR)}<br><small>${formatSelisih(k.KIR)}</small></td>
        <td>${fmtDate(k.ServisTerakhir)}<br><small>${formatServis(k.ServisTerakhir)}</small></td>
        <td>${fmtDate(k.pajak5tahun)}<br><small>${formatSelisih(k.pajak5tahun)}</small></td>
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

/* ================= SIMPAN KENDARAAN ================= */
async function simpanKendaraan() {
  const plat = document.getElementById("plat").value.trim();
  const letak = document.getElementById("letak").value.trim();
  const stnk = document.getElementById("stnk").value;
  const kir = document.getElementById("kir").value;
  const servis = document.getElementById("servis").value;
  const pajak5 = document.getElementById("pajak5").value;

  if (!plat || !letak) return toast("Plat nomor dan lokasi harus diisi!");

  const res = await api("addKendaraan", {
    Platnomor: plat,
    Letak: letak,
    STNK: stnk,
    KIR: kir,
    ServisTerakhir: servis,
    pajak5tahun: pajak5,
  });

  toast(res.message);
  if (res.success) location.href = "kendaraan.html";
}
