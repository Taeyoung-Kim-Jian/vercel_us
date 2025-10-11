/* ==========================================================
   🌐 SWING INVESTOR — common.js (LTS Stable)
   - 단일 Supabase 클라이언트
   - 헤더 직접 갱신 (header.html에 스크립트 불필요)
   - 구버전 호환(showLoading/showError) + 커스텀 이벤트
   ========================================================== */

console.log("🌐 SWING INVESTOR common.js loaded");

// 1) Supabase 초기화 (한 번만)
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

if (!window.supabase) console.error("❌ Supabase SDK not loaded.");

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
window.SWINGINV = { db, user: null };
window.db = db; // 호환용
console.log("✅ Supabase client initialized.");

// 2) 구버전 호환 유틸
SWINGINV.showLoading = function (el, msg = "⏳ 불러오는 중...") {
  if (!el) return;
  el.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:10px;">${msg}</td></tr>`;
};
SWINGINV.showError = function (el, msg = "❌ 오류가 발생했습니다.") {
  if (!el) return;
  el.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red;padding:10px;">${msg}</td></tr>`;
};

// 3) 헤더 갱신 (header.html DOM 늦을 수 있으니 재시도)
function renderHeader(user, tries = 0) {
  const emailSpan = document.getElementById("user-email");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!emailSpan || !loginBtn || !logoutBtn) {
    if (tries < 20) {
      setTimeout(() => renderHeader(user, tries + 1), 200);
    } else {
      console.warn("⚠️ Header elements not found after retries.");
    }
    return;
  }

  if (user) {
    const nickname = user.user_metadata?.nickname || user.email?.split("@")[0] || "사용자";
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

// 4) 초기 세션 확인 + 준비 이벤트
(async () => {
  try {
    const { data, error } = await db.auth.getUser();
    SWINGINV.user = error ? null : (data?.user || null);
    if (SWINGINV.user) console.log("👤 Logged in:", SWINGINV.user.email);
    renderHeader(SWINGINV.user);

    // 페이지들이 들을 수 있게 준비 이벤트 발행
    window.dispatchEvent(new CustomEvent("swinginv-ready", { detail: { user: SWINGINV.user } }));
  } catch (e) {
    console.error("❌ Initial auth check failed:", e);
  }
})();

// 5) 로그인/로그아웃/세션복원 감지 + 헤더 갱신 + 이벤트 발행
db.auth.onAuthStateChange((event, session) => {
  console.log("🔄 Auth state changed:", event);
  const user = session?.user || null;

  if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
    SWINGINV.user = user;
  } else if (event === "SIGNED_OUT") {
    SWINGINV.user = null;
  }

  renderHeader(SWINGINV.user);
  window.dispatchEvent(new CustomEvent("swinginv-auth", { detail: { event, user: SWINGINV.user } }));
});

// 6) 로그아웃 버튼 전역 처리
document.addEventListener("click", async (e) => {
  if (e.target?.id === "logoutBtn") {
    try {
      await db.auth.signOut();
      alert("👋 로그아웃되었습니다.");
    } catch (err) {
      console.error("❌ 로그아웃 실패:", err);
      alert("로그아웃 중 오류 발생");
    }
  }
});

console.log("✅ SWINGINV common.js fully initialized.");
