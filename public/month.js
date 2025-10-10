/* ==========================================================
   📅 SWING INVESTOR month.js (v1.2)
   - Supabase monthly_performance_view 뷰에서 월별 성과 조회
   - 월별 탭 자동 생성 및 테이블 출력
   ========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("month-table-body");
  const tabsContainer = document.getElementById("month-tabs");

  // ✅ 로딩 표시
  SWINGINV.showLoading(tableBody, "월별 성과 데이터를 불러오는 중...");

  try {
    const db = SWINGINV.db;

    // ✅ monthly_performance_view에서 데이터 조회
    // ※ 컬럼 예시: 종목명, 등록일, 당시가격, 현재가격, 최고, 최저, 수익률
    const { data, error } = await db
      .from("monthly_performance_view")
      .select("종목명, 등록일, 당시가격, 현재가격, 최고, 최저, 수익률")
      .order("등록일", { ascending: false });

    if (error || !data || data.length === 0) {
      SWINGINV.showError(tableBody, "월별 성과 데이터가 없습니다.");
      console.error("❌ Supabase Error:", error);
      return;
    }

    // ✅ 월별 그룹화 (등록일 기준)
    const grouped = {};
    data.forEach((row) => {
      const d = new Date(row.등록일);
      if (isNaN(d)) return;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[ym]) grouped[ym] = [];
      grouped[ym].push(row);
    });

    const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    // ✅ 월별 탭 생성
    tabsContainer.innerHTML = months
      .map(
        (m, i) =>
          `<button class="tab-btn ${i === 0 ? "active" : ""}" data-month="${m}">
             ${m.replace("-", "년 ")}월
           </button>`
      )
      .join("");

    // ✅ 탭 클릭 시 데이터 표시
    tabsContainer.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        tabsContainer.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderTable(grouped[btn.dataset.month]);
      });
    });

    // ✅ 기본 첫 번째(최신 월) 표시
    renderTable(grouped[months[0]]);
  } catch (err) {
    console.error("❌ JS Error:", err);
    SWINGINV.showError(tableBody, "데이터를 불러오지 못했습니다.");
  }

  // ------------------------------------------
  // 📊 테이블 렌더링 함수
  // ------------------------------------------
  function renderTable(rows) {
    if (!rows || rows.length === 0) {
      SWINGINV.showError(tableBody, "해당 월 데이터가 없습니다.");
      return;
    }

    tableBody.innerHTML = rows
      .map((r) => {
        const 수익률 = parseFloat(r.수익률 || 0);
        const color = 수익률 >= 0 ? "#d32f2f" : "#1976d2";
        const sign = 수익률 >= 0 ? "▲" : "▼";
        return `
          <tr>
            <td>${SWINGINV.esc(r.종목명)}</td>
            <td>${SWINGINV.fmtDate(r.등록일)}</td>
            <td>${SWINGINV.nf(r.당시가격)}</td>
            <td>${SWINGINV.nf(r.현재가격)}</td>
            <td style="color:${color};font-weight:500;">${sign}${수익률.toFixed(2)}%</td>
            <td>${SWINGINV.nf(r.최고)}</td>
            <td>${SWINGINV.nf(r.최저)}</td>
          </tr>
        `;
      })
      .join("");
  }
});
