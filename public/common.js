/* ==========================================================
   🌐 SWING INVESTOR common.js (최종 통합버전)
   - Supabase 연결 + 공통 유틸 + 전역 등록 + 클릭 이동
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

// ------------------------------------------
// 🌍 전역 객체 등록
// ------------------------------------------
window.SWINGINV = window.SWINGINV || {};
SWINGINV.db = db;

// ------------------------------------------
// 🧩 공통 유틸 함수
// ------------------------------------------

/** ✅ 숫자 포맷 (1,234 형식) */
SWINGINV.nf = (num) => {
  if (num == null || num === "") return "-";
  const n = parseFloat(num);
  return isNaN(n) ? "-" : n.toLocaleString();
};

/** ✅ 퍼센트 형식 (▲1.25% / ▼-0.83%) */
SWINGINV.fmtPct = (v) => {
  if (v == null || isNaN(v)) return "-";
  const n = parseFloat(v);
  const sign = n >= 0 ? "▲" : "▼";
  const color = n >= 0 ? "#d32f2f" : "#1976d2";
  return `<span style="color:${color};font-weight:500;">${sign}${Math.abs(n).toFixed(2)}%</span>`;
};

/** ✅ 날짜 YYYY.MM.DD 형식 */
SWINGINV.fmtDate = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

/** ✅ 로딩 표시 */
SWINGINV.showLoading = (el, msg = "⏳ 로딩 중...") => {
  if (el)
    el.innerHTML = `<div style="text-align:center;color:#666;padding:20px;">${msg}</div>`;
};

/** ✅ 에러 표시 */
SWINGINV.showError = (el, msg = "❌ 오류 발생") => {
  if (el)
    el.innerHTML = `<div style="text-align:center;color:#b91c1c;padding:20px;">${msg}</div>`;
};

/** ✅ HTML Escape (XSS 방지) */
SWINGINV.esc = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// ------------------------------------------
// 🧭 종목명 클릭 시 detail.html로 이동
// ------------------------------------------
document.addEventListener("click", (e) => {
  const target = e.target.closest(".clickable-name");
  if (!target) return;

  const code = target.dataset.code;
  const name = target.dataset.name;
  if (!code) return;

  // ✅ detail.html로 이동
  const encodedName = encodeURIComponent(name || "");
  window.location.href = `detail.html?code=${code}&name=${encodedName}`;
});

console.log("✅ SWINGINV common.js initialized successfully (click event active).");
