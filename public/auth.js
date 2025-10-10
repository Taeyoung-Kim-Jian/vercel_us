/* ==========================================================
   🔐 SWING INVESTOR auth.js (로그인 & 세션 관리)
   ========================================================== */

console.log("🔐 SWING INVESTOR auth.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Supabase 준비 대기
  let db;
  for (let i = 0; i < 20; i++) {
    if (window.SWINGINV?.db) {
      db = SWINGINV.db;
      break;
    }
    await wait(250);
  }
  if (!db) {
    console.error("❌ Supabase 초기화 실패 (common.js가 먼저 로드되어야 함)");
    return;
  }

  // ------------------------------------------
  // 🌐 로그인 상태 감시
  // ------------------------------------------
  const { data: { session } } = await db.auth.getSession();
  SWINGINV.user = session?.user || null;

  db.auth.onAuthStateChange(async (_event, session) => {
    SWINGINV.user = session?.user || null;
    if (SWINGINV.user) await checkProfile();
    updateHeaderAuthUI();
  });

  if (SWINGINV.user) await checkProfile();
  updateHeaderAuthUI();

  // ------------------------------------------
  // 👤 닉네임 체크 및 생성
  // ------------------------------------------
  async function checkProfile() {
    if (!SWINGINV.user) return;

    const { data, error } = await db
      .from("profiles")
      .select("nickname")
      .eq("id", SWINGINV.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("닉네임 조회 오류:", error.message);
      return;
    }

    if (!data || !data.nickname) {
      let nickname = "";
      while (!nickname || nickname.length < 2) {
        nickname = prompt("닉네임을 설정해주세요 (2자 이상):");
        if (nickname === null) return;
      }

      const { error: upErr } = await db.from("profiles").upsert({
        id: SWINGINV.user.id,
        nickname,
      });
      if (upErr) alert("닉네임 저장 실패: " + upErr.message);
      else SWINGINV.user.nickname = nickname;
    } else {
      SWINGINV.user.nickname = data.nickname;
    }
  }

  // ------------------------------------------
  // 🚪 로그아웃
  // ------------------------------------------
  async function logoutUser() {
    await db.auth.signOut();
    SWINGINV.user = null;
    updateHeaderAuthUI();
    alert("🚪 로그아웃 완료");
  }

  // ------------------------------------------
  // 🧭 헤더 상태 갱신
  // ------------------------------------------
  function updateHeaderAuthUI() {
    const emailEl = document.getElementById("user-email");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    if (!emailEl || !loginBtn || !logoutBtn) return;

    const u = SWINGINV.user;
    if (u) {
      const label = u.nickname ? `${u.nickname}` : u.email;
      emailEl.textContent = `👤 ${label}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    } else {
      emailEl.textContent = "로그아웃 중";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }

    logoutBtn.onclick = logoutUser;
  }

  // ------------------------------------------
  // 🌍 전역 내보내기
  // ------------------------------------------
  SWINGINV.logoutUser = logoutUser;
  SWINGINV.updateHeaderAuthUI = updateHeaderAuthUI;
  SWINGINV.checkProfile = checkProfile;

  console.log("✅ auth.js initialized successfully.");
});
