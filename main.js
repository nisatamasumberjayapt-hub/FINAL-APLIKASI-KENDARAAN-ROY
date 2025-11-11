/****************************************************
 * PT ANISA JAYA UTAMA — Styles v4.0 by Roy
 * + Emoji-friendly buttons
 * + Smooth layout for Login, Dashboard, Kendaraan
 * + Tidak mengubah logic JS
 ****************************************************/

/* ========== ROOT COLOR ========== */
:root {
  --aju-blue: #2c7bd9;
  --aju-light: #e8f0ff;
  --aju-dark: #1e5aa8;
  --aju-green: #1b6e2a;
  --aju-red: #c0392b;
  --aju-yellow: #f1c40f;
  --border: #dce4f2;
  --bg: #f7faff;
  --text: #1b1f23;
  --muted: #6b7280;
  --radius: 8px;
  --shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  --font: "Poppins", "Segoe UI", Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font);
  color: var(--text);
  background: var(--bg);
  transition: all 0.3s ease;
}

/* ========== HEADER (DASHBOARD & KENDARAAN) ========== */
header {
  background: linear-gradient(90deg, var(--aju-blue), var(--aju-dark));
  color: #fff;
  padding: 14px 20px;
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  letter-spacing: 0.3px;
  box-shadow: var(--shadow);
}

header span.logo {
  font-size: 22px;
  margin-right: 8px;
}

/* ========== CONTAINER ========== */
.container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 15px;
}

/* ========== CARD ========== */
.card {
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
}

/* ========== BUTTONS ========== */
button {
  border: none;
  border-radius: var(--radius);
  padding: 8px 14px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* Tombol utama */
.btn-primary {
  background: var(--aju-green);
  color: #fff;
}
.btn-primary:hover {
  background: #13521d;
}

/* Tombol batal */
.btn-cancel {
  background: #999;
  color: #fff;
}
.btn-cancel:hover {
  background: #777;
}

/* Tombol edit / hapus */
.btn-edit {
  background: var(--aju-yellow);
  color: #000;
}
.btn-edit:hover {
  background: #f7d85e;
}

.btn-delete {
  background: var(--aju-red);
  color: #fff;
}
.btn-delete:hover {
  background: #a93226;
}

/* Emoji pada tombol */
.btn-edit::before {
  content: "✏️";
}
.btn-delete::before {
  content: "🗑️";
}
.btn-primary::before {
  content: "🚗";
}
.btn-cancel::before {
  content: "❌";
}

/* Logout button special */
.logout-btn {
  background: #f14c4c;
  color: #fff;
  border-radius: var(--radius);
  padding: 8px 12px;
}
.logout-btn::before {
  content: "🚪";
}
.logout-btn:hover {
  background: #d33434;
}

/* ========== SEARCH BAR ========== */
.search-container {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

#searchInput {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

#searchInput:focus {
  border-color: var(--aju-blue);
  box-shadow: 0 0 0 2px rgba(44, 123, 217, 0.2);
}

/* Tombol Clear ❌ */
#clearSearch {
  background: var(--aju-blue);
  color: #fff;
  padding: 8px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 15px;
  box-shadow: var(--shadow);
  transition: background 0.2s;
}
#clearSearch::before {
  content: "🔍";
  margin-right: 5px;
}
#clearSearch:hover {
  background: var(--aju-dark);
}

/* ========== TABLE ========== */
.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  background: #fff;
  margin-top: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 850px;
}

th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
  font-size: 14px;
}

th {
  background: var(--aju-blue);
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  position: sticky;
  top: 0;
}

td small {
  color: var(--muted);
}

tr:hover {
  background: #f0f6ff;
  transition: 0.2s;
}

/* Scrollbar halus */
.table-container::-webkit-scrollbar {
  height: 8px;
}
.table-container::-webkit-scrollbar-thumb {
  background: #b0c4e4;
  border-radius: 4px;
}
.table-container::-webkit-scrollbar-track {
  background: #f1f3f9;
}

/* ========== FORM (Tambah / Edit) ========== */
form {
  display: grid;
  gap: 12px;
  max-width: 500px;
  margin-top: 15px;
}

input[type="text"],
input[type="date"],
input[type="password"] {
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  width: 100%;
  transition: all 0.2s;
}

input:focus {
  border-color: var(--aju-blue);
  box-shadow: 0 0 0 2px rgba(44, 123, 217, 0.25);
  outline: none;
}

/* ========== LOGIN PAGE ========== */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(circle at top left, #eaf3ff, #cfe0ff);
}

.login-card {
  background: #fff;
  padding: 30px 25px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 340px;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.login-card h2 {
  margin-bottom: 18px;
  color: var(--aju-dark);
}

.login-card input {
  width: 100%;
  padding: 10px;
  margin-bottom: 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  font-size: 14px;
}

.login-card button {
  width: 100%;
  padding: 10px;
  background: var(--aju-green);
  color: white;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 15px;
  transition: 0.3s;
}
.login-card button::before {
  content: "🔑";
  margin-right: 6px;
}
.login-card button:hover {
  background: #13521d;
}

.login-card a {
  color: var(--aju-blue);
  text-decoration: none;
}
.login-card a:hover {
  text-decoration: underline;
}

/* ========== FOOTER ========== */
footer {
  text-align: center;
  padding: 15px;
  font-size: 13px;
  color: var(--muted);
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  table {
    min-width: 650px;
  }
}

/* ========== ANIMASI ========== */
.fade-in {
  animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== TOAST ALERT (untuk pesan kecil bawah kanan) ========== */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--aju-dark);
  color: white;
  padding: 10px 14px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  animation: fadeIn 0.5s ease;
}

/* ========== BONUS - Header Dashboard Emoji ========== */
header::before {
  content: "🏢 ";
}
