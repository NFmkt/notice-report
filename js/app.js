/**
 * app.js — 공고 리포트 뷰어
 */

// ============================================
// 1. 뷰 토글 (매거진 ↔ 카드뷰)
// ============================================
function initViewToggle() {
  const buttons = document.querySelectorAll('.toggle-btn');
  const magazineView = document.getElementById('magazineView');
  const cardView = document.getElementById('cardView');

  function switchView(targetView) {
    buttons.forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.toggle-btn[data-view="${targetView}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    if (targetView === 'magazine') {
      magazineView.classList.add('active');
      cardView.classList.remove('active');
    } else {
      cardView.classList.add('active');
      magazineView.classList.remove('active');
    }
    history.replaceState(null, '', '#' + targetView);
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // 페이지 로드 시 hash 읽어서 초기 뷰 결정
  const hash = window.location.hash.replace('#', '');
  if (hash === 'card') {
    switchView('card');
  }
}

// ============================================
// 2. 스크롤 프로그레스바
// ============================================
function initScrollProgress() {
  const bar = document.getElementById('progressBar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = Math.min(progress, 100) + '%';
  });
}

// ============================================
// 3. JSON 리포트 로딩
// ============================================
async function loadReport(slug) {
  try {
    const res = await fetch('reports/' + slug + '.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    // 페이지 타이틀
    document.title = data.meta.title + ' | 공고 리포트';

    // 히어로 섹션 채우기
    const titleEl = document.getElementById('reportTitle');
    const subtitleEl = document.getElementById('reportSubtitle');
    const badgeEl = document.querySelector('.hero-badge');
    if (titleEl) titleEl.textContent = data.meta.title;
    if (subtitleEl) subtitleEl.textContent = data.meta.subtitle;
    if (badgeEl && data.meta.badge) badgeEl.textContent = data.meta.badge;

    renderMagazineView(data);
    renderCardView(data);
    initSectionObserver();
  } catch (err) {
    console.error('[app.js] loadReport error:', err);
    const articleBody = document.getElementById('articleBody');
    if (articleBody) {
      articleBody.innerHTML = `
        <div class="article-section">
          <h2 class="article-section-title">리포트를 불러올 수 없습니다</h2>
          <p>slug: <code>${slug}</code> 에 해당하는 리포트 파일을 찾을 수 없습니다.<br>
          URL 파라미터 <code>?slug=xxx</code>가 올바른지 확인해 주세요.</p>
        </div>`;
    }
  }
}

// ============================================
// 4. 매거진 뷰 렌더링
// ============================================
function renderMagazineView(data) {
  const articleBody = document.getElementById('articleBody');
  const sectionIndexList = document.getElementById('sectionIndexList');

  if (!articleBody) return;

  // 기존 플레이스홀더 제거
  articleBody.innerHTML = '';
  if (sectionIndexList) sectionIndexList.innerHTML = '';

  data.sections.forEach(section => {
    // 본문 섹션 생성
    const el = document.createElement('section');
    el.id = 'section-' + section.id;
    el.dataset.sectionId = section.id;
    el.classList.add('article-section');
    el.innerHTML = section.content;
    articleBody.appendChild(el);

    // 목차 링크 생성 (intro, closing 제외)
    if (section.id !== 'intro' && section.id !== 'closing' && sectionIndexList) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#section-' + section.id;
      a.textContent = (section.emoji ? section.emoji + ' ' : '') + section.title;
      a.dataset.target = section.id;
      li.appendChild(a);
      sectionIndexList.appendChild(li);
    }
  });
}

// ============================================
// 5. 카드 뷰 렌더링
// ============================================
function renderCardView(data) {
  const cardsGrid = document.getElementById('cardsGrid');
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';

  const CARD_BUILDERS = {
    eligibility: buildEligibilityCard,
    cost: buildCostCard,
    application: buildApplicationCard,
    schedule: buildScheduleCard,
    caution: buildCautionCard,
  };

  data.sections.forEach(section => {
    const builder = CARD_BUILDERS[section.id];
    if (!builder) return;
    const card = document.createElement('div');
    card.innerHTML = builder(section);
    cardsGrid.appendChild(card.firstElementChild);
  });
}

function svgPerson() {
  return `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="6" r="3.5" fill="white"/><path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7H3z" fill="white"/></svg>`;
}
function svgCoin() {
  return `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8" fill="white" opacity="0.3"/><circle cx="10" cy="10" r="5.5" fill="white" opacity="0.5"/><rect x="9.1" y="6" width="1.8" height="8" rx="0.9" fill="white"/><rect x="6.5" y="9.1" width="7" height="1.8" rx="0.9" fill="white"/></svg>`;
}
function svgMonitor() {
  return `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="16" height="11" rx="2" fill="white"/><rect x="4" y="5" width="12" height="7" rx="1" fill="#7C3AED"/><rect x="7.5" y="14" width="5" height="2" rx="1" fill="white"/><rect x="8.5" y="16" width="3" height="1.5" rx="0.75" fill="white"/></svg>`;
}
function svgCalendar() {
  return `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="16" height="14" rx="2" fill="white"/><rect x="2" y="4" width="16" height="6" rx="2" fill="white" opacity="0.5"/><rect x="5" y="2" width="2" height="4" rx="1" fill="white"/><rect x="13" y="2" width="2" height="4" rx="1" fill="white"/><rect x="5" y="12" width="3" height="3" rx="0.5" fill="#F59E0B"/><rect x="9" y="12" width="3" height="3" rx="0.5" fill="#F59E0B" opacity="0.5"/></svg>`;
}
function svgShield() {
  return `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2L3 5.5v5.5C3 14.6 6.2 18 10 19c3.8-1 7-4.4 7-8V5.5L10 2z" fill="white"/><rect x="9.1" y="7" width="1.8" height="5" rx="0.9" fill="#EF4444"/><circle cx="10" cy="14" r="1.1" fill="#EF4444"/></svg>`;
}

function buildEligibilityCard(section) {
  return `
  <div class="vc-card" data-type="eligibility">
    <div class="vc-header" style="background:#EFF6FF">
      <div class="vc-icon-wrap" style="background:#2563EB">${svgPerson()}</div>
      <div>
        <p class="vc-label">자격 조건</p>
        <p class="vc-headline">무주택이면 누구나</p>
      </div>
    </div>
    <div class="vc-body">
      <div class="vc-chips">
        <span class="vc-chip good">✓ 소득 제한 없음</span>
        <span class="vc-chip good">✓ 자산 제한 없음</span>
        <span class="vc-chip good">✓ 무주택세대구성원</span>
      </div>
      <div class="vc-divider"></div>
      <p class="vc-sub-label">신청 불가</p>
      <ul class="vc-list bad">
        <li>유주택세대 세대분리예정자</li>
        <li>중복 당첨자 / 현 입주자 지위 보유</li>
        <li>만 19세 미만 미성년자 (예외 있음)</li>
        <li>외국인 / 모바일 앱 신청 불가</li>
      </ul>
    </div>
  </div>`;
}

function buildCostCard(section) {
  return `
  <div class="vc-card" data-type="cost">
    <div class="vc-header" style="background:#ECFDF5">
      <div class="vc-icon-wrap" style="background:#10B981">${svgCoin()}</div>
      <div>
        <p class="vc-label">임대료</p>
        <p class="vc-headline">월세 부담 제로</p>
      </div>
    </div>
    <div class="vc-body">
      <div class="vc-stat-row">
        <div class="vc-stat">
          <span class="vc-stat-value" style="color:#10B981">90%</span>
          <span class="vc-stat-desc">시세 이하</span>
        </div>
        <div class="vc-stat">
          <span class="vc-stat-value" style="color:#10B981">0원</span>
          <span class="vc-stat-desc">월세</span>
        </div>
        <div class="vc-stat">
          <span class="vc-stat-value" style="color:#10B981">8년</span>
          <span class="vc-stat-desc">최장 거주</span>
        </div>
      </div>
      <div class="vc-progress-wrap">
        <div class="vc-progress-label">
          <span>시세 대비 보증금</span><span>90% 이하</span>
        </div>
        <div class="vc-progress-track">
          <div class="vc-progress-fill" style="width:90%;background:#10B981"></div>
        </div>
        <p class="vc-progress-note">주택별 상이 — 안심전세포털에서 확인</p>
      </div>
      <div class="vc-chips" style="margin-top:12px">
        <span class="vc-chip neutral">전세보증금 방식</span>
        <span class="vc-chip neutral">2년 계약</span>
        <span class="vc-chip neutral">재계약 최대 3회</span>
      </div>
    </div>
  </div>`;
}

function buildApplicationCard(section) {
  return `
  <div class="vc-card" data-type="application">
    <div class="vc-header" style="background:#F5F3FF">
      <div class="vc-icon-wrap" style="background:#7C3AED">${svgMonitor()}</div>
      <div>
        <p class="vc-label">신청 방법</p>
        <p class="vc-headline">PC 온라인 전용</p>
      </div>
    </div>
    <div class="vc-body">
      <a class="vc-link-btn" href="https://www.khug.or.kr/jeonse/index.jsp" target="_blank" style="background:#7C3AED">
        HUG 안심전세포털 바로가기 →
      </a>
      <div class="vc-steps">
        <div class="vc-step"><span class="vc-step-num" style="background:#7C3AED">1</span><span>포털 접속</span></div>
        <div class="vc-step-arrow">→</div>
        <div class="vc-step"><span class="vc-step-num" style="background:#7C3AED">2</span><span>주택 선택</span></div>
        <div class="vc-step-arrow">→</div>
        <div class="vc-step"><span class="vc-step-num" style="background:#7C3AED">3</span><span>본인 인증</span></div>
        <div class="vc-step-arrow">→</div>
        <div class="vc-step"><span class="vc-step-num" style="background:#7C3AED">4</span><span>신청 완료</span></div>
      </div>
      <div class="vc-chips" style="margin-top:12px">
        <span class="vc-chip bad">모바일 앱 불가</span>
        <span class="vc-chip bad">방문 접수 불가</span>
      </div>
    </div>
  </div>`;
}

function buildScheduleCard(section) {
  return `
  <div class="vc-card" data-type="schedule">
    <div class="vc-header" style="background:#FFFBEB">
      <div class="vc-icon-wrap" style="background:#F59E0B">${svgCalendar()}</div>
      <div>
        <p class="vc-label">신청 일정</p>
        <p class="vc-headline">마감 26.06.08</p>
      </div>
    </div>
    <div class="vc-body">
      <div class="vc-timeline">
        <div class="vc-tl-item active">
          <div class="vc-tl-dot" style="background:#F59E0B"></div>
          <div class="vc-tl-content">
            <span class="vc-tl-date">26.05.29 ~ 06.08</span>
            <span class="vc-tl-label">신청 접수</span>
          </div>
        </div>
        <div class="vc-tl-item">
          <div class="vc-tl-dot"></div>
          <div class="vc-tl-content">
            <span class="vc-tl-date">26.06.09</span>
            <span class="vc-tl-label">서류제출 대상자 발표</span>
          </div>
        </div>
        <div class="vc-tl-item">
          <div class="vc-tl-dot"></div>
          <div class="vc-tl-content">
            <span class="vc-tl-date">26.06.22</span>
            <span class="vc-tl-label">서류 제출 마감</span>
          </div>
        </div>
        <div class="vc-tl-item">
          <div class="vc-tl-dot"></div>
          <div class="vc-tl-content">
            <span class="vc-tl-date">26.08.31</span>
            <span class="vc-tl-label">당첨자 발표</span>
          </div>
        </div>
        <div class="vc-tl-item">
          <div class="vc-tl-dot"></div>
          <div class="vc-tl-content">
            <span class="vc-tl-date">26.09 ~ 10월</span>
            <span class="vc-tl-label">주택 열람 · 계약</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function buildCautionCard(section) {
  return `
  <div class="vc-card" data-type="caution">
    <div class="vc-header" style="background:#FEF2F2">
      <div class="vc-icon-wrap" style="background:#EF4444">${svgShield()}</div>
      <div>
        <p class="vc-label">주의사항</p>
        <p class="vc-headline">이것만은 꼭 체크</p>
      </div>
    </div>
    <div class="vc-body">
      <ul class="vc-list bad">
        <li>허위 정보 입력 → 즉시 부적격 처리</li>
        <li>중복 신청 전부 무효 (1세대 1주택)</li>
        <li>서류 미제출 시 다음 회차 신청까지 제한</li>
        <li>서류는 공고일(26.05.29) 이후 발급분만 인정</li>
      </ul>
      <div class="vc-divider"></div>
      <p class="vc-sub-label">문의처</p>
      <div class="vc-contact-row">
        <span class="vc-contact">☎ HUG 1566-9009</span>
        <span class="vc-contact-time">평일 09:00~18:00</span>
      </div>
    </div>
  </div>`;
}

// ============================================
// 6. 사이드바 목차 스크롤 하이라이트
// ============================================
function initSectionObserver() {
  const sections = document.querySelectorAll('#articleBody section[data-section-id]');
  if (!sections.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target.dataset.sectionId;
        document.querySelectorAll('.section-index-list a').forEach(a => {
          a.classList.remove('active');
          if (a.dataset.target === target) {
            a.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-60px 0px -40% 0px' });

  sections.forEach(section => observer.observe(section));
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initViewToggle();
  initScrollProgress();

  // ?slug=xxx (로컬 테스트) 또는 /report/xxx (Vercel 배포) 둘 다 지원
  const params = new URLSearchParams(window.location.search);
  let slug = params.get('slug');
  if (!slug) {
    const pathMatch = window.location.pathname.match(/\/report\/(.+)/);
    if (pathMatch) slug = pathMatch[1];
  }

  if (slug) {
    loadReport(slug);
  }
});
