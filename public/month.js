/* ==========================================================
   📅 SWING INVESTOR month.js (v2.0)
   - 월별 탭 + 클릭 정렬 기능 추가
   - 데이터 소스: monthly_performance_view
   ========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("month-table-body");
  const tabsContainer = document.getElementById("month-tabs");
  const tableHead = document.querySelector("thead");

  SWINGINV.showLoading(tableBody, "월별 성과 데이터를 불러오는 중...");

  let grouped = {};
  let currentMonth = null;
  let currentSort = { key: null, asc: true }; // 현재 정렬 상태

  try {
    const db = SWINGINV.db;

    // ✅ monthly_performance_view 조회
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
    grouped = {};
    data.forEach((row) => {
      const key = row.월구분; // ex) 2025-01
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    // ✅ 월 탭 생성
    tabsContainer.innerHTML = months
      .map((m, i) => {
        const [year, month] = m.split("-");
        const label = `${year}.${parseInt(month, 10)}`;
        return `
          <button class="tab-btn ${i === 0 ? "active" : ""}" data-month="${m}">
            ${label}
          </button>
        `;
      })
      .join("");

    // ✅ 탭 클릭 이벤트
    tabsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;

      tabsContainer.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      currentMonth = btn.dataset.month;
      renderTable(grouped[currentMonth]);
    });

    // ✅ 초기 첫 월 렌더링
    currentMonth = months[0];
    renderTable(grouped[currentMonth]);
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

    // ✅ 정렬 적용
    if (currentSort.key) {
      rows = [...rows].sort((a, b) => {
        let valA = a[currentSort.key];
        let valB = b[currentSort.key];

        // 문자열 비교
        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA > valB) return currentSort.asc ? 1 : -1;
        if (valA < valB) return currentSort.asc ? -1 : 1;
        return 0;
      });
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

  // ------------------------------------------
  // 🔼🔽 헤더 클릭 정렬 기능
  // ------------------------------------------
  tableHead.addEventListener("click", (e) => {
    const th = e.target.closest("th");
    if (!th) return;

    const index = Array.from(th.parentNode.children).indexOf(th);
    const keyMap = ["종목명", "측정일", "측정일종가", "현재가", "측정일대비수익률", "최고수익률", "최저수익률"];
    const key = keyMap[index];
    if (!key) return;

    // 정렬 상태 토글
    if (currentSort.key === key) {
      currentSort.asc = !currentSort.asc;
    } else {
      currentSort.key = key;
      currentSort.asc = true;
    }

    // 헤더 강조 업데이트
    tableHead.querySelectorAll("th").forEach((el) => (el.style.color = "#111827"));
    th.style.color = "#1e40af";
    th.textContent = th.textContent.replace(/ ↑| ↓/g, "");
    th.textContent += currentSort.asc ? " ↑" : " ↓";

    renderTable(grouped[currentMonth]);
  });
});
