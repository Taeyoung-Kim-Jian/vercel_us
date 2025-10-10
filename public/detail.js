/* ==========================================================
   📈 detail.js — ECharts + Supabase (페이징 + B가격 토글)
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
    /* --------------------------
       1️⃣ prices 데이터 페이징 로딩
    --------------------------- */
    let allPrices = [];
    const pageSize = 1000;
    let from = 0;
    let to = pageSize - 1;
    let done = false;

    while (!done) {
      const { data, error } = await db
        .from("prices")
        .select("날짜, 종가")
        .eq("종목코드", code)
        .order("날짜", { ascending: true })
        .range(from, to);

      if (error) throw error;
      if (!data || data.length === 0) done = true;
      else {
        allPrices = allPrices.concat(data);
        if (data.length < pageSize) done = true;
        from += pageSize;
        to += pageSize;
      }
    }

    if (allPrices.length === 0) {
      subEl.textContent = "📭 가격 데이터가 없습니다.";
      return;
    }

    /* --------------------------
       2️⃣ bt_points 데이터 페이징 로딩
    --------------------------- */
    let allBt = [];
    from = 0;
    to = pageSize - 1;
    done = false;

    while (!done) {
      const { data, error } = await db
        .from("bt_points")
        .select("b가격, 생성일")
        .eq("종목코드", code)
        .order("생성일", { ascending: true })
        .range(from, to);

      if (error) throw error;
      if (!data || data.length === 0) done = true;
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
    const bLines = Array.from(new Set(allBt?.map((b) => parseFloat(b.b가격)) || []));

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
          areaStyle: { color: "rgba(37,99,235,0.08)" },
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

    /* --------------------------
       ✅ UI 구성 변경
    --------------------------- */

    // 🔹 차트 왼쪽 위에 B가격 토글
    const toolbar = document.createElement("div");
    toolbar.style.display = "flex";
    toolbar.style.justifyContent = "space-between";
    toolbar.style.alignItems = "center";
    toolbar.style.margin = "10px 0";

    toolbar.innerHTML = `
      <div style="font-size:14px;">
        <label style="cursor:pointer;">
          <input type="checkbox" id="toggleB" checked style="transform:scale(1.1);margin-right:5px;">
          B가격 표시
        </label>
      </div>
      <button id="backBtn" class="back-btn" style="
        background:#2563eb;
        color:white;
        border:none;
        border-radius:6px;
        padding:6px 12px;
        font-size:13px;
        cursor:pointer;
      ">← 뒤로가기</button>
    `;

    chartEl.parentNode.insertBefore(toolbar, chartEl);

    // ✅ 이벤트 연결
    document.getElementById("toggleB").addEventListener("change", (e) => {
      showBLines = e.target.checked;
      updateBLines();
    });

    document.getElementById("backBtn").addEventListener("click", () => history.back());

    // ✅ 차트 렌더링
    updateBLines();

    // ✅ 반응형 리사이즈
    window.addEventListener("resize", () => chart.resize());
  } catch (err) {
    console.error("❌ 차트 로딩 오류:", err);
    subEl.textContent = "⚠️ 차트를 불러오지 못했습니다.";
  }
});
