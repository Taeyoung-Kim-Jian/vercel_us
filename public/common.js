/* =========================================================
   🌐 ECONews common.js
   모든 페이지에서 공통으로 사용하는 전역 유틸리티
   - Supabase 연결
   - 숫자/퍼센트 포맷팅
   - 공통 클릭 이벤트
   - 전역 로딩/에러 핸들링
   - 로그인 세션 유지 (추가)
   ========================================================= */

console.log("🌐 ECONews common.js loaded");

// ✅ Supabase 연결 (전역)
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================================
// 🧩 공통 유틸 함수
// ==========================================================

// ✅ 숫자 포맷팅 (천 단위 콤마)
function nf(num) {
  if (num === null || num === undefined || num === "") return "-";
  const n = parseFloat(num);
  return isNaN(n) ? "-" : n.toLocaleString();
}

// ✅ 퍼센트 포맷팅 (▲▼ 색상 포함)
function fmtPct(value) {
  if (value === null || value === undefined || isNaN(value)) return "-";
  const num = parseFloat(value);
  const sign = num >= 0 ? "▲" : "▼";
  const color = num >= 0 ? "#d32f2f" : "#1976d2";
  return `<span style="color:${color}; font-weight:500;">${sign}${num.toFixed(2)}%</span>`;
}

// ✅ 날짜 포맷 (YYYY-MM-DD → YYYY.MM.DD)
function fmtDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
        d.getDate()
      ).padStart(2, "0")}`;
}

// ✅ HTML 안전 이스케이프
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// =========================================================
// ⚙️ 전역 클릭 이벤트: 종목 클릭 → detail.html 이동
// =========================================================
document.addEventListener("click", (e) => {
  const target = e.target.closest(".clickable-name");
  if (!target) return;

  const code = target.dataset.code;
  const name = target.dataset.name;
  if (!code || !name) return;

  // 이동
  location.href = `detail.html?code=${encodeURIComponent(
    code
  )}&name=${encodeURIComponent(name)}`;
});

// =========================================================
// 🌀 전역 로딩 및 에러 핸들러
// =========================================================

// 로딩 인디케이터 (간단한 텍스트 방식)
function showLoading(targetEl, message = "데이터 불러오는 중...") {
  if (!targetEl) return;
  targetEl.innerHTML = `<div style="text-align:center; padding:20px; color:#666;">⏳ ${message}</div>`;
}

function showError(targetEl, message = "데이터 로딩 실패") {
  if (!targetEl) return;
  targetEl.innerHTML = `<div style="text-align:center; padding:20px; color:#b91c1c;">❌ ${message}</div>`;
}

// =========================================================
// 🔐 Supabase Auth (로그인 세션 유지 추가)
// =========================================================

// ✅ 로그인 상태 감시 및 유지
(async () => {
  try {
    const { data: { session } } = await db.auth.getSession();
    window.ECONews = window.ECONews || {};
    ECONews.user = session?.user || null;

    db.auth.onAuthStateChange((_event, session) => {
      ECONews.user = session?.user || null;
      if (ECONews.user) {
        console.log(`✅ 로그인 유지됨: ${ECONews.user.email}`);
      } else {
        console.log("🚪 로그아웃됨");
      }
    });
  } catch (err) {
    console.error("❌ Auth 초기화 오류:", err.message);
  }
})();

// ✅ 로그인/로그아웃 유틸 함수
async function loginWithEmail(email) {
  const { error } = await db.auth.signInWithOtp({ email });
  if (error) {
    alert("❌ 로그인 실패: " + error.message);
  } else {
    alert("📩 로그인 링크를 이메일로 보냈습니다.");
  }
}

async function logoutUser() {
  await db.auth.signOut();
  alert("🚪 로그아웃 완료");
}

// =========================================================
// 🧭 전역 네임스페이스로 내보내기
// =========================================================
window.ECONews = {
  ...window.ECONews,
  db,
  nf,
  fmtPct,
  fmtDate,
  esc,
  showLoading,
  showError,
  loginWithEmail,
  logoutUser,
};
