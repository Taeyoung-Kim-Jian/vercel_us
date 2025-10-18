/* =========================================================
   📈 total.js — total_return 테이블 전체 조회 + 차트 이동 지원
   ========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("total-list-body");

  // 초기 로딩 표시
  tbody.innerHTML = `
    <tr><td colspan="7" style="text-align:center;">⏳ 전체 데이터를 불러오는 중...</td></tr>
  `;

  try {
    // ✅ Supabase total_return 조회
    const { data, error } = await db
      .from("total_return")
      .select("*")
      .order("수익률", { ascending: false });

    if (error) throw error;

    // ✅ 데이터가 없을 경우 처리
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">📭 데이터가 없습니다.</td></tr>`;
      return;
    }

    // ✅ 테이블 렌더링
    tbody.innerHTML = data
      .map((r, i) => {
        const rate = parseFloat(r.수익률 ?? 0);
        const rateColor = rate >= 0 ? "#d32f2f" : "#1976d2";
        const rateSign = rate >= 0 ? "▲" : "▼";

        return `
          <tr class="clickable-row" 
              data-code="${r.종목코드}" 
              data-name="${r.종목명}">
            <td>${i + 1}</td>
            <td class="clickable-name">${r.종목명 || "-"}</td>
            <td style="text-align:center;">${r.시작가격?.toLocaleString() || "-"}</td>
            <td style="text-align:center;">${r.현재가격?.toLocaleString() || "-"}</td>
            <td style="text-align:center; color:${rateColor}; font-weight:500;">
              ${rateSign}${Math.abs(rate).toFixed(2)}%
            </td>
          </tr>
        `;
      })
      .join("");

    // ✅ 모달창으로 상세 정보 표시
    bindStockClickEvents();
  } catch (err) {
    console.error("❌ 데이터 로드 오류:", err);
    tbody.innerHTML = `
      <tr><td colspan="7" style="text-align:center; color:red;">
        ❌ 불러오기 실패: ${err.message}
      </td></tr>
    `;
  }
});
