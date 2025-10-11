/* ==========================================================
   🌐 SWING INVESTOR — common.js (v3.7 Simple UI Sync Edition)
   - 로그인 감지 → 버튼 자동 변경
   - Render / Vercel / Supabase 완전 호환
   ========================================================== */

console.log("🌐 SWING INVESTOR common.js loaded");

// ------------------------------------------------------------
// ✅ 1. Supabase 초기화
// ------------------------------------------------------------
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

if (!window.supabase)
  console.error("❌ Supabase SDK not loaded. Please include it before this script.");

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("✅ Supabase client initialized.");

// ------------------------------------------------------------
// ✅ 2. 전역 네임스페이스 정의
// ------------------------------------------------------------
window.SWINGINV = { db, user: null };

// ------------------------------------------------------------
// ✅ 3. 로그인 상태 초기 확인
// ------------------------------------------------------------
(async () => {
  try {
    const { data, error } = await db.auth.getUser();
    if (!error && data?.user) {
      window.SWINGINV.user = data.user;
      console.log("👤 Logged in:", data.user.email);
      updateAuthUI(data.user);
    } else {
      console.log("🚪 Not logged in (no session)");
      updateAuthUI(null);
    }
  } catch (err) {
    console.error("❌ Auth check failed:", err);
  }
})();

// ------------------------------------------------------------
// ✅ 4. 로그인 / 로그아웃 감지 및 UI 업데이트
// ------------------------------------------------------------
db.auth.onAuthStateChange((event, session) => {
  console.log("🔄 Auth state changed:", event);
  const user = session?.user || null;

  if (event === "SIGNED_IN" && user) {
    console.log("👤 로그인 감지:", user.email);
    window.SWINGINV.user = user;
    updateAuthUI(user);
  } else if (event === "SIGNED_OUT") {
    console.log("👋 로그아웃 감지");
    window.SWINGINV.user = null;
    updateAuthUI(null);
  } else if (event === "INITIAL_SESSION" && user) {
    console.log("♻️ 세션 복원됨:", user.email);
    window.SWINGINV.user = user;
    updateAuthUI(user);
  }
});

// ------------------------------------------------------------
// ✅ 5. 로그아웃 버튼 동작
// ------------------------------------------------------------
document.addEventListener("click", async (e) => {
  if (e.target.id === "logoutBtn") {
    try {
      await db.auth.signOut();
      alert("👋 로그아웃되었습니다.");
      updateAuthUI(null);
    } catch (err) {
      console.error("❌ 로그아웃 실패:", err);
      alert("로그아웃 중 오류 발생.");
    }
  }
});

// ------------------------------------------------------------
// ✅ 6. 헤더 UI 업데이트 함수
// ------------------------------------------------------------
function updateAuthUI(user) {
  const emailSpan = document.getElementById("user-email");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!emailSpan || !loginBtn || !logoutBtn) {
    console.warn("⚠️ Header elements not found yet.");
    return;
  }

  if (user) {
    const nickname = user.user_metadata?.nickname || user.email.split("@")[0];
    emailSpan.textContent = `${nickname} 님`;
    emailSpan.style.color = "#2563eb";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-flex";
  } else {
    emailSpan.textContent = "로그아웃 중";
    emailSpan.style.color = "#374151";
    loginBtn.style.display = "inline-flex";
    logoutBtn.style.display = "none";
  }
}

// ------------------------------------------------------------
// ✅ 7. 호환성 alias
// ------------------------------------------------------------
window.db = db;
console.log("✅ window.db alias created (for backward compatibility)");
console.log("✅ SWINGINV common.js fully initialized.");
