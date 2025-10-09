
document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://sssmldmhcfuodutvvcqf.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc21sZG1oY2Z1b2R1dHZ2Y3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDc2MjUsImV4cCI6MjA3NTA4MzYyNX0.zxw9Hr9Mz9fuV9VIpFcISe-62kary1WABTrOnYZiIN4";

  const { createClient } = window.supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const name = params.get("name");

  const chartEl = document.getElementById("chart");
  const infoEl = document.getElementById("detail-info");
  const errorBox = document.getElementById("error-box");

  // 🚫 접근 제한: URL 파라미터 없을 경우 진입 차단
  if (!code || !name) {
    chartEl.style.display = "none";
    infoEl.style.display = "none";
    errorBox.style.display = "block";
    return;
  }

  // ✅ 정상 접근 시 차트 로딩
  const chart = echarts.init(chartEl);
  chart.showLoading("default", { text: "차트 데이터를 불러오는 중..." });

  try {
    const { data, error } = await db
      .from("prices")
      .select("날짜, 시가, 고가, 저가, 종가")
      .eq("종목코드", code)
      .order("날짜", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      infoEl.textContent = "데이터가 없습니다.";
      chart.hideLoading();
      return;
    }

    infoEl.textContent = `총 ${data.length}개 데이터 로드됨`;

    const dates = data.map((d) => d.날짜);
    const ohlc = data.map((d) => [+d.시가, +d.종가, +d.저가, +d.고가]);

    const option = {
      title: {
        text: `${name} (${code})`,
        left: "center",
        textStyle: { fontSize: 14 },
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

    chart.hideLoading();
    chart.setOption(option);
  } catch (err) {
    console.error("❌ 차트 로딩 오류:", err);
    infoEl.textContent = "데이터 로딩 실패";
  }

  window.addEventListener("resize", () => chart.resize());
});
