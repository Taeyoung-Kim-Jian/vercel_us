/* ==========================================================
   🌐 SWING INVESTOR common.js (닉네임 포함 통합버전)
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
// 🧩 기본 유틸
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

function showLoading(t, m = "데이터 불러오는 중...") {
  if (t) t.innerHTML = `<div style="text-align:center;color:#666;padding:20px;">⏳ ${m}</div>`;
}
function showError(t, m = "데이터 로딩 실패") {
  if (t) t.innerHTML = `<div style="text-align:center;color:#b91c1c;padding:20px;">❌ ${m}</div>`;
}

// ------------------------------------------
// 🔐 로그인 세션 관리 + 닉네임 확인
// ------------------------------------------
(async () => {
  try {
    const { data: { session } } = await db.auth.getSession();
    window.SWINGINV = window.SWINGINV || {};
    SWINGINV.user = session?.user || null;

    db.auth.onAuthStateChange(async (_event, session) => {
      SWINGINV.user = session?.user || null;
      await SWINGINV_checkProfile();
      SWINGINV_updateHeaderAuthUI();
    });

    // 최초 세션 체크
    await SWINGINV_checkProfile();

    // 보호 페이지 접근 제한
    const protectedPages = ["watch.html", "board.html"];
    const current = location.pathname.split("/").pop();
    if (protectedPages.includes(current) && !SWINGINV.user) {
      alert("로그인이 필요한 서비스입니다.");
      location.href = "login.html";
    }
  } catch (err) {
    console.error("❌ Auth 초기화 오류:", err);
  }
})();

// ------------------------------------------
// 👤 프로필 닉네임 확인 / 생성 / 요청
// ------------------------------------------
async function SWINGINV_checkProfile() {
  if (!SWINGINV.user) return;

  const { data, error } = await db
    .from("profiles")
    .select("nickname")
    .eq("id", SWINGINV.user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.warn("닉네임 조회 오류:", error.message);
    return;
  }

  if (!data || !data.nickname) {
    // 닉네임 입력 요청
    let nickname = "";
    while (!nickname || nickname.length < 2) {
      nickname = prompt("닉네임을 설정해주세요 (2자 이상):");
      if (nickname === null) return; // 취소 시 무시
    }

    const { error: upErr } = await db.from("profiles").upsert({
      id: SWINGINV.user.id,
      nickname,
    });

    if (upErr) alert("닉네임 저장 실패: " + upErr.message);
    else SWINGINV.user.nickname = nickname;
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
  SWINGINV_updateHeaderAuthUI();
  alert("🚪 로그아웃 완료");
}

// ------------------------------------------
// 🧭 헤더 로그인 상태 갱신
// ------------------------------------------
function SWINGINV_updateHeaderAuthUI() {
  const emailEl = document.getElementById("user-email");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (!emailEl || !loginBtn || !logoutBtn) return;

  const u = SWINGINV.user;
  if (u) {
    const label = u.nickname ? `${u.nickname}` : u.email;
    emailEl.textContent = `👤 ${label}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    emailEl.textContent = "로그아웃 중";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }

  logoutBtn.onclick = logoutUser;
}

// ------------------------------------------
// 📋 네비게이션 메뉴 강조
// ------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const current = location.pathname.split("/").pop();
  document.querySelectorAll(".gnb button").forEach((btn) => {
    const m = btn.getAttribute("onclick")?.match(/'(.*?)'/);
    if (m && current === m[1]) btn.classList.add("active");
  });
  SWINGINV_updateHeaderAuthUI();
});

// ------------------------------------------
// 🌍 전역 등록
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
  SWINGINV_checkProfile,
  SWINGINV_updateHeaderAuthUI,
};
