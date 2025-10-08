window.addEventListener('DOMContentLoaded', async () => {
  const SUPABASE_URL = 'https://sssmldmhcfuodutvvcqf.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4';
  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const totalTbody = document.getElementById('total-table-body');
  const swingTbody = document.getElementById('swing-table-body');
  const btnTotal = document.getElementById('loadMoreTotalBtn');
  const btnSwing = document.getElementById('loadMoreSwingBtn');
  const top5Card = document.getElementById('top5-card');

  let totalData = [];
  let swingData = [];
  let showTotal = 5;
  let showSwing = 5;

  // === 전체 수익률 ===
  async function loadTotalReturn() {
    totalTbody.innerHTML = `<tr><td colspan="4">⏳ 데이터를 불러오는 중...</td></tr>`;
    try {
      const { data, error } = await db
        .from('total_return')
        .select('*')
        .order('수익률', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        totalTbody.innerHTML = `<tr><td colspan="4">데이터가 없습니다.</td></tr>`;
        return;
      }

      totalData = data;
      renderTop5Card(data);
      renderTotal();
    } catch (err) {
      console.error('❌ total_return:', err);
      totalTbody.innerHTML = `<tr><td colspan="4">❌ 불러오기 실패</td></tr>`;
    }
  }

  // === Top5 카드 ===
  function renderTop5Card(rows) {
    const top5 = rows.slice(0, 5);
    if (!top5Card) return;
    top5Card.innerHTML = `
      <h3>🏆 전체 수익률 Top 5</h3>
      <ul class="top5-list">
        ${top5
          .map(
            (r, i) => `
          <li class="top5-item">
            <span class="name">
              ${i + 1}. ${r.종목명 || '-'}
            </span>
            <span class="rate" style="color:${
              r.수익률 >= 0 ? '#d32f2f' : '#1976d2'
            };">
              ${r.수익률 >= 0 ? '▲' : '▼'}${parseFloat(r.수익률).toFixed(2)}%
            </span>
          </li>`
          )
          .join('')}
      </ul>
    `;
  }

  // === 전체 수익률 테이블 ===
  function renderTotal() {
    totalTbody.innerHTML = '';
    totalData.slice(0, showTotal).forEach((row) => {
      const rate = parseFloat(row.수익률 ?? 0);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.종목명 || '-'}</td>
        <td>${row.시작가격?.toLocaleString() || '-'}</td>
        <td>${row.현재가격?.toLocaleString() || '-'}</td>
        <td style="color:${rate >= 0 ? '#d32f2f' : '#1976d2'}; text-align:right;">
          ${rate >= 0 ? '▲' : '▼'}${rate.toFixed(2)}%
        </td>`;
      totalTbody.appendChild(tr);
    });
    btnTotal.style.display = totalData.length > 5 ? 'inline-block' : 'none';
    btnTotal.textContent = showTotal === 5 ? '더보기' : '접기';
  }

  // === 스윙 적정가격 (자동 계산 후 로드)
  async function updateSwingPriceTable() {
    console.log("⏳ 스윙 적정가격 자동 계산 중...");
    swingTbody.innerHTML = `<tr><td colspan="4">🧮 스윙 적정가격 계산 중...</td></tr>`;

    try {
      // 1️⃣ bt_points 테이블에서 b가격들 가져오기
      const { data: bData, error: e1 } = await db
        .from('bt_points')
        .select('종목명, 종목코드, b가격');
      if (e1) throw e1;

      // 2️⃣ prices 테이블에서 최신 종가 가져오기
      const { data: pData, error: e2 } = await db
        .from('prices')
        .select('종목명, 종목코드, 종가, 날짜')
        .order('날짜', { ascending: false });
      if (e2) throw e2;

      const results = [];

      // 3️⃣ 두 데이터 비교 (±5% 이내)
      for (const b of bData) {
        const price = pData.find((p) => p.종목코드 === b.종목코드);
        if (!price) continue;

        const diffRate = ((price.종가 - b.b가격) / b.b가격) * 100;
        if (Math.abs(diffRate) <= 5) {
          results.push({
            종목명: b.종목명,
            종목코드: b.종목코드,
            적정매수가: b.b가격,
            현재가: price.종가,
            괴리율: diffRate.toFixed(2),
          });
        }
      }

      // 4️⃣ 기존 swing_price 테이블 초기화 후 삽입
      await db.from('swing_price').delete().neq('종목코드', '');
      if (results.length > 0) {
        await db.from('swing_price').insert(results);
      }

      console.log(`✅ ${results.length}개 종목이 swing_price에 업데이트됨`);
      swingData = results;
      renderSwing();

    } catch (error) {
      console.error("❌ 스윙 계산 오류:", error);
      swingTbody.innerHTML = `<tr><td colspan="4">❌ 스윙 계산 중 오류 발생</td></tr>`;
    }
  }

  // === 스윙 테이블 렌더링 ===
  function renderSwing() {
    swingTbody.innerHTML = '';
    swingData.slice(0, showSwing).forEach((row) => {
      const diff = parseFloat(row.괴리율 ?? 0);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.종목명 || '-'}</td>
        <td>${row.적정매수가?.toLocaleString() || '-'}</td>
        <td>${row.현재가?.toLocaleString() || '-'}</td>
        <td style="color:${diff >= 0 ? '#d32f2f' : '#1976d2'}; text-align:right;">
          ${diff >= 0 ? '▲' : '▼'}${diff.toFixed(2)}%
        </td>`;
      swingTbody.appendChild(tr);
    });

    btnSwing.style.display = swingData.length > 5 ? 'inline-block' : 'none';
    btnSwing.textContent = showSwing === 5 ? '더보기' : '접기';
  }

  // === 더보기 버튼 ===
  btnTotal.addEventListener('click', () => {
    showTotal = showTotal === 5 ? totalData.length : 5;
    renderTotal();
  });
  btnSwing.addEventListener('click', () => {
    showSwing = showSwing === 5 ? swingData.length : 5;
    renderSwing();
  });

  // === 페이지 로드 시 자동 실행 ===
  await loadTotalReturn();
  await updateSwingPriceTable();
});
