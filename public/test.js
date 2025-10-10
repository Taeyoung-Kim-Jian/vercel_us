// test.js
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || "005850";  // 기본값 에스엘
  const name = decodeURIComponent(params.get("name") || "에스엘");

  const titleEl = document.getElementById("chart-title");
  const subEl = document.getElementById("subtitle");
  const errBox = document.getElementById("error-box");
  const chartEl = document.getElementById("chart");

  document.getElementById("backBtn").addEventListener("click", () => history.back());

  // 로그 디버깅
  console.log("🔍 test.js 시작 — code:", code, "name:", name);

  // Supabase 연결 대기
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
    console.error("Supabase 초기화 실패");
    return;
  }

  titleEl.textContent = `${name} (${code})`;
  subEl.textContent = "가격 데이터를 불러오는 중...";

  // 데이터 조회
  const { data, error } = await db
    .from("prices")
    .select("날짜, 종가")
    .eq("종목코드", code)
    .order("날짜", { ascending: true });

  if (error) {
    errBox.style.display = "block";
    errBox.textContent = "데이터 로드 실패: " + error.message;
    console.error("데이터 로드 오류:", error);
    return;
  }
  if (!data || data.length === 0) {
    errBox.style.display = "block";
    errBox.textContent = "📭 데이터가 없습니다.";
    console.warn("데이터 없음 for code:", code);
    return;
  }

  // 배열 준비
  const dates = data.map(r => r["날짜"]);
  const closes = data.map(r => parseFloat(r["종가"]));

  // 요약 표시
  subEl.textContent = `${dates[0]} ~ ${dates[dates.length - 1]} (${data.length}개 날짜)`;

  // ECharts 초기화
  const chart = echarts.init(chartEl);
  const option = {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: { formatter: v => v.toLocaleString() },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
    },
    grid: { left: "6%", right: "4%", top: 40, bottom: 60 },
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
            { offset: 1, color: "rgba(37,99,235,0)" }
          ]),
        },
      },
    ],
    dataZoom: [
      { type: "inside", start: 80, end: 100 },
      { type: "slider", start: 80, end: 100 }
    ],
  };

  chart.setOption(option);
  window.addEventListener("resize", () => chart.resize());

  console.log("✅ 차트 렌더링 완료");
});
