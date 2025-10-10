/* ==========================================================
   📈 detail.js — ECharts + Supabase (B가격 표시 토글)
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

  // ✅ ECharts 초기화
  const chart = echarts.init(chartEl);

  // ✅ Supabase 연결
  const db = SWINGINV.db;

  try {
    // 1️⃣ prices 테이블 데이터 가져오기
    const { data: prices, error: priceErr } = await db
      .from("prices")
      .select("날짜, 종가")
      .eq("종목코드", code)
      .order("날짜", { ascending: true });

    if (priceErr) throw priceErr;
    if (!prices || prices.length === 0) {
      subEl.textContent = "📭 가격 데이터가 없습니다.";
      return;
    }

    // 2️⃣ bt_points 테이블의 B가격 데이터 가져오기
    const { data: btPoints, error: btErr } = await db
      .from("bt_points")
      .select("b가격, 발생일")
      .eq("종목코드", code)
      .order("발생일", { ascending: true });

    if (btErr) throw btErr;

    subEl.textContent = `데이터 ${prices.length}건 로드 완료`;

    const dates = prices.map((d) => d.날짜);
    const closePrices = prices.map((d) => parseFloat(d.종가));

    // B가격들을 고유하게 정리 (중복 제거)
    const bLines = Array.from(new Set(btPoints?.map((b) => parseFloat(b.b가격)) || []));

    // ✅ 기본 차트 옵션
    let showBLines = true;
    const baseOption = {
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const item = params[0];
          return `${item.axisValue}<br/>가격: <b>${item.data.toLocaleString()}</b>`;
        },
      },
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
      grid: { left: 60, right: 20, top: 40, bottom: 60 },
      series: [
        {
          name: "종가",
          type: "line",
          data: closePrices,
          smooth: true,
          lineStyle: { color: "#2563eb", width: 2 },
          areaStyle: {
            color: "rgba(37,99,235,0.08)",
          },
        },
      ],
    };

    // ✅ B가격 라인 적용 함수
    const updateBLines = () => {
      if (!showBLines || bLines.length === 0) {
        chart.setOption(baseOption, true);
        return;
      }

      const markLines = bLines.map((b) => ({
        yAxis: b,
        lineStyle: { color: "#e11d48", type: "dashed" },
        label: {
          formatter: `B ${b.toLocaleString()}`,
          color: "#e11d48",
          position: "end",
        },
      }));

      chart.setOption(
        {
          ...baseOption,
          series: [
            {
              ...baseOption.series[0],
              markLine: {
                symbol: "none",
                label: { show: true },
                data: markLines,
              },
            },
          ],
        },
        true
      );
    };

    // ✅ 초기 렌더링
    updateBLines();

    // ✅ 토글 버튼 추가
    const toggleContainer = document.createElement("div");
    toggleContainer.style.textAlign = "center";
    toggleContainer.style.margin = "10px 0";

    toggleContainer.innerHTML = `
      <label style="font-size:14px;cursor:pointer;">
        <input type="checkbox" id="toggleB" checked style="transform:scale(1.2);margin-right:6px;">
        B가격 표시
      </label>
    `;
    chartEl.parentNode.insertBefore(toggleContainer, chartEl);

    document.getElementById("toggleB").addEventListener("change", (e) => {
      showBLines = e.target.checked;
      updateBLines();
    });

    // ✅ 리사이즈 대응
    window.addEventListener("resize", () => chart.resize());
  } catch (err) {
    console.error("❌ 차트 로딩 오류:", err);
    subEl.textContent = "⚠️ 차트를 불러오지 못했습니다.";
  }
});
