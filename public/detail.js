/* ==========================================================
   📈 detail.js — ECharts + Supabase + B가격 토글 + 관심종목
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
    // 1️⃣ prices 데이터 로드 (페이징)
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

    // 2️⃣ bt_points 데이터 로드
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

    // ✅ 기본 옵션
    let showBLines = true;
    const baseOption = {
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const item = params[0];
          return `${item.axisValue}<br/>가격: <b>${item.data.toLocaleString()}</b>`;
        },
      },
      grid: { left: 60, right: 20, top: 40, bottom: 80 },
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
      dataZoom: [
        { type: "inside", zoomOnMouseWheel: true, moveOnMouseMove: true },
        { type: "slider", bottom: 20 }
      ],
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

    // ✅ B가격 라인 표시 함수
    const updateBLines = () => {
      if (!showBLines || !bLines.length) {
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

      chart.setOption({
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
      }, true);
    };

    // ✅ UI — B가격 토글 추가
    const toolbar = document.createElement("div");
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      margin: 8px 0 6px 0;
      font-size: 13px;
    `;
    toolbar.innerHTML = `
      <label style="cursor:pointer; color:#333;">
        <input type="checkbox" id="toggleB" checked
          style="transform:scale(1.1); margin-right:5px;">
        B가격 표시
      </label>
    `;
    chartEl.parentNode.insertBefore(toolbar, chartEl);

    // ✅ 이벤트 연결
    document.getElementById("toggleB").addEventListener("change", (e) => {
      showBLines = e.target.checked;
      updateBLines();
    });

    // ✅ 데이터 로드 완료 후 메시지 제거
    subEl.textContent = "";
    updateBLines();

    // ✅ 리사이즈 안정화
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => chart.resize(), 300);
    });

    /* =====================================================
       ⭐ 관심종목 등록 기능
    ===================================================== */
    const watchToggle = document.getElementById("watchlistToggle");
    if (watchToggle) {
      const user = SWINGINV.user;

      // 🔹 로그인된 유저가 이미 등록했는지 확인
      if (user) {
        const { data: existing } = await db
          .from("watchlist")
          .select("id")
          .eq("user_id", user.id)
          .eq("종목코드", code)
          .maybeSingle();

        if (existing) watchToggle.checked = true;
      }

      // 🔹 체크박스 클릭 이벤트
      watchToggle.addEventListener("change", async (e) => {
        const checked = e.target.checked;
        const user = SWINGINV.user;

        if (!user) {
          alert("로그인 후 이용할 수 있습니다.");
          e.target.checked = false;
          return;
        }

        if (checked) {
          try {
            const { data: latestPrice, error: priceErr } = await db
              .from("prices")
              .select("종가, 날짜")
              .eq("종목코드", code)
              .order("날짜", { ascending: false })
              .limit(1)
              .single();

            if (priceErr || !latestPrice) {
              alert("가격 정보를 불러올 수 없습니다.");
              e.target.checked = false;
              return;
            }

            const { data: profile } = await db
              .from("profiles")
              .select("nickname")
              .eq("id", user.id)
              .single();

            const nickname = profile?.nickname || "익명";

            const { error: insertErr } = await db.from("watchlist").insert([
              {
                user_id: user.id,
                닉네임: nickname,
                종목명: name,
                종목코드: code,
                등록일: new Date().toISOString().split("T")[0],
                등록종가: parseFloat(latestPrice.종가),
                공개여부: false,
              },
            ]);

            if (insertErr) throw insertErr;
            alert(`✅ ${name}이(가) 관심종목에 추가되었습니다!`);
          } catch (err) {
            console.error("❌ 관심종목 등록 오류:", err);
            alert("등록 중 오류가 발생했습니다.");
            e.target.checked = false;
          }
        } else {
          const { error } = await db
            .from("watchlist")
            .delete()
            .eq("user_id", user.id)
            .eq("종목코드", code);

          if (error) console.error(error);
          else alert(`❎ ${name}이(가) 관심종목에서 제거되었습니다.`);
        }
      });
    }

  } catch (err) {
    console.error("❌ 차트 로딩 오류:", err);
    subEl.textContent = "⚠️ 차트를 불러오지 못했습니다.";
  }
});
