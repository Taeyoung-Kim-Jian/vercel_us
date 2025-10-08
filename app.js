// app.js  (Lightweight Charts ESM import 버전)

// ===============================
// 0) Supabase 연결 설정
// ===============================
const SUPABASE_URL = 'https://sssmldmhcfuodutvvcqf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4';
// HTML에 @supabase/supabase-js@2 스크립트가 로드되어 있어야 함
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===============================
// 1) Lightweight Charts ESM 로더 (버전 고정 + 전역 오염 없음)
// ===============================
async function getLW() {
  if (window.__LW_MODULE__) return window.__LW_MODULE__;
  const mod = await import('https://unpkg.com/lightweight-charts@4.3.0/dist/lightweight-charts.esm.production.js');
  window.__LW_MODULE__ = mod;
  return mod;
}

// ===============================
// 2) 전역 상태 (차트 핸들)
// ===============================
let stockChartInstance = null;
let stockChartSeries = null;

// ===============================
// 3) 유틸
// ===============================
const nf = new Intl.NumberFormat('ko-KR');
const fmtPct = (v) => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  return Number.isFinite(num) ? `${num.toFixed(2)}%` : v;
};
function el(tag, className = '', html = '') {
  const $ = document.createElement(tag);
  if (className) $.className = className;
  if (html) $.innerHTML = html;
  return $;
}

// ===============================
// 4) 요약 카드
// ===============================
function renderSummaryCards(rows) {
  const cont = document.getElementById('summary-cards-container');
  if (!cont) return;
  cont.innerHTML = '';

  const clean = rows.filter(r => r['수익률'] !== null && r['수익률'] !== undefined);
  const top5 = clean.slice(0, 5);
  const bottom5 = clean.slice(-5).reverse();

  const makeCard = (title, list, accentClass) => {
    const card = el('div', `rounded-xl border p-6 shadow-sm ${accentClass}`);
    const h = el('h3', 'font-bold text-lg mb-3', title);
    const ul = el('ul', 'space-y-2');
    list.forEach((r, i) => {
      const li = el(
        'li',
        'flex justify-between items-center hover:underline cursor-pointer',
        `<span class="truncate max-w-[75%]">${i + 1}. ${r['종목명'] ?? '-'}</span>
         <span class="font-semibold">${fmtPct(r['수익률'])}</span>`
      );
      li.addEventListener('click', () => onPickStock(r));
      ul.appendChild(li);
    });
    card.appendChild(h);
    card.appendChild(ul);
    return card;
  };

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-4');
  grid.appendChild(makeCard('📈 상승 Top 5', top5, 'bg-green-50/40 border-green-200'));
  grid.appendChild(makeCard('📉 하락 Top 5', bottom5, 'bg-red-50/40 border-red-200'));
  cont.appendChild(grid);
}

// ===============================
// 5) 표 생성 + 클릭 핸들러
// ===============================
function createDataTable(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);

  let html = '<table><thead><tr>';
  headers.forEach(h => { html += `<th class="whitespace-nowrap">${h}</th>`; });
  html += '</tr></thead><tbody>';

  data.forEach(row => {
    html += '<tr>';
    headers.forEach(h => {
      let cell = row[h];
      let attrs = 'class="whitespace-nowrap"';
      if (h === '종목명') {
        const code = (row['종목코드'] ?? '').toString();
        const name = (cell ?? '').toString();
        attrs = `class="clickable-stock whitespace-nowrap" data-stock-name="${name}" data-stock-code="${code}"`;
      }
      const right = (typeof cell === 'number' || h.includes('수익률')) ? 'style="text-align:right;"' : '';
      if (h === '현재가격' || h === '시작가격') {
        const num = Number(cell);
        cell = Number.isFinite(num) ? nf.format(num) : (cell ?? '');
      }
      if (h === '수익률') cell = fmtPct(cell);
      html += `<td ${right} ${attrs}>${cell ?? ''}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

function setupClickHandlers() {
  document.querySelectorAll('.clickable-stock').forEach(cell => {
    cell.addEventListener('click', (e) => {
      const name = e.currentTarget.getAttribute('data-stock-name') || '';
      const code = e.currentTarget.getAttribute('data-stock-code') || '';
      onPickStock({ '종목명': name, '종목코드': code });
    });
  });
}

// ===============================
// 6) 차트 렌더링 (ESM 사용)
// ===============================
async function renderChartByRows(prices, titleText = '') {
  const container = document.getElementById('chart-container');

  // ESM 모듈 확보 (전역 충돌 방지)
  const { createChart } = await getLW();

  // 이전 차트 제거 → 깨끗한 루트 생성
  if (stockChartInstance && typeof stockChartInstance.remove === 'function') {
    stockChartInstance.remove();
  }
  container.innerHTML = '';
  const root = document.createElement('div');
  root.id = 'chart-root';
  root.style.width = '100%';
  root.style.height = '400px';
  container.appendChild(root);

  if (titleText) {
    const title = el('div', 'text-sm text-gray-500 mb-2', `📈 <b>${titleText}</b>`);
    container.prepend(title);
  }

  // 차트 생성
  stockChartInstance = createChart(root, {
    width: root.clientWidth,
    height: 400,
    layout: { background: { type: 'solid', color: '#ffffff' }, textColor: '#111827' },
    grid: { vertLines: { color: '#e5e7eb' }, horzLines: { color: '#e5e7eb' } },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
    localization: { locale: 'ko-KR' }
  });

  // 정상 API 검증
  if (!stockChartInstance || typeof stockChartInstance.addCandlestickSeries !== 'function') {
    console.error('Unexpected chart API:', stockChartInstance);
    container.innerHTML = `<p class="error text-center py-8">
      🚨 차트 API 오류: addCandlestickSeries가 없습니다.
      <br/>HTML에서 lightweight-charts 관련 <code>&lt;script&gt;</code>를 모두 제거했는지 확인하세요.
    </p>`;
    return;
  }

  // OHLC 여부 판단
  const hasOHLC = ['open', 'high', 'low', 'close'].every(k => k in prices[0]);
  stockChartSeries = hasOHLC
    ? stockChartInstance.addCandlestickSeries({
        upColor: '#22c55e', downColor: '#ef4444',
        wickUpColor: '#22c55e', wickDownColor: '#ef4444',
        borderVisible: false
      })
    : stockChartInstance.addLineSeries({ lineWidth: 2 });

  stockChartSeries.setData(prices);
  stockChartInstance.timeScale().fitContent();

  // 반응형
  new ResizeObserver(entries => {
    const w = Math.round(entries[0].contentRect.width);
    stockChartInstance.applyOptions({ width: w });
  }).observe(container);
}

// ===============================
// 7) 종목 클릭 → 가격 로딩 → 차트 호출
// ===============================
async function onPickStock(row) {
  const name = row['종목명'] || '';
  const code = row['종목코드'] || '';
  const container = document.getElementById('chart-container');
  container.innerHTML = `<p class="text-gray-500 text-center py-8">"${name || code}" 데이터 로딩 중...</p>`;

  try {
    // 1차: 한국어 컬럼 + 코드 우선, 코드 없으면 종목명
    let q1 = supabaseClient.from('prices').select('날짜, 시가, 고가, 저가, 종가');
    q1 = code ? q1.eq('종목코드', code) : q1.eq('종목명', name);
    let { data, error } = await q1.order('날짜', { ascending: true }).limit(5000);

    // 2차: 영어 컬럼 fallback
    if (error || !data || data.length === 0) {
      let q2 = supabaseClient.from('prices').select('date, open, high, low, close');
      q2 = code ? q2.eq('code', code) : q2.eq('name', name);
      const alt = await q2.order('date', { ascending: true }).limit(5000);
      data = alt.data || [];
    }

    if (!data || data.length === 0) {
      container.innerHTML = `<p class="p-8 text-center text-yellow-600">
        ⚠️ "${name || code}" 데이터가 없습니다. prices 테이블의 컬럼/값을 확인하세요.
      </p>`;
      return;
    }

    // 정규화 (초 단위 epoch)
    let prices;
    if ('시가' in data[0] && '고가' in data[0] && '저가' in data[0] && '종가' in data[0]) {
      prices = data.map(d => ({
        time: Math.floor(new Date(d['날짜']).getTime() / 1000),
        open: +d['시가'], high: +d['고가'], low: +d['저가'], close: +d['종가']
      }));
    } else if ('open' in data[0] && 'high' in data[0] && 'low' in data[0] && 'close' in data[0]) {
      prices = data.map(d => ({
        time: Math.floor(new Date(d['date']).getTime() / 1000),
        open: +d['open'], high: +d['high'], low: +d['low'], close: +d['close']
      }));
    } else if ('종가' in data[0]) {
      prices = data.map(d => ({
        time: Math.floor(new Date(d['날짜']).getTime() / 1000),
        value: +d['종가']
      }));
    } else {
      prices = data.map(d => ({
        time: Math.floor(new Date(d['date']).getTime() / 1000),
        value: +d['close']
      }));
    }

    await renderChartByRows(prices, `${name}${code ? ' (' + code + ')' : ''}`);
  } catch (e) {
    container.innerHTML = `<p class="error text-center py-8">🚨 데이터 처리 중 오류: ${e.message}</p>`;
    console.error('Chart Rendering Error:', e);
  }
}

// ===============================
// 8) 데이터 로드 & 테이블 렌더
// ===============================
async function loadTotalReturnData() {
  const dataContainer = document.getElementById('data-container');
  const summaryContainer = document.getElementById('summary-cards-container');
  dataContainer.innerHTML = '<p class="text-gray-600 p-8">데이터를 불러오는 중...</p>';
  summaryContainer.innerHTML = '<p class="text-gray-500 text-center py-4">요약 데이터를 준비하는 중...</p>';

  try {
    const { data, error } = await supabaseClient
      .from('total_return')
      .select('종목명, 종목코드, 시작가격, 현재가격, 수익률')  // 종목코드 포함 권장
      .order('수익률', { ascending: false });

    if (error) {
      dataContainer.innerHTML = `<p class="error p-8">❌ 데이터 로딩 오류: ${error.message}</p>`;
      summaryContainer.innerHTML = '';
      return;
    }
    if (!data || data.length === 0) {
      dataContainer.innerHTML = '<p class="p-8">⚠️ 테이블에 데이터가 없습니다.</p>';
      summaryContainer.innerHTML = '';
      return;
    }

    renderSummaryCards(data);
    dataContainer.innerHTML = createDataTable(data);
    setupClickHandlers();
  } catch (e) {
    dataContainer.innerHTML = `<p class="error p-8">🚨 연결 오류: ${e.message}</p>`;
    summaryContainer.innerHTML = '';
    console.error('Fetch Error:', e);
  }
}

// ===============================
// 9) 시작
// ===============================
window.addEventListener('DOMContentLoaded', loadTotalReturnData);
