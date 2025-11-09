/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * main.js FINAL v1.3 (Dashboard Fix Width + Smart Search)
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbxMwBMv4-0-ttB8WfhC5NfwNpJuKgVdcsz4vdWj8mViO4DGSBqaUKiIIgyAItPlEM-amg/exec";
console.log("✅ main.js aktif & terhubung ke database utama");

// === HELPER API TANPA CORS ===
async function api(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload })
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("⚠️ Response bukan JSON:", text);
      return { success: false, message: "Response tidak valid" };
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return { success: false, message: "Gagal menghubungi server" };
  }
}

// === UTILITAS ===
function toast(msg) { alert(msg); }
function logout() { localStorage.removeItem("aj_user"); location.href = "login.html"; }
function fmt(d) {
  if (!d) return "-";
  if (typeof d === "string" && d.includes("T")) return d.split("T")[0];
  return d;
}

// === CARI DATA KENDARAAN (Auto Search + All Data saat kosong) ===
async function doSearch() {
  const q = document.getElementById("qSearch")?.value.trim().toLowerCase() || "";
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" align="center">🔄 Memuat data...</td></tr>`;

  try {
    const resp = await api("getKendaraan", { qPlat: q, qLetak: q });
    if (!resp.success) throw new Error(resp.message || "Gagal memuat data");

    const rows = Array.isArray(resp.data) ? resp.data : [];
    const filtered = rows.filter(k => {
      if (!q) return true; // kosong = tampil semua
      const plat = (k.PlatNomor || "").toLowerCase();
      const letak = (k.Letak || "").toLowerCase();
      return plat.includes(q) || letak.includes(q);
    });

    if (filtered.length > 0) {
      tbody.innerHTML = filtered.map(k => `
        <tr>
          <td>${k.PlatNomor || "-"}</td>
          <td>${k.Letak || "-"}</td>
          <td>${fmt(k.STNK)}</td>
          <td>${fmt(k.KIR)}</td>
          <td>${fmt(k.ServisTerakhir)}</td>
          <td>-</td>
        </tr>
      `).join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="6" align="center">🚫 Tidak ada data kendaraan</td></tr>`;
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" align="center">⚠️ Gagal memuat data kendaraan</td></tr>`;
  }
}

// === EVENT ===
document.addEventListener("DOMContentLoaded", () => {
  // pencarian realtime
  const qInput = document.getElementById("qSearch");
  if (qInput) {
    qInput.addEventListener("input", () => doSearch());
  }

  // load awal
  if (location.pathname.includes("dashboard.html")) {
    doSearch();
  }

  console.log("💡 Dashboard siap digunakan — PT ANISA JAYA UTAMA");
});
