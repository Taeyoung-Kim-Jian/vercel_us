document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const name = decodeURIComponent(params.get("name") || "종목");

  document.getElementById("chart-title").textContent = `📊 ${name} (${code})`;

  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  let db;
  for (let i = 0; i < 25; i++) {
    if (window.SWINGINV?.db) { db = SWINGINV.db; break; }
    await wait(200);
  }
  if (!db) return alert("❌ Supabase 초기화 실패");

  const { data, error } = await db
    .from("prices")
    .select("날짜, 종가")
    .eq("종목코드", code)
    .order("날짜", { ascending: true });

  if (error || !data?.length) {
    document.getElementById("chart").innerHTML = "<p style='text-align:center;'>⚠️ 데이터 없음</p>";
    return;
  }

  const dates = data.map(d => d.날짜);
  const closes = data.map(d => parseFloat(d.종가));

  const chart = echarts.init(document.getElementById("chart"));
  chart.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: dates, boundaryGap: false },
    yAxis: { type: "value", scale: true },
    series: [{
      type: "line",
      name: "종가",
      data: closes,
      smooth: true,
      lineStyle: { color: "#2563eb", width: 2 },
      areaStyle: { color: "rgba(37,99,235,0.08)" }
    }]
  });

  window.addEventListener("resize", () => chart.resize());
  document.getElementById("backBtn").addEventListener("click", () => history.back());
});
