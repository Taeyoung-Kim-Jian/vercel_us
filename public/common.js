/* ==========================================================
   🌐 SWING INVESTOR common.js (회원가입 + 로그인 통합)
   ----------------------------------------------------------
   포함 기능:
   - Supabase 연결 및 세션 유지
   - 회원가입 / 로그인 / 로그아웃
   - 숫자, 퍼센트, 날짜 포맷
   - 종목 상세 이동 / 로딩 / 에러
   - 헤더 로그인 상태 UI 반영
   ========================================================== */

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
// 📈 종목 클릭 시 상세 페이지 이동
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
// ⏳ 로딩 및 에러 표시
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
// 🔐 Supabase Auth — 세션 유지
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

// =========================================================
// 🧑‍💻 회원가입 / 로그인 / 로그아웃
// =========================================================

// ✅ 회원가입
async function signUpWithEmail(email, password) {
  const { error } = await db.auth.signUp({ email, password });
  if (error) {
    alert("❌ 회원가입 실패: " + error.message);
  } else {
    alert("✅ 회원가입 완료! 이메일 인증 후 로그인하세요.");
  }
}

// ✅ 로그인
async function loginWithPassword(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    alert("❌ 로그인 실패: " + error.message);
  } else {
    alert("✅ 로그인 성공");
    SWINGINV.user = data.user;
    SWINGINV_updateHeaderAuthUI();
  }
}

// ✅ 로그아웃
async function logoutUser() {
  await db.auth.signOut();
  SWINGINV.user = null;
  SWINGINV_updateHeaderAuthUI();
  alert("🚪 로그아웃 완료");
}

// =========================================================
// 🧭 헤더 로그인 상태 반영
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
    userLabel.textContent = "로그아웃 중";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }

  loginBtn.onclick = async () => {
    const mode = prompt("로그인 또는 회원가입 중 선택 (login/signup):");
    const email = prompt("이메일을 입력하세요:");
    const password = prompt("비밀번호를 입력하세요 (6자 이상):");

    if (!email || !password) return alert("이메일과 비밀번호를 모두 입력하세요.");

    if (mode === "signup") {
      await signUpWithEmail(email, password);
    } else {
      await loginWithPassword(email, password);
    }
  };

  logoutBtn.onclick = async () => await logoutUser();
}

// =========================================================
// 🧭 네비게이션 메뉴 활성화
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  const current = location.pathname.split("/").pop();
  const menuButtons = document.querySelectorAll(".scroll-menu button");

  menuButtons.forEach((btn) => {
    const match = btn.getAttribute("onclick")?.match(/'(.*?)'/);
    if (match && current === match[1]) {
      btn.style.background = "#e0e7ff";
      btn.style.fontWeight = "600";
      btn.style.color = "#1d4ed8";
    }
  });

  SWINGINV_updateHeaderAuthUI();
});

// =========================================================
// 🌍 전역 네임스페이스 등록
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
  signUpWithEmail,
  loginWithPassword,
  logoutUser,
  SWINGINV_updateHeaderAuthUI,
};
