/* =========================================================
   💰 proper.js — swing_proper_view 기반 페이지 (전체 출력 버전)
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("swing-table-body");
  SWINGINV.showLoading(tbody);

  try {
    // ✅ Supabase View에서 모든 데이터 불러오기
    const { data, error } = await SWINGINV.db
      .from("swing_proper_view")
      .select("*")
      .order("괴리율", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      SWINGINV.showError(tbody, "📭 표시할 종목이 없습니다.");
      return;
    }

    // ✅ 모든 행을 한 번에 렌더링
    tbody.innerHTML = data
      .map(
        (r) => `
          <tr class="clickable-row" data-code="${r.종목코드}" data-name="${r.종목명}">
            <td>${SWINGINV.esc(r.종목명)}</td>
            <td style="text-align:right;">${SWINGINV.nf(r.적정매수가)}</td>
            <td style="text-align:right;">${SWINGINV.nf(r.현재가)}</td>
            <td style="text-align:right;">${SWINGINV.fmtPct(r.괴리율)}</td>
          </tr>
        `
      )
      .join("");

    // ✅ 클릭 시 detail.html로 이동
    document.querySelectorAll(".clickable-row").forEach((row) => {
      row.addEventListener("click", () => {
        const name = row.dataset.name;
        const code = row.dataset.code;
        location.href = `detail.html?name=${encodeURIComponent(name)}&code=${code}`;
      });
    });
  } catch (err) {
    console.error("❌ 데이터 로드 오류:", err);
    SWINGINV.showError(tbody, "데이터를 불러오지 못했습니다.");
  }
});
