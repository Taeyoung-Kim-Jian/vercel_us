// app.js

// 💡 1. Supabase 환경 변수 설정
// WARNING: 보안상의 이유로 실제 키를 코드에 직접 넣는 것은 권장되지 않습니다. 
// (Vercel 환경 변수 사용을 권장합니다.) 
const SUPABASE_URL = 'https://sssmldmhcfuodutvvcqf.supabase.co'; 
// ⚠️ 여기에 Supabase 프로젝트의 'Project Settings' -> 'API' 섹션에 있는 실제 Anon Key를 붙여넣으세요.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4'; // <--- 이 부분을 실제 키로 교체해야 합니다!

// 💡 2. Supabase 클라이언트 초기화
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 차트 객체를 전역적으로 저장하여 중복 생성을 막고 업데이트하기 쉽게 합니다.
let chart = null;
let currentSeries = null;

/**
 * 데이터를 받아 HTML 테이블 문자열을 반환하는 함수
 * @param {Array<Object>} data - Supabase에서 받은 데이터 배열 (테이블 행)
 * @returns {string} 완성된 HTML 테이블 문자열
 */
function createDataTable(data) {
    if (data.length === 0) return '';

    // 첫 번째 데이터 객체의 키를 추출하여 테이블 헤더로 사용합니다.
    const headers = Object.keys(data[0]);
    
    let html = '<table><thead><tr>';
    
    // 헤더 행 생성 (<th> 태그)
    headers.forEach(h => {
        html += `<th class="whitespace-nowrap">${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    // 데이터 행 생성 (<tr> 및 <td> 태그)
    data.forEach(row => {
        html += '<tr>';
        headers.forEach(h => {
            let cellContent = row[h];
            let cellAttributes = '';

            // 종목명 컬럼에 클릭 핸들러 속성 추가
            if (h === '종목명') {
                // 클릭 이벤트 핸들러가 종목명을 식별할 수 있도록 data-속성 추가
                cellAttributes = `class="clickable-stock whitespace-nowrap" data-stock-name="${cellContent}"`; 
            } else {
                 cellAttributes = 'class="whitespace-nowrap"';
            }
            
            // 숫자 데이터에만 우측 정렬 스타일 적용
            const style = (typeof cellContent === 'number' || h.includes('수익률')) ? 'style="text-align: right;"' : '';
            
            html += `<td ${style} ${cellAttributes}>${cellContent}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

/**
 * 최고/최저 수익률 5개 종목을 카드 형식으로 렌더링합니다.
 * @param {Array<Object>} fullData - 수익률 순으로 정렬된 전체 데이터 배열
 */
function renderSummaryCards(fullData) {
    const summaryContainer = document.getElementById('summary-cards-container');
    if (!summaryContainer) return;

    // 데이터는 이미 loadTotalReturnData에서 '수익률' 내림차순으로 정렬되어 있다고 가정합니다.
    const topFive = fullData.slice(0, 5);
    const bottomFive = fullData.slice(-5).reverse(); // 최저 5개를 오름차순으로 보여주기 위해 reverse

    let html = `
        <div class="grid grid-cols-2 gap-4 sm:gap-6">
            <!-- 최고 수익률 5 -->
            <div class="bg-green-50 p-6 rounded-xl shadow-lg border border-green-200">
                <h3 class="text-lg sm:text-xl font-bold text-green-700 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    🥇 최고 수익률 Top 5
                </h3>
                ${topFive.map((item, index) => `
                    <div class="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span class="text-sm text-gray-600 font-medium">${index + 1}. ${item['종목명']}</span>
                        <span class="text-sm font-bold text-green-600">${item['수익률']}</span>
                    </div>
                `).join('')}
            </div>

            <!-- 최저 수익률 5 -->
            <div class="bg-red-50 p-6 rounded-xl shadow-lg border border-red-200">
                <h3 class="text-lg sm:text-xl font-bold text-red-700 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                    📉 최저 수익률 Bottom 5
                </h3>
                ${bottomFive.map((item, index) => `
                    <div class="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span class="text-sm text-gray-600 font-medium">${index + 1}. ${item['종목명']}</span>
                        <span class="text-sm font-bold text-red-600">${item['수익률']}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    summaryContainer.innerHTML = html;
}


/**
 * 테이블 생성 후, 종목명 셀에 클릭 이벤트를 설정합니다.
 */
function setupClickHandlers() {
    const stockCells = document.querySelectorAll('.clickable-stock');
    stockCells.forEach(cell => {
        cell.addEventListener('click', (event) => {
            const stockName = event.target.getAttribute('data-stock-name');
            if (stockName) {
                renderChart(stockName);
            }
        });
    });
}

/**
 * Lightweight Charts를 사용하여 차트를 그립니다.
 * @param {string} stockName - 클릭된 종목 이름
 */
async function renderChart(stockName) {
    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = `<p class="text-gray-500 text-center py-8">"${stockName}"의 시계열 데이터를 로드하는 중...</p>`;
    
    try {
        // Supabase 'prices' 테이블에서 종목명에 해당하는 시계열 데이터 쿼리
        // 컬럼명을 사용자님의 스키마(날짜, 시가, 고가, 저가, 종가)에 맞게 수정했습니다.
        const { data, error } = await supabaseClient
            .from('prices')
            .select('날짜, 시가, 고가, 저가, 종가') // 수정된 컬럼명 사용
            .eq('종목명', stockName) // 클릭된 종목명으로 필터링
            .order('날짜', { ascending: true }); // 날짜순으로 정렬

        if (error) {
            chartContainer.innerHTML = `<p class="error text-center py-8">❌ 차트 데이터 로딩 오류: ${error.message}</p>`;
            console.error("Supabase Chart API Error:", error);
            return;
        }

        if (data.length === 0) {
            chartContainer.innerHTML = `<p class="p-8 text-center text-yellow-600">⚠️ "${stockName}"에 대한 가격 데이터(prices 테이블)가 없습니다. '종목명' 및 '날짜' 필드가 올바른지 확인하세요.</p>`;
            return;
        }
        
        // Lightweight Charts 형식에 맞춰 데이터 매핑 및 시간 변환
        const chartData = data.map(item => ({
            // '날짜' 필드를 UNIX timestamp (초)로 변환
            time: Math.floor(new Date(item['날짜']).getTime() / 1000), 
            open: item['시가'],
            high: item['고가'],
            low: item['저가'],
            close: item['종가']
        }));

        if (chart) {
            chart.remove(); 
        }
        
        chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 400,
            layout: {
                backgroundColor: '#ffffff',
                textColor: '#333333',
            },
            grid: { vertLines: { color: '#e5e7eb' }, horzLines: { color: '#e5e7eb' } },
            rightPriceScale: { borderColor: '#e5e7eb' },
            timeScale: { borderColor: '#e5e7eb', timeVisible: true, secondsVisible: false },
            localization: { locale: 'ko-KR' }
        });

        currentSeries = chart.addCandlestickSeries({
            upColor: '#22c55e', 
            downColor: '#ef4444', 
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        currentSeries.setData(chartData);

        new ResizeObserver(entries => {
            entries.forEach(entry => {
                chart.applyOptions({ width: entry.contentRect.width });
            });
        }).observe(chartContainer);

    } catch (e) {
        chartContainer.innerHTML = `<p class="error text-center py-8">🚨 데이터 처리 중 오류 발생: ${e.message}</p>`;
        console.error("Chart Rendering Error:", e);
    }
}

/**
 * 테스트를 위한 더미 시계열 데이터 생성 함수 (이제 사용하지 않음)
 */
// function generateDummyChartData() {
//     let data = [];
//     let basePrice = 50;
//     let time = 1640995200; // 2022-01-01 시작 (Unix Timestamp)

//     for (let i = 0; i < 50; i++) {
//         const open = basePrice + Math.random() * 2 - 1;
//         const close = open + (Math.random() * 2 - 1) * 2;
//         const high = Math.max(open, close) + Math.random() * 1;
//         const low = Math.min(open, close) - Math.random() * 1;

//         data.push({
//             time: time,
//             open: open,
//             high: high,
//             low: low,
//             close: close
//         });

//         time += 86400; // 하루 증가
//         basePrice += (close - open) * 0.5 + (Math.random() * 0.5 - 0.25);
//     }
//     return data;
// }


/**
 * 3. Supabase에서 데이터 로드 및 HTML 테이블 생성
 */
async function loadTotalReturnData() {
    const dataContainer = document.getElementById('data-container');
    dataContainer.innerHTML = '<p class="text-gray-600 p-8">데이터를 불러오는 중...</p>'; // 로딩 상태 표시
    const summaryContainer = document.getElementById('summary-cards-container');
    summaryContainer.innerHTML = '<p class="text-gray-500 text-center py-4">요약 데이터를 준비하는 중...</p>';

    try {
        // 3.1. total_return 테이블에서 데이터 요청 (전체 데이터를 가져와서 요약과 테이블에 사용)
        const { data, error } = await supabaseClient
            .from('total_return')
            .select('종목명, 시작가격, 현재가격, 수익률')
            .order('수익률', { ascending: false }); // 수익률 내림차순 정렬

        if (error) {
            dataContainer.innerHTML = `<p class="error p-8">❌ 데이터 로딩 오류: ${error.message} (테이블 이름 및 스키마 확인 필요)</p>`;
            summaryContainer.innerHTML = ''; // 요약 카드 에러 메시지 제거
            console.error("Supabase API Error:", error);
            return;
        }

        if (data.length === 0) {
            dataContainer.innerHTML = '<p class="p-8">⚠️ 테이블에 데이터가 없습니다. (테이블에 행이 있는지 확인하세요)</p>';
            summaryContainer.innerHTML = ''; 
            return;
        }

        // 3.2. 요약 카드 렌더링 (Top 5 / Bottom 5)
        renderSummaryCards(data); 

        // 3.3. 전체 데이터를 HTML 테이블로 변환하여 표시
        dataContainer.innerHTML = createDataTable(data);
        
        // 테이블 생성 후 클릭 핸들러 설정
        setupClickHandlers(data); 

    } catch (e) {
        // 네트워크 또는 기타 예외 처리
        dataContainer.innerHTML = `<p class="error p-8">🚨 연결 오류 발생: ${e.message} (네트워크 및 CORS 설정 확인)</p>`;
        summaryContainer.innerHTML = '';
        console.error("General Fetch/Client Error:", e);
    }
}

// 4. 페이지 로드 시 데이터 로딩 함수 실행
window.onload = loadTotalReturnData;
