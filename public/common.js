/* ==========================================================
   🌐 SWING INVESTOR common.js (v3.0)
   - 로그인/닉네임 관리
   - 헤더 감지 및 자동 토글
   ========================================================== */

console.log("🌐 SWING INVESTOR common.js loaded");

const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 로그인 세션 감시
(async () => {
  const { data: { session } } = await db.auth.getSession();
  window.SWINGINV = window.SWINGINV || {};
  SWINGINV.user = session?.user || null;

  db.auth.onAuthStateChange(async (_event, session) => {
    SWINGINV.user = session?.user || null;
    if (SWINGINV.user) await checkNickname();
    updateHeaderUI();
  });

  if (SWINGINV.user) await checkNickname();
  updateHeaderUI();
})();

// 닉네임 확인
async function checkNickname() {
  if (!SWINGINV.user) return;
  const { data, error } = await db.from("profiles").select("nickname").eq("id", SWINGINV.user.id).single();
  if (!data || !data.nickname) return;
  SWINGINV.user.nickname = data.nickname;
}

// 로그아웃
async function logoutUser() {
  await db.auth.signOut();
  SWINGINV.user = null;
  updateHeaderUI();
  location.href = "index.html";
}

// 헤더 갱신
function updateHeaderUI() {
  const tryBind = () => {
    const emailEl = document.getElementById("user-email");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    if (!emailEl || !loginBtn || !logoutBtn) return false;

    const u = SWINGINV.user;
    if (u) {
      emailEl.textContent = `👤 ${u.nickname || u.email}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    } else {
      emailEl.textContent = "로그인 필요";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }

    loginBtn.onclick = () => {
      const current = location.pathname.split("/").pop();
      location.href = `login.html?redirect=${encodeURIComponent(current)}`;
    };
    logoutBtn.onclick = logoutUser;
    return true;
  };

  if (!tryBind()) {
    let tries = 0;
    const timer = setInterval(() => {
      if (tryBind() || tries++ > 30) clearInterval(timer);
    }, 300);
  }
}

window.SWINGINV = { db, logoutUser, checkNickname, updateHeaderUI };
