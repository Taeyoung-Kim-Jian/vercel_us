/* =========================================================
   📊 us_modal.js — US 주식 상세 모달창 관리
   ========================================================= */

// 모달 HTML 생성 및 초기화
function initStockModal() {
  const existingModal = document.getElementById('stock-modal');
  if (existingModal) existingModal.remove();

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

        <!-- 패턴 예측 정보 테이블 (US용은 현재 비활성화) -->
        <div id="modal-prediction" style="margin-top: 30px; display:none;">
          <h3 style="font-size: 16px; color: #1f2937; margin-bottom: 15px;">
            📊 AI 패턴 분석 결과
          </h3>
          <div class="prediction-table-wrap">
            <table class="prediction-table">
              <thead>
                <tr>
                  <th>투자점수</th>
                  <th>신뢰도</th>
                  <th>예상수익률</th>
                  <th>예상기간</th>
                </tr>
              </thead>
              <tbody id="prediction-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('stock-modal');
  const closeBtn = document.getElementById('modal-close');

  closeBtn.addEventListener('click', closeStockModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeStockModal();
  });

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
  document.body.style.overflow = 'hidden';

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
    document.body.style.overflow = '';

    if (window.modalChartInstance) {
      window.modalChartInstance.dispose();
      window.modalChartInstance = null;
    }
  }
}

// 종목 상세 데이터 로드 및 차트 렌더링
async function loadStockDetailData(code, name) {
  const subtitle = document.getElementById('modal-subtitle');
  const toggleB = document.getElementById('modal-toggleB');
  const watchToggle = document.getElementById('modal-watchToggle');

  subtitle.textContent = `종목코드: ${code}`;

  const { data: pricesData, error: pricesError } = await SWINGINV.db
    .from('us_prices')
    .select('날짜, 종가')
    .eq('종목코드', code)
    .order('날짜', { ascending: true });

  if (pricesError) throw pricesError;
  if (!pricesData || pricesData.length === 0) {
    throw new Error('차트 데이터가 없습니다.');
  }

  const latestPrice = pricesData[pricesData.length - 1]?.종가 || 0;

  const { data: btData, error: btError } = await SWINGINV.db
    .from('us_bt_points')
    .select('b가격')
    .eq('종목코드', code);

  if (btError) console.warn('⚠️ B가격 데이터 조회 실패:', btError);

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

  renderModalChart(pricesData, name, toggleB.checked, btData);

  const handleToggleB = () => {
    renderModalChart(pricesData, name, toggleB.checked, btData);
  };
  toggleB.removeEventListener('change', handleToggleB);
  toggleB.addEventListener('change', handleToggleB);

  const handleWatchToggle = async () => {
    if (!SWINGINV.user) {
      alert('⚠️ 로그인이 필요합니다.');
      watchToggle.checked = false;
      return;
    }

    if (watchToggle.checked) {
      const { error } = await SWINGINV.db.from('watchlist').insert({
        user_id: SWINGINV.user.id,
        종목코드: code,
        종목명: name,
        등록종가: latestPrice,
      });
      if (error) {
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
      lineStyle: {
        color: '#2563eb',
        width: 2,
      },
      areaStyle:{ color:"rgba(37,99,235,0.1)" },
      itemStyle: {
        opacity: 0
      },
    },
  ];

  const markLines = [];
  if (showB && btData && btData.length > 0) {
    const bPrices = Array.from(new Set(btData.map(b => parseFloat(b.b가격))));
    bPrices.forEach((price, index) => {
        markLines.push({
          name: `B${index + 1}`,
          yAxis: price,
          label: {
            formatter: `B: {c}`,
            position: 'end',
            color: '#e11d48',
            fontSize: 10,
          },
          lineStyle: {
            color: '#e11d48',
            width: 1,
            type: 'dashed',
          },
        });
    });

    if (markLines.length > 0) {
      series[0].markLine = {
        silent: true,
        symbol: 'none',
        data: markLines,
      };
    }
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#374151' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
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
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        start: 0,
        end: 100,
        height: 25,
        bottom: 10,
      },
    ],
    series,
  };

  chart.setOption(option);

  const resizeHandler = () => chart.resize();
  window.removeEventListener('resize', resizeHandler);
  window.addEventListener('resize', resizeHandler);
}

document.addEventListener('DOMContentLoaded', () => {
  initStockModal();
});

function bindStockClickEvents() {
  document.querySelectorAll('.clickable-row, .clickable-name').forEach((el) => {
    const code = el.dataset.code;
    const name = el.dataset.name;

    if (code && name) {
        // 기존 onclick 제거
        if(el.hasAttribute('onclick')) {
            el.removeAttribute('onclick');
        }
        
        el.style.cursor = 'pointer';
        // 중복 바인딩 방지를 위해 기존 리스너 제거
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);

        newEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openStockModal(code, name);
        });
    }
  });
}

window.openStockModal = openStockModal;
window.closeStockModal = closeStockModal;
window.bindStockClickEvents = bindStockClickEvents;