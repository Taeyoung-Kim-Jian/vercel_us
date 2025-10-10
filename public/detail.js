// detail.js — scroll / zoom 완전 정상 + 관심종목 & B가격 포함
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const name = decodeURIComponent(params.get("name") || "종목");

  const titleEl = document.getElementById("chart-title");
  const subEl = document.getElementById("subtitle");
  const errBox = document.getElementById("error-box");
  const chartEl = document.getElementById("chart");

  document.getElementById("backBtn").addEventListener("click", () => history.back());

  titleEl.textContent = `📈 ${name} (${code || "?"})`;
  subEl.textContent = "가격 데이터를 불러오는 중...";

  // ✅ Supabase 로드 대기
  let db;
  for (let i = 0; i < 25; i++) {
    if (window.SWINGINV?.db) { db = SWINGINV.db; break; }
    await new Promise(r => setTimeout(r, 200));
  }
  if (!db) {
    errBox.style.display = "block";
    errBox.textContent = "❌ Supabase 초기화 실패";
    return;
  }

  // ✅ 로그인 세션
  const { data: { session } } = await db.auth.getSession();
  const user = session?.user || null;
  if (user) SWINGINV.user = user;

  try {
    // 📊 가격 데이터
    const { data, error } = await db
      .from("prices")
      .select("날짜, 종가")
      .eq("종목코드", code)
      .order("날짜", { ascending: true });

    if (error) throw error;
    if (!data?.length) {
      subEl.textContent = "📭 데이터가 없습니다.";
      return;
    }

    const dates = data.map(d => d.날짜);
    const closes = data.map(d => parseFloat(d.종가));

    // 📍 B가격 로드
    const { data: btData } = await db
      .from("bt_points")
      .select("b가격")
      .eq("종목코드", code);
    const bLines = Array.from(new Set(btData?.map(b => parseFloat(b.b가격)) || []));

    // 📈 차트 옵션
    let showBLines = true;
    const chart = echarts.init(chartEl);
    const baseOption = {
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: dates, boundaryGap: false },
      yAxis: { type: "value", scale: true },
      grid: { left: 50, right: 20, top: 40, bottom: 60 },
      dataZoom: [
        { type: "inside", start: 85, end: 100 },
        { type: "slider", start: 85, end: 100 }
      ],
      series: [
        {
          name: "종가",
          type: "line",
          data: closes,
          smooth: true,
          symbol: "none",
          lineStyle: { color: "#2563eb", width: 2 },
          areaStyle: { color: "rgba(37,99,235,0.1)" },
        },
      ],
    };

    const updateChart = () => {
      const marks = showBLines
        ? bLines.map(v => ({
            yAxis: v,
            lineStyle: { type: "dashed", color: "#e11d48" },
            label: { formatter: `B ${v.toLocaleString()}` },
          }))
        : [];
      chart.setOption({
        ...baseOption,
        series: [
          {
            ...baseOption.series[0],
            markLine: marks.length
              ? { symbol: "none", label: { show: true }, data: marks }
              : undefined,
          },
        ],
      });
    };

    // ✅ B가격 표시 토글
    document.getElementById("toggleB").addEventListener("change", e => {
      showBLines = e.target.checked;
      updateChart();
    });

    // ✅ 관심종목 자동체크 & 등록/삭제
    const watchToggle = document.getElementById("watchToggle");
    if (user) {
      const { data: exist } = await db
        .from("watchlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("종목코드", code)
        .maybeSingle();
      if (exist) watchToggle.checked = true;
    }

    watchToggle.addEventListener("change", async (e) => {
      if (!SWINGINV.user) {
        alert("🔐 로그인 후 이용해주세요.");
        e.target.checked = false;
        return;
      }

      if (e.target.checked) {
        const latestPrice = closes[closes.length - 1];
        const nickname = (
          await db.from("profiles").select("nickname").eq("id", SWINGINV.user.id).single()
        ).data?.nickname;
        const { error } = await db.from("watchlist").insert({
          user_id: SWINGINV.user.id,
          닉네임: nickname || "익명",
          종목명: name,
          종목코드: code,
          등록일: new Date().toISOString(),
          등록종가: latestPrice,
          공개여부: true,
        });
        if (error) alert("❌ 등록 실패: " + error.message);
        else alert("⭐ 관심종목으로 등록되었습니다!");
      } else {
        if (confirm("🗑️ 관심종목에서 삭제하시겠습니까?")) {
          await db.from("watchlist")
            .delete()
            .eq("user_id", SWINGINV.user.id)
            .eq("종목코드", code);
          alert("🗑️ 삭제되었습니다.");
        } else {
          e.target.checked = true;
        }
      }
    });

    // ✅ 차트 렌더
    updateChart();
    window.addEventListener("resize", () => chart.resize());
    subEl.textContent = `${dates[0]} ~ ${dates.at(-1)} (${data.length}일치 데이터)`;
  } catch (err) {
    console.error("❌ detail.js 오류:", err);
    errBox.style.display = "block";
    errBox.textContent = "데이터 로드 실패";
  }
});
