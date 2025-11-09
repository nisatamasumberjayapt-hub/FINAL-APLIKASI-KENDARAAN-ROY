/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js FINAL v3.0 (Login + Register + Dashboard)
 ****************************************************/

// Ganti URL berikut dengan Web App URL terbaru kamu:
const API_URL = "https://script.google.com/macros/s/AKfycbwupFec4Nr2U0orr-9t0dFIhFjsl5hWfT--xYxdgCEAbC17p6W12cngio-Mxv_XRWRv8A/exec";
console.log("✅ main.js aktif & terhubung ke database utama:", API_URL);

// ============ HELPER API TANPA CORS ============
async function api(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload })
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("⚠️ Response bukan JSON:", text);
      return { success: false, message: "Response tidak valid dari server" };
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return { success: false, message: "Gagal menghubungi server" };
  }
}

// ============ UTILITAS UMUM ============
function toast(msg) { alert(msg); }
function getSession() { return JSON.parse(localStorage.getItem("aj_user") || "null"); }
function setSession(u) { localStorage.setItem("aj_user", JSON.stringify(u)); }
function logout() { localStorage.removeItem("aj_user"); location.href = "login.html"; }
function fmt(d) {
  if (!d) return "-";
  if (typeof d === "string" && d.includes("T")) return d.split("T")[0];
  return d;
}

// ============ LOGIN ============
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

// ============ REGISTER ============
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

// ============ SIMPAN KENDARAAN ============
async function simpanKendaraan() {
  const PlatNomor = document.getElementById("PlatNomor")?.value.trim();
  const Letak = document.getElementById("Letak")?.value.trim();
  const STNK = document.getElementById("STNK")?.value.trim();
  const KIR = document.getElementById("KIR")?.value.trim();
  const ServisTerakhir = document.getElementById("ServisTerakhir")?.value.trim();
  const pajak5Tahunan = document.getElementById("pajak5Tahunan")?.value.trim();

  if (!PlatNomor || !Letak || !STNK || !KIR || !ServisTerakhir || !pajak5Tahunan)
    return toast("⚠️ Semua kolom wajib diisi!");

  const data = await api("addKendaraan", {
    PlatNomor, Letak, STNK, KIR, ServisTerakhir, pajak5Tahunan
  });

  if (data.success) {
    toast("✅ Kendaraan berhasil disimpan!");
    location.href = "dashboard.html";
  } else {
    toast("❌ " + (data.message || "Gagal menyimpan data kendaraan"));
  }
}

// ============ LOAD USER (ADMIN) ============
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

// ============ DASHBOARD: CARI KENDARAAN ============
async function doSearch() {
  const q = document.getElementById("qSearch")?.value.trim().toLowerCase() || "";
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" align="center">🔄 Memuat data...</td></tr>`;

  try {
    const resp = await api("getKendaraan", { qPlat: q, qLetak: q });
    if (!resp.success) throw new Error(resp.message || "Gagal memuat data");

    const rows = Array.isArray(resp.data) ? resp.data : [];
    const filtered = rows.filter(k => {
      if (!q) return true;
      const plat = (k.PlatNomor || "").toLowerCase();
      const letak = (k.Letak || "").toLowerCase();
      return plat.includes(q) || letak.includes(q);
    });

    if (filtered.length > 0) {
      tbody.innerHTML = filtered.map(k => `
        <tr>
          <td>${k.PlatNomor || "-"}</td>
          <td>${k.Letak || "-"}</td>
          <td>${fmt(k.STNK)}</td>
          <td>${fmt(k.KIR)}</td>
          <td>${fmt(k.ServisTerakhir)}</td>
          <td>${fmt(k.pajak5Tahunan)}</td>
        </tr>
      `).join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="6" align="center">🚫 Tidak ada data kendaraan</td></tr>`;
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" align="center">⚠️ Gagal memuat data kendaraan</td></tr>`;
  }
}

// ============ DASHBOARD INITIALIZER ============
function initDashboard() {
  const user = getSession();
  if (!user) {
    alert("⚠️ Anda belum login. Silakan login terlebih dahulu.");
    location.href = "login.html";
    return;
  }

  console.log(`👤 Selamat datang, ${user.username} (${user.role})`);
  doSearch();
}

// ============ EVENT LISTENER GLOBAL ============
document.addEventListener("DOMContentLoaded", () => {
  // Tombol login/register/simpan
  document.getElementById("btnLogin")?.addEventListener("click", e => { e.preventDefault(); login(); });
  document.getElementById("btnRegister")?.addEventListener("click", e => { e.preventDefault(); register(); });
  document.getElementById("btnSimpan")?.addEventListener("click", e => { e.preventDefault(); simpanKendaraan(); });

  // Auto-search kendaraan
  const qInput = document.getElementById("qSearch");
  if (qInput) {
    qInput.addEventListener("input", () => doSearch());
  }

  console.log("💡 Semua fungsi siap digunakan — PT ANISA JAYA UTAMA");
});

