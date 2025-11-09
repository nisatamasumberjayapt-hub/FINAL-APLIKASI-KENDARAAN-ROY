/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js FINAL FIX v3.0
 * Terhubung ke backend baru (Google Apps Script)
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbxh57p_PBLvAAESYD5KLQMf9wcKvjvWt55hM9ytsJCTuxgAU-foe9pFSTTYcPq_Ad89Fw/exec";
console.log("✅ main.js aktif — backend tersambung:", API_URL);

// === Helper untuk fetch API tanpa CORS ===
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
    console.error("❌ Gagal konek API:", err);
    return { success: false, message: "Tidak bisa terhubung ke server" };
  }
}

// === Utilitas umum ===
function toast(msg) { alert(msg); }
function getSession() { return JSON.parse(localStorage.getItem("aj_user") || "null"); }
function setSession(u) { localStorage.setItem("aj_user", JSON.stringify(u)); }
function logout() { localStorage.removeItem("aj_user"); location.href = "login.html"; }
function fmt(d) {
  if (!d) return "-";
  if (typeof d === "string" && d.includes("T")) return d.split("T")[0];
  return d;
}

/****************************************************
 * === LOGIN ===
 ****************************************************/
async function login() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!username || !password) return toast("⚠️ Isi semua field!");

  const data = await api("login", { username, password });
  if (data.success) {
    setSession(data.user);
    toast("✅ Login berhasil!");
    location.href = "dashboard.html";
  } else {
    toast(data.message || "❌ Login gagal");
  }
}

/****************************************************
 * === REGISTER ===
 ****************************************************/
async function register() {
  const nama = document.getElementById("nama")?.value.trim();
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!nama || !username || !password) return toast("⚠️ Semua field wajib diisi!");

  const data = await api("register", { nama, username, password });
  if (data.success) {
    toast("✅ Registrasi berhasil!");
    location.href = "login.html";
  } else {
    toast(data.message || "❌ Gagal mendaftar");
  }
}

/****************************************************
 * === SIMPAN KENDARAAN ===
 ****************************************************/
async function simpanKendaraan() {
  const PlatNomor = document.getElementById("PlatNomor")?.value.trim();
  const Letak = document.getElementById("Letak")?.value.trim();
  const STNK = document.getElementById("STNK")?.value.trim();
  const KIR = document.getElementById("KIR")?.value.trim();
  const ServisTerakhir = document.getElementById("ServisTerakhir")?.value.trim();
  const Pajak5Tahunan = document.getElementById("Pajak5Tahunan")?.value.trim();

  if (!PlatNomor || !Letak || !STNK || !KIR || !ServisTerakhir)
    return toast("⚠️ Semua kolom wajib diisi!");

  const data = await api("addKendaraan", { PlatNomor, Letak, STNK, KIR, ServisTerakhir, Pajak5Tahunan });
  if (data.success) {
    toast("✅ Kendaraan berhasil disimpan!");
    location.href = "dashboard.html";
  } else {
    toast("❌ " + (data.message || "Gagal menyimpan data kendaraan"));
  }
}

/****************************************************
 * === LOAD USERS (ADMIN)
 ****************************************************/
async function loadUsers() {
  const tbl = document.getElementById("tblUser");
  if (!tbl) return;
  tbl.innerHTML = `<tr><td colspan="3" align="center">Memuat data...</td></tr>`;

  const data = await api("getUsers");
  if (data.success && data.data?.length) {
    tbl.innerHTML = data.data.map(u => `
      <tr>
        <td>${u.nama}</td>
        <td>${u.username}</td>
        <td>${u.role}</td>
      </tr>
    `).join("");
  } else {
    tbl.innerHTML = `<tr><td colspan="3" align="center">Tidak ada data user</td></tr>`;
  }
}

/****************************************************
 * === DASHBOARD (KENDARAAN)
 ****************************************************/
async function doSearch() {
  const q = document.getElementById("qSearch")?.value.trim().toLowerCase() || "";
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" align="center">🔄 Memuat data...</td></tr>`;

  const resp = await api("getKendaraan", { qPlat: q, qLetak: q });
  if (!resp.success) {
    tbody.innerHTML = `<tr><td colspan="6" align="center">⚠️ ${resp.message}</td></tr>`;
    return;
  }

  const rows = Array.isArray(resp.data) ? resp.data : [];
  if (rows.length > 0) {
    tbody.innerHTML = rows.map(k => `
      <tr>
        <td>${k.Platnomor || "-"}</td>
        <td>${k.Letak || "-"}</td>
        <td>${fmt(k.STNK)}</td>
        <td>${fmt(k.KIR)}</td>
        <td>${fmt(k.ServisTerakhir)}</td>
        <td>${fmt(k.pajak5tahun)}</td>
      </tr>
    `).join("");
  } else {
    tbody.innerHTML = `<tr><td colspan="6" align="center">🚫 Tidak ada data kendaraan</td></tr>`;
  }
}

/****************************************************
 * === EVENT LISTENER GLOBAL ===
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLogin")?.addEventListener("click", e => { e.preventDefault(); login(); });
  document.getElementById("btnRegister")?.addEventListener("click", e => { e.preventDefault(); register(); });
  document.getElementById("btnSimpan")?.addEventListener("click", e => { e.preventDefault(); simpanKendaraan(); });

  const qInput = document.getElementById("qSearch");
  if (qInput) {
    qInput.addEventListener("input", () => doSearch());
    doSearch();
  }

  console.log("💡 Semua fungsi siap — PT ANISA JAYA UTAMA");
});
