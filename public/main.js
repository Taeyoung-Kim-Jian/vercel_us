/* ===========================================================
   📊 main.js — SWING INVESTOR 메인 페이지 (4 카드 통합 버전)
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const topCards = document.querySelectorAll(".card");
  const totalBody = document.getElementById("total-table-body");
  const swingBody = document.getElementById("swing-table-body");

  // 📌 공통 로딩
  const showLoading = (el, msg = "📊 불러오는 중...") => {
    el.innerHTML = `<div style="text-align:center;padding:20px;">${msg}</div>`;
  };

  // ===========================================================
  // 🏆 1️⃣ 전체 수익률 TOP5 — total_return
  // ===========================================================
  async function loadTotalTop5() {
    const card = topCards[0];
    showLoading(card, "📈 불러오는 중...");

    const { data, error } = await db
      .from("total_return")
      .select("종목명, 수익률")
      .order("수익률", { ascending: false })
      .limit(5);

    if (error || !data?.length) {
      card.innerHTML = "❌ 데이터 없음";
      return;
    }

    const html = data
      .map(
        (r, i) => `
        <li>
          <span class="top5-rank">${i + 1}</span>
          <span class="top5-name">${r.종목명}</span>
          <span class="top5-return ${r.수익률 >= 0 ? "up" : "down"}">
            ${r.수익률 >= 0 ? "▲" : "▼"}${Math.abs(r.수익률).toFixed(2)}%
          </span>
        </li>`
      )
      .join("");

    card.innerHTML = `<h4>🏆 전체 수익률 TOP5</h4><ul>${html}</ul>`;
  }

  // ===========================================================
  // ⭐ 2️⃣ 관심종목 랭킹 TOP5 — watchlist_with_return
  // ===========================================================
  async function loadWatchlistTop5() {
    const card = topCards[1];
    showLoading(card, "⭐ 불러오는 중...");

    const { data, error } = await db
      .from("watchlist_with_return")
      .select("종목명, 수익률")
      .eq("공개여부", true)
      .order("수익률", { ascending: false })
      .limit(5);

    if (error || !data?.length) {
      card.innerHTML = "❌ 데이터 없음";
      return;
    }

    const html = data
      .map(
        (r, i) => `
        <li>
          <span class="top5-rank">${i + 1}</span>
          <span class="top5-name">${r.종목명}</span>
          <span class="top5-return ${r.수익률 >= 0 ? "up" : "down"}">
            ${r.수익률 >= 0 ? "▲" : "▼"}${Math.abs(r.수익률).toFixed(2)}%
          </span>
        </li>`
      )
      .join("");

    card.innerHTML = `<h4>⭐ 관심종목 랭킹 TOP5</h4><ul>${html}</ul>`;
  }

  // ===========================================================
  // 📅 3️⃣ 이번 달 수익률 TOP5 — monthly_performance_view
  // ===========================================================
  async function loadMonthTop5() {
    const card = topCards[2];
    showLoading(card, "📆 이번 달 불러오는 중...");

    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { data, error } = await db
      .from("monthly_performance_view")
      .select("종목명, 측정일대비수익률, 월구분")
      .eq("월구분", ym)
      .order("측정일대비수익률", { ascending: false })
      .limit(5);

    if (error || !data?.length) {
      card.innerHTML = "❌ 데이터 없음";
      return;
    }

    const html = data
      .map(
        (r, i) => `
        <li>
          <span class="top5-rank">${i + 1}</span>
          <span class="top5-name">${r.종목명}</span>
          <span class="top5-return ${r.측정일대비수익률 >= 0 ? "up" : "down"}">
            ${r.측정일대비수익률 >= 0 ? "▲" : "▼"}${Math.abs(r.측정일대비수익률).toFixed(2)}%
          </span>
        </li>`
      )
      .join("");

    card.innerHTML = `<h4>📅 이번 달 수익률 TOP5</h4><ul>${html}</ul>`;
  }

  // ===========================================================
  // 🌍 4️⃣ 전체 기간 수익률 TOP5 — monthly_performance_view (전체)
  // ===========================================================
  async function loadMonthAllTop5() {
    const card = topCards[3];
    showLoading(card, "🌍 전체기간 불러오는 중...");

    const { data, error } = await db
      .from("monthly_performance_view")
      .select("종목명, 측정일대비수익률")
      .order("측정일대비수익률", { ascending: false })
      .limit(5);

    if (error || !data?.length) {
      card.innerHTML = "❌ 데이터 없음";
      return;
    }

    const html = data
      .map(
        (r, i) => `
        <li>
          <span class="top5-rank">${i + 1}</span>
          <span class="top5-name">${r.종목명}</span>
          <span class="top5-return ${r.측정일대비수익률 >= 0 ? "up" : "down"}">
            ${r.측정일대비수익률 >= 0 ? "▲" : "▼"}${Math.abs(r.측정일대비수익률).toFixed(2)}%
          </span>
        </li>`
      )
      .join("");

    card.innerHTML = `<h4>🌍 전체 수익률 TOP5</h4><ul>${html}</ul>`;
  }

  // ===========================================================
  // 📊 테이블 (하단 섹션) — total_return + swing_proper_view
  // ===========================================================
  async function loadTables() {
    // 전체 수익률
    const { data: total, error: e1 } = await db
      .from("total_return")
      .select("종목명, 시작가격, 현재가격, 수익률")
      .order("수익률", { ascending: false })
      .limit(20);

    totalBody.innerHTML = e1 || !total?.length
      ? `<tr><td colspan="4">데이터 없음</td></tr>`
      : total
          .map(
            (r) => `
            <tr>
              <td>${r.종목명}</td>
              <td>${(r.시작가격 || 0).toLocaleString()}</td>
              <td>${(r.현재가격 || 0).toLocaleString()}</td>
              <td style="color:${r.수익률 >= 0 ? "#dc2626" : "#2563eb"};">
                ${r.수익률 >= 0 ? "▲" : "▼"}${Math.abs(r.수익률).toFixed(2)}%
              </td>
            </tr>`
          )
          .join("");

    // 스윙 적정가격
    const { data: swing, error: e2 } = await db
      .from("swing_proper_view")
      .select("종목명, 적정매수가, 현재가, 괴리율")
      .order("괴리율", { ascending: true })
      .limit(20);

    swingBody.innerHTML = e2 || !swing?.length
      ? `<tr><td colspan="4">데이터 없음</td></tr>`
      : swing
          .map(
            (r) => `
            <tr>
              <td>${r.종목명}</td>
              <td>${(r.적정매수가 || 0).toLocaleString()}</td>
              <td>${(r.현재가 || 0).toLocaleString()}</td>
              <td style="color:${r.괴리율 >= 0 ? "#2563eb" : "#dc2626"};">
                ${r.괴리율 >= 0 ? "▲" : "▼"}${Math.abs(r.괴리율).toFixed(2)}%
              </td>
            </tr>`
          )
          .join("");
  }

  // ===========================================================
  // 🚀 실행
  // ===========================================================
  await Promise.all([
    loadTotalTop5(),
    loadWatchlistTop5(),
    loadMonthTop5(),
    loadMonthAllTop5(),
    loadTables(),
  ]);
});
