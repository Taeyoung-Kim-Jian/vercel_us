/* ==========================================================
   🔐 SWING INVESTOR auth.js
   ========================================================== */
console.log("🔐 SWING INVESTOR auth.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  const wait = (ms)=>new Promise(r=>setTimeout(r,ms));
  let db;
  for (let i=0;i<20;i++){ if(window.SWINGINV?.db){ db=SWINGINV.db; break; } await wait(250);}
  if(!db){ alert("❌ Supabase 초기화 실패"); return; }

  // ✅ 이메일/닉네임 중복 체크
  SWINGINV.checkDuplicate = async(email,nickname)=>{
    const exists={email:false,nickname:false};
    try{
      if(email){
        const {data:e}=await db.from("profiles").select("id").eq("email",email);
        if(e?.length>0) exists.email=true;
      }
      if(nickname){
        const {data:n}=await db.from("profiles").select("id").eq("nickname",nickname);
        if(n?.length>0) exists.nickname=true;
      }
    }catch(err){console.error(err);}
    return exists;
  };

  // ✅ 로그아웃
  SWINGINV.logoutUser = async ()=>{
    await db.auth.signOut();
    alert("🚪 로그아웃 완료");
    location.href="login.html";
  };
});
