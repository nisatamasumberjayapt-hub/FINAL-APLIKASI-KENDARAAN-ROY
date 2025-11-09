/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v1.2 — STABIL + PERINGATAN OTOMATIS
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbxMwBMv4-0-ttB8WfhC5NfwNpJuKgVdcsz4vdWj8mViO4DGSBqaUKiIIgyAItPlEM-amg/exec";
console.log("✅ main.js aktif — versi dengan peringatan tanggal");

// ====== Helper umum ======
async function api(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload })
    });
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    console.error("Fetch error:", e);
    return { success: false, message: "Server tidak dapat dihubungi." };
  }
}

function toast(msg) { alert(msg); }
function getSession() { return JSON.parse(localStorage.getItem("aj_user") || "null"); }
function setSession(u) { localStorage.setItem("aj_user", JSON.stringify(u)); }
function logout() { localStorage.removeItem("aj_user"); location.href = "login.html"; }

// ===== LOGIN =====
async function login() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  if (!username || !password) return toast("⚠️ Isi semua field!");
  const data = await api("login", { username, password });
  if (data.success) { setSession(data.user); location.href = "dashboard.html"; }
  else toast(data.message || "❌ Login gagal.");
}

// ===== REGISTER =====
async function register() {
  const nama = document.getElementById("nama")?.value.trim();
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  if (!nama || !username || !password) return toast("⚠️ Semua field wajib diisi!");
  const data = await api("register", { nama, username, password });
  if (data.success) { toast("✅ Registrasi berhasil!"); location.href = "login.html"; }
  else toast(data.message || "❌ Gagal mendaftar.");
}

// ===== FORMAT TANGGAL & PERINGATAN =====
function formatTanggal(isoDate) {
  if (!isoDate) return "-";
  const d = new Date(isoDate);
  if (isNaN(d)) return isoDate;
  return d.toISOString().split("T")[0];
}

function hitungSisaHari(isoDate) {
  if (!isoDate) return "";
  const sekarang = new Date();
  const target = new Date(isoDate);
  const selisihMs = target - sekarang;
  const selisihHari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
  const bulan = Math.floor(selisihHari / 30);
  const hari = selisihHari % 30;

  if (selisihHari < 0) return `⚠️ Telah lewat ${Math.abs(selisihHari)} hari`;
  if (bulan > 0) return `${bulan} bulan ${hari} hari lagi`;
  return `${hari} hari lagi`;
}

function warnaPeringatan(isoDate) {
  if (!isoDate) return "";
  const sisa = new Date(isoDate) - new Date();
  const hari = sisa / (1000 * 60 * 60 * 24);
  if (hari < 0) return "expired";      // sudah lewat
  if (hari <= 30) return "warning";    // kurang dari 30 hari
  return "";                           // aman
}

// ====== RENDER KENDARAAN ======
function renderKendaraan(rows) {
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;
  if (!rows?.length) {
    tbody.innerHTML = `<tr><td colspan="6" align="center">🚫 Tidak ada data kendaraan</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(k => {
    const stnkWarn = warnaPeringatan(k.STNK);
    const kirWarn = warnaPeringatan(k.KIR);
    const servisWarn = warnaPeringatan(k.ServisTerakhir);

    return `
      <tr>
        <td>${k.PlatNomor}</td>
        <td>${k.Letak}</td>
        <td class="${stnkWarn}">
          ${formatTanggal(k.STNK)}<br>
          <small>${hitungSisaHari(k.STNK)}</small>
        </td>
        <td class="${kirWarn}">
          ${formatTanggal(k.KIR)}<br>
          <small>${hitungSisaHari(k.KIR)}</small>
        </td>
        <td class="${servisWarn}">
          ${formatTanggal(k.ServisTerakhir)}<br>
          <small>${hitungSisaHari(k.ServisTerakhir)}</small>
        </td>
        <td>-</td>
      </tr>`;
  }).join("");
}

// ====== PENCARIAN ======
let searchTimer = null;
let searchSeq = 0;

function uniqueByPlat(arr) {
  const seen = new Set();
  return arr.filter(x => {
    const key = (x.PlatNomor || "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function handleSearchInput(termRaw) {
  const term = (termRaw || "").trim();
  if (searchTimer) clearTimeout(searchTimer);

  searchTimer = setTimeout(async () => {
    const mySeq = ++searchSeq;
    const tbody = document.querySelector("#tblKendaraan tbody");
    if (!tbody) return;

    if (term === "") {
      tbody.innerHTML = `<tr><td colspan="6" align="center">🔄 Memuat data...</td></tr>`;
      const res = await api("getKendaraan", { qPlat: "", qLetak: "" });
      if (mySeq !== searchSeq) return;
      if (res.success) renderKendaraan(res.data);
      return;
    }

    tbody.innerHTML = `<tr><td colspan="6" align="center">🔎 Mencari...</td></tr>`;
    const [byPlat, byLetak] = await Promise.all([
      api("getKendaraan", { qPlat: term, qLetak: "" }),
      api("getKendaraan", { qPlat: "", qLetak: term })
    ]);

    if (mySeq !== searchSeq) return;
    const list1 = byPlat.success ? (byPlat.data || []) : [];
    const list2 = byLetak.success ? (byLetak.data || []) : [];
    const merged = uniqueByPlat([...list1, ...list2]);
    renderKendaraan(merged);
  }, 250);
}

// ====== LOAD SEMUA DATA ======
async function loadAllKendaraan() {
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" align="center">🔄 Memuat data...</td></tr>`;
  const data = await api("getKendaraan", { qPlat: "", qLetak: "" });
  if (data.success) renderKendaraan(data.data);
  else tbody.innerHTML = `<tr><td colspan="6" align="center">⚠️ Gagal memuat data</td></tr>`;
}

// ====== EVENT ======
document.addEventListener("DOMContentLoaded", () => {
  const q = document.getElementById("q");
  if (q) {
    loadAllKendaraan();
    q.addEventListener("input", () => handleSearchInput(q.value));
  }
  document.getElementById("btnLogin")?.addEventListener("click", e => { e.preventDefault(); login(); });
  document.getElementById("btnRegister")?.addEventListener("click", e => { e.preventDefault(); register(); });
});
