/* ==========================================================
   🔐 SWING INVESTOR — auth.js (v3.4)
   - 회원가입 / 로그인 / 로그아웃 / 닉네임 중복검사
   - Supabase & Render 완전 호환
   ========================================================== */

console.log("🔐 SWING INVESTOR auth.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  // --------------------------------------------------------
  // ⏳ Supabase 초기화 대기 (common.js 로드 완료될 때까지)
  // --------------------------------------------------------
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let db;
  for (let i = 0; i < 20; i++) {
    if (window.SWINGINV?.db) {
      db = SWINGINV.db;
      break;
    }
    await wait(250); // 0.25초 간격으로 최대 5초까지 대기
  }

  if (!db) {
    alert("❌ Supabase 초기화 실패: common.js가 먼저 로드되어야 합니다.");
    return;
  }

  // --------------------------------------------------------
  // ✅ 회원가입 (이메일 + 비밀번호 + 닉네임)
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
        return;
      }

      console.log("✅ 회원가입 성공:", data);
      alert("✅ 회원가입 성공! 이메일을 확인하세요.");
    } catch (err) {
      console.error("❌ signUpUser error:", err);
      alert("회원가입 중 오류가 발생했습니다.");
    }
  };

  // --------------------------------------------------------
  // ✅ 로그인 (이메일 + 비밀번호)
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

      // ✅ 로그인 직후 세션 즉시 반영
      const { data: session } = await db.auth.getSession();
      window.SWINGINV.user = session?.session?.user || null;

      // ✅ header 즉시 갱신
      if (typeof window.SWINGINV_updateHeaderAuthUI === "function") {
        await window.SWINGINV_updateHeaderAuthUI();
      }

      alert("로그인 성공!");
      location.href = "index.html";
    } catch (err) {
      console.error("❌ loginUser error:", err);
      alert("로그인 중 오류: " + err.message);
    }
  };

  // --------------------------------------------------------
  // ✅ 로그아웃
  // --------------------------------------------------------
  SWINGINV.logoutUser = async () => {
    try {
      await db.auth.signOut();
      alert("🚪 로그아웃 완료");
      location.href = "login.html";
    } catch (err) {
      console.error("❌ 로그아웃 실패:", err);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  // --------------------------------------------------------
  // ✅ 닉네임 중복 체크 (profiles 테이블)
  // --------------------------------------------------------
  SWINGINV.checkDuplicate = async (nickname) => {
    try {
      const { data, error } = await db.from("profiles").select("id").eq("nickname", nickname);
      if (error) {
        console.error("❌ 닉네임 중복 체크 실패:", error);
        return false;
      }
      return data?.length > 0;
    } catch (err) {
      console.error("❌ checkDuplicate error:", err);
      return false;
    }
  };
});
