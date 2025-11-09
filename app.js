/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * Frontend Logic (app.js) FINAL VERSION
 ****************************************************/

// =================== KONFIGURASI ===================
const API_URL = "https://script.google.com/macros/s/AKfycbyUUR6CxPVJsExI51dmuELVCswp9pIHoO_6aUc5GxqMQm_32AmDCh5IOKNbmu3z2hiS/exec");
// GANTI jika perlu

console.log("✅ app.js berhasil dimuat (versi 4) — PT ANISA JAYA UTAMA");

// =================== UTILITAS ===================
function toast(msg) {
  alert(msg);
}

function fmtDate(str) {
  if (!str) return "-";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toISOString().split("T")[0];
}

function daysBetween(date) {
  const now = new Date();
  const dd = new Date(date);
  if (isNaN(dd)) return 0;
  const diff = Math.floor((now - dd) / (1000 * 60 * 60 * 24));
  return diff;
}

function statusBadge(dateStr) {
  if (!dateStr) return `<span class="badge gray">-</span>`;
  const d = new Date(dateStr);
  if (isNaN(d)) return `<span class="badge gray">${dateStr}</span>`;
  const diff = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  let color = "green";
  if (diff < 0) color = "red";
  else if (diff <= 7) color = "yellow";
  return `<span class="badge ${color}">${fmtDate(dateStr)}</span>`;
}

function servisInfo(dateStr) {
  if (!dateStr) return `<span class="badge gray">-</span>`;
  const diff = daysBetween(dateStr);
  let color = diff > 180 ? "yellow" : "green";
  return `<span class="badge ${color}">${diff} hari lalu</span>`;
}

// =================== SESSION HANDLER ===================
function setSession(user) {
  localStorage.setItem("aj_user", JSON.stringify(user));
}

function getSession() {
  return JSON.parse(localStorage.getItem("aj_user") || "null");
}

function logout() {
  localStorage.removeItem("aj_user");
  window.location.href = "login.html";
}

function guard() {
  const user = getSession();
  if (!user) {
    window.location.href = "login.html";
  }
  return user;
}

// =================== LOGIN & REGISTER ===================
let loginAttempts = 0;

async function login() {
  const btn = document.getElementById("btnLogin");
  if (btn) btn.disabled = true;

  try {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      toast("Isi semua field!");
      if (btn) btn.disabled = false;
      return;
    }

    loginAttempts++;
    if (loginAttempts > 3) {
      toast("Terlalu banyak percobaan. Coba lagi nanti.");
      if (btn) btn.disabled = true;
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });

    const data = await res.json();
    if (data.success) {
      setSession(data.user);
      toast("Login berhasil!");
      window.location.href = "dashboard.html";
    } else {
      toast(data.message || "Login gagal");
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    toast("Kesalahan koneksi atau server");
    if (btn) btn.disabled = false;
  }
}

async function register() {
  const nama = document.getElementById("nama")?.value.trim() || "";
  const username = document.getElementById("username")?.value.trim() || "";
  const password = document.getElementById("password")?.value.trim() || "";

  if (!nama || !username || !password) return toast("Semua field wajib diisi");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", nama, username, password }),
    });
    const data = await res.json();
    if (data.success) {
      toast("Registrasi berhasil!");
      window.location.href = "login.html";
    } else {
      toast(data.message || "Gagal mendaftar");
    }
  } catch (err) {
    toast("Terjadi kesalahan saat register");
  }
}

// =================== TOGGLE PASSWORD ===================
function togglePassword() {
  const p = document.getElementById("password");
  const t = document.getElementById("togglePass");
  if (!p || !t) return;
  if (p.type === "password") {
    p.type = "text";
    t.textContent = "🙈";
  } else {
    p.type = "password";
    t.textContent = "👁️";
  }
}

// =================== DASHBOARD ===================
async function loadKendaraan(qPlat = "", qLetak = "") {
  const user = guard();
  document.getElementById("welcome").innerText = `Selamat datang, ${user.nama} (${user.role})`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getKendaraan", qPlat, qLetak }),
    });

    const data = await res.json();
    if (!data.success) return toast("Gagal memuat data kendaraan");

    const tbody = document.getElementById("kendaraanBody");
    tbody.innerHTML = "";

    data.data.forEach((k) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${k.PlatNomor}</td>
        <td>${k.Letak}</td>
        <td>${statusBadge(k.STNK)}</td>
        <td>${statusBadge(k.KIR)}</td>
        <td>${servisInfo(k.ServisTerakhir)}</td>
        ${
          user.role === "admin"
            ? `<td>
                <button onclick="goEdit('${k.PlatNomor}')">✏️</button>
                <button onclick="hapusKendaraan('${k.PlatNomor}')">🗑️</button>
              </td>`
            : "<td>-</td>"
        }
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    toast("Gagal memuat data kendaraan");
  }
}

function doSearch() {
  const qPlat = document.getElementById("searchPlat")?.value || "";
  const qLetak = document.getElementById("searchLetak")?.value || "";
  loadKendaraan(qPlat, qLetak);
}

// =================== KENDARAAN ===================
function initKendaraanForm() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const plat = params.get("plat");

  const title = document.getElementById("formTitle");
  if (mode === "edit" && plat) {
    title.innerText = "Edit Kendaraan";
    loadKendaraanForEdit(plat);
  } else {
    title.innerText = "Tambah Kendaraan";
  }
}

async function loadKendaraanForEdit(plat) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getKendaraan", qPlat: plat }),
    });

    const data = await res.json();
    if (data.success && data.data.length > 0) {
      const k = data.data[0];
      document.getElementById("plat").value = k.PlatNomor;
      document.getElementById("letak").value = k.Letak;
      document.getElementById("stnk").value = fmtDate(k.STNK);
      document.getElementById("kir").value = fmtDate(k.KIR);
      document.getElementById("servis").value = fmtDate(k.ServisTerakhir);
      document.getElementById("platAsli").value = k.PlatNomor;
    }
  } catch (err) {
    toast("Gagal memuat data kendaraan");
  }
}

async function simpanKendaraan() {
  const mode = new URLSearchParams(window.location.search).get("mode") || "add";
  const PlatNomor = document.getElementById("plat").value.trim();
  const Letak = document.getElementById("letak").value.trim();
  const STNK = document.getElementById("stnk").value;
  const KIR = document.getElementById("kir").value;
  const ServisTerakhir = document.getElementById("servis").value;

  if (!PlatNomor || !Letak || !STNK || !KIR || !ServisTerakhir) {
    return toast("Semua kolom wajib diisi!");
  }

  const payload =
    mode === "edit"
      ? {
          action: "updateKendaraan",
          platAsli: document.getElementById("platAsli").value,
          PlatNomor,
          Letak,
          STNK,
          KIR,
          ServisTerakhir,
        }
      : { action: "addKendaraan", PlatNomor, Letak, STNK, KIR, ServisTerakhir };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.success) {
      toast(data.message);
      window.location.href = "dashboard.html";
    } else toast(data.message);
  } catch (err) {
    toast("Gagal menyimpan kendaraan");
  }
}

async function hapusKendaraan(plat) {
  if (!confirm(`Hapus kendaraan ${plat}?`)) return;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteKendaraan", PlatNomor: plat }),
    });
    const data = await res.json();
    toast(data.message);
    loadKendaraan();
  } catch (err) {
    toast("Gagal menghapus kendaraan");
  }
}

function goEdit(plat) {
  window.location.href = `kendaraan.html?mode=edit&plat=${encodeURIComponent(plat)}`;
}

// =================== USERS (untuk admin) ===================
async function showUsers() {
  const user = guard();
  if (user.role !== "admin") {
    toast("Hanya admin yang bisa melihat daftar user");
    return;
  }
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getUsers" }),
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
    toast("Gagal memuat data user");
  }
}

// =================== EVENT BIND ===================
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("togglePass");
  const btnLogin = document.getElementById("btnLogin");
  const btnRegister = document.getElementById("btnRegister");

  if (toggle) toggle.addEventListener("click", (e) => { e.preventDefault(); togglePassword(); });
  if (btnLogin) btnLogin.addEventListener("click", (e) => { e.preventDefault(); login(); });
  if (btnRegister) btnRegister.addEventListener("click", (e) => { e.preventDefault(); register(); });
});
