/* ==========================================================
   📈 detail.js — ECharts + Supabase (스크롤 정상 버전)
   ========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const name = urlParams.get("name");

  const chartEl = document.getElementById("chart");
  const titleEl = document.getElementById("chart-title");
  const subEl = document.getElementById("chart-sub");
  const errorBox = document.getElementById("error-box");

  if (!code) {
    chartEl.style.display = "none";
    errorBox.style.display = "block";
    return;
  }

  titleEl.textContent = `📈 ${name || "종목"} (${code})`;

  const db = SWINGINV.db;
  const chart = echarts.init(chartEl);

  try {
    // 1️⃣ prices 데이터 페이징 로딩
    let allPrices = [];
    const pageSize = 1000;
    let from = 0, to = pageSize - 1, done = false;

    while (!done) {
      const { data, error } = await db
        .from("prices")
        .select("날짜, 종가")
        .eq("종목코드", code)
        .order("날짜", { ascending: true })
        .range(from, to);

      if (error) throw error;
      if (!data?.length) done = true;
      else {
        allPrices = allPrices.concat(data);
        if (data.length < pageSize) done = true;
        from += pageSize;
        to += pageSize;
      }
    }

    if (!allPrices.length) {
      subEl.textContent = "📭 가격 데이터가 없습니다.";
      return;
    }

    // 2️⃣ bt_points 데이터 로딩
    let allBt = [];
    from = 0; to = pageSize - 1; done = false;

    while (!done) {
      const { data, error } = await db
        .from("bt_points")
        .select("b가격, 생성일")
        .eq("종목코드", code)
        .order("생성일", { ascending: true })
        .range(from, to);

      if (error) throw error;
      if (!data?.length) done = true;
      else {
        allBt = allBt.concat(data);
        if (data.length < pageSize) done = true;
        from += pageSize;
        to += pageSize;
      }
    }

    // ✅ 데이터 정리
    const dates = allPrices.map((d) => d.날짜);
    const closePrices = allPrices.map((d) => parseFloat(d.종가));
    const bLines = Array.from(new Set(allBt.map((b) => parseFloat(b.b가격))));

    // ✅ 차트 옵션
    let showBLines = true;
    const baseOption = {
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const item = params[0];
          return `${item.axisValue}<br/>가격: <b>${item.data.toLocaleString()}</b>`;
        },
      },
      grid: { left: 60, right: 20, top: 40, bottom: 60 },
      xAxis: {
        type: "category",
        data: dates,
        boundaryGap: false,
        axisLabel: { color: "#555" },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: { color: "#555" },
      },
      series: [
        {
          name: "종가",
          type: "line",
          data: closePrices,
          smooth: true,
          lineStyle: { color: "#2563eb", width: 2 },
          areaStyle: { color: "rgba(37,99,235,0.08)" },
        },
      ],
      dataZoom: [
        { type: "inside", zoomOnMouseWheel: true, moveOnMouseMove: true },
        { type: "slider", bottom: 10 }
      ],
    };
