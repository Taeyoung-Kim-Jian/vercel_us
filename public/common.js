/* ==========================================================
   🌐 SWING INVESTOR common.js
   (로그인/회원가입 모달 포함 버전)
   ========================================================== */

console.log("🌐 SWING INVESTOR common.js loaded");

// Supabase 연결
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 기본 포맷 함수
function nf(num) {
  if (num === null || num === undefined || num === "") return "-";
  const n = parseFloat(num);
  return isNaN(n) ? "-" : n.toLocaleString();
}
function fmtPct(v) {
  if (v === null || v === undefined || isNaN(v)) return "-";
  const n = parseFloat(v);
  const c = n >= 0 ? "#d32f2f" : "#1976d2";
  const s = n >= 0 ? "▲" : "▼";
  return `<span style="color:${c};font-weight:500;">${s}${n.toFixed(2)}%</span>`;
}
function fmtDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  return isNaN(date) ? d : `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}
function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 로딩/에러
function showLoading(t, m = "데이터 불러오는 중...") {
  if (t) t.innerHTML = `<div style="text-align:center;color:#666;padding:20px;">⏳ ${m}</div>`;
}
function showError(t, m = "데이터 로딩 실패") {
  if (t) t.innerHTML = `<div style="text-align:center;color:#b91c1c;padding:20px;">❌ ${m}</div>`;
}

// 로그인 세션 유지
(async () => {
  try {
    const { data: { session } } = await db.auth.getSession();
    window.SWINGINV = window.SWINGINV || {};
    SWINGINV.user = session?.user || null;
    db.auth.onAuthStateChange((_e, s) => {
      SWINGINV.user = s?.user || null;
      SWINGINV_updateHeaderAuthUI();
    });
  } catch (e) {
    console.error("Auth init error:", e.message);
  }
})();

// 회원가입 / 로그인 / 로그아웃
async function signUpWithEmail(email, password) {
  const { error } = await db.auth.signUp({ email, password });
  if (error) alert("❌ 회원가입 실패: " + error.message);
  else alert("✅ 회원가입 완료! 이메일 인증 후 로그인하세요.");
}
async function loginWithPassword(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) alert("❌ 로그인 실패: " + error.message);
  else {
    SWINGINV.user = data.user;
    SWINGINV_updateHeaderAuthUI();
    alert("✅ 로그인 성공");
  }
}
async function logoutUser() {
  await db.auth.signOut();
  SWINGINV.user = null;
  SWINGINV_updateHeaderAuthUI();
  alert("🚪 로그아웃 완료");
}

// 헤더 UI 갱신
function SWINGINV_updateHeaderAuthUI() {
  const userLabel = document.getElementById("user-email");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!userLabel || !loginBtn || !logoutBtn) return;

  const user = SWINGINV.user;
  if (user) {
    userLabel.textContent = `👤 ${user.email}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    userLabel.textContent = "로그아웃 중";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }

  logoutBtn.onclick = logoutUser;
}

// 로그인 모달
function openLoginModal(mode = "login") {
  const modal = document.getElementById("loginModal");
  if (!modal) return;
  modal.classList.remove("hidden");

  const title = document.getElementById("modal-title");
  const submitBtn = document.getElementById("modal-submit");
  const switchToSignup = document.getElementById("switchToSignup");
  const emailInput = document.getElementById("modal-email");
  const pwInput = document.getElementById("modal-password");

  const setMode = (m) => {
    mode = m;
    if (m === "login") {
      title.textContent = "🔑 로그인";
      submitBtn.textContent = "로그인";
      switchToSignup.textContent = "회원가입";
    } else {
      title.textContent = "🧭 회원가입";
      submitBtn.textContent = "회원가입";
      switchToSignup.textContent = "로그인";
    }
  };
  setMode(mode);

  switchToSignup.onclick = (e) => {
    e.preventDefault();
    setMode(mode === "login" ? "signup" : "login");
  };

  modal.querySelector(".close-btn").onclick = () => modal.classList.add("hidden");
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hidden"); };

  submitBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const password = pwInput.value.trim();
    if (!email || !password) return alert("이메일과 비밀번호를 입력하세요.");
    if (mode === "login") await loginWithPassword(email, password);
    else await signUpWithEmail(email, password);
    modal.classList.add("hidden");
  };
}

// 현재 페이지 강조
document.addEventListener("DOMContentLoaded", () => {
  const cur = location.pathname.split("/").pop();
  document.querySelectorAll(".gnb button").forEach((btn) => {
    const m = btn.getAttribute("onclick")?.match(/'(.*?)'/);
    if (m && cur === m[1]) btn.classList.add("active");
  });
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.onclick = () => openLoginModal("login");
  SWINGINV_updateHeaderAuthUI();
});

// 전역 등록
window.SWINGINV = {
  ...window.SWINGINV,
  db,
  nf,
  fmtPct,
  fmtDate,
  esc,
  showLoading,
  showError,
  signUpWithEmail,
  loginWithPassword,
  logoutUser,
  SWINGINV_updateHeaderAuthUI,
};
