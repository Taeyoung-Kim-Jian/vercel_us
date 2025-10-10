/* ==========================================================
   🌐 SWING INVESTOR common.js (v3.6)
   - Supabase 초기화 및 인증 상태 관리
   - 로그인/로그아웃/닉네임 관리
   - 전역 유틸 함수 포함
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
// 🧩 전역 객체 생성
// ------------------------------------------
window.SWINGINV = window.SWINGINV || {};
SWINGINV.db = db;

// ------------------------------------------
// 🧩 유틸 함수들
// ------------------------------------------
SWINGINV.nf = function (num) {
  if (num == null || num === "") return "-";
  const n = parseFloat(num);
  return isNaN(n) ? "-" : n.toLocaleString();
};

SWINGINV.fmtDate = function (str) {
  if (!str) return "-";
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

SWINGINV.showLoading = function (target, msg = "⏳ 데이터 불러오는 중...") {
  if (target)
    target.innerHTML = `<div style="text-align:center;color:#666;padding:20px;">${msg}</div>`;
};

SWINGINV.showError = function (target, msg = "❌ 데이터 로딩 실패") {
  if (target)
    target.innerHTML = `<div style="text-align:center;color:#b91c1c;padding:20px;">${msg}</div>`;
};

// ------------------------------------------
// 🔐 로그인 세션 관리
// ------------------------------------------
(async () => {
  try {
    const { data: { session } } = await db.auth.getSession();
    SWINGINV.user = session?.user || null;

    // 로그인 상태 변경 감시
    db.auth.onAuthStateChange(async (_event, session) => {
      SWINGINV.user = session?.user || null;
      if (SWINGINV.user) await SWINGINV_checkNickname();
      SWINGINV_updateHeaderAuthUI();
    });

    if (SWINGINV.user) await SWINGINV_checkNickname();
    SWINGINV_updateHeaderAuthUI();
  } catch (err) {
    console.error("❌ 인증 초기화 오류:", err.message);
  }
})();

// ------------------------------------------
// 👤 닉네임 확인 및 등록
// ------------------------------------------
async function SWINGINV_checkNickname() {
  if (!SWINGINV.user) return;
  try {
    const { data, error } = await db
      .from("profiles")
      .select("nickname")
      .eq("id", SWINGINV.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("닉네임 조회 실패:", error.message);
      return;
    }

    if (!data || !data.nickname) {
      SWINGINV.user.nickname = "";
    } else {
      SWINGINV.user.nickname = data.nickname;
    }
  } catch (e) {
    console.error("닉네임 확인 중 오류:", e.message);
  }
}

// ------------------------------------------
// 🚪 로그아웃
// ------------------------------------------
async function logoutUser() {
  try {
    await db.auth.signOut();
    SWINGINV.user = null;
    SWINGINV_updateHeaderAuthUI();
    alert("🚪 로그아웃 완료");
  } catch (err) {
    alert("로그아웃 실패: " + err.message);
  }
}

// ------------------------------------------
// 🧭 헤더 로그인/로그아웃 UI 갱신
// ------------------------------------------
function SWINGINV_updateHeaderAuthUI() {
  const emailEl = document.getElementById("user-email");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!emailEl || !loginBtn || !logoutBtn) return;

  const user = SWINGINV.user;
  if (user) {
    const label = user.nickname ? user.nickname : user.email;
    emailEl.textContent = `👤 ${label}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    emailEl.textContent = "로그인되지 않음";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }

  loginBtn.onclick = () => (location.href = "login.html");
  logoutBtn.onclick = logoutUser;
}

// ------------------------------------------
// 📋 메뉴 강조 (현재 페이지)
–------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const current = location.pathname.split("/").pop();
  document.querySelectorAll(".gnb button").forEach((btn) => {
    const m = btn.getAttribute("onclick")?.match(/'(.*?)'/);
    if (m && current === m[1]) btn.classList.add("active");
  });
  SWINGINV_updateHeaderAuthUI();
});

// ------------------------------------------
// 🌍 전역 내보내기
// ------------------------------------------
window.SWINGINV = {
  ...window.SWINGINV,
  db,
  nf: SWINGINV.nf,
  fmtDate: SWINGINV.fmtDate,
  showLoading: SWINGINV.showLoading,
  showError: SWINGINV.showError,
  logoutUser,
  SWINGINV_checkNickname,
  SWINGINV_updateHeaderAuthUI,
};

console.log("✅ SWINGINV common.js initialized successfully.");
