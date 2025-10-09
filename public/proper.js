
/* =========================================================
   💰 proper.js — 스윙 적정가격 (view 기반)
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("swing-table-body");
  const loadMoreBtn = document.getElementById("loadMoreSwingBtn");
  ECONews.showLoading(tbody);

  const PAGE_SIZE = 10;
  let currentPage = 0;
  let allData = [];

  try {
    // ✅ 1) 뷰에서 직접 데이터 가져오기
    const { data, error } = await ECONews.db
      .from("swing_proper_view")
      .select("*")
      .order("괴리율", { ascending: true });

    if (error) throw error;

    allData = data || [];

    // ✅ 2) 렌더링
    const renderPage = () => {
      const start = currentPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageData = allData.slice(start, end);

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

      if (currentPage === 0) tbody.innerHTML = rows;
      else tbody.insertAdjacentHTML("beforeend", rows);

      currentPage++;
      if (end >= allData.length) loadMoreBtn.style.display = "none";
    };

    renderPage();
    loadMoreBtn.addEventListener("click", renderPage);
  } catch (err) {
    console.error("❌ 스윙 적정가격 로드 오류:", err);
    ECONews.showError(tbody, "데이터 로딩 실패");
  }
});
