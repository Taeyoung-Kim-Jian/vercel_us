/* auth.js */
console.log("🔐 SWING INVESTOR auth.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  let db;
  for (let i = 0; i < 20; i++) {
    if (window.SWINGINV?.db) {
      db = SWINGINV.db;
      break;
    }
    await wait(250);
  }
  if (!db) {
    console.error("❌ Supabase 초기화 실패 (auth.js)");
    return;
  }

  // 세션 초기화
  const { data: { session } } = await db.auth.getSession();
  SWINGINV.user = session?.user || null;

  db.auth.onAuthStateChange((_event, session) => {
    SWINGINV.user = session?.user || null;
    console.log("Auth state changed:", SWINGINV.user?.email);
  });

  // 로그아웃 함수
  SWINGINV.logoutUser = async () => {
    await db.auth.signOut();
    alert("🚪 로그아웃 되었습니다");
    location.reload();
  };

  // 중복 체크 함수 (이메일 + 닉네임)
  SWINGINV.checkDuplicate = async (email, nickname) => {
    const exists = { email: false, nickname: false };

    // 이메일 중복 검사
    const { data: emailDup, error: e1 } = await db
      .from("profiles")
      .select("id")
      .eq("email", email);
    if (!e1 && emailDup && emailDup.length > 0) {
      exists.email = true;
    }

    // 닉네임 중복 검사
    const { data: nickDup, error: e2 } = await db
      .from("profiles")
      .select("id")
      .eq("nickname", nickname);
    if (!e2 && nickDup && nickDup.length > 0) {
      exists.nickname = true;
    }

    return exists;
  };

  console.log("✅ auth.js initialized");
});
