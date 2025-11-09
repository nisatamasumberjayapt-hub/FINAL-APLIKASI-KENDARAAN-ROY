/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * Frontend Logic (main.js) — STABIL v1.1
 ****************************************************/

// ===== KONFIGURASI =====
const API_URL = "https://script.google.com/macros/s/AKfycbxMwBMv4-0-ttB8WfhC5NfwNpJuKgVdcsz4vdWj8mViO4DGSBqaUKiIIgyAItPlEM-amg/exec";
console.log("✅ main.js aktif & terhubung ke database utama");

// ===== HELPER FETCH TANPA CORS =====
async function api(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload })
    });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { console.error("⚠️ Response bukan JSON:", text); return { success:false, message:"Response tidak valid" }; }
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return { success:false, message:"Gagal menghubungi server" };
  }
}

// ===== UTILITAS =====
function toast(msg){ alert(msg); }
function getSession(){ return JSON.parse(localStorage.getItem("aj_user") || "null"); }
function setSession(u){ localStorage.setItem("aj_user", JSON.stringify(u)); }
function logout(){ localStorage.removeItem("aj_user"); location.href = "login.html"; }

// --------------------------------------------------
// AUTH
// --------------------------------------------------
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

function togglePassword(){
  const p = document.getElementById("password");
  const t = document.getElementById("togglePass");
  if (!p || !t) return;
  if (p.type === "password"){ p.type = "text"; t.textContent = "🙈"; }
  else { p.type = "password"; t.textContent = "👁️"; }
}

// --------------------------------------------------
// KENDARAAN
// --------------------------------------------------
async function simpanKendaraan() {
  const PlatNomor = document.getElementById("PlatNomor")?.value.trim();
  const Letak = document.getElementById("Letak")?.value.trim();
  const STNK = document.getElementById("STNK")?.value.trim();
  const KIR = document.getElementById("KIR")?.value.trim();
  const ServisTerakhir = document.getElementById("ServisTerakhir")?.value.trim();

  if (!PlatNomor || !Letak || !STNK || !KIR || !ServisTerakhir)
    return toast("⚠️ Semua kolom wajib diisi!");

  const data = await api("addKendaraan", { PlatNomor, Letak, STNK, KIR, ServisTerakhir });
  if (data.success) {
    toast("✅ Kendaraan berhasil disimpan!");
    location.href = "dashboard.html";
  } else {
    toast("❌ " + (data.message || "Gagal menyimpan data kendaraan"));
  }
}

// --------------------------------------------------
// USER (Admin)
// --------------------------------------------------
async function loadUsers(){
  const tbl = document.getElementById("tblUser");
  if (!tbl) return;
  tbl.innerHTML = `<tr><td colspan="3" align="center">Memuat data...</td></tr>`;
  const data = await api("getUsers");
  if (data.success && data.data?.length){
    tbl.innerHTML = data.data.map(u => `
      <tr>
        <td>${u.nama}</td>
        <td>${u.username}</td>
        <td>${u.role}</td>
      </tr>`).join("");
  } else {
    tbl.innerHTML = `<tr><td colspan="3" align="center">Tidak ada data user</td></tr>`;
  }
}

// --------------------------------------------------
// DASHBOARD LIST + PENCARIAN STABIL (OR + Debounce)
// --------------------------------------------------
let searchTimer = null;
let searchSeq = 0;  // untuk mengabaikan respons lama

function renderKendaraan(rows){
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;
  if (!rows || rows.length === 0){
    tbody.innerHTML = `<tr><td colspan="6" align="center">🚫 Tidak ada data kendaraan</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(k => `
    <tr>
      <td>${k.PlatNomor}</td>
      <td>${k.Letak}</td>
      <td>${k.STNK}</td>
      <td>${k.KIR}</td>
      <td>${k.ServisTerakhir}</td>
      <td>-</td>
    </tr>`).join("");
}

async function loadAllKendaraan(){
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" align="center">🔄 Memuat data...</td></tr>`;
  const res = await api("getKendaraan", { qPlat: "", qLetak: "" });
  if (res.success){ renderKendaraan(res.data || []); }
  else { tbody.innerHTML = `<tr><td colspan="6" align="center">⚠️ Gagal memuat data</td></tr>`; }
}

function uniqueByPlat(arr){
  const seen = new Set();
  return arr.filter(x => {
    const key = (x.PlatNomor || "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function handleSearchInput(termRaw){
  const term = (termRaw || "").trim();

  // debounce
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const mySeq = ++searchSeq;
    const tbody = document.querySelector("#tblKendaraan tbody");
    if (!tbody) return;

    if (term === ""){
      // Tampilkan semua
      tbody.innerHTML = `<tr><td colspan="6" align="center">🔄 Memuat data...</td></tr>`;
      const res = await api("getKendaraan", { qPlat:"", qLetak:"" });
      if (mySeq !== searchSeq) return; // abaikan respons lama
      if (res.success) renderKendaraan(res.data || []);
      else tbody.innerHTML = `<tr><td colspan="6" align="center">⚠️ Gagal memuat data</td></tr>`;
      return;
    }

    // OR logic tanpa ubah backend:
    // panggil dua kali: (Plat berisi term) dan (Letak berisi term), lalu gabung unik
    tbody.innerHTML = `<tr><td colspan="6" align="center">🔎 Mencari...</td></tr>`;

    const [byPlat, byLetak] = await Promise.all([
      api("getKendaraan", { qPlat: term, qLetak: "" }),
      api("getKendaraan", { qPlat: "",    qLetak: term })
    ]);

    if (mySeq !== searchSeq) return; // abaikan respons lama

    const list1 = byPlat.success ? (byPlat.data || []) : [];
    const list2 = byLetak.success ? (byLetak.data || []) : [];
    const merged = uniqueByPlat([...list1, ...list2]);
    renderKendaraan(merged);
  }, 250);
}

// --------------------------------------------------
// EVENT BIND
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // tombol form
  document.getElementById("btnLogin")?.addEventListener("click", e => { e.preventDefault(); login(); });
  document.getElementById("btnRegister")?.addEventListener("click", e => { e.preventDefault(); register(); });
  document.getElementById("btnSimpan")?.addEventListener("click", e => { e.preventDefault(); simpanKendaraan(); });
  document.getElementById("togglePass")?.addEventListener("click", e => { e.preventDefault(); togglePassword(); });

  // dashboard
  const q = document.getElementById("q");  // input pencarian tunggal
  if (q){
    // muat semua saat pertama kali
    loadAllKendaraan();
    // cari realtime
    q.addEventListener("input", () => handleSearchInput(q.value));
  }

  console.log("🔧 Semua fungsi frontend aktif — PT ANISA JAYA UTAMA");
});
