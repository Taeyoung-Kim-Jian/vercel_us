/* =========================================================
   📈 ECONews detail.js (페이징 + 전체 데이터 로드)
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const name = urlParams.get("name");

  if (!code) {
    document.body.innerHTML = "<h2>❌ 종목 코드가 없습니다.</h2>";
    return;
  }

  const chartEl = document.getElementById("chart");
  chartEl.innerHTML = `<div style="padding:20px; text-align:center;">⏳ 데이터 불러오는 중...</div>`;

  try {
    // ✅ Supabase 페이징 유틸 (1000개씩 전체 가져오기)
    async function fetchAllRows(builderFactory, pageSize = 1000) {
      const all = [];
      let from = 0;
      while (true) {
        const to = from + pageSize - 1;
        const { data, error } = await builderFactory().range(from, to);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < pageSize) break; // 마지막 페이지
        from += pageSize;
      }
      return all;
    }

    // ✅ 전체 price 데이터 불러오기 (한국 컬럼명 기준)
    const allData = await fetchAllRows(() =>
      ECONews.db
        .from("prices")
        .select("날짜, 시가, 고가, 저가, 종가")
        .eq("종목코드", code)
        .order("날짜", { ascending: true })
    );

    if (!allData || allData.length === 0) {
      chartEl.innerHTML = `<p style="text-align:center; color:#999;">데이터가 없습니다.</p>`;
      return;
    }

    // ✅ ECharts 차트 생성
    const dates = allData.map((d) => d.날짜);
    const prices = allData.map((d) => [
      d.시가,
      d.종가,
      d.저가,
      d.고가,
    ]);

    const chart = echarts.init(chartEl);

    chart.setOption({
      title: {
        text: `${name || code}`,
        left: "center",
        textStyle: { fontSize: 14, fontWeight: 600 },
      },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: dates,
        boundaryGap: true,
      },
      yAxis: { scale: true },
      dataZoom: [{ type: "inside" }, { type: "slider" }],
      series: [
        {
          type: "candlestick",
          data: prices,
          itemStyle: {
            color: "#22c55e",
            color0: "#ef4444",
            borderColor: "#22c55e",
            borderColor0: "#ef4444",
          },
        },
      ],
    });

    chart.resize();
    window.addEventListener("resize", () => chart.resize());
  } catch (e) {
    console.error(e);
    chartEl.innerHTML = `<p style="color:red; text-align:center;">❌ 데이터 불러오기 실패: ${e.message}</p>`;
  }
});
