/* =========================================================
   📈 detail.js
   - 종목 클릭 시 detail.html 로드
   - Supabase prices 테이블에서 시세 가져와 ECharts 표시
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const name = params.get("name");

  const chartEl = document.getElementById("chart");
  const titleEl = document.getElementById("chart-title");
  const subEl = document.getElementById("chart-sub");
  const errorBox = document.getElementById("error-box");

  // 🚫 파라미터 누락 시 접근 차단
  if (!code || !name) {
    chartEl.style.display = "none";
    subEl.style.display = "none";
    errorBox.style.display = "block";
    return;
  }

  // ✅ 차트 제목
  titleEl.textContent = `📊 ${name} (${code})`;

  // ✅ ECharts 초기화
  const chart = echarts.init(chartEl);
  chart.showLoading("default", { text: "차트 데이터를 불러오는 중..." });

  try {
    // ✅ Supabase prices 테이블에서 데이터 조회
    const { data, error } = await ECONews.db
      .from("prices")
      .select("날짜, 시가, 고가, 저가, 종가")
      .eq("종목코드", code)
      .order("날짜", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      subEl.textContent = "📭 데이터가 없습니다.";
      chart.hideLoading();
      return;
    }

    // ✅ 날짜 / 가격 배열 생성
    const dates = data.map((d) => d.날짜);
    const ohlc = data.map((d) => [+d.시가, +d.종가, +d.저가, +d.고가]);

    // ✅ ECharts 옵션
    const option = {
      title: {
        text: `${name} (${code})`,
        left: "center",
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 20, top: 60, bottom: 40 },
      xAxis: { type: "category", data: dates, boundaryGap: true },
      yAxis: { scale: true },
      dataZoom: [{ type: "inside" }, { type: "slider" }],
      series: [
        {
          type: "candlestick",
          data: ohlc,
          itemStyle: {
            color: "#22c55e",
            color0: "#ef4444",
            borderColor: "#22c55e",
            borderColor0: "#ef4444",
          },
        },
      ],
    };

    // ✅ 차트 렌더링
    chart.hideLoading();
    chart.setOption(option);
    subEl.textContent = `총 ${data.length}개 데이터 로드됨`;
  } catch (err) {
    console.error("❌ 차트 로딩 오류:", err);
    subEl.textContent = "데이터 로딩 실패";
  }

  // ✅ 반응형
  window.addEventListener("resize", () => chart.resize());
});
