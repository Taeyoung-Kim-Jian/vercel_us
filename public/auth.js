console.log("🔐 SWING INVESTOR auth.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  let db;
  for (let i = 0; i < 20; i++) {
    if (window.SWINGINV?.db) { db = SWINGINV.db; break; }
    await wait(250);
  }
  if (!db) { alert("❌ Supabase 초기화 실패 (common.js가 먼저 로드되어야 함)"); return; }

  // ✅ 현재 로그인 세션 확인
  const { data: { session } } = await db.auth.getSession();
  SWINGINV.user = session?.user || null;

  // ✅ 상태변화 감시
  db.auth.onAuthStateChange((_event, session) => {
    SWINGINV.user = session?.user || null;
    console.log("Auth state changed:", SWINGINV.user?.email);
  });

  // ✅ 로그아웃 함수
  SWINGINV.logoutUser = async () => {
    await db.auth.signOut();
    alert("🚪 로그아웃 완료");
    location.reload();
  };

  // ✅ 중복 확인 함수 추가
  SWINGINV.checkDuplicate = async (email, nickname) => {
    let exists = { email: false, nickname: false };

    // 이메일 중복 확인
    const { data: users } = await db
      .from("profiles")
      .select("email")
      .eq("email", email);
    if (users && users.length > 0) exists.email = true;

    // 닉네임 중복 확인
    const { data: nicks } = await db
      .from("profiles")
      .select("nickname")
      .eq("nickname", nickname);
    if (nicks && nicks.length > 0) exists.nickname = true;

    return exists;
  };
});
