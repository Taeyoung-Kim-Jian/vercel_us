/* ==========================================================
   🔐 SWING INVESTOR auth.js
   - 로그인/회원가입/중복체크/로그아웃 담당
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
    console.error("❌ Supabase 초기화 실패 (auth.js)");
    return;
  }

  // 세션 확인
  const { data: { session } } = await db.auth.getSession();
  SWINGINV.user = session?.user || null;

  // 인증 상태 변화 감시
  db.auth.onAuthStateChange((_event, session) => {
    SWINGINV.user = session?.user || null;
    console.log("Auth state changed:", SWINGINV.user?.email);
  });

  // -------------------------------------------------------
  // ✅ 중복 체크 함수 (이메일 & 닉네임)
  // -------------------------------------------------------
  SWINGINV.checkDuplicate = async (email, nickname) => {
    const exists = { email: false, nickname: false };

    try {
      if (email) {
        const { data: eData, error: eErr } = await db
          .from("profiles")
          .select("id")
          .eq("email", email);
        if (eData?.length > 0) exists.email = true;
        if (eErr) console.warn("이메일 중복검사 오류:", eErr.message);
      }

      if (nickname) {
        const { data: nData, error: nErr } = await db
          .from("profiles")
          .select("id")
          .eq("nickname", nickname);
        if (nData?.length > 0) exists.nickname = true;
        if (nErr) console.warn("닉네임 중복검사 오류:", nErr.message);
      }
    } catch (err) {
      console.error("중복검사 실패:", err.message);
    }

    return exists;
  };

  // -------------------------------------------------------
  // 🚪 로그아웃
  // -------------------------------------------------------
  SWINGINV.logoutUser = async () => {
    await db.auth.signOut();
    SWINGINV.user = null;
    alert("🚪 로그아웃 완료");
    location.reload();
  };

  console.log("✅ auth.js initialized");
});
