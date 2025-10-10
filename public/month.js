/* ==========================================================
   📅 SWING INVESTOR month.js (v1.0)
   - Supabase에서 월별 성과 데이터 조회
   - 탭별 데이터 필터링 및 테이블 출력
   ========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("month-table-body");
  const tabsContainer = document.getElementById("month-tabs");

  // 로딩 표시
  SWINGINV.showLoading(tableBody, "월별 데이터 불러오는 중...");

  try {
    // ✅ Supabase 연결
    const db = SWINGINV.db;

    // ✅ 데이터 가져오기 (예: total_return 테이블)
    // total_return 테이블은 다음 컬럼을 가진다고 가정:
    // 종목명, 발생일, 발생일종가, 현재가격, 최고, 최저, 수익률
    const { data, error } = await db
      .from("total_return")
      .select("종목명, 발생일, 발생일종가, 현재가격, 최고, 최저, 수익률")
      .order("발생일", { ascending: false });

    if (error || !data || data.length === 0) {
      SWINGINV.showError(tableBody, "데이터가 없습니다.");
      console.error(error);
      return;
    }

    // ✅ 월별 그룹핑
    const grouped = {};
    data.forEach((row) => {
      const d = new Date(row.발생일);
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

    // ✅ 탭 클릭 이벤트
    tabsContainer.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        tabsContainer.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderTable(grouped[btn.dataset.month]);
      });
    });

    // ✅ 초기 렌더링 (최신 월)
    renderTable(grouped[months[0]]);
  } catch (err) {
    console.error(err);
    SWINGINV.showError(tableBody, "데이터를 불러오지 못했습니다.");
  }

  // --------------------------------------
  // 📊 테이블 렌더링 함수
  // --------------------------------------
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
            <td>${SWINGINV.fmtDate(r.발생일)}</td>
            <td>${SWINGINV.nf(r.발생일종가)}</td>
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
