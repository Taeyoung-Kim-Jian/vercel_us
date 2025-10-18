/* ==========================================================
   🌐 SWING INVESTOR — common.js (v4.6 Stable Full)
   - Supabase 초기화 + 로그인/회원가입/로그아웃/헤더 UI + 유틸 + 테이블 정렬
   ========================================================== */

console.log("🌐 SWING INVESTOR common_auth.js loaded");

// ------------------------------------------------------------
// ✅ 1. Supabase 초기화
// ------------------------------------------------------------
const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

if (!window.supabase) console.error("❌ Supabase SDK not loaded.");

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("✅ Supabase client initialized.");

// ------------------------------------------------------------
// ✅ 2. 전역 네임스페이스 정의
// ------------------------------------------------------------
window.SWINGINV = {
  db,
  user: null,

  // ---------------------------
  // 🔹 공통 유틸
  // ---------------------------
  showLoading(el, msg = "⏳ 불러오는 중...") {
    if (!el) return;
    el.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:10px;">${msg}</td></tr>`;
  },

  showError(el, msg = "❌ 오류가 발생했습니다.") {
    if (!el) return;
    el.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red;padding:10px;">${msg}</td></tr>`;
  },

  nf(val) {
    if (val == null || val === "") return "-";
    return Number(val).toLocaleString();
  },

  fmtDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toISOString().slice(0, 10);
  },

  fmtPct(num) {
    if (num == null) return "-";
    const n = parseFloat(num);
    const sign = n >= 0 ? "▲" : "▼";
    const color = n >= 0 ? "#dc2626" : "#2563eb";
    return `<span style="color:${color};font-weight:600;">${sign}${Math.abs(n).toFixed(2)}%</span>`;
  },

  esc(str) {
    return (str || "").replace(/[&<>"']/g, (m) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[m];
    });
  },

  // ---------------------------
  // 🔹 인증 관련 함수
  // ---------------------------
  async loginUser(email, password, errEl) {
    if (!email || !password) {
      if (errEl) errEl.textContent = "⚠️ 이메일과 비밀번호를 입력해주세요.";
      return;
    }
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("❌ 로그인 실패:", error);
      if (errEl) errEl.textContent = "❌ 이메일 또는 비밀번호가 올바르지 않습니다.";
      return;
    }
    console.log("✅ 로그인 성공");
    location.href = "index.html";
  },

  async signUpUser(email, password, nickname, errEl) {
    if (!email || !password || !nickname) {
      if (errEl) errEl.textContent = "⚠️ 모든 항목을 입력해주세요.";
      return;
    }
    const { error } = await db.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });
    if (error) {
      console.error("❌ 회원가입 실패:", error);
      if (errEl) errEl.textContent = "❌ 회원가입 실패: " + error.message;
      return;
    }
    console.log("✅ 회원가입 성공");
    location.href = "index.html";
  },

  async logoutUser() {
    try {
      await db.auth.signOut();
      console.log("👋 로그아웃 성공");
      location.href = "index.html";
    } catch (e) {
      console.error("❌ 로그아웃 실패:", e);
    }
  },
};

// ------------------------------------------------------------
// ✅ 3. 초기 인증 상태 확인
// ------------------------------------------------------------
(async () => {
  try {
    const { data, error } = await db.auth.getUser();
    if (!error && data?.user) {
      SWINGINV.user = data.user;
      console.log("👤 Logged in:", data.user.email);
    }
  } catch (err) {
    console.error("❌ Auth init check failed:", err);
  }
})();

// ------------------------------------------------------------
// ✅ 4. 인증 이벤트 감지
// ------------------------------------------------------------
db.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Auth state changed:", event);
  if (event === "SIGNED_IN") {
    SWINGINV.user = session?.user || null;
    console.log("👤 로그인 감지:", session?.user?.email);
  } else if (event === "SIGNED_OUT") {
    SWINGINV.user = null;
    console.log("👋 로그아웃 감지");
  }
  window.SWINGINV_updateHeaderAuthUI?.();
});

// ------------------------------------------------------------
// ✅ 5. 헤더 자동 갱신 (닉네임 + 버튼 전환)
// ------------------------------------------------------------
window.SWINGINV_updateHeaderAuthUI = async () => {
  const tryGet = (id) => document.getElementById(id);
  const emailSpan = tryGet("user-email");
  const loginBtn = tryGet("loginBtn");
  const logoutBtn = tryGet("logoutBtn");

  if (!emailSpan || !loginBtn || !logoutBtn) {
    console.warn("⏳ Header not ready, retrying in 300ms...");
    setTimeout(window.SWINGINV_updateHeaderAuthUI, 300);
    return;
  }

  try {
    const { data: sessionData } = await SWINGINV.db.auth.getSession();
    const user = sessionData?.session?.user || null;

    if (user) {
      const nickname = user.user_metadata?.nickname || user.email.split("@")[0];
      emailSpan.textContent = `${nickname} 님`;
      emailSpan.style.color = "#2563eb";
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-flex";

      logoutBtn.onclick = async () => {
        await SWINGINV.logoutUser();
        window.SWINGINV_updateHeaderAuthUI();
      };

      console.log("✅ Header updated → 로그인 표시:", nickname);
    } else {
      emailSpan.textContent = "로그아웃 중";
      emailSpan.style.color = "#374151";
      loginBtn.style.display = "inline-flex";
      logoutBtn.style.display = "none";
      console.log("✅ Header updated → 로그아웃 표시");
    }
  } catch (err) {
    console.error("❌ Header UI update failed:", err);
  }
};

// ------------------------------------------------------------
// ✅ 6. 페이지 로드 후 헤더 갱신
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(window.SWINGINV_updateHeaderAuthUI, 500);
});

// ------------------------------------------------------------
// ✅ 7. window.db 호환성 alias 추가
// ------------------------------------------------------------
if (window.SWINGINV?.db) {
  window.db = window.SWINGINV.db;
  console.log("✅ window.db alias created (for backward compatibility)");
}

// ------------------------------------------------------------
// ✅ 8. 모든 테이블 컬럼 클릭 정렬 기능 (오름/내림 토글, 화살표 표시 제거)
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const tables = document.querySelectorAll("table");
  tables.forEach((table) => {
    const headers = table.querySelectorAll("thead th");
    headers.forEach((th, index) => {
      th.style.cursor = "pointer";
      let asc = true;

      th.innerHTML = th.textContent.trim();

      th.addEventListener("click", () => {
        const tbody = table.querySelector("tbody");
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll("tr"));

        // 정렬
        const sortedRows = rows.sort((a, b) => {
          const aText = a.children[index].textContent.trim();
          const bText = b.children[index].textContent.trim();

          const aNum = parseFloat(aText.replace(/[^\d.-]/g, ""));
          const bNum = parseFloat(bText.replace(/[^\d.-]/g, ""));

          if (!isNaN(aNum) && !isNaN(bNum)) {
            return asc ? aNum - bNum : bNum - aNum;
          }
          return asc ? aText.localeCompare(bText) : bText.localeCompare(aText);
        });

        tbody.innerHTML = "";
        sortedRows.forEach((row) => tbody.appendChild(row));

        asc = !asc;
      });
    });
  });
});

console.log("✅ SWINGINV common_auth.js fully initialized.");

function applyTableFixes() {
  document.querySelectorAll('table').forEach(table => {
    if (!table.parentElement.classList.contains('table-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }

    const firstTh = table.querySelector('thead th:first-child');
    if (!firstTh) return;

    const firstColName = firstTh.innerText.trim();

    table.classList.remove('fixed-name', 'fixed-rank-name');

    if (firstColName === '순위') {
      table.classList.add('fixed-rank-name');
    } else if (firstColName === '종목명') {
      table.classList.add('fixed-name');
    }
  });
}
// common.js


document.addEventListener('DOMContentLoaded', applyTableFixes);
