document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const tbody = document.getElementById("total-list-body");

  tbody.innerHTML = `<tr><td colspan="7">⏳ 전체 데이터를 불러오는 중...</td></tr>`;

  try {
    // total_return 전체 데이터 조회
    const { data, error } = await db
      .from("total_return")
      .select("*")
      .order("수익률", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">데이터가 없습니다.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    data.forEach((r, i) => {
      const rate = parseFloat(r.수익률 ?? 0);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${r.종목명 || "-"}</td>
        <td>${r.종목코드 || "-"}</td>
        <td style="text-align:right;">${r.시작가격?.toLocaleString() || "-"}</td>
        <td style="text-align:right;">${r.현재가격?.toLocaleString() || "-"}</td>
        <td style="color:${rate >= 0 ? "#d32f2f" : "#1976d2"}; text-align:right;">
          ${rate >= 0 ? "▲" : "▼"}${rate.toFixed(2)}%
        </td>
        <td style="text-align:right;">${r.기간 ?? "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7">❌ 불러오기 실패: ${err.message}</td></tr>`;
  }
});

