/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * Frontend Logic (main.js) FINAL FIX (CORS-SAFE)
 ****************************************************/

// ===== KONFIGURASI =====
const API_URL = "https://script.google.com/macros/s/AKfycbw6J5kgoQQYzYZZ5_BeI2P4_1A34HdeUuMnIElupuUqm1aobByMtNctcWNlxcnZePZW/exec";
console.log("✅ main.js dimuat — PT ANISA JAYA UTAMA");

// ===== HELPER FETCH TANPA CORS =====
async function api(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // ← kunci anti-preflight
    body: JSON.stringify({ action, ...payload })
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error("Response bukan JSON:\n" + text.slice(0, 500)); }
  return data;
}

// ===== UTILITAS =====
function toast(msg) { alert(msg); }
function getSession() { return JSON.parse(localStorage.getItem("aj_user") || "null"); }
function setSession(u) { localStorage.setItem("aj_user", JSON.stringify(u)); }
function logout() { localStorage.removeItem("aj_user"); location.href = "login.html"; }

// ===== LOGIN =====
async function login() {
  const btn = document.getElementById("btnLogin");
  if (btn) btn.disabled = true;

  try {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      toast("⚠️ Isi semua field!");
      return;
    }

    const data = await api("login", { username, password });
    if (data.success) {
      setSession(data.user);
      toast("✅ Login berhasil!");
      location.href = "dashboard.html";
    } else {
      toast(data.message || "Login gagal.");
    }
  } catch (e) {
    console.error(e);
    toast("⚠️ Kesalahan koneksi atau server.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ===== REGISTER =====
async function register() {
  const nama = document.getElementById("nama")?.value.trim() || "";
  const username = document.getElementById("username")?.value.trim() || "";
  const password = document.getElementById("password")?.value.trim() || "";

  if (!nama || !username || !password) {
    toast("⚠️ Semua field wajib diisi.");
    return;
  }

  try {
    const data = await api("register", { nama, username, password });
    if (data.success) {
      toast("✅ Registrasi berhasil!");
      location.href = "login.html";
    } else {
      toast(data.message || "Gagal mendaftar.");
    }
  } catch (e) {
    console.error(e);
    toast("⚠️ Kesalahan koneksi atau server.");
  }
}

// ===== TOGGLE PASSWORD =====
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

// ===== SIMPAN KENDARAAN (dummy dulu) =====
async function simpanKendaraan() {
  const PlatNomor = document.getElementById("PlatNomor").value.trim();
  const Letak = document.getElementById("Letak").value.trim();
  const STNK = document.getElementById("STNK").value.trim();
  const KIR = document.getElementById("KIR").value.trim();
  const ServisTerakhir = document.getElementById("ServisTerakhir").value.trim();

  if (!PlatNomor || !Letak || !STNK || !KIR || !ServisTerakhir) {
    toast("⚠️ Semua kolom wajib diisi!");
    return;
  }

  try {
    const data = await api("addKendaraan", { PlatNomor, Letak, STNK, KIR, ServisTerakhir });
    if (data.success) {
      toast("✅ Data kendaraan berhasil disimpan!");
      location.href = "dashboard.html";
    } else {
      toast("❌ Gagal menyimpan data kendaraan.");
    }
  } catch (err) {
    console.error(err);
    toast("⚠️ Terjadi kesalahan koneksi atau server.");
  }
}

// ===== EVENT BIND =====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("togglePass")?.addEventListener("click", e => {
    e.preventDefault();
    togglePassword();
  });

  document.getElementById("btnLogin")?.addEventListener("click", e => {
    e.preventDefault();
    login();
  });

  document.getElementById("btnRegister")?.addEventListener("click", e => {
    e.preventDefault();
    register();
  });

  console.log("🔍 Semua fungsi siap — PT ANISA JAYA UTAMA");
});
