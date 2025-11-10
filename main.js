/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js v1.5 — Stabil (STNK, KIR, Servis, Pajak 5 Tahun)
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbxMwBMv4-0-ttB8WfhC5NfwNpJuKgVdcsz4vdWj8mViO4DGSBqaUKiIIgyAItPlEM-amg/exec";
console.log("✅ main.js aktif — versi 1.5 stabil");

/* ====== Helper umum ====== */
async function api(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload })
    });
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    console.error("Fetch error:", e);
    return { success: false, message: "Server tidak dapat dihubungi." };
  }
}

function toast(msg) { alert(msg); }
function getSession() { return JSON.parse(localStorage.getItem("aj_user") || "null"); }
function setSession(u) { localStorage.setItem("aj_user", JSON.stringify(u)); }
function logout() { localStorage.removeItem("aj_user"); location.href = "login.html"; }

/* ===== FORMAT TANGGAL ===== */
function formatTanggal(isoDate) {
  if (!isoDate) return "-";
  const d = new Date(isoDate);
  if (isNaN(d)) return isoDate;
  return d.toISOString().split("T")[0];
}

/* ===== PERHITUNGAN ===== */

// --- Hitung sisa hari (untuk STNK, KIR, Pajak) ---
function hitungSisaHari(isoDate) {
  if (!isoDate) return "";
  const sekarang = new Date();
  const target = new Date(isoDate);
  const selisihMs = target - sekarang;
  const selisihHari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
  if (selisihHari < 0) return `⚠ Telah lewat ${Math.abs(selisihHari)} hari`;
  return `${selisihHari} hari lagi`;
}

// --- Hitung waktu sejak servis terakhir ---
function hitungSejakServis(isoDate) {
  if (!isoDate) return "";
  const sekarang = new Date();
  const lastServis = new Date(isoDate);
  const selisihMs = sekarang - lastServis;
  const selisihHari = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
  const bulan = Math.floor(selisihHari / 30);
  const hari = selisihHari % 30;
  return `Sudah ${bulan} bulan ${hari} hari`;
}

/* ===== WARNA PERINGATAN ===== */

// Untuk STNK / KIR / Pajak (≤10 hari)
function warnaPeringatan(isoDate) {
  if (!isoDate) return "";
  const sisa = new Date(isoDate) - new Date();
  const hari = sisa / (1000 * 60 * 60 * 24);
  if (hari < 0) return "expired";
  if (hari <= 10) return "warning";
  return "";
}

// Untuk Servis (berdasarkan lama sejak servis)
function warnaServis(isoDate) {
  if (!isoDate) return "";
  const sekarang = new Date();
  const lastServis = new Date(isoDate);
  const selisihHari = Math.floor((sekarang - lastServis) / (1000 * 60 * 60 * 24));
  const bulan = selisihHari / 30;
  if (bulan >= 4) return "expired";
  if (bulan >= 3) return "warning";
  return "safe";
}

/* ===== RENDER KENDARAAN ===== */
function renderKendaraan(rows) {
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;

  if (!rows?.length) {
    tbody.innerHTML = `<tr><td colspan="7" align="center">🚫 Tidak ada data kendaraan</td></tr>`;
    document.getElementById("legend")?.remove();
    return;
  }

  tbody.innerHTML = rows.map(k => {
    const stnkWarn = warnaPeringatan(k.STNK);
    const kirWarn = warnaPeringatan(k.KIR);
    const servisWarn = warnaServis(k.ServisTerakhir);
    const pajakWarn = warnaPeringatan(k.pajak5tahun || k.Pajak5Tahun || k.Pajak5 || "");

    return `
      <tr>
        <td>${k.PlatNomor || k.Platnomor || "-"}</td>
        <td>${k.Letak || "-"}</td>

        <td class="${stnkWarn}">
          ${formatTanggal(k.STNK)}<br>
          <small>${hitungSisaHari(k.STNK)}</small>
        </td>

        <td class="${kirWarn}">
          ${formatTanggal(k.KIR)}<br>
          <small>${hitungSisaHari(k.KIR)}</small>
        </td>

        <td class="${servisWarn}">
          ${formatTanggal(k.ServisTerakhir)}<br>
          <small>${hitungSejakServis(k.ServisTerakhir)}</small>
        </td>

        <td class="${pajakWarn}">
          ${formatTanggal(k.pajak5tahun)}<br>
          <small>${hitungSisaHari(k.pajak5tahun)}</small>
        </td>

        <td>-</td>
      </tr>`;
  }).join("");

  tampilkanLegenda();
}

/* ===== LEGENDA WARNA ===== */
function tampilkanLegenda() {
  const existing = document.getElementById("legend");
  if (existing) existing.remove();

  const legend = document.createElement("div");
  legend.id = "legend";
  legend.className = "legend-container";
  legend.innerHTML = `
    <div class="legend-item"><span class="legend-box safe"></span> Aman (Servis < 3 bulan)</div>
    <div class="legend-item"><span class="legend-box warning"></span> Peringatan (STNK/KIR/Pajak ≤ 10 hari, Servis ≥ 3 bulan)</div>
    <div class="legend-item"><span class="legend-box expired"></span> Lewat (STNK/KIR/Pajak habis, Servis ≥ 4 bulan)</div>
  `;
  const table = document.getElementById("tblKendaraan");
  table.parentNode.appendChild(legend);
}

/* ===== PENCARIAN ===== */
let searchTimer = null;
let searchSeq = 0;

function uniqueByPlat(arr) {
  const seen = new Set();
  return arr.filter(x => {
    const key = (x.PlatNomor || x.Platnomor || "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function handleSearchInput(termRaw) {
  const term = (termRaw || "").trim();
  if (searchTimer) clearTimeout(searchTimer);

  searchTimer = setTimeout(async () => {
    const mySeq = ++searchSeq;
    const tbody = document.querySelector("#tblKendaraan tbody");
    if (!tbody) return;

    if (term === "") {
      tbody.innerHTML = `<tr><td colspan="7" align="center">🔄 Memuat data...</td></tr>`;
      const res = await api("getKendaraan", { qPlat: "", qLetak: "" });
      if (mySeq !== searchSeq) return;
      if (res.success) renderKendaraan(res.data);
      return;
    }

    tbody.innerHTML = `<tr><td colspan="7" align="center">🔎 Mencari...</td></tr>`;
    const [byPlat, byLetak] = await Promise.all([
      api("getKendaraan", { qPlat: term, qLetak: "" }),
      api("getKendaraan", { qPlat: "", qLetak: term })
    ]);

    if (mySeq !== searchSeq) return;
    const list1 = byPlat.success ? (byPlat.data || []) : [];
    const list2 = byLetak.success ? (byLetak.data || []) : [];
    const merged = uniqueByPlat([...list1, ...list2]);
    renderKendaraan(merged);
  }, 250);
}

/* ===== LOAD SEMUA ===== */
async function loadAllKendaraan() {
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" align="center">🔄 Memuat data...</td></tr>`;
  const data = await api("getKendaraan", { qPlat: "", qLetak: "" });
  if (data.success) renderKendaraan(data.data);
  else tbody.innerHTML = `<tr><td colspan="7" align="center">⚠ Gagal memuat data</td></tr>`;
}

/* ===== EVENT ===== */
document.addEventListener("DOMContentLoaded", () => {
  const q = document.getElementById("q");
  if (q) {
    loadAllKendaraan();
    q.addEventListener("input", () => handleSearchInput(q.value));
  }
});
