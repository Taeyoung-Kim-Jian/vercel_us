// app.js

// 💡 1. Supabase 환경 변수 설정
// 이 키는 공개 키(Anon Key)이므로 클라이언트 코드에 포함해도 안전합니다.
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; 
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// 💡 2. Supabase 클라이언트 초기화
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 3. Supabase에서 데이터 로드 및 HTML 테이블 생성
 */
async function loadTotalReturnData() {
    const dataContainer = document.getElementById('data-container');
    
    // 3.1. total_return 테이블에서 데이터 요청 (수익률 내림차순 정렬 예시)
    const { data, error } = await supabase
        .from('total_return')
        .select('*') // 모든 컬럼을 선택합니다.
        .order('수익률', { ascending: false }); // '수익률' 컬럼이 있다고 가정

    if (error) {
        dataContainer.innerHTML = `<p style="color:red;">❌ 데이터 로딩 오류: ${error.message}</p>`;
        console.error("Supabase Error:", error);
        return;
    }

    if (data.length === 0) {
        dataContainer.innerHTML = '<p>⚠️ 테이블에 데이터가 없습니다.</p>';
        return;
    }
    
    // 3.2. 데이터를 HTML 테이블로 변환
    dataContainer.innerHTML = createDataTable(data);
}

/**
 * 데이터를 받아 HTML 테이블 문자열을 반환하는 함수
 * @param {Array<Object>} data - Supabase에서 받은 데이터 배열
 */
function createDataTable(data) {
    if (data.length === 0) return '';

    // 테이블 헤더 (첫 번째 객체의 키를 사용)
    const headers = Object.keys(data[0]);
    let html = '<table><thead><tr>';
    headers.forEach(h => {
        html += `<th>${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    // 테이블 본문 (데이터 행)
    data.forEach(row => {
        html += '<tr>';
        headers.forEach(h => {
            html += `<td>${row[h]}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

// 4. 페이지 로드 시 데이터 로딩 함수 실행
loadTotalReturnData();
