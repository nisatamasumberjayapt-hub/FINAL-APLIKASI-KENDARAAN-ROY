/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v7.0 — Kendaraan (Admin) + Edit + Search + Warna Aman
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbx5Ij7T7FBL1cs6327qrkLnQNwI2MSqw27di59sn3ud1pDqRzY3wb2zuBhF_N9wzrEc/exec";
console.log("✅ main.js aktif — v7.0 Kendaraan");

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
  return t.toISOString().split("T")[0];
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

/* ================= STATUS PER TANGGAL ================= */
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
    ? `Telah lewat ${bulan} bulan ${hari} hari`
    : diff > 0
    ? `${bulan} bulan ${hari} hari lagi`
    : "Hari ini";

  if (diff <= 0) color = "red";
  else if (diff <= 30) color = "gold";

  return { color, text: ket };
}

/* ================= SERVIS ================= */
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

  return { color, text: `Sudah ${bulan} bulan ${hari} hari` };
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

  renderTabelKendaraan(res.data, false); // mode user
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

  renderTabelKendaraan(res.data, true); // mode admin
  initSearch();
}

/* ================= RENDER ================= */
function renderTabelKendaraan(data, isAdmin = false) {
  const tbl = document.querySelector("#tblKendaraan tbody");
  let html = "";
  data.forEach((k, i) => {
    const stnk = getStatusTanggal(k.STNK);
    const kir = getStatusTanggal(k.KIR);
    const pajak = getStatusTanggal(k.pajak5tahun);
    const servis = getStatusServis(k.ServisTerakhir);

    html += `
      <tr>
        <td>${k.Platnomor || "-"}</td>
        <td>${k.Letak || "-"}</td>
        <td><span style="display:inline-block;width:12px;height:12px;background:${stnk.color};border-radius:2px;margin-right:5px;"></span>
            ${fmtDate(k.STNK)}<br><small>${stnk.text}</small></td>
        <td><span style="display:inline-block;width:12px;height:12px;background:${kir.color};border-radius:2px;margin-right:5px;"></span>
            ${fmtDate(k.KIR)}<br><small>${kir.text}</small></td>
        <td><span style="display:inline-block;width:12px;height:12px;background:${servis.color};border-radius:2px;margin-right:5px;"></span>
            ${fmtDate(k.ServisTerakhir)}<br><small>${servis.text}</small></td>
        <td><span style="display:inline-block;width:12px;height:12px;background:${pajak.color};border-radius:2px;margin-right:5px;"></span>
            ${fmtDate(k.pajak5tahun)}<br><small>${pajak.text}</small></td>
        ${
          isAdmin
            ? `<td>
                <button class="btn-edit" onclick="editKendaraan('${encodeURIComponent(JSON.stringify(k))}')">✏️ Edit</button>
              </td>`
            : `<td></td>`
        }
      </tr>`;
  });
  tbl.innerHTML = html || `<tr><td colspan="8" align="center">Tidak ada data kendaraan</td></tr>`;
}

/* ================= EDIT (MODE ADMIN) ================= */
function editKendaraan(dataStr) {
  const data = JSON.parse(decodeURIComponent(dataStr));
  localStorage.setItem("edit_kendaraan", JSON.stringify(data));
  location.href = "edit-kendaraan.html";
}

/* ================= SIMPAN TAMBAH ================= */
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

/* ================= PENCARIAN + CLEAR ================= */
function initSearch() {
  const input =
    document.getElementById("searchInput") ||
    document.querySelector('input[placeholder*="Cari kendaraan"]');

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

  const rows = document.querySelectorAll("#tblKendaraan tbody tr");

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
}/* ==========================================================
   KENDARAAN PAGE CONTROLLER (Form State, Edit/Save/Update)
   ========================================================== */

let KEND_DATA = [];            // cache data kendaraan (array of obj)
let KEND_MODE = "view";        // "view" | "add" | "edit"
let KEND_EDIT_PLAT_LAMA = "";  // untuk update (key baris lama)

// util: ambil elemen by id
const $ = (id) => document.getElementById(id);

// aktif/nonaktifkan semua input form
function setFormEnabled(enabled) {
  ["plat", "lokasi", "stnk", "kir", "servis", "pajak"].forEach(id => {
    const el = $(id);
    if (!el) return;
    if (enabled) el.removeAttribute("disabled");
    else el.setAttribute("disabled", "disabled");
  });
}

// kosongkan form
function resetForm() {
  ["plat", "lokasi", "stnk", "kir", "servis", "pajak"].forEach(id => {
    const el = $(id);
    if (el) el.value = "";
  });
}

// set tombol sesuai mode
function syncButtons() {
  const btnPrimary = $("btnPrimary");
  const btnCancel  = $("btnCancel");

  if (!btnPrimary || !btnCancel) return;

  if (KEND_MODE === "view") {
    btnPrimary.textContent = "➕ Tambah";
    btnCancel.setAttribute("disabled", "disabled");
  } else if (KEND_MODE === "add") {
    btnPrimary.textContent = "💾 Simpan";
    btnCancel.removeAttribute("disabled");
  } else if (KEND_MODE === "edit") {
    btnPrimary.textContent = "✅ Update";
    btnCancel.removeAttribute("disabled");
  }
}

// masuk ke mode view
function enterViewMode() {
  KEND_MODE = "view";
  setFormEnabled(false);
  resetForm();
  syncButtons();
}

// masuk ke mode add
function enterAddMode() {
  KEND_MODE = "add";
  setFormEnabled(true);
  resetForm();
  syncButtons();
  $("plat")?.focus();
}

// isi form untuk edit
function enterEditMode(row) {
  KEND_MODE = "edit";
  setFormEnabled(true);
  if (!row) return;

  KEND_EDIT_PLAT_LAMA = row.Platnomor || row.PlatNomor || row.plat || row.Plat;

  $("plat").value   = row.Platnomor || "";
  $("lokasi").value = row.Letak || "";
  $("stnk").value   = normalizeDateForInput(row.STNK);
  $("kir").value    = normalizeDateForInput(row.KIR);
  $("servis").value = normalizeDateForInput(row.ServisTerakhir);
  $("pajak").value  = normalizeDateForInput(row.pajak5tahun);

  syncButtons();
  $("lokasi")?.focus();
}

// normalisasi input date (YYYY-MM-DD)
function normalizeDateForInput(d) {
  if (!d) return "";
  const t = new Date(d);
  if (isNaN(t)) {
    // mungkin sudah YYYY-MM-DD
    const parts = String(d).split("-");
    if (parts.length === 3) return d;
    return "";
  }
  return t.toISOString().slice(0,10);
}

// validasi form (required + plat unik saat add)
function validateForm() {
  const plat   = $("plat").value.trim();
  const lokasi = $("lokasi").value.trim();
  const stnk   = $("stnk").value;
  const kir    = $("kir").value;
  const servis = $("servis").value;
  const pajak  = $("pajak").value;

  if (!plat)   return { ok:false, msg:"Plat nomor wajib diisi." };
  if (!lokasi) return { ok:false, msg:"Letak/Garasi wajib diisi." };
  if (!stnk)   return { ok:false, msg:"Tanggal STNK wajib diisi." };
  if (!kir)    return { ok:false, msg:"Tanggal KIR wajib diisi." };
  if (!servis) return { ok:false, msg:"Tanggal Servis Terakhir wajib diisi." };
  if (!pajak)  return { ok:false, msg:"Tanggal Pajak 5 Tahunan wajib diisi." };

  if (KEND_MODE === "add") {
    const dup = (KEND_DATA || []).some(x =>
      String(x.Platnomor || x.PlatNomor || x.plat || "")
        .toLowerCase() === plat.toLowerCase()
    );
    if (dup) return { ok:false, msg:"Plat nomor sudah ada. Gunakan plat lain." };
  }

  return { ok:true };
}

// render tabel khusus halaman kendaraan (dengan tombol Edit)
function renderKendaraanManage(rows) {
  const tbody = $("tblKendaraan")?.querySelector("tbody");
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" align="center">Tidak ada data kendaraan</td></tr>`;
    return;
  }

  const fmt = (d) => (d ? d : "-");

  tbody.innerHTML = rows.map(k => {
    const plat   = fmt(k.Platnomor);
    const letak  = fmt(k.Letak);
    const stnk   = fmt(k.STNK);
    const kir    = fmt(k.KIR);
    const serv   = fmt(k.ServisTerakhir);
    const pajak5 = fmt(k.pajak5tahun);

    return `
      <tr>
        <td>${plat}</td>
        <td>${letak}</td>
        <td>${stnk}</td>
        <td>${kir}</td>
        <td>${serv}</td>
        <td>${pajak5}</td>
        <td>
          <button class="btn-sm" onclick='handleEditClick(${JSON.stringify(k)})'>✎ Edit</button>
        </td>
      </tr>
    `;
  }).join("");
}

// global untuk onclick baris (karena pakai inline handler)
window.handleEditClick = function(rowObj) {
  enterEditMode(rowObj);
};

// ambil data & render
async function reloadKendaraanList() {
  const res = await api("getKendaraan");
  if (res && res.success) {
    KEND_DATA = res.data || [];
    renderKendaraanManage(KEND_DATA);
  } else {
    const tbody = $("tblKendaraan")?.querySelector("tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" align="center">Gagal memuat data</td></tr>`;
  }
}

// handler klik tombol utama (Tambah/Simpan/Update)
async function handlePrimaryClick() {
  if (KEND_MODE === "view") {
    // tombol: Tambah
    enterAddMode();
    return;
  }

  // ambil & validasi
  const plat   = $("plat").value.trim();
  const lokasi = $("lokasi").value.trim();
  const stnk   = $("stnk").value;
  const kir    = $("kir").value;
  const servis = $("servis").value;
  const pajak  = $("pajak").value;

  const v = validateForm();
  if (!v.ok) return alert(v.msg);

  // payload sesuai backend yang sudah ada
  const payload = {
    Platnomor: plat,
    Letak: lokasi,
    STNK: stnk,
    KIR: kir,
    ServisTerakhir: servis,
    pajak5tahun: pajak
  };

  if (KEND_MODE === "add") {
    const r = await api("addKendaraan", payload);
    alert(r.message || (r.success ? "Tersimpan" : "Gagal menyimpan"));
    if (r.success) {
      await reloadKendaraanList();
      enterViewMode();
    }
  } else if (KEND_MODE === "edit") {
    // diasumsikan Apps Script kamu punya action "updateKendaraan"
    // Jika belum ada, silakan tambahkan di backend:
    // cari baris via Platnomor lama dan update.
    const r = await api("updateKendaraan", { PlatnomorLama: KEND_EDIT_PLAT_LAMA, ...payload });
    alert(r.message || (r.success ? "Terupdate" : "Gagal update"));
    if (r.success) {
      await reloadKendaraanList();
      enterViewMode();
    }
  }
}

// handler batal
function handleCancel() {
  enterViewMode();
}

// init halaman kendaraan
function initKendaraanPage() {
  // tombol
  $("btnPrimary")?.addEventListener("click", handlePrimaryClick);
  $("btnCancel") ?.addEventListener("click", handleCancel);

  // pencarian
  const search = $("searchInput");
  if (search) {
    search.addEventListener("input", async () => {
      const term = (search.value || "").trim().toLowerCase();
      if (!term) return renderKendaraanManage(KEND_DATA);
      const filtered = (KEND_DATA || []).filter(x => {
        const p = String(x.Platnomor || "").toLowerCase();
        const l = String(x.Letak || "").toLowerCase();
        return p.includes(term) || l.includes(term);
      });
      renderKendaraanManage(filtered);
    });
  }

  // awal: view mode & load data
  enterViewMode();
  reloadKendaraanList();
}


