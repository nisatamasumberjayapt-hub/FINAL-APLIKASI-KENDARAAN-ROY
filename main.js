/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js FINAL STABIL v3.0
 * Kompatibel dengan backend terbaru (login, register, kendaraan, user)
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbwwp-A4sP0LKwnuseOobJNilG1z8mszHAeZXJCeqmsleUwFS0cJiSTdzl6Jzp6sZ7472A/exec";
console.log("✅ main.js aktif — terhubung ke backend utama");

/****************************************************
 * === HELPER FUNGSI API TANPA CORS ===
 ****************************************************/
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
      console.error("⚠️ Response bukan JSON:", text);
      return { success: false, message: "Response tidak valid dari server" };
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return { success: false, message: "Tidak dapat terhubung ke server" };
  }
}

/****************************************************
 * === UTILITAS DASAR ===
 ****************************************************/
function toast(msg) {
  alert(msg);
}

function getSession() {
  return JSON.parse(localStorage.getItem("aj_user") || "null");
}

function setSession(u) {
  localStorage.setItem("aj_user", JSON.stringify(u));
}

function logout() {
  localStorage.removeItem("aj_user");
  location.href = "login.html";
}

function fmtDate(d) {
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

  if (!username || !password) {
    toast("⚠️ Username dan password wajib diisi!");
    return;
  }

  const data = await api("login", { username, password });
  if (data.success) {
    setSession(data.user);
    toast("✅ Login berhasil!");
    location.href = "dashboard.html";
  } else {
    toast(data.message || "❌ Login gagal, periksa kembali data Anda!");
  }
}

/****************************************************
 * === REGISTER ===
 ****************************************************/
async function register() {
  const nama = document.getElementById("nama")?.value.trim();
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!nama || !username || !password) {
    toast("⚠️ Semua field wajib diisi!");
    return;
  }

  const data = await api("register", { nama, username, password });
  if (data.success) {
    toast("✅ Registrasi berhasil!");
    location.href = "login.html";
  } else {
    toast(data.message || "❌ Gagal mendaftar, coba lagi!");
  }
}

/****************************************************
 * === SIMPAN DATA KENDARAAN ===
 ****************************************************/
async function simpanKendaraan() {
  const PlatNomor = document.getElementById("PlatNomor")?.value.trim();
  const Letak = document.getElementById("Letak")?.value.trim();
  const STNK = document.getElementById("STNK")?.value.trim();
  const KIR = document.getElementById("KIR")?.value.trim();
  const ServisTerakhir = document.getElementById("ServisTerakhir")?.value.trim();
  const Pajak5Tahunan = document.getElementById("Pajak5Tahunan")?.value.trim() || "";

  if (!PlatNomor || !Letak || !STNK || !KIR || !ServisTerakhir) {
    toast("⚠️ Semua kolom wajib diisi!");
    return;
  }

  const data = await api("addKendaraan", {
    PlatNomor,
    Letak,
    STNK,
    KIR,
    ServisTerakhir,
    Pajak5Tahunan,
  });

  if (data.success) {
    toast("✅ Data kendaraan berhasil disimpan!");
    location.href = "dashboard.html";
  } else {
    toast("❌ " + (data.message || "Gagal menyimpan data kendaraan"));
  }
}

/****************************************************
 * === AMBIL DATA USER (KHUSUS ADMIN)
 ****************************************************/
async function loadUsers() {
  const tbl = document.getElementById("tblUser");
  if (!tbl) return;
  tbl.innerHTML = `<tr><td colspan="3" align="center">🔄 Memuat data...</td></tr>`;

  const data = await api("getUsers");
  if (data.success && Array.isArray(data.data) && data.data.length > 0) {
    tbl.innerHTML = data.data
      .map(
        (u) => `
      <tr>
        <td>${u.nama}</td>
        <td>${u.username}</td>
        <td>${u.role}</td>
      </tr>`
      )
      .join("");
  } else {
    tbl.innerHTML = `<tr><td colspan="3" align="center">🚫 Tidak ada data user</td></tr>`;
  }
}

/****************************************************
 * === DASHBOARD — PENCARIAN CERDAS KENDARAAN ===
 ****************************************************/
async function doSearch() {
  const q = document.getElementById("qSearch")?.value.trim().toLowerCase() || "";
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" align="center">🔄 Memuat data kendaraan...</td></tr>`;

  const resp = await api("getKendaraan", { qPlat: q, qLetak: q });

  if (!resp.success) {
    tbody.innerHTML = `<tr><td colspan="6" align="center">⚠️ ${resp.message}</td></tr>`;
    return;
  }

  const rows = Array.isArray(resp.data) ? resp.data : [];
  const filtered = rows.filter((k) => {
    if (!q) return true;
    return (
      (k.PlatNomor || "").toLowerCase().includes(q) ||
      (k.Letak || "").toLowerCase().includes(q)
    );
  });

  if (filtered.length > 0) {
    tbody.innerHTML = filtered
      .map(
        (k) => `
      <tr>
        <td>${k.PlatNomor || "-"}</td>
        <td>${k.Letak || "-"}</td>
        <td>${fmtDate(k.STNK)}</td>
        <td>${fmtDate(k.KIR)}</td>
        <td>${fmtDate(k.ServisTerakhir)}</td>
        <td>${fmtDate(k.Pajak5Tahunan)}</td>
      </tr>`
      )
      .join("");
  } else {
    tbody.innerHTML = `<tr><td colspan="6" align="center">🚫 Tidak ada data ditemukan</td></tr>`;
  }
}

/****************************************************
 * === INISIALISASI SAAT HALAMAN DIMUAT ===
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  console.log("💡 Semua fungsi siap digunakan — PT ANISA JAYA UTAMA");

  // Tombol utama
  document.getElementById("btnLogin")?.addEventListener("click", (e) => {
    e.preventDefault();
    login();
  });

  document.getElementById("btnRegister")?.addEventListener("click", (e) => {
    e.preventDefault();
    register();
  });

  document.getElementById("btnSimpan")?.addEventListener("click", (e) => {
    e.preventDefault();
    simpanKendaraan();
  });

  // Auto-search kendaraan
  const qInput = document.getElementById("qSearch");
  if (qInput) {
    qInput.addEventListener("input", doSearch);
    doSearch();
  }

  // Cek user login di dashboard
  const u = getSession();
  const namaUser = document.getElementById("namaUser");
  if (namaUser && u) namaUser.textContent = u.nama || u.username || "-";
});
/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js FINAL STABIL v3.0
 * Kompatibel dengan backend terbaru (login, register, kendaraan, user)
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbwwp-A4sP0LKwnuseOobJNilG1z8mszHAeZXJCeqmsleUwFS0cJiSTdzl6Jzp6sZ7472A/exec";
console.log("✅ main.js aktif — terhubung ke backend utama");

/****************************************************
 * === HELPER FUNGSI API TANPA CORS ===
 ****************************************************/
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
      console.error("⚠️ Response bukan JSON:", text);
      return { success: false, message: "Response tidak valid dari server" };
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return { success: false, message: "Tidak dapat terhubung ke server" };
  }
}

/****************************************************
 * === UTILITAS DASAR ===
 ****************************************************/
function toast(msg) {
  alert(msg);
}

function getSession() {
  return JSON.parse(localStorage.getItem("aj_user") || "null");
}

function setSession(u) {
  localStorage.setItem("aj_user", JSON.stringify(u));
}

function logout() {
  localStorage.removeItem("aj_user");
  location.href = "login.html";
}

function fmtDate(d) {
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

  if (!username || !password) {
    toast("⚠️ Username dan password wajib diisi!");
    return;
  }

  const data = await api("login", { username, password });
  if (data.success) {
    setSession(data.user);
    toast("✅ Login berhasil!");
    location.href = "dashboard.html";
  } else {
    toast(data.message || "❌ Login gagal, periksa kembali data Anda!");
  }
}

/****************************************************
 * === REGISTER ===
 ****************************************************/
async function register() {
  const nama = document.getElementById("nama")?.value.trim();
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!nama || !username || !password) {
    toast("⚠️ Semua field wajib diisi!");
    return;
  }

  const data = await api("register", { nama, username, password });
  if (data.success) {
    toast("✅ Registrasi berhasil!");
    location.href = "login.html";
  } else {
    toast(data.message || "❌ Gagal mendaftar, coba lagi!");
  }
}

/****************************************************
 * === SIMPAN DATA KENDARAAN ===
 ****************************************************/
async function simpanKendaraan() {
  const PlatNomor = document.getElementById("PlatNomor")?.value.trim();
  const Letak = document.getElementById("Letak")?.value.trim();
  const STNK = document.getElementById("STNK")?.value.trim();
  const KIR = document.getElementById("KIR")?.value.trim();
  const ServisTerakhir = document.getElementById("ServisTerakhir")?.value.trim();
  const Pajak5Tahunan = document.getElementById("Pajak5Tahunan")?.value.trim() || "";

  if (!PlatNomor || !Letak || !STNK || !KIR || !ServisTerakhir) {
    toast("⚠️ Semua kolom wajib diisi!");
    return;
  }

  const data = await api("addKendaraan", {
    PlatNomor,
    Letak,
    STNK,
    KIR,
    ServisTerakhir,
    Pajak5Tahunan,
  });

  if (data.success) {
    toast("✅ Data kendaraan berhasil disimpan!");
    location.href = "dashboard.html";
  } else {
    toast("❌ " + (data.message || "Gagal menyimpan data kendaraan"));
  }
}

/****************************************************
 * === AMBIL DATA USER (KHUSUS ADMIN)
 ****************************************************/
async function loadUsers() {
  const tbl = document.getElementById("tblUser");
  if (!tbl) return;
  tbl.innerHTML = `<tr><td colspan="3" align="center">🔄 Memuat data...</td></tr>`;

  const data = await api("getUsers");
  if (data.success && Array.isArray(data.data) && data.data.length > 0) {
    tbl.innerHTML = data.data
      .map(
        (u) => `
      <tr>
        <td>${u.nama}</td>
        <td>${u.username}</td>
        <td>${u.role}</td>
      </tr>`
      )
      .join("");
  } else {
    tbl.innerHTML = `<tr><td colspan="3" align="center">🚫 Tidak ada data user</td></tr>`;
  }
}

/****************************************************
 * === DASHBOARD — PENCARIAN CERDAS KENDARAAN ===
 ****************************************************/
async function doSearch() {
  const q = document.getElementById("qSearch")?.value.trim().toLowerCase() || "";
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" align="center">🔄 Memuat data kendaraan...</td></tr>`;

  const resp = await api("getKendaraan", { qPlat: q, qLetak: q });

  if (!resp.success) {
    tbody.innerHTML = `<tr><td colspan="6" align="center">⚠️ ${resp.message}</td></tr>`;
    return;
  }

  const rows = Array.isArray(resp.data) ? resp.data : [];
  const filtered = rows.filter((k) => {
    if (!q) return true;
    return (
      (k.PlatNomor || "").toLowerCase().includes(q) ||
      (k.Letak || "").toLowerCase().includes(q)
    );
  });

  if (filtered.length > 0) {
    tbody.innerHTML = filtered
      .map(
        (k) => `
      <tr>
        <td>${k.PlatNomor || "-"}</td>
        <td>${k.Letak || "-"}</td>
        <td>${fmtDate(k.STNK)}</td>
        <td>${fmtDate(k.KIR)}</td>
        <td>${fmtDate(k.ServisTerakhir)}</td>
        <td>${fmtDate(k.Pajak5Tahunan)}</td>
      </tr>`
      )
      .join("");
  } else {
    tbody.innerHTML = `<tr><td colspan="6" align="center">🚫 Tidak ada data ditemukan</td></tr>`;
  }
}

/****************************************************
 * === INISIALISASI SAAT HALAMAN DIMUAT ===
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  console.log("💡 Semua fungsi siap digunakan — PT ANISA JAYA UTAMA");

  // Tombol utama
  document.getElementById("btnLogin")?.addEventListener("click", (e) => {
    e.preventDefault();
    login();
  });

  document.getElementById("btnRegister")?.addEventListener("click", (e) => {
    e.preventDefault();
    register();
  });

  document.getElementById("btnSimpan")?.addEventListener("click", (e) => {
    e.preventDefault();
    simpanKendaraan();
  });

  // Auto-search kendaraan
  const qInput = document.getElementById("qSearch");
  if (qInput) {
    qInput.addEventListener("input", doSearch);
    doSearch();
  }

  // Cek user login di dashboard
  const u = getSession();
  const namaUser = document.getElementById("namaUser");
  if (namaUser && u) namaUser.textContent = u.nama || u.username || "-";
});
