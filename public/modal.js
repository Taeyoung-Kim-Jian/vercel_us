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

        <!-- 패턴 예측 정보 테이블 -->
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
                  <th>유사패턴</th>
                  <th>현재수익률</th>
                  <th>경과일수</th>
                </tr>
              </thead>
              <tbody id="prediction-tbody">
                <tr><td colspan="7" style="text-align:center;padding:15px;">분석 중...</td></tr>
              </tbody>
            </table>
          </div>
          <p style="font-size: 11px; color: #9ca3af; margin-top: 10px; text-align: center;">
            * 과거 유사 패턴 분석 기반 예측으로, 실제 결과와 다를 수 있습니다.
          </p>
        </div>
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

  // ✅ 패턴 예측 정보 로드 (차트보다 먼저)
  await loadPredictionData(code);

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

// 패턴 예측 데이터 로드
async function loadPredictionData(code) {
  const predictionDiv = document.getElementById('modal-prediction');
  const predictionTbody = document.getElementById('prediction-tbody');

  try {
    // pattern_predictions 테이블에서 데이터 조회
    const { data, error } = await SWINGINV.db
      .from('pattern_predictions')
      .select('*')
      .eq('종목코드', code)
      .order('분석일시', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // 예측 데이터 없음
      predictionDiv.style.display = 'none';
      return;
    }

    // 데이터가 있으면 테이블 표시
    predictionDiv.style.display = 'block';

    // 투자점수에 따른 색상
    const getScoreColor = (score) => {
      if (score >= 70) return '#10b981'; // 녹색
      if (score >= 50) return '#f59e0b'; // 주황
      return '#ef4444'; // 빨강
    };

    const scoreColor = getScoreColor(data.투자점수);
    const returnColor = data.평균_예상수익률 >= 0 ? '#10b981' : '#ef4444';
    const currentReturnColor = data.현재_수익률 >= 0 ? '#10b981' : '#ef4444';

    predictionTbody.innerHTML = `
      <tr>
        <td style="font-weight: 700; font-size: 18px; color: ${scoreColor};">
          ${data.투자점수.toFixed(1)}<span style="font-size: 12px; color: #6b7280;">/100</span>
        </td>
        <td style="font-weight: 600;">
          ${data.신뢰도.toFixed(1)}%
        </td>
        <td style="font-weight: 600; color: ${returnColor};">
          ${data.평균_예상수익률.toFixed(1)}%
          <div style="font-size: 11px; color: #9ca3af;">
            (${data.최소_예상수익률.toFixed(1)}% ~ ${data.최대_예상수익률.toFixed(1)}%)
          </div>
        </td>
        <td>${data.평균_예상기간}일</td>
        <td>${data.유사패턴_개수}개</td>
        <td style="font-weight: 600; color: ${currentReturnColor};">
          ${data.현재_수익률.toFixed(2)}%
        </td>
        <td>${data.현재_경과일수}일</td>
      </tr>
      <tr style="background: #f9fafb;">
        <td colspan="7" style="padding: 15px; font-size: 13px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div>
              <strong style="color: #1f2937;">📊 평균 매수가:</strong>
              <span style="color: #2563eb; font-weight: 600; margin-left: 5px;">
                ${data.평균_매수가?.toLocaleString() || '-'}원
              </span>
            </div>
            <div>
              <strong style="color: #1f2937;">🎯 목표가:</strong>
              <span style="color: #10b981; font-weight: 600; margin-left: 5px;">
                ${data.목표가?.toLocaleString() || '-'}원
              </span>
              <span style="font-size: 11px; color: #6b7280; margin-left: 3px;">
                (+${data.목표_수익률?.toFixed(1) || '0'}%)
              </span>
            </div>
            <div>
              <strong style="color: #1f2937;">💰 현재가:</strong>
              <span style="font-weight: 600; margin-left: 5px;">
                ${data.현재가?.toLocaleString() || '-'}원
              </span>
            </div>
          </div>
          <details style="margin-top: 10px;">
            <summary style="cursor: pointer; color: #6b7280; font-size: 12px;">
              🔽 5분할 매수 단가 보기
            </summary>
            <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; font-size: 12px;">
              <div style="text-align: center; padding: 6px; background: white; border-radius: 4px;">
                <div style="color: #6b7280;">1차 (-2%)</div>
                <div style="font-weight: 600; color: #2563eb;">${data.매수1?.toLocaleString() || '-'}원</div>
              </div>
              <div style="text-align: center; padding: 6px; background: white; border-radius: 4px;">
                <div style="color: #6b7280;">2차 (-4%)</div>
                <div style="font-weight: 600; color: #2563eb;">${data.매수2?.toLocaleString() || '-'}원</div>
              </div>
              <div style="text-align: center; padding: 6px; background: white; border-radius: 4px;">
                <div style="color: #6b7280;">3차 (-6%)</div>
                <div style="font-weight: 600; color: #2563eb;">${data.매수3?.toLocaleString() || '-'}원</div>
              </div>
              <div style="text-align: center; padding: 6px; background: white; border-radius: 4px;">
                <div style="color: #6b7280;">4차 (-8%)</div>
                <div style="font-weight: 600; color: #2563eb;">${data.매수4?.toLocaleString() || '-'}원</div>
              </div>
              <div style="text-align: center; padding: 6px; background: white; border-radius: 4px;">
                <div style="color: #6b7280;">5차 (-10%)</div>
                <div style="font-weight: 600; color: #2563eb;">${data.매수5?.toLocaleString() || '-'}원</div>
              </div>
            </div>
          </details>
        </td>
      </tr>
    `;

    // ✅ 차트에 매수가와 목표가 표시 (전역 변수에 저장)
    window.currentPredictionData = data;
  } catch (err) {
    console.error('❌ 예측 데이터 로드 오류:', err);
    predictionDiv.style.display = 'none';
  }
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
        width: 3,
        shadowColor: 'rgba(37, 99, 235, 0.3)',
        shadowBlur: 4,
        shadowOffsetY: 2,
      },
      itemStyle: {
        color: '#2563eb',
        borderWidth: 2,
        borderColor: '#fff',
      },
      emphasis: {
        focus: 'series',
        lineStyle: {
          width: 4,
        },
      },
    },
  ];

  // ✅ B가격을 각각 수평선(markLine)으로 표시 - 흐린 회색으로 배경처럼 표시
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
            color: '#9ca3af',
            fontSize: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: [2, 4],
            borderRadius: 3,
          },
          lineStyle: {
            color: '#d1d5db',
            width: 1.5,
            type: 'dashed',
            opacity: 0.6,
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

  // ✅ 매수가와 목표가 표시 (예측 데이터가 있는 경우)
  if (window.currentPredictionData) {
    const pred = window.currentPredictionData;

    // 평균 매수가 라인
    if (pred.평균_매수가) {
      if (!series[0].markLine) series[0].markLine = { silent: false, symbol: 'none', data: [] };
      series[0].markLine.data.push({
        name: '평균 매수가',
        yAxis: pred.평균_매수가,
        label: {
          formatter: '📊 평균 매수가: {c}원',
          position: 'insideEndTop',
          color: '#2563eb',
          fontSize: 11,
          fontWeight: 'bold',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: [4, 8],
          borderRadius: 4,
          borderColor: '#2563eb',
          borderWidth: 1,
        },
        lineStyle: {
          color: '#2563eb',
          width: 2,
          type: 'solid',
          opacity: 0.8,
        },
      });
    }

    // 목표가 라인
    if (pred.목표가) {
      if (!series[0].markLine) series[0].markLine = { silent: false, symbol: 'none', data: [] };
      series[0].markLine.data.push({
        name: '목표가',
        yAxis: pred.목표가,
        label: {
          formatter: '🎯 목표가: {c}원',
          position: 'insideEndTop',
          color: '#10b981',
          fontSize: 11,
          fontWeight: 'bold',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: [4, 8],
          borderRadius: 4,
          borderColor: '#10b981',
          borderWidth: 1,
        },
        lineStyle: {
          color: '#10b981',
          width: 2,
          type: 'solid',
          opacity: 0.8,
        },
      });
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
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
        fontSize: 13,
      },
      formatter: (params) => {
        let res = `<div style="font-weight:600;margin-bottom:6px;">${params[0].axisValue}</div>`;
        params.forEach((p) => {
          if (p.value !== null && p.value !== undefined) {
            res += `${p.marker} ${p.seriesName}: <span style="font-weight:600;">${p.value?.toLocaleString()}</span><br/>`;
          }
        });
        return res;
      },
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#9ca3af',
          type: 'dashed',
        },
      },
    },
    legend: {
      data: legendData,
      top: 30,
      textStyle: {
        fontSize: 12,
        color: '#6b7280',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
      backgroundColor: '#fafafa',
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: {
        lineStyle: { color: '#d1d5db' },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: {
        lineStyle: { color: '#d1d5db' },
      },
      axisLabel: {
        formatter: (v) => v.toLocaleString(),
        color: '#6b7280',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          type: 'solid',
        },
      },
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
        zoomOnMouseWheel: 'ctrl',
      },
      {
        start: 0,
        end: 100,
        height: 25,
        bottom: 10,
        borderColor: '#d1d5db',
        textStyle: {
          color: '#6b7280',
        },
        handleStyle: {
          color: '#2563eb',
        },
      },
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
