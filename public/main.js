/* =========================================================
   ⚡ main.js — SWING INVESTOR Dashboard (v4.6 Ultra Optimized)
   - Promise.all 로 모든 쿼리 병렬 실행
   - select("*") 제거 → 경량 데이터만 요청
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 main.js v4.6 loaded");

  const totalBody = document.getElementById("total-table-body");
  const swingBody = document.getElementById("swing-table-body");
  const cards = document.querySelectorAll(".card");
  const loadMoreTotalBtn = document.getElementById("loadMoreTotalBtn");
  const loadMoreSwingBtn = document.getElementById("loadMoreSwingBtn");

  SWINGINV.showLoading(totalBody);
  SWINGINV.showLoading(swingBody);

  const PAGE_SIZE = 5;
  let totalPage = 0;
  let swingPage = 0;
  let totalData = [];
  let swingData = [];

  // ✅ 공통 Top5 렌더 함수
  const renderTop5 = (card, title, data, field = "수익률") => {
    if (!data?.length) {
      card.innerHTML = `<h4>${title}</h4><div style="text-align:center;padding:20px;">데이터 없음</div>`;
      return;
    }

    card.innerHTML = `
      <h4>${title}</h4>
      <ul class="top5-list">
        ${data.slice(0, 5).map((r, i) => {
          const value = parseFloat(r[field] ?? r.측정일대비수익률 ?? 0) || 0;
          const color = value >= 0 ? "#dc2626" : "#2563eb";
          const sign = value >= 0 ? "▲" : "▼";
          return `
            <li>
              <span class="rank">${i + 1}.</span>
              <span class="clickable-name" data-code="${r.종목코드 || ""}" data-name="${r.종목명 || ""}">
                ${SWINGINV.esc(r.종목명)}
              </span>
              <span class="rate" style="color:${color}">
                ${sign}${Math.abs(value).toFixed(2)}%
              </span>
            </li>`;
        }).join("")}
      </ul>`;
  };

  try {
    // ✅ 4개 쿼리를 병렬 실행
    const [
      totalRes,
      watchRes,
      monthAllRes,
      swingRes
    ] = await Promise.all([
      SWINGINV.db.from("total_return")
        .select("종목명, 종목코드, 시작가격, 현재가격, 수익률")
        .order("수익률", { ascending: false }),

      SWINGINV.db.from("watchlist_with_return")
        .select("종목명, 종목코드, 수익률")
        .eq("공개여부", true)
        .order("수익률", { ascending: false })
        .limit(5),

      SWINGINV.db.from("monthly_performance_view")
        .select("종목명, 종목코드, 측정일대비수익률, 월구분")
        .order("측정일대비수익률", { ascending: false })
        .limit(5),

      SWINGINV.db.from("swing_proper_view")
        .select("종목명, 종목코드, 적정매수가, 현재가, 괴리율")
        .order("괴리율", { ascending: true })
    ]);

    // ✅ 데이터 추출
    totalData = totalRes.data || [];
    const watchData = watchRes.data || [];
    const monthAll = monthAllRes.data || [];
    swingData = swingRes.data || [];

    // ✅ 1️⃣ 전체 수익률 Top5
    renderTop5(cards[0], "📈 전체 수익률 Top5", totalData, "수익률");

    // ✅ 2️⃣ 관심종목 Top5
    renderTop5(cards[1], "⭐ 관심종목 수익률 Top5", watchData, "수익률");

    // ✅ 3️⃣ 기준가 수익률 Top5
    const sorted = [...monthAll].sort(
      (a, b) => (parseFloat(b.측정일대비수익률) || 0) - (parseFloat(a.측정일대비수익률) || 0)
    );
    renderTop5(cards[2], "🌍 기준가 수익률 Top5", sorted, "측정일대비수익률");

    // ✅ 4️⃣ 이번 달 수익률 Top5
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthLabel = `${now.getMonth() + 1}월`;
    const monthNow = monthAll.filter((r) => r.월구분 === ym);
    renderTop5(cards[3], `📆 ${monthLabel} 수익률 Top5`, monthNow, "측정일대비수익률");

    // ✅ 전체 수익률 테이블 렌더
    const renderTotalPage = () => {
      const start = totalPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageData = totalData.slice(start, end);
      const rows = pageData.map(
        (r) => `
          <tr>
            <td class="clickable-name" data-code="${r.종목코드}" data-name="${r.종목명}">
              ${SWINGINV.esc(r.종목명)}
            </td>
            <td>${SWINGINV.nf(r.시작가격)}</td>
            <td>${SWINGINV.nf(r.현재가격)}</td>
            <td>${SWINGINV.fmtPct(r.수익률)}</td>
          </tr>`
      ).join("");

      if (totalPage === 0) totalBody.innerHTML = rows;
      else totalBody.insertAdjacentHTML("beforeend", rows);

      totalPage++;
      if (end >= totalData.length) loadMoreTotalBtn.style.display = "none";
    };

    renderTotalPage();
    loadMoreTotalBtn.addEventListener("click", () => {
      location.href = "total.html";
    });

    // ✅ 스윙 적정가 테이블 렌더
    const renderSwingPage = () => {
      const start = swingPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageData = swingData.slice(start, end);
      const rows = pageData.map(
        (r) => `
          <tr>
            <td class="clickable-name" data-code="${r.종목코드}" data-name="${r.종목명}">
              ${SWINGINV.esc(r.종목명)}
            </td>
            <td>${SWINGINV.nf(r.적정매수가)}</td>
            <td>${SWINGINV.nf(r.현재가)}</td>
            <td>${SWINGINV.fmtPct(r.괴리율)}</td>
          </tr>`
      ).join("");

      if (swingPage === 0) swingBody.innerHTML = rows;
      else swingBody.insertAdjacentHTML("beforeend", rows);

      swingPage++;
      if (end >= swingData.length) loadMoreSwingBtn.style.display = "none";
    };

    renderSwingPage();
    loadMoreSwingBtn.addEventListener("click", () => {
      location.href = "proper.html";
    });

  } catch (err) {
    console.error("❌ 데이터 로딩 오류:", err);
    SWINGINV.showError(totalBody, "전체 수익률 데이터를 불러오지 못했습니다.");
    SWINGINV.showError(swingBody, "스윙 적정가격 데이터를 불러오지 못했습니다.");
  }
});
