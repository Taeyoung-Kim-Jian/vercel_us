/* =========================================================
   📊 main.js — index.html
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const totalBody = document.getElementById("total-table-body");
  const swingBody = document.getElementById("swing-table-body");
  const top5Card = document.getElementById("top5-card");
  const loadMoreTotalBtn = document.getElementById("loadMoreTotalBtn");
  const loadMoreSwingBtn = document.getElementById("loadMoreSwingBtn");

  SWINGINV.showLoading(totalBody);
  SWINGINV.showLoading(swingBody);

  const PAGE_SIZE = 5;
  let totalPage = 0;
  let swingPage = 0;
  let totalData = [];
  let swingData = [];

  try {
    /* ✅ 1️⃣ 전체 수익률 */
    const { data: totalDataRaw, error: totalErr } = await SWINGINV.db
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
              ${SWINGINV.esc(r.종목명)}
            </span>
            <span class="rate">${SWINGINV.fmtPct(r.수익률)}</span>
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
            ${SWINGINV.esc(r.종목명)}
          </td>
          <td style="text-align:center">${SWINGINV.nf(r.시작가격)}</td>
          <td style="text-align:center">${SWINGINV.nf(r.현재가격)}</td>
          <td style="text-align:center">${SWINGINV.fmtPct(r.수익률)}</td>
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

    // ✅ 더보기 클릭 시 total.html로 이동
    loadMoreTotalBtn.addEventListener("click", () => {
      window.location.href = "total.html";
    });

    /* ✅ 2️⃣ 스윙 적정가격 */
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
          <td style="text-align:center">${SWINGINV.nf(r.적정매수가)}</td>
          <td style="text-align:center">${SWINGINV.nf(r.현재가)}</td>
          <td style="text-align:center">${SWINGINV.fmtPct(r.괴리율)}</td>
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

    // ✅ 더보기 클릭 시 proper.html로 이동
    loadMoreSwingBtn.addEventListener("click", () => {
      window.location.href = "proper.html";
    });
  } catch (err) {
    console.error("❌ 데이터 로딩 오류:", err);
    SWINGINV.showError(totalBody, "전체 수익률 데이터를 불러오지 못했습니다.");
    SWINGINV.showError(swingBody, "스윙 적정가격 데이터를 불러오지 못했습니다.");
  }
});
