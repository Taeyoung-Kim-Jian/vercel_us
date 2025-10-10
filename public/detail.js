/* ==========================================================
   📈 detail.js — ECharts + Supabase (완전 스크롤 대응 버전)
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
  const chart = echarts.init(chartEl);

  /* ======================================================
     ✅ 스크롤 고정 방지 패치 (핵심)
  ====================================================== */
  function enforcePanY() {
    // CSS를 전역에 한 번만 추가
    if (!document.getElementById("echarts-pan-y-style")) {
      const style = document.createElement("style");
      style.id = "echarts-pan-y-style";
      style.textContent = `
        #chart, #chart * { touch-action: pan-y !important; -ms-touch-action: pan-y !important; }
        @media (max-width: 768px) {
          #chart { touch-action: pan-y !important; pointer-events: auto !important; }
        }
      `;
      document.head.appendChild(style);
    }

    // 차트 DOM 및 내부 캔버스 모두에 touch-action 적용
    const applyNow = () => {
      chartEl.style.touchAction = "pan-y";
      chartEl.querySelectorAll("canvas, div").forEach(el => {
        try { el.style.touchAction = "pan-y"; } catch {}
      });
    };
    applyNow();

    // 새 캔버스가 추가될 때도 다시 적용
    const mo = new MutationObserver(() => applyNow());
    mo.observe(chartEl, { childList: true, subtree: true });
  }
  enforcePanY();

  /* ✅ 뒤로가기 버튼을 차트 안쪽에 추가 */
  const backBtn = document.createElement("button");
  backBtn.className = "chart-back";
  backBtn.textContent = "← 뒤로가기";
  backBtn.addEventListener("click", () => history.back());
  chartEl.appendChild(backBtn);

  /* ✅ Supabase 로드 대기 */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let db;
  for (let i = 0; i < 25; i++) {
    if (window.SWINGINV?.db) { db = SWINGINV.db; break; }
    await wait(200);
  }
  if (!db) {
    alert("❌ Supabase 초기화 실패");
    return;
  }

  /* ✅ 유저 세션 확인 */
  const { data: { session } } = await db.auth.getSession();
  const user = session?.user || null;
  if (user) SWINGINV.user = user;

  try {
    /* -----------------------------
       1️⃣ 가격 데이터 로드
    ----------------------------- */
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

    if (allPrices.length === 0) {
      subEl.textContent = "📭 가격 데이터가 없습니다.";
      return;
    }

    /* -----------------------------
       2️⃣ B가격 데이터 로드
    ----------------------------- */
    const { data: btData } = await db
      .from("bt_points")
      .select("b가격, 생성일")
      .eq("종목코드", code)
      .order("생성일", { ascending: true });

    const dates = allPrices.map((d) => d.날짜);
    const closePrices = allPrices.map((d) => parseFloat(d.종가));
    const bLines = Array.from(new Set(btData?.map((b) => parseFloat(b.b가격)) || []));

    /* -----------------------------
       3️⃣ 차트 옵션
    ----------------------------- */
    let showBLines = true;
    const baseOption = {
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const item = params[0];
          return `${item.axisValue}<br/>가격: <b>${item.data.toLocaleString()}</b>`;
        },
      },
      xAxis: { type: "category", data: dates, boundaryGap: false },
      yAxis: { type: "value", scale: true },
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

    const updateBLines = () => {
      const markLines = showBLines
        ? bLines.map((b) => ({
            yAxis: b,
            lineStyle: { color: "#e11d48", type: "dashed" },
            label: { formatter: `B ${b.toLocaleString()}`, color: "#e11d48" },
          }))
        : [];

      chart.setOption({
        ...baseOption,
        series: [
          {
            ...baseOption.series[0],
            markLine: markLines.length
              ? { symbol: "none", label: { show: true }, data: markLines }
              : undefined,
          },
        ],
      });
    };

    /* -----------------------------
       4️⃣ 툴바 이벤트 (B가격, 관심종목)
    ----------------------------- */
    const toggleB = document.getElementById("toggleB");
    const watchToggle = document.getElementById("watchToggle");

    toggleB.addEventListener("change", (e) => {
      showBLines = e.target.checked;
      updateBLines();
    });

    // 이미 등록된 관심종목 체크
    if (user) {
      const { data: existing } = await db
        .from("watchlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("종목코드", code)
        .maybeSingle();
      if (existing) watchToggle.checked = true;
    }

    watchToggle.addEventListener("change", async (e) => {
      if (!SWINGINV.user) {
        alert("🔐 로그인 후 이용해주세요.");
        e.target.checked = false;
        return;
      }

      if (e.target.checked) {
        const latestPrice = closePrices[closePrices.length - 1];
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

        if (error) {
          console.error(error);
          alert("❌ 등록 실패: " + error.message);
          e.target.checked = false;
        } else {
          alert("⭐ 관심종목으로 등록되었습니다!");
        }
      } else {
        if (confirm("🗑️ 관심종목에서 삭제하시겠습니까?")) {
          await db
            .from("watchlist")
            .delete()
            .eq("user_id", SWINGINV.user.id)
            .eq("종목코드", code);
          alert("🗑️ 삭제되었습니다.");
        } else {
          e.target.checked = true;
        }
      }
    });

    /* -----------------------------
       5️⃣ 차트 렌더 및 반응형
    ----------------------------- */
    updateBLines();
    window.addEventListener("resize", () => chart.resize());
    subEl.textContent = "";
  } catch (err) {
    console.error("❌ 차트 로딩 오류:", err);
    subEl.textContent = "⚠️ 차트를 불러오지 못했습니다.";
  }
});
