// test.js
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || "005850";  // 기본값: 에스엘
  const name = decodeURIComponent(params.get("name") || "에스엘");

  const titleEl = document.getElementById("chart-title");
  const subEl = document.getElementById("subtitle");
  const errBox = document.getElementById("error-box");
  const chartEl = document.getElementById("chart");

  document.getElementById("backBtn").addEventListener("click", () => history.back());

  console.log("🔍 test.js 시작 — code:", code, "name:", name);

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
    console.error("Supabase 초기화 실패");
    return;
  }

  titleEl.textContent = `${name} (${code})`;
  subEl.textContent = "가격 데이터를 불러오는 중...";

  // ✅ 1️⃣ prices 테이블에서 종가 조회
  const { data: priceData, error: priceError } = await db
    .from("prices")
    .select("날짜, 종가")
    .eq("종목코드", code)
    .order("날짜", { ascending: true });

  if (priceError) {
    errBox.style.display = "block";
    errBox.textContent = "데이터 로드 실패: " + priceError.message;
    console.error("데이터 로드 오류:", priceError);
    return;
  }

  if (!priceData || priceData.length === 0) {
    errBox.style.display = "block";
    errBox.textContent = "📭 가격 데이터가 없습니다.";
    return;
  }

  const dates = priceData.map(r => r["날짜"]);
  const closes = priceData.map(r => parseFloat(r["종가"]));

  // ✅ 2️⃣ bt_points_test 테이블에서 b가격 조회
  const { data: btData, error: btError } = await db
    .from("bt_points_test")
    .select("b가격")
    .eq("종목코드", code)
    .order("순번", { ascending: true });

  if (btError) {
    console.warn("⚠️ bt_points_test 불러오기 오류:", btError);
  }

  // b가격 값들
  const bPrices = (btData || [])
    .map(r => parseFloat(r["b가격"]))
    .filter(v => !isNaN(v));

  console.log(`📊 b가격 ${bPrices.length}개 로드됨`);

  subEl.textContent = `${dates[0]} ~ ${dates[dates.length - 1]} (${priceData.length}개 날짜)`;


  // ✅ ECharts 초기화
  const chart = echarts.init(chartEl);

  // ✅ 수평선(line) 표시용 markLine 데이터 생성
  const markLineData = bPrices.map(price => ({
    yAxis: price,
    lineStyle: {
      color: "#22c55e",
      type: "dashed",
      width: 1.5
    },
    label: {
      show: true,
      formatter: `B: ${price.toLocaleString()}`,
      position: "insideEndTop",
      color: "#22c55e",
      fontSize: 10
    }
  }));

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
        markLine: {
          symbol: "none",
          data: markLineData,
        }
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
