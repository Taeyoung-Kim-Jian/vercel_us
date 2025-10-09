// ✅ 로그인 완료 시 redirect 파라미터 확인 후 이동
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  // Supabase 로그인 세션 감지 후 리디렉션
  const { data: { session } } = await SWINGINV.db.auth.getSession();
  if (session && redirect) {
    location.href = redirect;
  }

  SWINGINV.db.auth.onAuthStateChange((_event, session) => {
    if (session && redirect) {
      location.href = redirect;
    }
  });
});
