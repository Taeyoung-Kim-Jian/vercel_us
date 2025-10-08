// === 0) Supabase 연결 (본인 값으로 교체) ===
const SUPABASE_URL = 'https://sssmldmhcfuodutvvcqf.supabase.co'; // <-- 교체
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4';               // <-- 교체
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === 1) 전역 상태 ===
let chart; // ECharts 인스턴스
const chartEl = document.getElementById('chart');

// 한 번만 만들고 계속 재사용 (중요: dispose 남발 X)
function getChart() {
  if (!chart) {
    chart = echarts.init(chartEl);
    window.addEventListener('resize', () => chart.resize());
  }
  return chart;
}

// === 2) 유틸 ===
const nf = new Intl.NumberFormat('ko-KR');
const fmtPct = v => (v == null || v === '' || isNaN(+v)) ? '' : `${(+v).toFixed(2)}%`;

// === 3) 요약 카드 ===
function renderSummaryCards(rows) {
  const wrap = document.getElementById('summary-cards');
  if (!wrap) return;
  wrap.innerHTML = '';

  const clean = rows.filter(r => r['수익률'] != null);
  const top5 = clean.slice(0, 5);
  const bottom5 = clean.slice(-5).reverse();

  const card = (title, list, accent) => `
    <div class="rounded-xl border p-4 ${accent}">
      <h3 class="font-bold mb-3">${title}</h3>
      ${list.map((r,i)=>`
        <div class="card-row flex justify-between items-center py-1 border-b last:border-b-0" data-name="${r['종목명'] ?? ''}" data-code="${r['종목코드'] ?? ''}">
          <span class="truncate max-w-[70%]">${i+1}. ${r['종목명'] ?? '-'}</span>
          <span class="font-semibold">${fmtPct(r['수익률'])}</span>
        </div>`).join('')}
    </div>
  `;
  wrap.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${card('📈 상승 Top 5', top5, 'bg-green-50/40 border-green-200')}
      ${card('📉 하락 Bottom 5', bottom5, 'bg-red-50/40 border-red-200')}
    </div>
  `;

  // 카드 항목 클릭 → 차트 로드
  wrap.querySelectorAll('.card-row').forEach(row => {
    row.addEventListener('click', () => {
      const name = row.getAttribute('data-name') || '';
      const code = row.getAttribute('data-code') || '';
      showChart(name, code);
    });
  });
}

// === 4) 리스트 로드 ===
async function loadList() {
  const el = document.getElementById('list');
  el.innerHTML = '불러오는 중...';

  const { data, error } = await supabaseClient
    .from('total_return')
    .select('종목명, 종목코드, 시작가격, 현재가격, 수익률')
    .order('수익률', { ascending: false });

  if (error) {
    el.innerHTML = `<p class="text-red-600">에러: ${error.message}</p>`;
    return;
  }
  if (!data || data.length === 0) {
    el.innerHTML = '<p class="text-gray-500">데이터가 없습니다.</p>';
    return;
  }

  renderSummaryCards(data);

  // 간단 테이블 렌더
  const headers = ['종목명', '종목코드', '시작가격', '현재가격', '수익률'];
  let html = '<table><thead><tr>';
  headers.forEach(h => html += `<th>${h}</th>`);
  html += '</tr></thead><tbody>';

  data.forEach(r => {
    html += `
      <tr>
        <td class="clickable" data-name="${r['종목명']}" data-code="${r['종목코드'] ?? ''}">${r['종목명']}</td>
        <td>${r['종목코드'] ?? ''}</td>
        <td style="text-align:right">${nf.format(+r['시작가격'] || 0)}</td>
        <td style="text-align:right">${nf.format(+r['현재가격'] || 0)}</td>
        <td style="text-align:right">${fmtPct(r['수익률'])}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  el.innerHTML = html;

  // 리스트 클릭 → 차트 로드
  el.querySelectorAll('.clickable').forEach(td => {
    td.addEventListener('click', async () => {
      const name = td.getAttribute('data-name') || '';
      const code = td.getAttribute('data-code') || '';
      await showChart(name, code);
    });
  });
}

// === 5) 차트 옵션 ===
function buildCandleOption(dates, ohlc, title='') {
  return {
    title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 50, bottom: 40 },
    xAxis: { type: 'category', data: dates, boundaryGap: true, axisLine: { onZero: false } },
    yAxis: { scale: true },
    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    series: [
      {
        name: 'OHLC',
        type: 'candlestick',
        data: ohlc,      // [open, close, low, high]
        itemStyle: {
          color: '#22c55e',          // 상승
          color0: '#ef4444',         // 하락
          borderColor: '#22c55e',
          borderColor0: '#ef4444'
        }
      }
    ]
  };
}

function buildLineOption(dates, closes, title='') {
  return {
    title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 50, bottom: 40 },
    xAxis: { type: 'category', data: dates, boundaryGap: false },
    yAxis: { scale: true },
    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    series: [{ type: 'line', data: closes, showSymbol: false }]
  };
}

// === 6) Supabase → ECharts 데이터 정규화 ===
function normalizeToECharts(data) {
  // 한국어 컬럼 (캔들)
  if (data.length && '시가' in data[0] && '고가' in data[0] && '저가' in data[0] && '종가' in data[0]) {
    const dates = data.map(d => d['날짜']);
    const ohlc  = data.map(d => [ +d['시가'], +d['종가'], +d['저가'], +d['고가'] ]); // [O,C,L,H]
    return { type: 'candlestick', dates, ohlc };
  }
  // 영어 컬럼 (캔들)
  if (data.length && 'open' in data[0] && 'high' in data[0] && 'low' in data[0] && 'close' in data[0]) {
    const dates = data.map(d => d['date']);
    const ohlc  = data.map(d => [ +d['open'], +d['close'], +d['low'], +d['high'] ]);
    return { type: 'candlestick', dates, ohlc };
  }
  // 종가만 (라인)
  if (data.length && ('종가' in data[0] || 'close' in data[0])) {
    const useK = '종가' in data[0];
    const dates = data.map(d => useK ? d['날짜'] : d['date']);
    const closes = data.map(d => +(useK ? d['종가'] : d['close']));
    return { type: 'line', dates, closes };
  }
  return { type: 'empty' };
}

// === 7) 종목 선택 → 차트 표시 (로딩 처리 fix 포함) ===
async function showChart(name, code) {
  const c = getChart();

  // ✅ 로딩 오버레이 (DOM을 갈아엎지 않음)
  c.showLoading('default', { text: '데이터 로딩 중...' });

  try {
    // 1차: 한국어 컬럼
    let q = supabaseClient.from('prices').select('날짜, 시가, 고가, 저가, 종가');
    q = code ? q.eq('종목코드', code) : q.eq('종목명', name);
    let { data, error } = await q.order('날짜', { ascending: true }).limit(5000);

    // 2차: 영어 컬럼 fallback
    if (error || !data || data.length === 0) {
      let q2 = supabaseClient.from('prices').select('date, open, high, low, close');
      q2 = code ? q2.eq('code', code) : q2.eq('name', name);
      const alt = await q2.order('date', { ascending: true }).limit(5000);
      data = alt.data || [];
    }

    // 데이터 없음 처리
    if (!data || data.length === 0) {
      c.clear();
      c.setOption({
        title: { text: `⚠️ "${name || code}" 데이터가 없습니다.`, left: 'center' },
        graphic: {
          type: 'text', left: 'center', top: 'middle',
          style: { text: '데이터 없음', fill: '#666', fontSize: 14 }
        }
      }, true);
      return;
    }

    // 정규화
    const norm = normalizeToECharts(data);

    // ✅ 이전 시리즈/옵션 비우고 새로 설정 (dispose 불필요)
    c.clear();

    if (norm.type === 'candlestick') {
      c.setOption(buildCandleOption(
        norm.dates,
        norm.ohlc,
        `${name}${code ? ' (' + code + ')' : ''}`
      ), true);
    } else if (norm.type === 'line') {
      c.setOption(buildLineOption(
        norm.dates,
        norm.closes,
        `${name}${code ? ' (' + code + ')' : ''}`
      ), true);
    } else {
      c.setOption({
        title: { text: '지원하지 않는 데이터 형식', left: 'center' }
      }, true);
    }
  } catch (e) {
    // 에러 표시
    c.clear();
    c.setOption({
      title: { text: `에러: ${e.message}`, left: 'center', textStyle: { color: '#dc2626' } }
    }, true);
    console.error(e);
  } finally {
    // ✅ 로딩 종료 (성공/실패 모두)
    c.hideLoading();
  }
}

// === 8) 시작 ===
loadList();
