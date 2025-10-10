/* ==========================================================
   🌐 SWING INVESTOR common.js (유틸/공통 UI 전용)
   ========================================================== */

console.log("🌐 SWING INVESTOR common.js loaded");

// ------------------------------------------
// 🔗 Supabase 연결
// ------------------------------------------
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 전역 등록
window.SWINGINV = window.SWINGINV || {};
SWINGINV.db = db;

// ------------------------------------------
// 🧩 공통 유틸 함수
// ------------------------------------------
SWINGINV.nf = (num) => {
  if (num == null || num === "") return "-";
  const n = parseFloat(num);
  return isNaN(n) ? "-" : n.toLocaleString();
};

SWINGINV.fmtPct = (v) => {
  if (v == null || isNaN(v)) return "-";
  const n = parseFloat(v);
  const sign = n >= 0 ? "▲" : "▼";
  const color = n >= 0 ? "#d32f2f" : "#1976d2";
  return `<span style="color:${color};font-weight:500;">${sign}${n.toFixed(2)}%</span>`;
};

SWINGINV.fmtDate = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

SWINGINV.showLoading = (el, msg = "⏳ 로딩 중...") => {
  if (el) el.innerHTML = `<div style="text-align:center;color:#666;padding:20px;">${msg}</div>`;
};

SWINGINV.showError = (el, msg = "❌ 데이터 로딩 실패") => {
  if (el) el.innerHTML = `<div style="text-align:center;color:#b91c1c;padding:20px;">${msg}</div>`;
};

SWINGINV.esc = (str) =>
  String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ------------------------------------------
// 🌍 전역 객체로 등록
// ------------------------------------------
console.log("✅ SWINGINV common.js initialized successfully.");
