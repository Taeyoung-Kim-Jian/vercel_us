window.addEventListener('DOMContentLoaded', async () => {
  // === Supabase 연결 ===
  const SUPABASE_URL = 'https://sssmldmhcfuodutvvcqf.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4';
  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // === 전역 변수 ===
  let totalData = [], swingData = [];
  let showTotal = 5, showSwing = 5;

  // === DOM 참조 ===
  const totalTbody = document.getElementById('total-table-body');
  const swingTbody = document.getElementById('swing-table-body');
  const btnTotal = document.getElementById('loadMoreTotalBtn');
  const btnSwing = document.getElementById('loadMoreSwingBtn');

  // === 전체 수익률 불러오기 ===
  async function loadTotalReturn() {
    totalTbody.innerHTML = `<tr><td colspan="4">⏳ 데이터를 불러오는 중...</td></tr>`;
    try {
      const { data, error } = await db.from('total_return').select('*').order('수익률', { ascending: false });
      if (error) throw error;
      totalData = data || [];
      renderTotal();
    } catch (err) {
      totalTbody.innerHTML = `<tr><td colspan="4">❌ 데이터 불러오기 실패</td></tr>`;
      console.error(err);
    }
  }

  // === 스윙 적정가격 불러오기 ===
  async function loadSwing() {
    swingTbody.innerHTML = `<tr><td colspan="4">⏳ 데이터를 불러오는 중...</td></tr>`;
    try {
      const { data, error } = await db.from('swing_price').select('*').order('괴리율', { ascending: true });
      if (error) throw error;
      swingData = data || [];
      renderSwing();
    } catch (err) {
      swingTbody.innerHTML = `<tr><td colspan="4">❌ 데이터 불러오기 실패</td></tr>`;
      console.error(err);
    }
  }

  // === 렌더링 함수들 ===
  function renderTotal() {
    totalTbody.innerHTML = '';
    totalData.slice(0, showTotal).forEach(r => {
      const tr = document.createElement('tr');
      const rate = parseFloat(r.수익률 ?? 0);
      tr.innerHTML = `
        <td>${r.종목명 || '-'}</td>
        <td>${r.매수가?.toLocaleString() || '-'}</td>
        <td>${r.현재가?.toLocaleString() || '-'}</td>
        <td style="color:${rate >= 0 ? '#d32f2f' : '#1976d2'};">
          ${rate >= 0 ? '▲' : '▼'}${rate.toFixed(2)}%
        </td>`;
      totalTbody.appendChild(tr);
    });
    btnTotal.style.display = totalData.length > 5 ? 'inline-block' : 'none';
  }

  function renderSwing() {
    swingTbody.innerHTML = '';
    swingData.slice(0, showSwing).forEach(r => {
      const tr = document.createElement('tr');
      const diff = parseFloat(r.괴리율 ?? 0);
      tr.innerHTML = `
        <td>${r.종목명 || '-'}</td>
        <td>${r.적정매수가?.toLocaleString() || '-'}</td>
        <td>${r.현재가?.toLocaleString() || '-'}</td>
        <td style="color:${diff >= 0 ? '#d32f2f' : '#1976d2'};">
          ${diff >= 0 ? '▲' : '▼'}${diff.toFixed(2)}%
        </td>`;
      swingTbody.appendChild(tr);
    });
    btnSwing.style.display = swingData.length > 5 ? 'inline-block' : 'none';
  }

  // === 더보기 버튼 ===
  btnTotal.addEventListener('click', () => {
    showTotal = showTotal === 5 ? totalData.length : 5;
    renderTotal();
    btnTotal.textContent = showTotal === 5 ? '더보기' : '접기';
  });
  btnSwing.addEventListener('click', () => {
    showSwing = showSwing === 5 ? swingData.length : 5;
    renderSwing();
    btnSwing.textContent = showSwing === 5 ? '더보기' : '접기';
  });

  // === 실행 ===
  loadTotalReturn();
  loadSwing();
});
