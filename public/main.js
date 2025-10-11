/* =========================================================
   📊 main.js — index.html (4개 카드 + 2개 테이블)
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  console.log("📡 main.js loaded");

  const totalBody = document.getElementById("total-table-body");
  const swingBody = document.getElementById("swing-table-body");
  const cards = document.querySelectorAll(".card"); // 1~4번 카드
  const loadMoreTotalBtn = document.getElementById("loadMoreTotalBtn");
  const loadMoreSwingBtn = document.getElementById("loadMoreSwingBtn");

  SWINGINV.showLoading(totalBody);
  SWINGINV.showLoading(swingBody);

  const PAGE_SIZE = 5;
  let totalPage = 0;
  let swingPage = 0;
  let totalData = [];
  let swingData = [];

  // ✅ 카드 렌더링 공통 함수
  const renderTop5 = (card, title, data, field = "수익률") => {
    if (!data?.length) {
      card.innerHTML = `<h4>${title}</h4><div style="text-align:center;padding:20px;">데이터 없음</div>`;
      return;
    }

    card.innerHTML = `
      <h4>${title}</h4>
      <ul class="top5-list">
        ${data
          .slice(0, 5)
          .map((r, i) => {
            const value =
              parseFloat(r[field] ?? r.측정일대비수익률 ?? 0) || 0;
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
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  };

  try {
    /* ✅ 1️⃣ 전체 수익률 Top5 */
    const { data: totalDataRaw, error: totalErr } = await SWINGINV.db
      .from("total_return")
      .select("종목명, 종목코드, 시작가격, 현재가격, 수익률")
      .order("수익률", { ascending: false });

    if (totalErr) throw totalErr;
    totalData = totalDataRaw || [];
    renderTop5(cards[0], "📈 전체 수익률 Top5", totalData, "수익률");

    // ✅ 전체 수익률 테이블
    const renderTotalPage = () => {
      const start = totalPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageData = totalData.slice(start, end);

      const rows = pageData
        .map(
          (r) => `
          <tr>
            <td class="clickable-name" data-code="${r.종목코드}" data-name="${r.종목명}">
              ${SWINGINV.esc(r.종목명)}
            </td>
            <td>${SWINGINV.nf(r.시작가격)}</td>
            <td>${SWINGINV.nf(r.현재가격)}</td>
            <td>${SWINGINV.fmtPct(r.수익률)}</td>
          </tr>`
        )
        .join("");

      if (totalPage === 0) totalBody.innerHTML = rows;
      else totalBody.insertAdjacentHTML("beforeend", rows);

      totalPage++;
      if (end >= totalData.length) loadMoreTotalBtn.style.display = "none";
    };

    renderTotalPage();

    loadMoreTotalBtn.addEventListener("click", () => {
      window.location.href = "total.html";
    });

    /* ✅ 2️⃣ 관심종목 Top5 */
    const { data: watchlist, error: watchErr } = await SWINGINV.db
      .from("watchlist_with_return")
      .select("종목명, 종목코드, 수익률")
      .eq("공개여부", true)
      .order("수익률", { ascending: false })
      .limit(5);

    if (watchErr) throw watchErr;
    renderTop5(cards[1], "⭐ 관심종목 수익률 Top5", watchlist, "수익률");

    /* ✅ 3️⃣ 전체 기준가 수익률 Top5 */
    const { data: monthAll, error: monthAllErr } = await SWINGINV.db
      .from("monthly_performance_view")
      .select("종목명, 종목코드, 측정일대비수익률")
      .order("측정일대비수익률", { ascending: false })
      .limit(5);

    if (monthAllErr) throw monthAllErr;
    renderTop5(cards[2], "🌍 기준가 수익률 Top5", monthAll, "측정일대비수익률");

    /* ✅ 4️⃣ 이번 달 수익률 Top5 */
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`; // ✅ date 타입 호환 ("YYYY-MM-01")
    const monthLabel = `${now.getMonth() + 1}월`;

    const { data: monthNow, error: monthErr } = await SWINGINV.db
      .from("monthly_performance_view")
      .select("종목명, 종목코드, 측정일대비수익률, 월구분")
      .eq("월구분", ym)
      .order("측정일대비수익률", { ascending: false })
      .limit(5);

    if (monthErr) {
      console.error("❌ monthly_performance_view:", monthErr);
      renderTop5(cards[3], `📆 ${monthLabel} 수익률 Top5`, []);
    } else {
      renderTop5(cards[3], `📆 ${monthLabel} 수익률 Top5`, monthNow, "측정일대비수익률");
    }

    /* ✅ 5️⃣ 스윙 적정가격 테이블 */
    const { data: swingView, error: swingErr } = await SWINGINV.db
      .from("swing_proper_view")
      .select("*")
      .order("괴리율", { ascending: true });

    if (swingErr) throw swingErr;
    swingData = swingView || [];

    const renderSwingPage = () => {
      const start = swingPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageData = swingData.slice(start, end);

      const rows = pageData
        .map(
          (r) => `
          <tr>
            <td class="clickable-name" data-code="${r.종목코드}" data-name="${r.종목명}">
              ${SWINGINV.esc(r.종목명)}
            </td>
            <td>${SWINGINV.nf(r.적정매수가)}</td>
            <td>${SWINGINV.nf(r.현재가)}</td>
            <td>${SWINGINV.fmtPct(r.괴리율)}</td>
          </tr>`
        )
        .join("");

      if (swingPage === 0) swingBody.innerHTML = rows;
      else swingBody.insertAdjacentHTML("beforeend", rows);

      swingPage++;
      if (end >= swingData.length) loadMoreSwingBtn.style.display = "none";
    };

    renderSwingPage();

    loadMoreSwingBtn.addEventListener("click", () => {
      window.location.href = "proper.html";
    });
  } catch (err) {
    console.error("❌ 데이터 로딩 오류:", err);
    SWINGINV.showError(totalBody, "전체 수익률 데이터를 불러오지 못했습니다.");
    SWINGINV.showError(swingBody, "스윙 적정가격 데이터를 불러오지 못했습니다.");
  }
});
