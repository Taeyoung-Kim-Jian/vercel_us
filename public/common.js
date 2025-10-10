/* ==========================================================
   🌐 SWING INVESTOR common.js (v3.2 full)
   - 로그인/닉네임 관리
   - 헤더 자동 로그인 버튼 감지
   - showLoading / showError 복원
   - favicon 자동 주입
   ========================================================== */

console.log("🌐 SWING INVESTOR common.js loaded");

// ------------------------------------------
// 🔗 Supabase 연결
// ------------------------------------------
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------------------------
// 🌍 전역 객체 초기화
// ------------------------------------------
window.SWINGINV = window.SWINGINV || {};
SWINGINV.db = db;

// ------------------------------------------
// 🧩 유틸 함수들
// ------------------------------------------
function nf(num) {
  if (num == null || num === "") return "-";
  const n = parseFloat(num);
  return isNaN(n) ? "-" : n.toLocaleString();
}
function fmtPct(v) {
  if (v == null || isNaN(v)) return "-";
  const n = parseFloat(v);
  const sign = n >= 0 ? "▲" : "▼";
  const color = n >= 0 ? "#d32f2f" : "#1976d2";
  return `<span style="color:${color};font-weight:500;">${sign}${n.toFixed(2)}%</span>`;
}
function fmtDate(str) {
  if (!str) return "-";
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ✅ showLoading / showError 복원
function showLoading(target, msg = "데이터 불러오는 중...") {
  if (!target) return;
  target.innerHTML = `<div style="text-align:center;color:#666;padding:20px;">⏳ ${msg}</div>`;
}
function showError(target, msg = "데이터 로딩 실패") {
  if (!target) return;
  target.innerHTML = `<div style="text-align:center;color:#b91c1c;padding:20px;">❌ ${msg}</div>`;
}

// ------------------------------------------
// 🔐 로그인 세션 및 닉네임 처리
// ------------------------------------------
(async () => {
  try {
    const { data: { session } } = await db.auth.getSession();
    SWINGINV.user = session?.user || null;

    db.auth.onAuthStateChange(async (_event, session) => {
      SWINGINV.user = session?.user || null;
      if (SWINGINV.user) await checkNickname();
      updateHeaderAuthUI();
    });

    if (SWINGINV.user) await checkNickname();
    updateHeaderAuthUI();
  } catch (err) {
    console.error("❌ Auth 초기화 오류:", err.message);
  }
})();

// ------------------------------------------
// 👤 닉네임 확인 / 등록
// ------------------------------------------
async function checkNickname() {
  if (!SWINGINV.user) return;

  const { data, error } = await db
    .from("profiles")
    .select("nickname")
    .eq("id", SWINGINV.user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("닉네임 조회 실패:", error.message);
    return;
  }

  if (!data || !data.nickname) {
    let nickname = "";
    while (true) {
      nickname = prompt("닉네임을 설정해주세요 (2~12자, 중복 불가):");
      if (nickname === null) return;
      nickname = nickname.trim();
      if (nickname.length < 2 || nickname.length > 12) {
        alert("⚠️ 닉네임은 2~12자 사이여야 합니다.");
        continue;
      }
      const { data: dup } = await db.from("profiles").select("nickname").eq("nickname", nickname);
      if (dup && dup.length > 0) {
        alert("🚫 이미 사용 중인 닉네임입니다.");
        continue;
      }
      const { error: upErr } = await db.from("profiles").upsert({
        id: SWINGINV.user.id,
        nickname,
      });
      if (upErr) {
        alert("닉네임 저장 실패: " + upErr.message);
        continue;
      }
      SWINGINV.user.nickname = nickname;
      alert(`✅ '${nickname}' 닉네임이 등록되었습니다.`);
      break;
    }
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
// 🧭 헤더 로그인/로그아웃 UI 갱신
// ------------------------------------------
function updateHeaderAuthUI() {
  const tryBind = () => {
    const emailEl = document.getElementById("user-email");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    if (!emailEl || !loginBtn || !logoutBtn) return false;

    const u = SWINGINV.user;
    if (u) {
      const label = u.nickname ? u.nickname : u.email;
      emailEl.textContent = `👤 ${label}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    } else {
      emailEl.textContent = "로그인 필요";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }

    // ✅ 로그인 버튼 클릭 시 redirect
    loginBtn.onclick = () => {
      const current = location.pathname.split("/").pop();
      location.href = `login.html?redirect=${encodeURIComponent(current)}`;
    };
    logoutBtn.onclick = logoutUser;
    return true;
  };

  // 헤더가 늦게 로드되어도 자동 감지
  if (!tryBind()) {
    let retryCount = 0;
    const timer = setInterval(() => {
      if (tryBind() || retryCount++ > 30) clearInterval(timer);
    }, 300);
  }
}

// ------------------------------------------
// 📋 메뉴 강조
// ------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const current = location.pathname.split("/").pop();
  document.querySelectorAll(".gnb button").forEach((btn) => {
    const m = btn.getAttribute("onclick")?.match(/'(.*?)'/);
    if (m && current === m[1]) btn.classList.add("active");
  });
  updateHeaderAuthUI();
});

// ------------------------------------------
// 📌 favicon 자동 주입
// ------------------------------------------
(function ensureFavicon() {
  if (!document.querySelector("link[rel='icon']")) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href =
      "data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAD4+PgA7OzsAPDw8ADw8PAA8PDwAPDw8ADw8PAA8PDwAPDw8ADw8PAA8PDwAPDw8ADw8PAA8PDwA7OzsAPj4+AD///8AAP///wAA";
    document.head.appendChild(link);
  }
})();

// ------------------------------------------
// 🌍 전역 내보내기
// ------------------------------------------
window.SWINGINV = {
  ...window.SWINGINV,
  db,
  nf,
  fmtPct,
  fmtDate,
  esc,
  showLoading,
  showError,
  logoutUser,
  checkNickname,
  updateHeaderAuthUI,
};
