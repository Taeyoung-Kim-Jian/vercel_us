/* ==========================================================
   🌐 SWING INVESTOR — common.js (v4.4 Stable Session-Safe)
   - Supabase 초기화 + 로그인/회원가입/로그아웃/헤더 UI 통합
   ========================================================== */

console.log("🌐 SWING INVESTOR common_auth.js loaded");

// ------------------------------------------------------------
// ✅ 1. Supabase 초기화
// ------------------------------------------------------------
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

if (!window.supabase) console.error("❌ Supabase SDK not loaded.");

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("✅ Supabase client initialized.");

// ------------------------------------------------------------
// ✅ 2. 전역 네임스페이스 정의
// ------------------------------------------------------------
window.SWINGINV = {
  db,
  user: null,

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

  // ✅ 로그인
  async loginUser(email, password, errEl) {
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
  },

  // ✅ 회원가입
  async signUpUser(email, password, nickname, errEl) {
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
    location.href = "index.html";
  },

  // ✅ 로그아웃
  async logoutUser() {
    try {
      await db.auth.signOut();
      console.log("👋 로그아웃 성공");
    } catch (e) {
      console.error("❌ 로그아웃 실패:", e);
    }
  },
};

// ------------------------------------------------------------
// ✅ 3. 인증 상태 초기 확인
// ------------------------------------------------------------
(async () => {
  try {
    const { data, error } = await db.auth.getUser();
    if (!error && data?.user) {
      SWINGINV.user = data.user;
      console.log("👤 Logged in:", data.user.email);
    }
  } catch (err) {
    console.error("❌ Auth init check failed:", err);
  }
})();

// ------------------------------------------------------------
// ✅ 4. 로그인/로그아웃 이벤트 감지
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
  window.SWINGINV_updateHeaderAuthUI?.();
});

// ------------------------------------------------------------
// ✅ 5. 헤더 로그인/로그아웃 UI 자동 갱신 (안전 버전)
// ------------------------------------------------------------
window.SWINGINV_updateHeaderAuthUI = async () => {
  const tryGet = (id) => document.getElementById(id);
  let emailSpan = tryGet("user-email");
  let loginBtn = tryGet("loginBtn");
  let logoutBtn = tryGet("logoutBtn");

  if (!emailSpan || !loginBtn || !logoutBtn) {
    console.warn("⏳ Header not ready, retrying in 300ms...");
    setTimeout(window.SWINGINV_updateHeaderAuthUI, 300);
    return;
  }

  try {
    const { data: sessionData } = await SWINGINV.db.auth.getSession();
    const user = sessionData?.session?.user || null;

    if (user) {
      const nickname = user.user_metadata?.nickname || user.email.split("@")[0];
      emailSpan.textContent = `${nickname} 님`;
      emailSpan.style.color = "#2563eb";
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-flex";

      logoutBtn.onclick = async () => {
        await SWINGINV.logoutUser();
        location.href = "index.html"; // 로그아웃 후 메인으로 이동
        window.SWINGINV_updateHeaderAuthUI();
      };

      console.log("✅ Header updated → 로그인 표시:", nickname);
    } else {
      emailSpan.textContent = "로그아웃 중";
      emailSpan.style.color = "#374151";
      loginBtn.style.display = "inline-flex";
      logoutBtn.style.display = "none";
      console.log("✅ Header updated → 로그아웃 표시");
    }
  } catch (err) {
    console.error("❌ Header UI update failed:", err);
  }
};

// ------------------------------------------------------------
// ✅ 6. 페이지 로드 후 헤더 자동 갱신
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(window.SWINGINV_updateHeaderAuthUI, 500);
});

// ------------------------------------------------------------
// ✅ 7. window.db 호환성 alias 추가
// ------------------------------------------------------------
if (window.SWINGINV?.db) {
  window.db = window.SWINGINV.db;
  console.log("✅ window.db alias created (for backward compatibility)");
}

console.log("✅ SWINGINV common_auth.js fully initialized.");
