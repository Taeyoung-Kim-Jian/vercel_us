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
 * @param {Array<Object>} data - Supabase에서 받은 데이터 배열
 * @returns {string} 완성된 HTML 테이블 문자열
 */
function createDataTable(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    
    let html = '<table><thead><tr>';
    
    // 헤더 행 생성
    headers.forEach(h => {
        html += `<th>${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    // 데이터 행 생성
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
        const { data, error } = await supabase
            .from('total_return')
            .select('*')
            // '수익률' 컬럼이 있는지 확인해주세요. 없으면 에러 발생
            .order('수익률', { ascending: false }); 

        if (error) {
            // 에러 발생 시 (대부분 RLS 또는 Policy 오류)
            dataContainer.innerHTML = `<p class="error">❌ 데이터 로딩 오류: ${error.message}</p>`;
            console.error("Supabase Error:", error);
            return;
        }

        if (data.length === 0) {
            dataContainer.innerHTML = '<p>⚠️ 테이블에 데이터가 없습니다.</p>';
            return;
        }

        // 데이터를 HTML 테이블로 변환하여 표시
        dataContainer.innerHTML = createDataTable(data);
        
    } catch (e) {
        // 네트워크 또는 기타 예외 처리
        dataContainer.innerHTML = `<p class="error">🚨 알 수 없는 오류 발생: ${e.message}</p>`;
        console.error("General Error:", e);
    }
}

// 4. 페이지 로드 시 데이터 로딩 함수 실행
window.onload = loadTotalReturnData;
