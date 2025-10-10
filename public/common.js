/* ==========================================================
   🌐 SWING INVESTOR common.js (최신 통합버전)
   ========================================================== */
console.log("🌐 SWING INVESTOR common.js loaded");

// ------------------------------------------
// 🔗 Supabase 연결
// ------------------------------------------
if (!window.SWINGINV) window.SWINGINV = {};

if (!window.SWINGINV.db) {
  const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  SWINGINV.db = db;
  console.log("✅ Supabase client initialized.");
} else {
  console.log("ℹ️ Supabase client already initialized.");
}
// ------------------------------------------
// ⏳ 로딩 표시 / 에러 표시 함수
// ------------------------------------------
SWINGINV.showLoading = (el, msg = "⏳ 로딩 중...") => {
  if (el)
    el.innerHTML = `<div style="text-align:center;color:#666;padding:20px;">${msg}</div>`;
};

SWINGINV.showError = (el, msg = "❌ 오류 발생") => {
  if (el)
    el.innerHTML = `<div style="text-align:center;color:#b91c1c;padding:20px;">${msg}</div>`;
};
// ------------------------------------------
// 🧭 종목명 클릭 시 detail.html로 이동
// ------------------------------------------
document.addEventListener("click", (e) => {
  const target = e.target.closest(".clickable-name");
  if (!target) return;

  const code = target.dataset.code;
  const name = target.dataset.name;
  if (!code) return;

  const encodedName = encodeURIComponent(name || "");
  window.location.href = `detail.html?code=${code}&name=${encodedName}`;
});

// ------------------------------------------
// 🧩 공통 유틸 함수
// ------------------------------------------
SWINGINV.nf = (num) => (isNaN(num) ? "-" : parseFloat(num).toLocaleString());
SWINGINV.fmtDate = (str) => {
  if (!str) return "-";
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

// ------------------------------------------
// 🔐 로그인 상태 갱신 함수
// ------------------------------------------
async function SWINGINV_updateHeaderAuthUI() {
  try {
    if (!window.SWINGINV?.db) {
      console.warn("⚠️ Supabase 클라이언트가 아직 준비되지 않았습니다.");
      return;
    }

    const db = SWINGINV.db;
    const { data: { session } } = await db.auth.getSession();

    const emailSpan = document.getElementById("user-email");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (session?.user) {
      // ✅ 로그인 상태
      if (loginBtn) loginBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline-block";

      const { data: profile } = await db
        .from("profiles")
        .select("nickname")
        .eq("id", session.user.id)
        .single();

      if (profile?.nickname) {
        emailSpan.textContent = `${profile.nickname} (${session.user.email}) 로그인 중`;
      } else {
        emailSpan.textContent = `${session.user.email} 로그인 중`;
      }

      logoutBtn.onclick = async () => {
        await db.auth.signOut();
        alert("로그아웃되었습니다.");
        location.href = "login.html";
      };
    } else {
      // 🚪 로그아웃 상태
      if (emailSpan) emailSpan.textContent = "로그아웃 중";
      if (loginBtn) loginBtn.style.display = "inline-block";
      if (logoutBtn) logoutBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Header 로그인 상태 갱신 오류:", err);
  }
}
