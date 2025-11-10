/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v7.4 — Fix Warna + Search + CRUD + URL Baru
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbwAH7TUpCMajOE3Mtuz0ELcsXVurKQkFz2e5vPVVf4IT4JPHhoErMvO9A-i0A4cGB4q/exec";
console.log("✅ main.js aktif — v7.4 (Stable Full)");


/* ================= HELPER API ================= */
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


/* ================= UTILITAS ================= */
function toast(msg) { alert(msg); }
function getSession() { try { return JSON.parse(localStorage.getItem("aj_user")) || null; } catch { return null; } }
function setSession(u) { localStorage.setItem("aj_user", JSON.stringify(u)); }
function logout() { localStorage.removeItem("aj_user"); location.href = "login.html"; }

function fmtDate(d) {
  if (!d) return "-";
  const t = new Date(d);
  if (isNaN(t)) return d;
  const local = new Date(t.getTime() - t.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}


/* ================= STATUS TANGGAL ================= */
function getStatusTanggal(tgl) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(tgl);
  if (isNaN(d)) return { color: "gray", text: "Tanggal tidak valid" };

  const diff = Math.floor((d - now) / (1000 * 60 * 60 * 24));
  const abs = Math.abs(diff);
  const bulan = Math.floor(abs / 30);
  const hari = abs % 30;

  let color = "green";
  let ket = diff < 0
    ? `Telah lewat ${bulan} bln ${hari} hr`
    : diff > 0
    ? `${bulan} bln ${hari} hr lagi`
    : "Hari ini";

  if (diff <= 0) color = "red";
  else if (diff <= 30) color = "gold";

  return { color, text: ket };
}

function getStatusServis(tgl) {
  const now = new Date();
  const d = new Date(tgl);
  if (isNaN(d)) return { color: "gray", text: "-" };

  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  const bulan = Math.floor(diff / 30);
  const hari = diff % 30;

  let color = "green";
  if (bulan >= 4) color = "red";
  else if (bulan >= 3) color = "gold";

  return { color, text: `Sudah ${bulan} bln ${hari} hr` };
}


/* ================= LOGIN / REGISTER ================= */
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


/* ================= DASHBOARD ================= */
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


/* ================= KENDARAAN (ADMIN) ================= */
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


/* ================= RENDER TABEL (WARNA AMAN) ================= */
function renderTabelKendaraan(data, isAdmin = false) {
  const tbl = document.querySelector("#tblKendaraan tbody");
  let html = "";

  data.forEach((k) => {
    const stnk = getStatusTanggal(k.STNK);
    const kir = getStatusTanggal(k.KIR);
    const pajak = getStatusTanggal(k.pajak5tahun);
    const servis = getStatusServis(k.ServisTerakhir);

    html += `
      <tr>
        <td>${k.Platnomor || "-"}</td>
        <td>${k.Letak || "-"}</td>

        <td><span style="display:inline-block;width:12px;height:12px;background:${stnk.color};border-radius:3px;margin-right:5px;"></span>
            ${fmtDate(k.STNK)}<br><small>${stnk.text}</small></td>

        <td><span style="display:inline-block;width:12px;height:12px;background:${kir.color};border-radius:3px;margin-right:5px;"></span>
            ${fmtDate(k.KIR)}<br><small>${kir.text}</small></td>

        <td><span style="display:inline-block;width:12px;height:12px;background:${servis.color};border-radius:3px;margin-right:5px;"></span>
            ${fmtDate(k.ServisTerakhir)}<br><small>${servis.text}</small></td>

        <td><span style="display:inline-block;width:12px;height:12px;background:${pajak.color};border-radius:3px;margin-right:5px;"></span>
            ${fmtDate(k.pajak5tahun)}<br><small>${pajak.text}</small></td>

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


/* ================= HAPUS KENDARAAN ================= */
async function hapusKendaraan(plat) {
  if (!confirm(`Apakah Anda yakin ingin menghapus kendaraan dengan plat "${plat}"?`)) return;
  const res = await api("deleteKendaraan", { Platnomor: plat });
  toast(res.message);
  if (res.success) {
    const reload = await api("getKendaraan");
    renderTabelKendaraan(reload.data, true);
  }
}


/* ================= EDIT (ADMIN) ================= */
function editKendaraan(dataStr) {
  const data = JSON.parse(decodeURIComponent(dataStr));
  localStorage.setItem("edit_kendaraan", JSON.stringify(data));
  location.href = "edit-kendaraan.html";
}


/* ================= TAMBAH KENDARAAN ================= */
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


/* ================= PENCARIAN (AUTO UPDATE) ================= */
let _searchInit = false;

function initSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  let clearBtn = document.getElementById("clearSearch");
  if (!clearBtn) {
    clearBtn = document.createElement("button");
    clearBtn.id = "clearSearch";
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
  }

  if (_searchInit) return;

  function applyFilter() {
    const val = (input.value || "").toLowerCase();
    document.querySelectorAll("#tblKendaraan tbody tr").forEach((row) => {
      const plat  = row.cells[0]?.innerText.toLowerCase() || "";
      const letak = row.cells[1]?.innerText.toLowerCase() || "";
      row.style.display = plat.includes(val) || letak.includes(val) ? "" : "none";
    });
    clearBtn.style.display = val ? "inline-block" : "none";
  }

  input.addEventListener("input", applyFilter);
  clearBtn.addEventListener("click", () => {
    input.value = "";
    applyFilter();
  });

  _searchInit = true;
}
