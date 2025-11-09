/****************************************************
 * PT ANISA JAYA UTAMA — BY ROY
 * Frontend Logic (main.js) v1.6
 * Tambahan: Pajak 5 Tahunan + Status Warna Otomatis
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbwwp-A4sP0LKwnuseOobJNilG1z8mszHAeZXJCeqmsleUwFS0cJiSTdzl6Jzp6sZ7472A/exec";
console.log("✅ main.js aktif & terhubung ke server utama");

// ===== UTILITAS =====
function toast(msg) { alert(msg); }
function getSession() { return JSON.parse(localStorage.getItem("aj_user") || "null"); }
function setSession(u) { localStorage.setItem("aj_user", JSON.stringify(u)); }
function logout() { localStorage.removeItem("aj_user"); location.href = "login.html"; }

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toISOString().split("T")[0];
}

function daysDiff(target) {
  if (!target) return null;
  const today = new Date();
  const t = new Date(target);
  return Math.floor((t - today) / (1000 * 60 * 60 * 24));
}

function formatSelisih(target) {
  const selisih = daysDiff(target);
  if (selisih === null) return "-";
  if (selisih >= 0) return `${selisih} hari lagi`;
  return `Telah lewat ${Math.abs(selisih)} hari`;
}

// ===== API REQUEST =====
async function api(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });
  return await res.json();
}

// ===== RENDER DATA =====
function getStatusColor(dateStr, isService = false) {
  if (!dateStr) return "";
  const selisih = daysDiff(dateStr);

  // Servis (berbeda logika)
  if (isService) {
    if (selisih >= -90) return "#b2f2bb"; // hijau
    if (selisih < -90 && selisih >= -120) return "#fff3bf"; // kuning
    return "#ffa8a8"; // merah
  }

  // Untuk STNK, KIR, Pajak
  if (selisih > 10) return "#b2f2bb"; // aman
  if (selisih <= 10 && selisih >= 0) return "#fff3bf"; // peringatan
  return "#ffa8a8"; // lewat
}

async function loadKendaraan() {
  const q = document.getElementById("qCari")?.value.toLowerCase() || "";
  const tbody = document.querySelector("#tblKendaraan tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" align="center">🔄 Memuat data...</td></tr>`;

  try {
    const data = await api("getKendaraan", {});
    if (data.success && data.data?.length) {
      let filtered = data.data.filter(k =>
        k.PlatNomor.toLowerCase().includes(q) || k.Letak.toLowerCase().includes(q)
      );

      tbody.innerHTML = filtered.map(k => {
        const sSTNK = formatDate(k.STNK);
        const sKIR = formatDate(k.KIR);
        const sServis = formatDate(k.ServisTerakhir);
        const sPajak5 = formatDate(k.Pajak5Tahunan);

        return `
          <tr>
            <td>${k.PlatNomor}</td>
            <td>${k.Letak}</td>
            <td style="background:${getStatusColor(sSTNK)}">${sSTNK}<br><small>${formatSelisih(sSTNK)}</small></td>
            <td style="background:${getStatusColor(sKIR)}">${sKIR}<br><small>${formatSelisih(sKIR)}</small></td>
            <td style="background:${getStatusColor(sServis, true)}">${sServis}<br><small>${formatSelisih(sServis)}</small></td>
            <td style="background:${getStatusColor(sPajak5)}">${sPajak5}<br><small>${formatSelisih(sPajak5)}</small></td>
            <td>-</td>
          </tr>
        `;
      }).join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="7" align="center">🚫 Tidak ada data kendaraan</td></tr>`;
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" align="center">⚠️ Gagal memuat data</td></tr>`;
  }
}

// ===== INISIALISASI DASHBOARD =====
function initDashboard() {
  loadKendaraan();
  const search = document.getElementById("qCari");
  if (search) {
    search.addEventListener("input", () => loadKendaraan());
  }
  console.log("📊 Dashboard aktif — Data kendaraan dimuat");
}
