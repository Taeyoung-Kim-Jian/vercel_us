/* ==========================================================
   🌐 SWING INVESTOR common.js
   (Supabase Auth UI + Google 로그인 통합 버전)
   ========================================================== */

console.log("🌐 SWING INVESTOR common.js loaded");

// ===========================================
// 🔗 Supabase 연결
// ===========================================
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===========================================
// 🧩 유틸 함수
// ===========================================
function nf(num) {
  if (num === null || num === undefined || num === "") return "-";
  const n = parseFloat(num);
  return isNaN(n) ? "-" : n.toLocaleString();
}

function fmtPct(value) {
  if (value === null || value === undefined || isNaN(value)) return "-";
  const num = parseFloat(value);
  const sign = num >= 0 ? "▲" : "▼";
  const color = num >= 0 ? "#d32f2f" : "#1976d2";
  return `<span style="color:${color};font-weight:500;">${sign}${num.toFixed(2)}%</span>`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d)
    ? dateStr
    : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function showLoading(t, msg = "데이터 불러오는 중...") {
  if (t) t.innerHTML = `<div style="text-align:center;color:#666;padding:20px;">⏳ ${msg}</div>`;
}
function showError(t, msg = "데이터 로딩 실패") {
  if (t) t.innerHTML = `<div style="text-align:center;color:#b91c1c;padding:20px;">❌ ${msg}</div>`;
}

// ===========================================
// 🔐 로그인 세션 관리
// ===========================================
(async () => {
  try {
    const { data: { session } } = await db.auth.getSession();
    window.SWINGINV = window.SWINGINV || {};
    SWINGINV.user = session?.user || null;

    db.auth.onAuthStateChange((_event, session) => {
      SWINGINV.user = session?.user || null;
      SWINGINV_updateHeaderAuthUI();
    });

    // 비로그인 접근 차단 페이지
    const protectedPages = ["watch.html", "board.html"];
    const current = location.pathname.split("/").pop();
    if (protectedPages.includes(current) && !SWINGINV.user) {
      alert("로그인이 필요한 서비스입니다.");
      location.href = "login.html";
    }
  } catch (err) {
    console.error("❌ Auth 초기화 오류:", err.message);
  }
})();

// ===========================================
// 🚪 로그아웃
// ===========================================
async function logoutUser() {
  await db.auth.signOut();
  SWINGINV.user = null;
  SWINGINV_updateHeaderAuthUI();
  alert("🚪 로그아웃 완료");
}

// ===========================================
// 🧭 헤더 로그인 상태 갱신
// ===========================================
function SWINGINV_updateHeaderAuthUI() {
  const userLabel = document.getElementById("user-email");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (!userLabel || !loginBtn || !logoutBtn) return;

  const user = SWINGINV.user;
  if (user) {
    userLabel.textContent = `👤 ${user.email}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    userLabel.textContent = "로그아웃 중";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }

  logoutBtn.onclick = logoutUser;
}

// ===========================================
// 📋 메뉴 활성화 강조
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
  const current = location.pathname.split("/").pop();
  document.querySelectorAll(".gnb button").forEach((btn) => {
    const m = btn.getAttribute("onclick")?.match(/'(.*?)'/);
    if (m && current === m[1]) btn.classList.add("active");
  });
  SWINGINV_updateHeaderAuthUI();
});

// ===========================================
// 🌍 전역 등록
// ===========================================
window.SWINGINV = {
  ...window.SWINGINV,
  db,
  nf,
  fmtPct,
  fmtDate,
  esc,
  showLoading,
  showError,
  logoutUser,
  SWINGINV_updateHeaderAuthUI,
};
