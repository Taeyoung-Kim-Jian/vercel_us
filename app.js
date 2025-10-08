// app.js

// 💡 1. Supabase 환경 변수 설정
// Vercel에서 데이터 조회를 시작하려면 이 키와 URL이 정확해야 합니다.
const SUPABASE_URL = 'https://sssmldmhcfuodutvvcqf.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4'; 

// 💡 2. Supabase 클라이언트 초기화
// index.html에서 로드한 Supabase SDK를 통해 전역 'supabase' 객체에 접근합니다.
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        html += `<th>${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    // 데이터 행 생성 (<tr> 및 <td> 태그)
    data.forEach(row => {
        html += '<tr>';
        headers.forEach(h => {
            // 숫자 데이터에만 우측 정렬 스타일 적용
            const style = (typeof row[h] === 'number' || h.includes('수익률')) ? 'style="text-align: right;"' : '';
            html += `<td ${style}>${row[h]}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}


/**
 * 3. Supabase에서 데이터 로드 및 HTML 테이블 생성
 */
async function loadTotalReturnData() {
    const dataContainer = document.getElementById('data-container');
    dataContainer.innerHTML = '데이터를 불러오는 중...'; // 로딩 상태 표시

    try {
        // total_return 테이블에서 데이터 요청
        // 컬럼 이름 불일치로 인한 오류를 피하기 위해, 정렬 조건을 잠시 제거하고 전체 데이터를 가져와 봅니다.
        const { data, error } = await supabase
            .from('total_return')
            .select('*'); 

        if (error) {
            // 에러 발생 시: RLS가 비활성화되었다면, 이 에러는 테이블 이름 오류 또는 스키마 오류일 수 있습니다.
            dataContainer.innerHTML = `<p class="error">❌ 데이터 로딩 오류: ${error.message} (테이블 이름 및 스키마 확인 필요)</p>`;
            console.error("Supabase API Error:", error);
            return;
        }

        if (data.length === 0) {
            dataContainer.innerHTML = '<p>⚠️ 테이블에 데이터가 없습니다. (테이블에 행이 있는지 확인하세요)</p>';
            return;
        }

        // 데이터를 HTML 테이블로 변환하여 표시
        dataContainer.innerHTML = createDataTable(data);
        
    } catch (e) {
        // 네트워크 또는 기타 예외 처리 (CORS 문제, 클라이언트 초기화 실패 등)
        dataContainer.innerHTML = `<p class="error">🚨 연결 오류 발생: ${e.message} (네트워크 및 CORS 설정 확인)</p>`;
        console.error("General Fetch/Client Error:", e);
    }
}

// 4. 페이지 로드 시 데이터 로딩 함수 실행
window.onload = loadTotalReturnData;
