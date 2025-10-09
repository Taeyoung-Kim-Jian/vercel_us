/* =========================================================
   📊 ECONews main.js
   - 전체 수익률
   - 스윙 적정가격
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const totalBody = document.getElementById("total-table-body");
  const swingBody = document.getElementById("swing-table-body");
  const cardEl = document.getElementById("top5-card");

  ECONews.showLoading(totalBody);
  ECONews.showLoading(swingBody);

  try {
    // ✅ 1. 전체 수익률 데이터
    const { data: totalData, error: totalError } = await ECONews.db
      .from("total_return")
      .select("종목명, 종목코드, 시작가격, 현재가격, 수익률")
      .order("수익률", { ascending: false });

    if (totalError) throw totalError;

    // ✅ 전체 수익률 테이블
    totalBody.innerHTML = totalData
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

    // ✅ 상위 5개 카드
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

    // ✅ 2. 스윙 적정가격 계산 (bt_points + prices 비교)
    const { data: btList, error: btErr } = await ECONews.db
      .from("bt_points")
      .select("종목코드, b가격");

    if (btErr) throw btErr;

    const swingList = [];

    for (const bt of btList) {
      const { data: priceData } = await ECONews.db
        .from("prices")
        .select("종가")
        .eq("종목코드", bt.종목코드)
        .order("날짜", { ascending: false })
        .limit(1);

      if (!priceData || priceData.length === 0) continue;

      const current = parseFloat(priceData[0].종가);
      const b = parseFloat(bt.b가격);
      const diff = ((current - b) / b) * 100;

      if (Math.abs(diff) <= 5) {
        swingList.push({
          종목코드: bt.종목코드,
          적정매수가: b,
          현재가: current,
          괴리율: diff.toFixed(2),
        });
      }
    }

    // ✅ 스윙 테이블 렌더링
    if (swingList.length > 0) {
      swingBody.innerHTML = swingList
        .map(
          (r) => `
        <tr>
          <td class="clickable-name" data-code="${r.종목코드}" data-name="${r.종목코드}">
            ${ECONews.esc(r.종목코드)}
          </td>
          <td style="text-align:right">${ECONews.nf(r.적정매수가)}</td>
          <td style="text-align:right">${ECONews.nf(r.현재가)}</td>
          <td style="text-align:right">${ECONews.fmtPct(r.괴리율)}</td>
        </tr>
      `
        )
        .join("");
    } else {
      swingBody.innerHTML = `<tr><td colspan="4">±5% 이내의 종목이 없습니다.</td></tr>`;
    }
  } catch (err) {
    console.error("❌ Error loading data:", err);
    ECONews.showError(totalBody, "데이터 로딩 실패");
    ECONews.showError(swingBody, "데이터 로딩 실패");
  }
});
