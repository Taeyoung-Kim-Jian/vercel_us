/* ==========================================================
   📊 main.js — SWING INVESTOR Dashboard
   ========================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const top5Card = document.getElementById("top5-card");
  const totalBody = document.getElementById("total-table-body");
  const swingBody = document.getElementById("swing-table-body");

  /* ----------------------------
     🏆 TOP 5 수익률
  ---------------------------- */
  async function loadTop5() {
    const { data, error } = await db
      .from("total_return")
      .select("종목명, 수익률")
      .order("수익률", { ascending: false })
      .limit(5);

    if (error || !data?.length) {
      top5Card.innerHTML = `<p>❌ 데이터를 불러오지 못했습니다.</p>`;
      console.error(error);
      return;
    }

    let html = `<h4>🏆 수익률 Top 5</h4><ul>`;
    data.forEach((row, i) => {
      const rate = parseFloat(row.수익률 ?? 0);
      const isUp = rate >= 0;
      html += `
        <li>
          <span class="top5-rank">${i + 1}</span>
          <span class="top5-name">${row.종목명}</span>
          <span class="top5-return ${isUp ? "up" : "down"}">
            ${isUp ? "▲" : "▼"}${Math.abs(rate).toFixed(2)}%
          </span>
        </li>
      `;
    });
    html += "</ul>";
    top5Card.innerHTML = html;
  }

  /* ----------------------------
     📈 전체 수익률 테이블
  ---------------------------- */
  async function loadTotalTable() {
    const { data, error } = await db
      .from("total_return")
      .select("종목명, 시작가격, 현재가격, 수익률")
      .order("수익률", { ascending: false })
      .limit(5);

    if (error || !data?.length) {
      totalBody.innerHTML = `<tr><td colspan="4">❌ 데이터 없음</td></tr>`;
      console.error(error);
      return;
    }

    totalBody.innerHTML = data
      .map((r) => {
        const rate = parseFloat(r.수익률 ?? 0);
        const color = rate >= 0 ? "#dc2626" : "#2563eb";
        const sign = rate >= 0 ? "▲" : "▼";
        return `
          <tr>
            <td>${r.종목명}</td>
            <td>${Number(r.시작가격).toLocaleString()}</td>
            <td>${Number(r.현재가격).toLocaleString()}</td>
            <td style="color:${color};font-weight:600;">
              ${sign}${Math.abs(rate).toFixed(2)}%
            </td>
          </tr>
        `;
      })
      .join("");
  }

  /* ----------------------------
     💰 스윙 적정가격 테이블
  ---------------------------- */
  async function loadSwingTable() {
    const { data, error } = await db
      .from("swing_proper_view")
      .select("종목명, 적정매수가, 현재가, 괴리율")
      .order("괴리율", { ascending: true })
      .limit(5);

    if (error || !data?.length) {
      swingBody.innerHTML = `<tr><td colspan="4">❌ 데이터 없음</td></tr>`;
      console.error(error);
      return;
    }

    swingBody.innerHTML = data
      .map((r) => {
        const gap = parseFloat(r.괴리율 ?? 0);
        const color = gap <= 0 ? "#dc2626" : "#2563eb";
        return `
          <tr>
            <td>${r.종목명}</td>
            <td>${Number(r.적정매수가).toLocaleString()}</td>
            <td>${Number(r.현재가).toLocaleString()}</td>
            <td style="color:${color};font-weight:600;">
              ${gap.toFixed(2)}%
            </td>
          </tr>
        `;
      })
      .join("");
  }

  /* ----------------------------
     🚀 실행
  ---------------------------- */
  await Promise.all([loadTop5(), loadTotalTable(), loadSwingTable()]);
});
