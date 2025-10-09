// nav.js
document.addEventListener("DOMContentLoaded", () => {
  const headerHTML = `
    <header class="header">
      <div class="header-inner">
        <div class="logo" onclick="location.href='index.html'">📊 ECONews 대시보드</div>
        <div class="login-btn"><button>로그인</button></div>
      </div>
    </header>
  `;

  const menuHTML = `
    <nav class="sub-menu">
      <ul>
        <li data-page="index.html">메인</li>
        <li data-page="total.html">전체</li>
        <li data-page="domestic.html">국내주식</li>
        <li data-page="global.html">해외주식</li>
        <li data-page="etf.html">ETF</li>
        <li data-page="swing.html">스윙전략</li>
      </ul>
    </nav>
  `;

  // ✅ body 맨 위에 헤더+메뉴 삽입
  document.body.insertAdjacentHTML("afterbegin", headerHTML + menuHTML);

  // ✅ 현재 페이지에 active 적용
  const currentPage = location.pathname.split("/").pop();
  const items = document.querySelectorAll(".sub-menu li");
  items.forEach(li => {
    const target = li.dataset.page;
    if (currentPage === target) {
      li.classList.add("active");
    }
    li.addEventListener("click", () => {
      location.href = li.dataset.page;
    });
  });
});
