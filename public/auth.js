/* ==========================================================
   🔐 SWING INVESTOR auth.js (Render 호환 완전 버전)
   ========================================================== */
console.log("🔐 SWING INVESTOR auth.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  // --------------------------------------------------------
  // ⏳ Supabase 초기화 대기 (common.js 로드 대기)
  // --------------------------------------------------------
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
    alert("❌ Supabase 초기화 실패");
    return;
  }

  // --------------------------------------------------------
  // ✅ 회원가입
  // --------------------------------------------------------
  SWINGINV.signUpUser = async (email, password, nickname) => {
    try {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: { nickname },
          emailRedirectTo: "https://vercel-project-1.onrender.com/set-password.html",
        },
      });

      if (error) {
        console.error("❌ 회원가입 실패:", error);
        alert("회원가입 실패: " + error.message);
      } else {
        console.log("✅ 회원가입 성공:", data);
        alert("✅ 회원가입 성공! 이메일을 확인하세요.");
      }
    } catch (err) {
      console.error("❌ signUpUser error:", err);
    }
  };

  // --------------------------------------------------------
  // ✅ 로그인
  // --------------------------------------------------------
  SWINGINV.loginUser = async (email, password) => {
    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("❌ 로그인 실패:", error);
        alert("로그인 실패: " + error.message);
        return;
      }
      console.log("✅ 로그인 성공:", data);
      alert("로그인 성공!");
      location.href = "index.html";
    } catch (err) {
      console.error("❌ loginUser error:", err);
    }
  };

  // --------------------------------------------------------
  // ✅ 로그아웃
  // --------------------------------------------------------
  SWINGINV.logoutUser = async () => {
    await db.auth.signOut();
    alert("🚪 로그아웃 완료");
    location.href = "login.html";
  };

  // --------------------------------------------------------
  // ✅ 닉네임 중복 체크 (profiles)
  // --------------------------------------------------------
  SWINGINV.checkDuplicate = async (nickname) => {
    try {
      const { data, error } = await db
        .from("profiles")
        .select("id")
        .eq("nickname", nickname);
      return data?.length > 0;
    } catch (err) {
      console.error("❌ 닉네임 중복체크 실패:", err);
      return false;
    }
  };
});
