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
  const top5Card = document.getElementById('top5-card'); // ✅ 추가

  let totalData = [];
  let swingData = [];
  let showTotal = 5;
  let showSwing = 5;

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
      renderTop5Card(data); // ✅ 추가
      renderTotal();
    } catch (err) {
      console.error('❌ Supabase Error (total_return):', err);
      totalTbody.innerHTML = `<tr><td colspan="4">❌ 데이터 불러오기 실패</td></tr>`;
    }
  }

  // ✅ 수익률 상위 5개 카드
  function renderTop5Card(rows) {
    const top5 = rows.slice(0, 5);
    if (!top5Card) return;
    let html = `
      <div class="card">
        <h3>🏆 전체 수익률 Top 5</h3>
        <ul class="top5-list">
          ${top5
            .map(
              (r, i) => `
            <li class="top5-item">
              <span class="rank">${i + 1}</span>
              <span class="name">${r.종목명}</span>
              <span class="rate" style="color:${r.수익률 >= 0 ? '#d32f2f' : '#1976d2'};">
                ${r.수익률 >= 0 ? '▲' : '▼'}${parseFloat(r.수익률).toFixed(2)}%
              </span>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    `;
    top5Card.innerHTML = html;
  }

  // === 기존 전체 수익률 렌더링 ===
  function renderTotal() {
    totalTbody.innerHTML = '';
    totalData.slice(0, showTotal).forEach(row => {
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

  // === 스윙 적정가격 로직은 동일 ===
  // (loadSwing, renderSwing, 버튼 핸들러 등 동일)

  btnTotal.addEventListener('click', () => {
    showTotal = showTotal === 5 ? totalData.length : 5;
    renderTotal();
  });

  btnSwing.addEventListener('click', () => {
    showSwing = showSwing === 5 ? swingData.length : 5;
    renderSwing();
  });

  loadTotalReturn();
  loadSwing();
});
