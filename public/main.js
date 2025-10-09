/* =========================================================
   📊 main.js — index.html
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const totalBody = document.getElementById("total-table-body");
  const swingBody = document.getElementById("swing-table-body");
  const top5Card = document.getElementById("top5-card");
  const loadMoreTotalBtn = document.getElementById("loadMoreTotalBtn");
  const loadMoreSwingBtn = document.getElementById("loadMoreSwingBtn");

  ECONews.showLoading(totalBody);
  ECONews.showLoading(swingBody);

  const PAGE_SIZE = 10;
  let totalPage = 0;
  let swingPage = 0;
  let totalData = [];
  let swingData = [];

  try {
    /* ✅ 1️⃣ 전체 수익률 (기존 테이블에서 그대로 가져옴) */
    const { data: totalDataRaw, error: totalErr } = await ECONews.db
      .from("total_return")
      .select("종목명, 종목코드, 시작가격, 현재가격, 수익률")
      .order("수익률", { ascending: false });

    if (totalErr) throw totalErr;
    totalData = totalDataRaw || [];

    // Top5 카드
    const top5 = totalData.slice(0, 5);
    top5Card.innerHTML = `
      <h4>📈 수익률 Top 5</h4>
      <ul class="top5-list">
        ${top5
          .map(
            (r, i) => `
          <li>
            <span class="rank">${i + 1}.</span>
            <span class="clickable-name" data-code="${r.종목코드}" data-name="${r.종목명}">
              ${ECONews.esc(r.종목명)}
            </span>
            <span class="rate">${ECONews.fmtPct(r.수익률)}</span>
          </li>
        `
          )
          .join("")}
      </ul>
    `;

    // 전체 수익률 테이블
    const renderTotalPage = () => {
      const start = totalPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageData = totalData.slice(start, end);

      const rows = pageData
        .map(
          (r) => `
        <tr>
          <td class="clickable-name" data-code="${r.종목코드}" data-name="${r.종목명}">
            ${ECONews.esc(r.종목명)}
          </td>
          <td style="text-align:right">${ECONews.nf(r.시작가격)}</td>
          <td style="text-align:right">${ECONews.nf(r.현재가격)}</td>
          <td style="text-align:right">${ECONews.fmtPct(r.수익률)}</td>
        </tr>
      `
        )
        .join("");

      if (totalPage === 0) totalBody.innerHTML = rows;
      else totalBody.insertAdjacentHTML("beforeend", rows);

      totalPage++;
      if (end >= totalData.length) loadMoreTotalBtn.style.display = "none";
    };

    renderTotalPage();
    loadMoreTotalBtn.addEventListener("click", renderTotalPage);

    /* ✅ 2️⃣ 스윙 적정가격 (뷰 기반: swing_proper_view) */
    const { data: swingView, error: swingErr } = await ECONews.db
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
            ${ECONews.esc(r.종목명)}
          </td>
          <td style="text-align:right">${ECONews.nf(r.적정매수가)}</td>
          <td style="text-align:right">${ECONews.nf(r.현재가)}</td>
          <td style="text-align:right">${ECONews.fmtPct(r.괴리율)}</td>
        </tr>
      `
        )
        .join("");

      if (swingPage === 0) swingBody.innerHTML = rows;
      else swingBody.insertAdjacentHTML("beforeend", rows);

      swingPage++;
      if (end >= swingData.length) loadMoreSwingBtn.style.display = "none";
    };

    renderSwingPage();
    loadMoreSwingBtn.addEventListener("click", renderSwingPage);
  } catch (err) {
    console.error("❌ 데이터 로딩 오류:", err);
    ECONews.showError(totalBody, "전체 수익률 데이터를 불러오지 못했습니다.");
    ECONews.showError(swingBody, "스윙 적정가격 데이터를 불러오지 못했습니다.");
  }
});
