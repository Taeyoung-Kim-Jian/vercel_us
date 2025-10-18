/* =========================================================
   📊 modal.js — 종목 상세 모달창 관리
   ========================================================= */

// 모달 HTML 생성 및 초기화
function initStockModal() {
  // 이미 모달이 존재하면 제거
  const existingModal = document.getElementById('stock-modal');
  if (existingModal) existingModal.remove();

  // 모달 HTML 생성
  const modalHTML = `
    <div id="stock-modal" class="modal-overlay" style="display:none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-chart-title">📈 종목 상세</h2>
          <button id="modal-close" class="modal-close-btn">&times;</button>
        </div>
        <p id="modal-subtitle">데이터를 불러오는 중...</p>

        <div id="modal-toolbar">
          <label><input type="checkbox" id="modal-toggleB" checked> B가격 표시</label>
          <label><input type="checkbox" id="modal-watchToggle"> ⭐ 관심종목 등록</label>
        </div>

        <div id="modal-chart"></div>
        <div id="modal-error-box" style="display:none;"></div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // 모달 닫기 이벤트
  const modal = document.getElementById('stock-modal');
  const closeBtn = document.getElementById('modal-close');

  closeBtn.addEventListener('click', closeStockModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeStockModal();
  });

  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeStockModal();
    }
  });
}

// 모달 열기
async function openStockModal(code, name) {
  const modal = document.getElementById('stock-modal');
  if (!modal) {
    console.error('❌ 모달이 초기화되지 않았습니다.');
    return;
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // 스크롤 방지

  const title = document.getElementById('modal-chart-title');
  const subtitle = document.getElementById('modal-subtitle');
  const chartDiv = document.getElementById('modal-chart');
  const errorBox = document.getElementById('modal-error-box');

  title.textContent = `📈 ${name}`;
  subtitle.textContent = '데이터를 불러오는 중...';
  chartDiv.innerHTML = '';
  errorBox.style.display = 'none';

  try {
    await loadStockDetailData(code, name);
  } catch (err) {
    console.error('❌ 모달 데이터 로드 오류:', err);
    errorBox.textContent = `❌ 데이터를 불러오지 못했습니다: ${err.message}`;
    errorBox.style.display = 'block';
  }
}

// 모달 닫기
function closeStockModal() {
  const modal = document.getElementById('stock-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = ''; // 스크롤 복원

    // 차트 인스턴스 정리
    if (window.modalChartInstance) {
      window.modalChartInstance.dispose();
      window.modalChartInstance = null;
    }
  }
}

// 종목 상세 데이터 로드 및 차트 렌더링
async function loadStockDetailData(code, name) {
  const subtitle = document.getElementById('modal-subtitle');
  const chartDiv = document.getElementById('modal-chart');
  const errorBox = document.getElementById('modal-error-box');
  const toggleB = document.getElementById('modal-toggleB');
  const watchToggle = document.getElementById('modal-watchToggle');

  subtitle.textContent = `종목코드: ${code}`;

  // ✅ prices 테이블에서 종가 데이터 조회
  const { data: pricesData, error: pricesError } = await SWINGINV.db
    .from('prices')
    .select('날짜, 종가, 시가, 고가, 저가, 거래량')
    .eq('종목코드', code)
    .order('날짜', { ascending: true });

  if (pricesError) throw pricesError;
  if (!pricesData || pricesData.length === 0) {
    throw new Error('차트 데이터가 없습니다.');
  }

  // 최신 종가 (관심종목 등록 시 사용)
  const latestPrice = pricesData[pricesData.length - 1]?.종가 || 0;

  // ✅ bt_points 테이블에서 B가격 데이터 조회
  const { data: btData, error: btError } = await SWINGINV.db
    .from('bt_points')
    .select('순번, b날짜, b가격, t날짜, t가격')
    .eq('종목코드', code)
    .order('순번', { ascending: true });

  if (btError) console.warn('⚠️ B가격 데이터 조회 실패:', btError);

  // B가격 데이터를 날짜별로 매핑 (b날짜 기준)
  const bPriceMap = {};
  if (btData && btData.length > 0) {
    btData.forEach(bt => {
      if (bt.b날짜 && bt.b가격) {
        const dateKey = new Date(bt.b날짜).toISOString().split('T')[0];
        bPriceMap[dateKey] = bt.b가격;
      }
    });
  }

  // prices 데이터에 B가격 정보 추가
  const mergedData = pricesData.map(p => {
    const dateKey = p.날짜;
    return {
      ...p,
      B가격: bPriceMap[dateKey] || null
    };
  });

  // 관심종목 상태 확인
  if (SWINGINV.user) {
    const { data: wData } = await SWINGINV.db
      .from('watchlist')
      .select('*')
      .eq('user_id', SWINGINV.user.id)
      .eq('종목코드', code)
      .single();
    watchToggle.checked = !!wData;
  } else {
    watchToggle.disabled = true;
    watchToggle.parentElement.title = '로그인 후 이용 가능';
  }

  // 차트 렌더링
  renderModalChart(mergedData, name, toggleB.checked, btData);

  // B가격 토글 이벤트
  const handleToggleB = () => {
    renderModalChart(mergedData, name, toggleB.checked, btData);
  };
  toggleB.removeEventListener('change', handleToggleB);
  toggleB.addEventListener('change', handleToggleB);

  // 관심종목 토글 이벤트
  const handleWatchToggle = async () => {
    if (!SWINGINV.user) {
      alert('⚠️ 로그인이 필요합니다.\n\n관심종목 등록 기능은 로그인 후 사용 가능합니다.');
      watchToggle.checked = false;
      return;
    }

    if (watchToggle.checked) {
      // ✅ 등록종가 추가
      const { error } = await SWINGINV.db.from('watchlist').insert({
        user_id: SWINGINV.user.id,
        종목코드: code,
        종목명: name,
        등록종가: latestPrice,
      });
      if (error) {
        console.error('❌ 관심종목 등록 실패:', error);
        alert('등록 실패: ' + error.message);
        watchToggle.checked = false;
      } else {
        alert('✅ 관심종목에 등록되었습니다.');
      }
    } else {
      const { error } = await SWINGINV.db
        .from('watchlist')
        .delete()
        .eq('user_id', SWINGINV.user.id)
        .eq('종목코드', code);
      if (error) {
        console.error('❌ 관심종목 해제 실패:', error);
        alert('해제 실패: ' + error.message);
        watchToggle.checked = true;
      } else {
        alert('✅ 관심종목에서 제거되었습니다.');
      }
    }
  };
  watchToggle.removeEventListener('change', handleWatchToggle);
  watchToggle.addEventListener('change', handleWatchToggle);
}

// ECharts 차트 렌더링
function renderModalChart(data, name, showB, btData) {
  const chartDiv = document.getElementById('modal-chart');

  if (window.modalChartInstance) {
    window.modalChartInstance.dispose();
  }

  const chart = echarts.init(chartDiv);
  window.modalChartInstance = chart;

  const dates = data.map((r) => r.날짜);
  const prices = data.map((r) => r.종가);

  const series = [
    {
      name: '종가',
      type: 'line',
      data: prices,
      smooth: true,
      lineStyle: { color: '#2563eb', width: 2 },
      itemStyle: { color: '#2563eb' },
    },
  ];

  // ✅ B가격을 각각 수평선(markLine)으로 표시
  const markLines = [];
  if (showB && btData && btData.length > 0) {
    btData.forEach((bt, index) => {
      if (bt.b가격) {
        markLines.push({
          name: `B${index + 1}`,
          yAxis: bt.b가격,
          label: {
            formatter: `B${index + 1}: {c}`,
            position: 'end',
            color: '#dc2626',
            fontSize: 11,
          },
          lineStyle: {
            color: '#dc2626',
            width: 2,
            type: 'dashed',
          },
        });
      }
    });

    // 종가 시리즈에 markLine 추가
    if (markLines.length > 0) {
      series[0].markLine = {
        silent: false,
        symbol: 'none',
        data: markLines,
      };
    }
  }

  const legendData = ['종가'];
  if (showB && markLines.length > 0) {
    legendData.push('B가격');
  }

  const option = {
    title: {
      text: name,
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let res = `${params[0].axisValue}<br/>`;
        params.forEach((p) => {
          if (p.value !== null && p.value !== undefined) {
            res += `${p.marker} ${p.seriesName}: ${p.value?.toLocaleString() || '-'}<br/>`;
          }
        });
        return res;
      },
    },
    legend: {
      data: legendData,
      top: 30,
    },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: {
        formatter: (v) => v.toLocaleString(),
      },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { start: 0, end: 100 },
    ],
    series,
  };

  chart.setOption(option);

  // 반응형 처리
  const resizeHandler = () => chart.resize();
  window.removeEventListener('resize', resizeHandler);
  window.addEventListener('resize', resizeHandler);
}

// 페이지 로드 시 모달 초기화
document.addEventListener('DOMContentLoaded', () => {
  initStockModal();
});

// 종목명 클릭 이벤트 바인딩 (공통)
function bindStockClickEvents() {
  document.querySelectorAll('.clickable-name, .clickable-row').forEach((el) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const code = el.dataset.code || el.closest('[data-code]')?.dataset.code;
      const name = el.dataset.name || el.closest('[data-name]')?.dataset.name;
      if (code && name) {
        openStockModal(code, name);
      }
    });
  });
}

// 전역 함수로 export
window.openStockModal = openStockModal;
window.closeStockModal = closeStockModal;
window.bindStockClickEvents = bindStockClickEvents;
