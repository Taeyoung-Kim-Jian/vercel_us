/* ==========================================================
   🌐 SWING INVESTOR — common.js (v3.3)
   - Supabase 클라이언트 및 공통 유틸 초기화
   ========================================================== */

console.log("🌐 SWING INVESTOR common.js loaded");

// ------------------------------------------------------------
// ✅ 1. Supabase 초기화
// ------------------------------------------------------------
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

if (!window.supabase) {
  console.error("❌ Supabase SDK not loaded. Please include it before this script.");
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

  // 공통 유틸
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
// ✅ 3. 현재 로그인 상태 확인
// ------------------------------------------------------------
(async () => {
  try {
    const { data, error } = await db.auth.getUser();
    if (error) {
      console.warn("⚠️ No active session:", error.message);
    } else {
      window.SWINGINV.user = data?.user || null;
      if (data?.user) console.log("👤 Logged in:", data.user.email);
    }

    // header.html UI 갱신
    if (typeof window.SWINGINV_updateHeaderAuthUI === "function") {
      window.SWINGINV_updateHeaderAuthUI();
    }
  } catch (err) {
    console.error("❌ Auth check failed:", err);
  }
})();

// ------------------------------------------------------------
// ✅ 4. 로그인/로그아웃 상태 자동 감지
// ------------------------------------------------------------
db.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Auth state changed:", event);

  if (event === "SIGNED_IN") {
    window.SWINGINV.user = session?.user || null;
    console.log("👤 로그인 감지:", session?.user?.email);
  } else if (event === "SIGNED_OUT") {
    window.SWINGINV.user = null;
    console.log("👋 로그아웃 감지");
  }

  if (typeof window.SWINGINV_updateHeaderAuthUI === "function") {
    window.SWINGINV_updateHeaderAuthUI();
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
      location.reload();
    } catch (err) {
      console.error("❌ 로그아웃 실패:", err);
      alert("로그아웃 중 오류 발생.");
    }
  }
});

// ------------------------------------------------------------
// ✅ 6. window.db 호환성 alias 추가
// ------------------------------------------------------------
if (window.SWINGINV?.db) {
  window.db = window.SWINGINV.db;
  console.log("✅ window.db alias created (for backward compatibility)");
}

// ------------------------------------------------------------
// ✅ 7. 준비 완료
// ------------------------------------------------------------
console.log("✅ SWINGINV common.js fully initialized.");
