// test.js
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || "005850"; // 기본값: 에스엘
  const name = decodeURIComponent(params.get("name") || "에스엘");

  const titleEl = document.getElementById("chart-title");
  const subEl = document.getElementById("subtitle");
  const errBox = document.getElementById("error-box");
  const chartEl = document.getElementById("chart");

  document.getElementById("backBtn").addEventListener("click", () => history.back());

  // ✅ Supabase 연결 대기
  let db;
  for (let i = 0; i < 20; i++) {
    if (window.SWINGINV?.db) {
      db = SWINGINV.db;
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  if (!db) {
    errBox.style.display = "block";
    errBox.textContent = "❌ Supabase 초기화 실패";
    return;
  }

  titleEl.textContent = `${name} (${code}) 차트`;
  subEl.textContent = "가격 데이터를 불러오는 중...";

  // ✅ 가격 데이터 가져오기
  const { data, error } = await db
    .from("prices")
    .select("날짜, 종가")
    .eq("종목코드", code)
    .order("날짜", { ascending: true });

  if (error) {
    errBox.style.display = "block";
    errBox.textContent = "데이터 로드 실패: " + error.message;
    return;
  }

  if (!data?.length) {
    errBox.style.display = "block";
    errBox.textContent = "📭 데이터가 없습니다.";
    return;
  }

  // ✅ 차트 데이터 준비
  const dates = data.map(r => r["날짜"]);
  const closes = data.map(r => r["종가"]);

  subEl.textContent = `${dates[0]} ~ ${dates[dates.length - 1]} (${data.length}일치 데이터)`;

  // ✅ ECharts 초기화
  const chart = echarts.init(chartEl);
  const option = {
    backgroundColor: "#fff",
    tooltip: { trigger: "axis" },
    grid: { left: "6%", right: "4%", top: 60, bottom: 60 },
    title: {
      text: `${name} (${code}) 일봉 차트`,
      left: "center",
      top: 10,
      textStyle: { fontSize: 16, fontWeight: 600 },
    },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { rotate: 45, fontSize: 10 },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: {
        formatter: value => value.toLocaleString(),
      },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
    },
    series: [
      {
        name: "종가",
        type: "line",
        data: closes,
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#2563eb", width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(37,99,235,0.3)" },
            { offset: 1, color: "rgba(37,99,235,0)" },
          ]),
        },
      },
    ],
    dataZoom: [
      { type: "inside", start: 80, end: 100 },
      { type: "slider", start: 80, end: 100 },
    ],
  };

  chart.setOption(option);
  window.addEventListener("resize", () => chart.resize());
});
