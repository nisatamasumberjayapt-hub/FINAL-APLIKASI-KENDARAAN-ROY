/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v6.2 — Indikator per kolom + Pencarian & Clear yang robust
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbx5Ij7T7FBL1cs6327qrkLnQNwI2MSqw27di59sn3ud1pDqRzY3wb2zuBhF_N9wzrEc/exec";
console.log("✅ main.js aktif — v6.2");

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

  renderTabelKendaraan(res.data);
  initSearch(); // aktifkan pencarian + tombol clear
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

/* ================= RENDER ================= */
function renderTabelKendaraan(data) {
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
        <td><span style="display:inline-block;width:12px;height:12px;background:${stnk.color};border-radius:2px;margin-right:5px;"></span>
            ${fmtDate(k.STNK)}<br><small>${stnk.text}</small></td>
        <td><span style="display:inline-block;width:12px;height:12px;background:${kir.color};border-radius:2px;margin-right:5px;"></span>
            ${fmtDate(k.KIR)}<br><small>${kir.text}</small></td>
        <td><span style="display:inline-block;width:12px;height:12px;background:${servis.color};border-radius:2px;margin-right:5px;"></span>
            ${fmtDate(k.ServisTerakhir)}<br><small>${servis.text}</small></td>
        <td><span style="display:inline-block;width:12px;height:12px;background:${pajak.color};border-radius:2px;margin-right:5px;"></span>
            ${fmtDate(k.pajak5tahun)}<br><small>${pajak.text}</small></td>
        <td></td>
      </tr>`;
  });
  tbl.innerHTML = html || `<tr><td colspan="7" align="center">Tidak ada data kendaraan</td></tr>`;
}

/* ================= USER ================= */
async function initUser() {
  const user = getSession();
  if (!user) return (location.href = "login.html");
  const tbl = document.querySelector("#tblUser tbody");
  tbl.innerHTML = `<tr><td colspan="3" align="center">Memuat data...</td></tr>`;
  const res = await api("getUsers");
  if (!res.success || !Array.isArray(res.data)) {
    tbl.innerHTML = `<tr><td colspan="3" align="center">Gagal memuat data user</td></tr>`;
    return;
  }
  let html = "";
  res.data.forEach(u => {
    html += `<tr><td>${u.nama || "-"}</td><td>${u.username || "-"}</td><td>${u.role || "-"}</td></tr>`;
  });
  tbl.innerHTML = html || `<tr><td colspan="3" align="center">Tidak ada data user</td></tr>`;
}

/* ================= SIMPAN ================= */
async function simpanKendaraan() {
  const plat = document.getElementById("plat").value.trim();
  const letak = document.getElementById("letak").value.trim();
  const stnk = document.getElementById("stnk").value;
  const kir = document.getElementById("kir").value;
  const servis = document.getElementById("servis").value;
  const pajak5 = document.getElementById("pajak5").value;
  if (!plat || !letak) return toast("Plat nomor dan lokasi harus diisi!");
  const res = await api("addKendaraan", {
    Platnomor: plat, Letak: letak,
    STNK: stnk, KIR: kir, ServisTerakhir: servis, pajak5tahun: pajak5
  });
  toast(res.message);
  if (res.success) location.href = "kendaraan.html";
}

/* =====================================================
   PENCARIAN + TOMBOL CLEAR — ROBUST (nggak perlu id khusus)
   ===================================================== */
let _searchReady = false;

function initSearch() {
  if (_searchReady) return; // cegah double-init

  // Cari input pencarian secara fleksibel:
  const input =
    document.getElementById("searchInput") ||
    document.querySelector(".search-box input") ||
    document.querySelector('input[placeholder*="Cari kendaraan"]') ||
    document.querySelector('input[placeholder*="Plat Nomor"]');

  if (!input) {
    console.warn("🔎 Input pencarian tidak ditemukan. Pastikan ada input di area pencarian.");
    return;
  }

  // Tambahkan tombol clear (❌) bila belum ada
  let clearBtn =
    document.getElementById("clearSearch") ||
    input.parentElement.querySelector(".clear-search-btn");

  if (!clearBtn) {
    clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.id = "clearSearch";
    clearBtn.className = "clear-search-btn";
    clearBtn.textContent = "❌";
    clearBtn.title = "Reset pencarian";
    // styling ringan
    clearBtn.style.marginLeft = "8px";
    clearBtn.style.padding = "2px 8px";
    clearBtn.style.border = "none";
    clearBtn.style.background = "#c0392b";
    clearBtn.style.color = "white";
    clearBtn.style.borderRadius = "4px";
    clearBtn.style.cursor = "pointer";
    clearBtn.style.fontSize = "14px";
    clearBtn.style.display = "none"; // awalnya disembunyikan

    // sisipkan setelah input
    input.parentNode.insertBefore(clearBtn, input.nextSibling);
  }

  const rows = Array.from(document.querySelectorAll("#tblKendaraan tbody tr"));

  const filterRows = () => {
    const q = (input.value || "").trim().toLowerCase();
    let shown = 0;
    rows.forEach((r) => {
      const plat = r.cells[0]?.innerText.toLowerCase() || "";
      const letak = r.cells[1]?.innerText.toLowerCase() || "";
      const match = plat.includes(q) || letak.includes(q);
      r.style.display = match ? "" : "none";
      if (match) shown++;
    });
    // tampilkan tombol clear hanya jika ada input
    clearBtn.style.display = q ? "inline-block" : "none";

    // kalau tidak ada hasil & ada query, tetap biarkan kosong (tanpa mengotak-atik data asli)
    if (shown === 0 && q) {
      // optionally: bisa tambahkan baris informasi "Tidak ada hasil"
      // tapi kita biarkan kosong agar bersih
    }
  };

  // input ketik langsung filter
  input.addEventListener("input", filterRows);

  // tombol clear reset
  clearBtn.addEventListener("click", () => {
    input.value = "";
    filterRows();      // show all
    input.focus();
  });

  // inisialisasi state awal
  filterRows();
  _searchReady = true;
}

// (opsional) supaya bisa dipanggil dari HTML oninput="handleSearchInput(this.value)"
window.handleSearchInput = function (val) {
  initSearch(); // pastikan sudah siap
  const input =
    document.getElementById("searchInput") ||
    document.querySelector(".search-box input") ||
    document.querySelector('input[placeholder*="Cari kendaraan"]') ||
    document.querySelector('input[placeholder*="Plat Nomor"]');
  if (!input) return;
  input.value = val;
  // trigger manual
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
