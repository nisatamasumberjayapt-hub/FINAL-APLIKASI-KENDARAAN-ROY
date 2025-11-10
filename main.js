/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v6.1 — Indikator per kolom + Pencarian Refresh
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbx5Ij7T7FBL1cs6327qrkLnQNwI2MSqw27di59sn3ud1pDqRzY3wb2zuBhF_N9wzrEc/exec";
console.log("✅ main.js aktif — v6.1 per-kolom + pencarian");

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
  initSearch(); // aktifkan fitur pencarian realtime + tombol refresh
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

/* ================= PENCARIAN + REFRESH ================= */
function initSearch() {
  const searchBox = document.querySelector("#searchInput");
  if (!searchBox) return;

  // buat tombol X
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "❌";
  clearBtn.title = "Reset pencarian";
  clearBtn.style.marginLeft = "8px";
  clearBtn.style.padding = "2px 6px";
  clearBtn.style.border = "none";
  clearBtn.style.background = "#c0392b";
  clearBtn.style.color = "white";
  clearBtn.style.borderRadius = "4px";
  clearBtn.style.cursor = "pointer";
  clearBtn.style.fontSize = "14px";

  searchBox.parentNode.insertBefore(clearBtn, searchBox.nextSibling);

  const rows = document.querySelectorAll("#tblKendaraan tbody tr");

  // fungsi filter
  function doFilter() {
    const filter = searchBox.value.toLowerCase();
    rows.forEach((row) => {
      const plat = row.cells[0]?.textContent.toLowerCase() || "";
      const letak = row.cells[1]?.textContent.toLowerCase() || "";
      row.style.display = (plat.includes(filter) || letak.includes(filter)) ? "" : "none";
    });
  }

  // event ketika ketik
  searchBox.addEventListener("keyup", doFilter);

  // tombol X = reset
  clearBtn.addEventListener("click", () => {
    searchBox.value = "";
    rows.forEach(r => r.style.display = "");
  });
}
