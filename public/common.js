/* ==========================================================
   🌐 SWING INVESTOR — common_auth.js (v4.3 Unified Stable)
   - Supabase 초기화 + 로그인 / 회원가입 / 로그아웃 / 유틸 통합
   ========================================================== */

console.log("🌐 SWING INVESTOR common_auth.js loaded");

// ------------------------------------------------------------
// ✅ 1. Supabase 초기화
// ------------------------------------------------------------
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

if (!window.supabase) {
  console.error("❌ Supabase SDK not loaded.");
}

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("✅ Supabase client initialized.");

// ------------------------------------------------------------
// ✅ 2. 전역 네임스페이스 정의
// ------------------------------------------------------------
window.SWINGINV = {
  db,
  user: null,

  // ---------------------------
  // 공통 유틸
  // ---------------------------
  showLoading(el, msg = "⏳ 불러오는 중...") {
    if (!el) return;
    el.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:10px;">${msg}</td></tr>`;
  },

  showError(el, msg = "❌ 오류가 발생했습니다.") {
    if (!el) return;
    el.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red;padding:10px;">${msg}</td></tr>`;
  },

  nf(val) {
    if (val == null || val === "") return "-";
    return Number(val).toLocaleString();
  },

  fmtDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toISOString().slice(0, 10);
  },

  fmtPct(num) {
    if (num == null) return "-";
    const n = parseFloat(num);
    const sign = n >= 0 ? "▲" : "▼";
    const color = n >= 0 ? "#dc2626" : "#2563eb";
    return `<span style="color:${color};font-weight:600;">${sign}${Math.abs(n).toFixed(2)}%</span>`;
  },

  esc(str) {
    return (str || "").replace(/[&<>"']/g, (m) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[m];
    });
  },
};

// ------------------------------------------------------------
// ✅ 3. 로그인/회원가입/로그아웃 통합
// ------------------------------------------------------------
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Supabase 초기 세션 확인
  try {
    const { data, error } = await db.auth.getUser();
    if (!error && data?.user) {
      SWINGINV.user = data.user;
      console.log("👤 Logged in:", data.user.email);
    }
  } catch (err) {
    console.error("❌ Auth init check failed:", err);
  }

  // 전역 함수 정의
  SWINGINV.loginUser = async (email, password, errEl) => {
    if (!email || !password) {
      if (errEl) errEl.textContent = "⚠️ 이메일과 비밀번호를 입력해주세요.";
      return;
    }
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("❌ 로그인 실패:", error);
      if (errEl) errEl.textContent = "❌ 이메일 또는 비밀번호가 올바르지 않습니다.";
      return;
    }
    console.log("✅ 로그인 성공");
    location.href = "index.html";
  };

  SWINGINV.signUpUser = async (email, password, nickname, errEl) => {
    if (!email || !password || !nickname) {
      if (errEl) errEl.textContent = "⚠️ 모든 항목을 입력해주세요.";
      return;
    }
    const { error } = await db.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });
    if (error) {
      console.error("❌ 회원가입 실패:", error);
      if (errEl) errEl.textContent = "❌ 회원가입 실패: " + error.message;
      return;
    }
    console.log("✅ 회원가입 성공");
    location.href = "index.html"; // ✅ 회원가입 후 바로 index.html 이동
  };

  SWINGINV.logoutUser = async () => {
    try {
      await db.auth.signOut();
    } catch (e) {
      console.error("❌ 로그아웃 실패:", e);
    }
    location.href = "index.html";
  };

  SWINGINV.checkDuplicate = async (nickname) => {
    const { data, error } = await db.from("profiles").select("id").eq("nickname", nickname);
    return !error && data?.length > 0;
  };
})();

// ------------------------------------------------------------
// ✅ 4. 인증 상태 자동 감지
// ------------------------------------------------------------
db.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Auth state changed:", event);
  if (event === "SIGNED_IN") {
    SWINGINV.user = session?.user || null;
    console.log("👤 로그인 감지:", session?.user?.email);
  } else if (event === "SIGNED_OUT") {
    SWINGINV.user = null;
    console.log("👋 로그아웃 감지");
  }

  if (typeof window.SWINGINV_updateHeaderAuthUI === "function") {
    window.SWINGINV_updateHeaderAuthUI();
  }
});

// ------------------------------------------------------------
// ✅ 5. 로그아웃 버튼 자동 연결
// ------------------------------------------------------------
document.addEventListener("click", async (e) => {
  if (e.target.id === "logoutBtn") {
    await SWINGINV.logoutUser();
  }
});

// ------------------------------------------------------------
// ✅ 6. window.db 호환성 alias 추가
// ------------------------------------------------------------
if (window.SWINGINV?.db) {
  window.db = window.SWINGINV.db;
  console.log("✅ window.db alias created (for backward compatibility)");
}

console.log("✅ SWINGINV common_auth.js fully initialized.");
