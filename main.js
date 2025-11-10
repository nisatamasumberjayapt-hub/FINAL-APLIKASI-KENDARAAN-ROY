/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v7.2 — Fix tampilan tabel, CRUD, Search, Hapus Aman
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbwAH7TUpCMajOE3Mtuz0ELcsXVurKQkFz2e5vPVVf4IT4JPHhoErMvO9A-i0A4cGB4q/exec";
console.log("✅ main.js aktif — v7.2 (Fix Tabel + CRUD)");

// ================= HELPER API ================= //
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
      return { success: false, message: "Respon tidak valid dari server" };
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return { success: false, message: "Gagal menghubungi server" };
  }
}

// ================= UTILITAS ================= //
function toast(msg) { alert(msg); }
function getSession() {
  try { return JSON.parse(localStorage.getItem("aj_user")) || null; }
  catch { return null; }
}
function setSession(u) { localStorage.setItem("aj_user", JSON.stringify(u)); }
function logout() { localStorage.removeItem("aj_user"); location.href = "login.html"; }

function fmtDate(d) {
  if (!d) return "-";
  const t = new Date(d);
  if (isNaN(t)) return d;
  // fix timezone offset (biar gak mundur sehari)
  const local = new Date(t.getTime() - t.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

// ================= LOGIN / REGISTER ================= //
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return toast("Isi username dan password!");
  const res = await api("login", { username, password });
  if (res.success) {
    setSession(res.user);
    location.href = "dashboard.html";
  } else toast(res.message || "Username atau password salah");
}

async function register() {
  const username = document.getElementById("username").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !nama || !password)
    return toast("Semua kolom wajib diisi!");
  const res = await api("register", { username, nama, password });
  toast(res.message);
  if (res.success) location.href = "login.html";
}

// ================= DASHBOARD (USER VIEW) ================= //
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

  renderTabelKendaraan(res.data, false);
  initSearch();
}

// ================= KENDARAAN (ADMIN) ================= //
async function initKendaraan() {
  const user = getSession();
  if (!user) return (location.href = "login.html");
  if (user.role !== "admin") {
    toast("Hanya admin yang bisa mengakses halaman ini!");
    return (location.href = "dashboard.html");
  }

  const tbl = document.querySelector("#tblKendaraan tbody");
  tbl.innerHTML = `<tr><td colspan="8" align="center">Memuat data kendaraan...</td></tr>`;

  const res = await api("getKendaraan");
  if (!res.success || !Array.isArray(res.data)) {
    tbl.innerHTML = `<tr><td colspan="8" align="center">Gagal memuat data kendaraan</td></tr>`;
    return;
  }

  renderTabelKendaraan(res.data, true);
  initSearch();
}

// ================= RENDER TABEL ================= //
function renderTabelKendaraan(data, isAdmin = false) {
  const tbl = document.querySelector("#tblKendaraan tbody");
  let html = "";

  data.forEach((k) => {
    html += `
      <tr>
        <td>${k.Platnomor || "-"}</td>
        <td>${k.Letak || "-"}</td>
        <td>${fmtDate(k.STNK)}</td>
        <td>${fmtDate(k.KIR)}</td>
        <td>${fmtDate(k.ServisTerakhir)}</td>
        <td>${fmtDate(k.pajak5tahun)}</td>
        ${
          isAdmin
            ? `<td>
                <button class="btn-edit" style="background:#f1c40f;color:#000;margin-right:5px"
                  onclick="editKendaraan('${encodeURIComponent(JSON.stringify(k))}')">✏️ Edit</button>
                <button class="btn-delete" style="background:#c0392b;color:#fff;"
                  onclick="hapusKendaraan('${k.Platnomor}')">🗑 Hapus</button>
              </td>`
            : `<td></td>`
        }
      </tr>`;
  });

  tbl.innerHTML =
    html || `<tr><td colspan="8" align="center">Tidak ada data kendaraan</td></tr>`;
}

// ================= HAPUS KENDARAAN ================= //
async function hapusKendaraan(plat) {
  if (!confirm(`Apakah Anda yakin ingin menghapus kendaraan dengan plat "${plat}"?`)) return;
  const res = await api("deleteKendaraan", { Platnomor: plat });
  toast(res.message);
  if (res.success) {
    const reload = await api("getKendaraan");
    renderTabelKendaraan(reload.data, true);
  }
}

// ================= EDIT (ADMIN) ================= //
function editKendaraan(dataStr) {
  const data = JSON.parse(decodeURIComponent(dataStr));
  localStorage.setItem("edit_kendaraan", JSON.stringify(data));
  location.href = "edit-kendaraan.html";
}

// ================= TAMBAH KENDARAAN ================= //
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

// ================= PENCARIAN + CLEAR ================= //
function initSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  const rows = document.querySelectorAll("#tblKendaraan tbody tr");
  let clearBtn = document.createElement("button");
  clearBtn.textContent = "❌";
  clearBtn.title = "Reset pencarian";
  Object.assign(clearBtn.style, {
    marginLeft: "8px",
    padding: "2px 8px",
    border: "none",
    background: "#c0392b",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer",
    display: "none",
  });

  input.parentNode.insertBefore(clearBtn, input.nextSibling);

  function filterRows() {
    const val = input.value.toLowerCase();
    let found = 0;
    rows.forEach((row) => {
      const plat = row.cells[0]?.innerText.toLowerCase() || "";
      const letak = row.cells[1]?.innerText.toLowerCase() || "";
      const visible = plat.includes(val) || letak.includes(val);
      row.style.display = visible ? "" : "none";
      if (visible) found++;
    });
    clearBtn.style.display = val ? "inline-block" : "none";
  }

  input.addEventListener("input", filterRows);
  clearBtn.addEventListener("click", () => {
    input.value = "";
    rows.forEach((r) => (r.style.display = ""));
    clearBtn.style.display = "none";
  });
}
