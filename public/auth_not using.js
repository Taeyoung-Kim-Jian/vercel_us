/* ==========================================================
   🔐 SWING INVESTOR — auth.js (v4.1, 이벤트 바인딩 포함)
   - 회원가입 / 로그인 / 로그아웃 / 상태감지 / UI 토글
   - 모든 동작을 이 파일 하나에서 처리
   ========================================================== */

console.log("🔐 SWING INVESTOR auth.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  // 1) common.js 준비 대기
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let db;
  for (let i = 0; i < 20; i++) {
    if (window.SWINGINV?.db) { db = SWINGINV.db; break; }
    await wait(150);
  }
  if (!db) { console.error("❌ Supabase 미초기화: common.js가 먼저 로드되어야 합니다."); return; }

  // 2) 도우미
  const $ = (id) => document.getElementById(id);
  const setMsg = (id, msg, color = "#dc2626") => { const el = $(id); if (el) { el.style.color = color; el.textContent = msg || ""; } };
  const show = (el, on = true) => el && (el.style.display = on ? "" : "none");
  const go = (url) => (location.href = url);

  // 3) 요소 참조 (있을 때만 연결되도록 안전하게)
  const loginForm = $("loginForm");
  const signupForm = $("signupForm");
  const logoutBtn = $("logoutBtn");

  const loginEmail = $("loginEmail");
  const loginPassword = $("loginPassword");
  const loginBtn = $("loginBtn");
  const loginError = $("loginError");
  const goSignup = $("goSignup");

  const signupEmail = $("signupEmail");
  const signupPassword = $("signupPassword");
  const signupNickname = $("signupNickname");
  const signupBtn = $("signupBtn");
  const signupError = $("signupError");
  const goLogin = $("goLogin");

  const userInfo = $("userInfo");

  const switchTo = (view) => {
    if (!loginForm || !signupForm) return;
    if (view === "signup") {
      show(loginForm, false); show(signupForm, true);
      if (loginError) loginError.textContent = "";
    } else {
      show(signupForm, false); show(loginForm, true);
      if (signupError) signupError.textContent = "";
    }
  };

  // 4) 이벤트 바인딩
  if (goSignup) goSignup.addEventListener("click", () => switchTo("signup"));
  if (goLogin) goLogin.addEventListener("click", () => switchTo("login"));

  if (loginBtn) {
    const doLogin = async () => {
      setMsg("loginError", "");
      const email = (loginEmail?.value || "").trim();
      const password = (loginPassword?.value || "").trim();
      if (!email || !password) return setMsg("loginError", "⚠️ 이메일과 비밀번호를 입력해주세요.");
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) return setMsg("loginError", "❌ 이메일 또는 비밀번호가 올바르지 않습니다.");
      go("index.html");
    };
    loginBtn.addEventListener("click", doLogin);
    // 엔터키로 로그인
    [loginEmail, loginPassword].forEach(inp => inp && inp.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); }));
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      setMsg("signupError", "");
      const email = (signupEmail?.value || "").trim();
      const password = (signupPassword?.value || "").trim();
      const nickname = (signupNickname?.value || "").trim();
      if (!email || !password || !nickname) return setMsg("signupError", "⚠️ 모든 항목을 입력해주세요.");
      const { error } = await db.auth.signUp({ email, password, options: { data: { nickname } } });
      if (error) return setMsg("signupError", "❌ 회원가입 실패: " + error.message);
      // 가입 후 로그인 폼으로 전환
      switchTo("login");
      setMsg("loginError", "✅ 회원가입 성공! 이메일 인증 후 로그인하세요.", "#16a34a");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try { await db.auth.signOut(); } catch (e) { console.error("❌ 로그아웃 실패:", e); }
      go("index.html");
    });
  }

  // 5) 페이지 진입 시 세션 상태에 따라 UI 세팅
  try {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      show(loginForm, false);
      show(signupForm, false);
      show(logoutBtn, true);
      if (userInfo) userInfo.textContent = `${session.user.email} 로그인 중`;
    } else {
      show(loginForm, true);
      show(signupForm, false);
      show(logoutBtn, false);
      if (userInfo) userInfo.textContent = "";
    }
  } catch (e) {
    console.error("❌ 세션 감지 오류:", e);
  }

  // 6) 전역 API (다른 페이지에서 호출 가능)
  window.SWINGINV = window.SWINGINV || {};
  SWINGINV.loginUser = async (email, password) => {
    setMsg("loginError", "");
    if (!email || !password) return setMsg("loginError", "⚠️ 이메일과 비밀번호를 입력해주세요.");
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) return setMsg("loginError", "❌ 이메일 또는 비밀번호가 올바르지 않습니다.");
    go("index.html");
  };
  SWINGINV.signUpUser = async (email, password, nickname) => {
    setMsg("signupError", "");
    if (!email || !password || !nickname) return setMsg("signupError", "⚠️ 모든 항목을 입력해주세요.");
    const { error } = await db.auth.signUp({ email, password, options: { data: { nickname } } });
    if (error) return setMsg("signupError", "❌ 회원가입 실패: " + error.message);
    switchTo("login");
    setMsg("loginError", "✅ 회원가입 성공! 이메일 인증 후 로그인하세요.", "#16a34a");
  };
  SWINGINV.logoutUser = async () => { try { await db.auth.signOut(); } finally { go("index.html"); } };
});
