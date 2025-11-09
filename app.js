/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * Frontend Logic (app.js) — UPDATED: toggle password + robust login
 ****************************************************/

// =================== KONFIGURASI ===================
const API_URL = "https://script.google.com/macros/s/AKfycbxMwBMv4-0-ttB8WfhC5NfwNpJuKgVdcsz4vdWj8mViO4DGSBqaUKiIIgyAItPlEM-amg/exec"; // GANTI jika perlu

// =================== UTIL FUNGI ===================
function toast(msg) {
  // replace alert if ingin toast fancy nanti
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
  if (btn) btn.disabled = true; // mencegah double click

  try {
    const usernameEl = document.getElementById("username");
    const passwordEl = document.getElementById("password");
    const username = usernameEl ? usernameEl.value.trim() : "";
    const password = passwordEl ? passwordEl.value.trim() : "";

    if (!username || !password) {
      toast("Isi semua field!");
      if (btn) btn.disabled = false;
      return;
    }

    loginAttempts++;
    if (loginAttempts > 3) {
      if (btn) btn.disabled = true;
      toast("Akun diblokir sementara karena gagal 3x!");
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });

    if (!res.ok) {
      toast("Gagal terhubung ke server: " + res.status);
      if (btn) btn.disabled = false;
      return;
    }

    const data = await res.json();
    if (data.success) {
      setSession(data.user);
      toast("Login berhasil!");
      loginAttempts = 0;
      // redirect ke dashboard
      window.location.href = "dashboard.html";
    } else {
      toast(data.message || "Login gagal!");
      if (passwordEl) passwordEl.value = "";
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    console.error("Login error:", err);
    toast("Terjadi kesalahan saat login. Cek koneksi.");
    if (btn) btn.disabled = false;
  }
}

// Register unchanged (but we ensure safe button types in HTML)
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
      toast("Pendaftaran berhasil!");
      window.location.href = "login.html";
    } else {
      toast(data.message || "Gagal mendaftar");
    }
  } catch (err) {
    console.error("Register error:", err);
    toast("Terjadi kesalahan saat registrasi.");
  }
}

// =================== PASSWORD TOGGLE ===================
function togglePassword() {
  const p = document.getElementById("password");
  const t = document.getElementById("togglePass");
  if (!p || !t) return;
  if (p.type === "password") {
    p.type = "text";
    t.textContent = "🙈"; // icon berubah
  } else {
    p.type = "password";
    t.textContent = "👁️";
  }
}

// Attach listeners kalau elemen ada
document.addEventListener("DOMContentLoaded", () => {
  // attach toggle if exists
  const t = document.getElementById("togglePass");
  if (t) t.addEventListener("click", (e) => { e.preventDefault(); togglePassword(); });

  // attach login button if exists
  const loginBtn = document.getElementById("btnLogin");
  if (loginBtn) loginBtn.addEventListener("click", (e) => { e.preventDefault(); login(); });

  // if page has register form button (type=button) ensure it calls register()
  const registerBtn = document.querySelector('button[type="button"].register-btn');
  if (registerBtn) registerBtn.addEventListener("click", (e) => { e.preventDefault(); register(); });

  // small convenience: pressing Enter on password triggers login
  const pwd = document.getElementById("password");
  if (pwd) {
    pwd.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        login();
      }
    });
  }
});

// =================== DASHBOARD & KENDARAAN (sama seperti sebelumnya) ===================
// ... (rest of app functions: initDashboard, loadKendaraan, doSearch, initKendaraanForm, fetchKendaraan,
// simpanKendaraan, hapusKendaraan, goEdit, showUsers) ...

// Untuk menjaga jawaban singkat di chat, jika kamu ingin saya kirim ulang seluruh file app.js
// (termasuk fungsi dashboard & kendaraan seperti sebelumnya), beri tahu — aku akan kirim full file
// yang sudah menggabungkan toggle + semua fungsi yang sebelumnya ada (loadKendaraan, simpanKendaraan, dll).
