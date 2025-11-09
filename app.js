/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * Frontend Logic (app.js)
 ****************************************************/

// =================== KONFIGURASI ===================
const API_URL = "https://script.google.com/macros/s/AKfycbxMwBMv4-0-ttB8WfhC5NfwNpJuKgVdcsz4vdWj8mViO4DGSBqaUKiIIgyAItPlEM-amg/exec"; // GANTI DENGAN URL WEB APP KAMU

// =================== UTIL FUNGI ===================
function toast(msg) {
  alert(msg); // Simpel alert agar tetap ringan
}

function fmtDate(str) {
  if (!str) return "-";
  const d = new Date(str);
  return d.toISOString().split("T")[0];
}

function daysBetween(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / (1000 * 60 * 60 * 24));
  return diff;
}

function statusBadge(dateStr) {
  if (!dateStr) return `<span class="badge gray">-</span>`;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
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
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return toast("Isi semua field!");

  loginAttempts++;
  if (loginAttempts > 3) {
    document.getElementById("btnLogin").disabled = true;
    return toast("Akun diblokir sementara karena gagal 3x!");
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
    toast(data.message || "Login gagal!");
    document.getElementById("password").value = "";
  }
}

async function register() {
  const nama = document.getElementById("nama").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!nama || !username || !password) return toast("Semua field wajib diisi");

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
    toast(data.message);
  }
}

// =================== DASHBOARD ===================
async function initDashboard() {
  const user = guard();
  document.getElementById("welcome").innerText = `Selamat datang, ${user.nama} (${user.role})`;

  if (user.role !== "admin") {
    document.getElementById("linkTambahKendaraan").style.display = "none";
    document.getElementById("linkUser").style.display = "none";
  }

  await loadKendaraan();
}

async function loadKendaraan() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getKendaraan" }),
  });
  const data = await res.json();

  const tbody = document.querySelector("#tblKendaraan tbody");
  tbody.innerHTML = "";

  if (data.success && data.data.length > 0) {
    const user = getSession();
    data.data.forEach(k => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${k.PlatNomor}</td>
        <td>${k.Letak}</td>
        <td>${statusBadge(k.STNK)}</td>
        <td>${statusBadge(k.KIR)}</td>
        <td>${servisInfo(k.ServisTerakhir)}</td>
        <td>
          ${user.role === "admin" ? `
            <button onclick="goEdit('${k.PlatNomor}')">✏️</button>
            <button onclick="hapusKendaraan('${k.PlatNomor}')">🗑️</button>` : "-"}
        </td>`;
      tbody.appendChild(tr);
    });
  } else {
    tbody.innerHTML = "<tr><td colspan='6'>Tidak ada data</td></tr>";
  }
}

async function doSearch() {
  const qPlat = document.getElementById("qPlat").value.trim();
  const qLetak = document.getElementById("qLetak").value.trim();

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getKendaraan", qPlat, qLetak }),
  });
  const data = await res.json();

  const tbody = document.querySelector("#tblKendaraan tbody");
  tbody.innerHTML = "";

  if (data.success && data.data.length > 0) {
    const user = getSession();
    data.data.forEach(k => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${k.PlatNomor}</td>
        <td>${k.Letak}</td>
        <td>${statusBadge(k.STNK)}</td>
        <td>${statusBadge(k.KIR)}</td>
        <td>${servisInfo(k.ServisTerakhir)}</td>
        <td>
          ${user.role === "admin" ? `
            <button onclick="goEdit('${k.PlatNomor}')">✏️</button>
            <button onclick="hapusKendaraan('${k.PlatNomor}')">🗑️</button>` : "-"}
        </td>`;
      tbody.appendChild(tr);
    });
  } else {
    tbody.innerHTML = "<tr><td colspan='6'>Data tidak ditemukan</td></tr>";
  }
}

// =================== KENDARAAN FORM ===================
function initKendaraanForm() {
  const user = guard();
  if (user.role !== "admin") {
    alert("Hanya admin yang dapat mengakses halaman ini");
    window.location.href = "dashboard.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const plat = params.get("plat");

  if (mode === "edit" && plat) {
    document.getElementById("formTitle").innerText = "Edit Kendaraan";
    fetchKendaraan(plat);
  }
}

async function fetchKendaraan(plat) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getKendaraan", qPlat: plat }),
  });
  const data = await res.json();

  if (data.success && data.data.length > 0) {
    const k = data.data[0];
    document.getElementById("PlatNomor").value = k.PlatNomor;
    document.getElementById("Letak").value = k.Letak;
    document.getElementById("STNK").value = k.STNK;
    document.getElementById("KIR").value = k.KIR;
    document.getElementById("ServisTerakhir").value = k.ServisTerakhir;
    localStorage.setItem("edit_plat", plat);
  }
}

async function simpanKendaraan() {
  const mode = new URLSearchParams(window.location.search).get("mode");
  const PlatNomor = document.getElementById("PlatNomor").value.trim();
  const Letak = document.getElementById("Letak").value.trim();
  const STNK = document.getElementById("STNK").value;
  const KIR = document.getElementById("KIR").value;
  const ServisTerakhir = document.getElementById("ServisTerakhir").value;

  if (!PlatNomor || !Letak || !STNK || !KIR || !ServisTerakhir)
    return toast("Semua field wajib diisi");

  let action = "addKendaraan";
  let body = { action, PlatNomor, Letak, STNK, KIR, ServisTerakhir };

  if (mode === "edit") {
    action = "updateKendaraan";
    const platAsli = localStorage.getItem("edit_plat");
    body = { action, platAsli, PlatNomor, Letak, STNK, KIR, ServisTerakhir };
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  toast(data.message);
  if (data.success) window.location.href = "dashboard.html";
}

async function hapusKendaraan(plat) {
  if (!confirm("Yakin ingin menghapus kendaraan ini?")) return;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deleteKendaraan", PlatNomor: plat }),
  });
  const data = await res.json();

  toast(data.message);
  if (data.success) loadKendaraan();
}

function goEdit(plat) {
  window.location.href = `kendaraan.html?mode=edit&plat=${encodeURIComponent(plat)}`;
}

// =================== ADMIN: USER LIST ===================
async function showUsers() {
  const user = getSession();
  if (user.role !== "admin") return toast("Hanya admin yang dapat melihat data user!");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getUsers" }),
  });
  const data = await res.json();

  const tbl = document.getElementById("tblUsers");
  tbl.innerHTML = "";

  if (data.success && data.data.length > 0) {
    data.data.forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${u.username}</td><td>${u.nama}</td><td>${u.role}</td>`;
      tbl.appendChild(tr);
    });
    document.getElementById("userList").classList.remove("hidden");
  } else {
    toast("Tidak ada data user.");
  }
}
