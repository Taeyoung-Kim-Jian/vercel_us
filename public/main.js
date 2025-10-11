/* ===========================================================
   📊 main.js — SWING INVESTOR 메인 페이지 (Supabase 재사용 + 자동 월)
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  console.log("📡 main.js loaded");

  // ✅ common.js 에서 이미 초기화된 Supabase 클라이언트를 재사용
  const db = window.db || window.supabaseClient;
  if (!db) {
    console.error("❌ Supabase client not found. Check common.js initialization.");
    return;
  }

  const cards = document.querySelectorAll(".card");
  const totalBody = document.getElementById("total-table-body");
  const swingBody = document.getElementById("swing-table-body");

  const showLoading = (el, msg = "📊 불러오는 중...") =>
    (el.innerHTML = `<div style="text-align:center;padding:20px;">${msg}</div>`);

  // 📌 공통 Top5 렌더링 함수
  const renderTop5 = (card, title, rows, field = "수익률") => {
    if (!rows?.length) {
      card.innerHTML = `<div style="text-align:center;padding:20px;">데이터 없음</div>`;
      return;
    }

    const html = rows
      .map((r, i) => {
        const val = parseFloat(r[field] || r.측정일대비수익률 || 0);
        const colorClass = val >= 0 ? "up" : "down";
        const sign = val >= 0 ? "▲" : "▼";
        return `
          <li>
            <span class="top5-rank">${i + 1}</span>
            <span class="top5-name">${r.종목명}</span>
            <span class="top5-return ${colorClass}">
              ${sign}${Math.abs(val).toFixed(2)}%
            </span>
          </li>
        `;
      })
      .join("");

    card.innerHTML = `<h4>${title}</h4><ul>${html}</ul>`;
  };

  // ===========================================================
  // 🏆 1️⃣ 전체 수익률 TOP5 — total_return
  // ===========================================================
  async function loadTotalTop5() {
    const card = cards[0];
    showLoading(card);
    const { data, error } = await db
      .from("total_return")
      .select("종목명, 수익률")
      .order("수익률", { ascending: false })
      .limit(5);

    if (error) {
      console.error("❌ total_return:", error);
      renderTop5(card, "🏆 전체 수익률 TOP5", []);
      return;
    }
    renderTop5(card, "🏆 전체 수익률 TOP5", data);
  }

  // ===========================================================
  // ⭐ 2️⃣ 관심종목 랭킹 TOP5 — watchlist_with_return
  // ===========================================================
  async function loadWatchlistTop5() {
    const card = cards[1];
    showLoading(card);
    const { data, error } = await db
      .from("watchlist_with_return")
      .select("종목명, 수익률")
      .eq("공개여부", true)
      .order("수익률", { ascending: false })
      .limit(5);

    if (error) {
      console.error("❌ watchlist_with_return:", error);
      renderTop5(card, "⭐ 관심종목 TOP5", []);
      return;
    }
    renderTop5(card, "⭐ 관심종목 TOP5", data);
  }

  // ===========================================================
  // 📆 3️⃣ 이번 달 수익률 TOP5 — monthly_performance_view
  // ===========================================================
  async function loadMonthTop5() {
    const card = cards[2];
    showLoading(card);

    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = `${now.getMonth() + 1}월`;

    const { data, error } = await db
      .from("monthly_performance_view")
      .select("종목명, 측정일대비수익률, 월구분")
      .eq("월구분", ym)
      .order("측정일대비수익률", { ascending: false })
      .limit(5);

    if (error) {
      console.error("❌ monthly_performance_view:", error);
      renderTop5(card, `📆 ${monthLabel} 수익률 TOP5`, []);
      return;
    }
    renderTop5(card, `📆 ${monthLabel} 수익률 TOP5`, data, "측정일대비수익률");
  }

  // ===========================================================
  // 🌍 4️⃣ 전체기간 수익률 TOP5 — monthly_performance_view (전체)
  // ===========================================================
  async function loadMonthAllTop5() {
    const card = cards[3];
    showLoading(card);
    const { data, error } = await db
      .from("monthly_performance_view")
      .select("종목명, 측정일대비수익률")
      .order("측정일대비수익률", { ascending: false })
      .limit(5);

    if (error) {
      console.error("❌ monthly_performance_view(all):", error);
      renderTop5(card, "🌍 전체 수익률 TOP5", []);
      return;
    }
    renderTop5(card, "🌍 전체 수익률 TOP5", data, "측정일대비수익률");
  }

  // ===========================================================
  // 📊 하단 테이블 — total_return & swing_proper_view
  // ===========================================================
  async function loadTables() {
    // 전체 수익률 테이블
    const { data: total, error: e1 } = await db
      .from("total_return")
      .select("종목명, 시작가격, 현재가격, 수익률")
      .order("수익률", { ascending: false })
      .limit(20);

    totalBody.innerHTML =
      e1 || !total?.length
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

    // 스윙 적정가 테이블
    const { data: swing, error: e2 } = await db
      .from("swing_proper_view")
      .select("종목명, 적정매수가, 현재가, 괴리율")
      .order("괴리율", { ascending: true })
      .limit(20);

    swingBody.innerHTML =
      e2 || !swing?.length
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
