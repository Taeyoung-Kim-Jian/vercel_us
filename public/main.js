/* =========================================================
   📊 ECONews main.js (Parallel + Pagination + 종목명 추가)
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const totalBody = document.getElementById("total-table-body");
  const swingBody = document.getElementById("swing-table-body");
  const cardEl = document.getElementById("top5-card");
  const loadMoreTotalBtn = document.getElementById("loadMoreTotalBtn");
  const loadMoreSwingBtn = document.getElementById("loadMoreSwingBtn");

  ECONews.showLoading(totalBody);
  ECONews.showLoading(swingBody);

  try {
    /* =========================================================
       1️⃣ 전체 수익률
    ========================================================= */
    console.log("⏳ total_return 데이터 로딩 중...");
    const { data: totalData, error: totalError } = await ECONews.db
      .from("total_return")
      .select("종목명, 종목코드, 시작가격, 현재가격, 수익률")
      .order("수익률", { ascending: false });

    if (totalError) throw totalError;

    let totalVisibleCount = 5;

    const renderTotalTable = () => {
      const slice = totalData.slice(0, totalVisibleCount);
      totalBody.innerHTML = slice
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

      if (totalVisibleCount >= totalData.length) {
        loadMoreTotalBtn.style.display = "none";
      }
    };

    loadMoreTotalBtn.addEventListener("click", () => {
      totalVisibleCount += 5;
      renderTotalTable();
    });

    renderTotalTable();

    const top5 = totalData.slice(0, 5);
    cardEl.innerHTML = `
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

    /* =========================================================
       2️⃣ 스윙 적정가격 (병렬 계산 + 종목명 표시)
    ========================================================= */
    console.log("⏳ 스윙 적정가격 계산 시작...");

    const { data: btList, error: btErr } = await ECONews.db
      .from("bt_points")
      .select("종목코드, b가격");

    if (btErr) throw btErr;
    if (!btList || btList.length === 0) {
      swingBody.innerHTML = `<tr><td colspan="4">bt_points 데이터가 없습니다.</td></tr>`;
      return;
    }

    // ✅ 병렬 처리 (Promise.all)
    const swingPromises = btList.map(async (bt) => {
      try {
        // ✅ prices에서 최신 종가 + 종목명 가져오기
        const { data: priceData, error: priceErr } = await ECONews.db
          .from("prices")
          .select("종목명, 종가")
          .eq("종목코드", bt.종목코드)
          .order("날짜", { ascending: false })
          .limit(1);

        if (priceErr) {
          console.warn(`⚠️ prices 접근 실패 (${bt.종목코드})`, priceErr);
          return null;
        }

        if (!priceData?.length) return null;

        const current = parseFloat(priceData[0].종가);
        const base = parseFloat(bt.b가격);
        const diff = ((current - base) / base) * 100;

        if (Math.abs(diff) <= 5) {
          return {
            종목코드: bt.종목코드,
            종목명: priceData[0].종목명 || bt.종목코드,
            적정매수가: base,
            현재가: current,
            괴리율: diff.toFixed(2),
          };
        }
        return null;
      } catch (e) {
        console.error("❌ swing 계산 중 에러:", e);
        return null;
      }
    });

    const swingList = (await Promise.all(swingPromises)).filter(Boolean);
    console.log(`✅ 스윙 적정가격 ${swingList.length}건 계산 완료`);

    // ✅ 처음에는 5개만 표시
    let swingVisibleCount = 5;

    const renderSwingTable = () => {
      const slice = swingList.slice(0, swingVisibleCount);
      swingBody.innerHTML = slice
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

      if (swingVisibleCount >= swingList.length) {
        loadMoreSwingBtn.style.display = "none";
      }
    };

    loadMoreSwingBtn.addEventListener("click", () => {
      swingVisibleCount += 5;
      renderSwingTable();
    });

    renderSwingTable();
  } catch (err) {
    console.error("❌ Error loading data:", err);
    ECONews.showError(totalBody, "데이터 로딩 실패");
    ECONews.showError(swingBody, "데이터 로딩 실패");
  }
});
