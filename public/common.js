/* ==========================================================
   🌐 SWING INVESTOR common.js
   모든 페이지에서 공통으로 사용하는 전역 유틸리티
   ---------------------------------------------------------
   포함 기능:
   - Supabase 연결 및 로그인 세션 유지
   - 숫자/퍼센트/날짜 포맷팅
   - 공통 클릭 이벤트 (종목 상세 이동)
   - 로딩/에러 표시
   - 로그인/로그아웃 버튼 자동 제어
   - 네비게이션(메뉴) 활성화
   ========================================================= */

console.log("🌐 SWING INVESTOR common.js loaded");

// =========================================================
// 🔗 Supabase 연결
// =========================================================
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================================================
// 🧩 포맷팅 유틸
// =========================================================
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
  return `<span style="color:${color}; font-weight:500;">${sign}${num.toFixed(2)}%</span>`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
        d.getDate()
      ).padStart(2, "0")}`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// =========================================================
// ⚙️ 공통 클릭 이벤트 (종목 상세 페이지 이동)
// =========================================================
document.addEventListener("click", (e) => {
  const target = e.target.closest(".clickable-name");
  if (!target) return;

  const code = target.dataset.code;
  const name = target.dataset.name;
  if (!code || !name) return;

  location.href = `detail.html?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`;
});

// =========================================================
// 🌀 로딩 및 에러 표시
// =========================================================
function showLoading(targetEl, message = "데이터 불러오는 중...") {
  if (!targetEl) return;
  targetEl.innerHTML = `<div style="text-align:center; padding:20px; color:#666;">⏳ ${message}</div>`;
}

function showError(targetEl, message = "데이터 로딩 실패") {
  if (!targetEl) return;
  targetEl.innerHTML = `<div style="text-align:center; padding:20px; color:#b91c1c;">❌ ${message}</div>`;
}

// =========================================================
// 🔐 Supabase Auth — 로그인 세션 유지
// =========================================================
(async () => {
  try {
    const { data: { session } } = await db.auth.getSession();
    window.SWINGINV = window.SWINGINV || {};
    SWINGINV.user = session?.user || null;

    db.auth.onAuthStateChange((_event, session) => {
      SWINGINV.user = session?.user || null;
      SWINGINV_updateHeaderAuthUI();
    });
  } catch (err) {
    console.error("❌ Auth 초기화 오류:", err.message);
  }
})();

// ✅ 이메일 로그인 / 로그아웃 함수
async function loginWithEmail(email) {
  const { error } = await db.auth.signInWithOtp({ email });
  if (error) alert("❌ 로그인 실패: " + error.message);
  else alert("📩 로그인 링크를 이메일로 보냈습니다.");
}

async function logoutUser() {
  await db.auth.signOut();
  alert("🚪 로그아웃 완료");
  SWINGINV_updateHeaderAuthUI();
}

// =========================================================
// 🧭 헤더 로그인 상태 관리 (공통 UI)
// =========================================================
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
    userLabel.textContent = "로그인되지 않았습니다.";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }

  loginBtn.onclick = async () => {
    const email = prompt("이메일을 입력하세요:");
    if (email) await loginWithEmail(email);
  };
  logoutBtn.onclick = async () => await logoutUser();
}

// =========================================================
// 🧭 네비게이션 메뉴 활성화 (nav.js 통합)
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  // 현재 페이지 파일명 추출
  const current = location.pathname.split("/").pop();

  // 스크롤 메뉴 버튼 강조
  const menuButtons = document.querySelectorAll(".scroll-menu button");
  menuButtons.forEach((btn) => {
    const match = btn.getAttribute("onclick")?.match(/'(.*?)'/);
    if (match && current === match[1]) {
      btn.style.background = "#e0e7ff";
      btn.style.fontWeight = "600";
    }
  });

  // 로그인 상태 표시 갱신
  SWINGINV_updateHeaderAuthUI();
});

// =========================================================
// 🌍 전역 네임스페이스 내보내기
// =========================================================
window.SWINGINV = {
  ...window.SWINGINV,
  db,
  nf,
  fmtPct,
  fmtDate,
  esc,
  showLoading,
  showError,
  loginWithEmail,
  logoutUser,
  SWINGINV_updateHeaderAuthUI,
};
