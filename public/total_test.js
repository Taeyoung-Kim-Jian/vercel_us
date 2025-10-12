<!-- ✅ total_test.html -->
<script>
document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("total-list-body");

  tbody.innerHTML = `
    <tr><td colspan="7" style="text-align:center;">⏳ 전체 데이터를 불러오는 중...</td></tr>
  `;

  try {
    const { data, error } = await db
      .from("total_return")
      .select("*")
      .order("수익률", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">📭 데이터가 없습니다.</td></tr>`;
      return;
    }

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

    // ✅ 클릭 시 test.html로 이동
    document.querySelectorAll(".clickable-row").forEach((row) => {
      row.addEventListener("click", () => {
        const code = row.dataset.code;
        const name = row.dataset.name;
        if (!code || !name) return;
        location.href = `test.html?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`;
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
</script>
