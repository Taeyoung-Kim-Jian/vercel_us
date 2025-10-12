// 📈 detail_combined.js
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || "005850";  // 기본값
  const name = decodeURIComponent(params.get("name") || "에스엘");

  const titleEl = document.getElementById("chart-title");
  const subEl = document.getElementById("subtitle");
  const errBox = document.getElementById("error-box");
  const chartEl = document.getElementById("chart");
  const toggleBEl = document.getElementById("toggleB");
  const watchToggleEl = document.getElementById("watchToggle");

  document.getElementById("backBtn").addEventListener("click", () => history.back());
  titleEl.textContent = `${name} (${code})`;
  subEl.textContent = "가격 데이터를 불러오는 중...";

  // Supabase 연결 대기
  let db;
  for (let i = 0; i < 20; i++) {
    if (window.SWINGINV?.db) { db = SWINGINV.db; break; }
    await new Promise(r => setTimeout(r, 200));
  }
  if (!db) {
    errBox.style.display = "block";
    errBox.textContent = "❌ Supabase 초기화 실패";
    return;
  }

  // 로그인 세션
  const { data: { session } } = await db.auth.getSession();
  const user = session?.user || null;
  if (user) SWINGINV.user = user;

  try {
    // 1️⃣ 가격 데이터
    const { data: priceData, error: priceError } = await db
      .from("prices")
      .select("날짜, 종가")
      .eq("종목코드", code)
      .order("날짜", { ascending: true });

    if (priceError) throw priceError;
    if (!priceData || priceData.length === 0) {
      subEl.textContent = "📭 가격 데이터가 없습니다.";
      return;
    }
    const dates = priceData.map(r => r.날짜);
    const closes = priceData.map(r => parseFloat(r.종가));

    // 2️⃣ B가격 데이터
    const { data: btData } = await db
      .from("bt_points_test")
      .select("b가격")
      .eq("종목코드", code)
      .order("순번", { ascending: true });

    const bPrices = (btData || [])
      .map(r => parseFloat(r.b가격))
      .filter(v => !isNaN(v));

    subEl.textContent = `${dates[0]} ~ ${dates[dates.length - 1]} (${priceData.length}개 날짜)`;

    // 3️⃣ ECharts 초기화
    const chart = echarts.init(chartEl);

    let showBLines = true;
    const getMarkLineData = () => showBLines
      ? bPrices.map(price => ({
          yAxis: price,
          lineStyle: { color: "#22c55e", type: "dashed", width: 1.5 },
          label: { show: false } // 평소에는 라벨 숨김
        }))
      : [];

    const option = {
      tooltip: {
        trigger: "axis",
        formatter: params => {
          const main = params.find(p => p.seriesId === "main-series");
          const bLine = params.find(p => p.seriesId === "b-series");
          let text = "";
          if (main) text += `날짜: ${main.axisValue}<br>종가: ${main.data.toLocaleString()}`;
          if (bLine) text += `<br>B가격: ${bLine.value.toLocaleString()}`;
          return text;
        }
      },
      xAxis: { type: "category", data: dates, boundaryGap: false, axisLabel: { rotate: 45, fontSize: 10 } },
      yAxis: { type: "value", scale: true, axisLabel: { formatter: v => v.toLocaleString() }, splitLine: { lineStyle: { color: "#e2e8f0" } } },
      grid: { left: "6%", right: "4%", top: 40, bottom: 60 },
      dataZoom: [{ type: "inside", start: 80, end: 100 }, { type: "slider", start: 80, end: 100 }],
      series: [
        {
          id: "main-series",
          name: "종가",
          type: "line",
          data: closes,
          smooth: true,
          symbol: "none",
          lineStyle: { color: "#2563eb", width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0,0,0,1,[
              { offset: 0, color: "rgba(37,99,235,0.3)" },
              { offset: 1, color: "rgba(37,99,235,0)" }
            ])
          }
        },
        {
          id: "b-series",
          type: "line",
          data: closes.map(() => null),
          markLine: { symbol: "none", tooltip: { formatter: params => `B가격: ${params.value}` }, data: getMarkLineData() }
        }
      ]
    };

    chart.setOption(option);
    window.addEventListener("resize", () => chart.resize());

    // ✅ B가격 토글
    toggleBEl?.addEventListener("change", e => {
      showBLines = e.target.checked;
      chart.setOption({ series: [{ id: "b-series", markLine: { data: getMarkLineData() } }] }, false, true);
    });

    // ✅ 관심종목 토글
    if (user) {
      const { data: exist } = await db.from("watchlist").select("id").eq("user_id", user.id).eq("종목코드", code).maybeSingle();
      if (exist) watchToggleEl.checked = true;
    }

    watchToggleEl?.addEventListener("change", async e => {
      if (!SWINGINV.user) { alert("🔐 로그인 후 이용해주세요."); e.target.checked = false; return; }
      const latestPrice = closes[closes.length - 1];
      const nickname = (await db.from("profiles").select("nickname").eq("id", SWINGINV.user.id).single()).data?.nickname;
      if (e.target.checked) {
        const { error } = await db.from("watchlist").insert({
          user_id: SWINGINV.user.id,
          닉네임: nickname || "익명",
          종목명: name,
          종목코드: code,
          등록일: new Date().toISOString(),
          등록종가: latestPrice,
          공개여부: true
        });
        if (error) alert("❌ 등록 실패: " + error.message);
        else alert("⭐ 관심종목으로 등록되었습니다!");
      } else {
        if (confirm("🗑️ 관심종목에서 삭제하시겠습니까?")) {
          await db.from("watchlist").delete().eq("user_id", SWINGINV.user.id).eq("종목코드", code);
          alert("🗑️ 삭제되었습니다.");
        } else e.target.checked = true;
      }
    });

    console.log("✅ 차트 렌더링 완료");

  } catch (err) {
    console.error("❌ 오류:", err);
    errBox.style.display = "block";
    errBox.textContent = "데이터 로드 실패";
  }
});
