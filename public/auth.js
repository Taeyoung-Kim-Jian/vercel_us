/* ==========================================================
   🔐 SWING INVESTOR — auth.js (v4.0)
   - 모든 인증 로직 통합 (회원가입 / 로그인 / 로그아웃 / 상태유지)
   - alert 제거 / 페이지 내 표시 전용
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
    await wait(250); // 최대 5초 대기
  }

  if (!db) {
    console.error("❌ Supabase 초기화 실패: common.js가 먼저 로드되어야 합니다.");
    return;
  }

  // --------------------------------------------------------
  // ✅ 전역 접근 가능한 객체 선언
  // --------------------------------------------------------
  const setMessage = (id, msg, color = "#dc2626") => {
    const el = document.getElementById(id);
    if (el) {
      el.style.color = color;
      el.textContent = msg || "";
    }
  };

  const go = (url) => (window.location.href = url);

  // --------------------------------------------------------
  // ✅ 회원가입
  // --------------------------------------------------------
  SWINGINV.signUpUser = async (email, password, nickname) => {
    const errorId = "signupError";
    setMessage(errorId, "⏳ 회원가입 중... ", "#2563eb");

    try {
      if (!email || !password || !nickname) {
        setMessage(errorId, "⚠️ 모든 항목을 입력해주세요.");
        return;
      }

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
        setMessage(errorId, "❌ " + error.message);
        return;
      }

      console.log("✅ 회원가입 성공:", data);
      setMessage(errorId, "✅ 회원가입 성공! 이메일을 확인해주세요.", "#16a34a");

      // 회원가입 완료 후 로그인 폼으로 전환
      const loginForm = document.getElementById("loginForm");
      const signupForm = document.getElementById("signupForm");
      if (loginForm && signupForm) {
        signupForm.style.display = "none";
        loginForm.style.display = "block";
      }
    } catch (err) {
      console.error("❌ signUpUser error:", err);
      setMessage(errorId, "❌ 회원가입 중 오류가 발생했습니다.");
    }
  };

  // --------------------------------------------------------
  // ✅ 로그인
  // --------------------------------------------------------
  SWINGINV.loginUser = async (email, password) => {
    const errorId = "loginError";
    setMessage(errorId, "⏳ 로그인 중...", "#2563eb");

    try {
      if (!email || !password) {
        setMessage(errorId, "⚠️ 이메일과 비밀번호를 입력하세요.");
        return;
      }

      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("❌ 로그인 실패:", error);
        setMessage(errorId, "❌ 이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      console.log("✅ 로그인 성공:", data);
      const { data: session } = await db.auth.getSession();
      window.SWINGINV.user = session?.session?.user || null;

      if (typeof window.SWINGINV_updateHeaderAuthUI === "function") {
        await window.SWINGINV_updateHeaderAuthUI();
      }

      go("index.html");
    } catch (err) {
      console.error("❌ loginUser error:", err);
      setMessage(errorId, "❌ 로그인 중 오류가 발생했습니다.");
    }
  };

  // --------------------------------------------------------
  // ✅ 로그아웃
  // --------------------------------------------------------
  SWINGINV.logoutUser = async () => {
    try {
      await db.auth.signOut();
      console.log("🚪 로그아웃 완료");
      go("index.html");
    } catch (err) {
      console.error("❌ 로그아웃 실패:", err);
    }
  };

  // --------------------------------------------------------
  // ✅ 닉네임 중복 체크
  // --------------------------------------------------------
  SWINGINV.checkDuplicate = async (nickname) => {
    try {
      const { data, error } = await db
        .from("profiles")
        .select("id")
        .eq("nickname", nickname);

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

  // --------------------------------------------------------
  // ✅ 로그인 상태 자동 감지 및 폼 표시 제어
  // --------------------------------------------------------
  try {
    const { data: { session } } = await db.auth.getSession();
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const logoutBtn = document.getElementById("logoutBtn");
    const userInfo = document.getElementById("userInfo");

    if (session?.user) {
      if (loginForm) loginForm.style.display = "none";
      if (signupForm) signupForm.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "block";
      if (userInfo) userInfo.textContent = `${session.user.email} 로그인 중`;
    } else {
      if (loginForm) loginForm.style.display = "block";
      if (signupForm) signupForm.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (userInfo) userInfo.textContent = "";
    }
  } catch (err) {
    console.error("❌ 세션 감지 오류:", err);
  }
});
