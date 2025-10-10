/* ==========================================================
   📅 SWING INVESTOR month.js (v1.5)
   - 월별 탭: 스크롤 가능 / 2025.1 형식
   - 데이터 소스: monthly_performance_view
   ========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("month-table-body");
  const tabsContainer = document.getElementById("month-tabs");

  SWINGINV.showLoading(tableBody, "월별 성과 데이터를 불러오는 중...");

  try {
    const db = SWINGINV.db;

    // ✅ monthly_performance_view에서 데이터 조회
    const { data, error } = await db
      .from("monthly_performance_view")
      .select(`
        종목명,
        종목코드,
        b가격,
        b날짜,
        측정일,
        측정일종가,
        현재가,
        측정일대비수익률,
        최고수익률,
        최저수익률,
        월구분
      `)
      .order("월구분", { ascending: false });

    if (error) {
      console.error("❌ Supabase Error:", error);
      SWINGINV.showError(tableBody, "데이터를 불러오지 못했습니다.");
      return;
    }

    if (!data || data.length === 0) {
      SWINGINV.showError(tableBody, "월별 성과 데이터가 없습니다.");
      return;
    }

    // ✅ 월별 그룹화
    const grouped = {};
    data.forEach((row) => {
      const key = row.월구분; // ex: 2025-01
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    // ✅ 월 탭 생성 (스크롤 가능 + 2025.1 형식)
    tabsContainer.innerHTML = months
      .map((m, i) => {
        const [year, month] = m.split("-");
        const label = `${year}.${parseInt(month, 10)}`; // 2025.1
        return `
          <button class="tab-btn ${i === 0 ? "active" : ""}" data-month="${m}">
            ${label}
          </button>
        `;
      })
      .join("");

    // ✅ 클릭 시 월별 데이터 표시
    tabsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;

      tabsContainer.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const monthKey = btn.dataset.month;
      renderTable(grouped[monthKey]);
    });

    // ✅ 초기 첫 번째 월 렌더링
    renderTable(grouped[months[0]]);
  } catch (err) {
    console.error("❌ JS Error:", err);
    SWINGINV.showError(tableBody, "데이터 로딩 실패");
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
        const cur = parseFloat(r.측정일대비수익률 || 0);
        const high = parseFloat(r.최고수익률 || 0);
        const low = parseFloat(r.최저수익률 || 0);
        const curColor = cur >= 0 ? "#d32f2f" : "#1976d2";
        const curSign = cur >= 0 ? "▲" : "▼";

        return `
          <tr>
            <td>${SWINGINV.esc(r.종목명)}</td>
            <td>${SWINGINV.fmtDate(r.측정일)}</td>
            <td>${SWINGINV.nf(r.측정일종가)}</td>
            <td>${SWINGINV.nf(r.현재가)}</td>
            <td style="color:${curColor};font-weight:500;">${curSign}${cur.toFixed(2)}%</td>
            <td style="color:#d32f2f;">▲${high.toFixed(2)}%</td>
            <td style="color:#1976d2;">▼${low.toFixed(2)}%</td>
          </tr>
        `;
      })
      .join("");
  }
});
