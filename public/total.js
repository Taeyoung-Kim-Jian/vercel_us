/* =========================================================
   📈 total.js — total_return 테이블 전체 조회 + 차트 이동 지원
   ========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
            <td>${r.종목코드 || "-"}</td>
            <td style="text-align:right;">${r.시작가격?.toLocaleString() || "-"}</td>
            <td style="text-align:right;">${r.현재가격?.toLocaleString() || "-"}</td>
            <td style="text-align:right; color:${rateColor}; font-weight:500;">
              ${rateSign}${Math.abs(rate).toFixed(2)}%
            </td>
            <td style="text-align:right;">${r.기간 ?? "-"}</td>
          </tr>
        `;
      })
      .join("");

    // ✅ 차트 페이지(detail.html) 이동 이벤트
    document.querySelectorAll(".clickable-row").forEach((row) => {
      row.addEventListener("click", () => {
        const code = row.dataset.code;
        const name = row.dataset.name;
        if (!code || !name) return;
        // detail 페이지로 이동
        location.href = `detail.html?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`;
      });
    });
  } catch (err) {
    console.error("❌ 데이터 로드 오류:", err);
    tbody.innerHTML = `
      <tr><td colspan="7" style="text-align:center; color:red;">
        ❌ 불러오기 실패: ${err.message}
      </td></tr>
    `;
  }
});
