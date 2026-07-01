/**
 * app.js — 공고 리포트 뷰어
 */
import { renderReport } from './renderer.js';

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

    const readTimeEl = document.getElementById('readingTime');
    if (readTimeEl) readTimeEl.textContent = calcReadingTime(data);

    const articleBody = document.getElementById('articleBody');
    const sectionIndexList = document.getElementById('sectionIndexList');
    renderReport(data, articleBody, sectionIndexList);
    initSectionObserver();
    if (window._syncMobileToc) window._syncMobileToc();
    initSectionAnimations();

    // Hide skeleton after render
    const sk = document.getElementById('loadingSkeleton');
    if (sk) sk.style.display = 'none';

    // Populate card view grid if empty
    const cardsGrid = document.getElementById('cardsGrid');
    if (cardsGrid && !cardsGrid.children.length && data.sections) {
      data.sections.forEach(section => {
        const lead = section.lead ? `<p class="card-body">${section.lead}</p>` : '';
        cardsGrid.insertAdjacentHTML('beforeend', `
          <div class="card">
            <div class="card-label">${section.title}</div>
            ${lead}
          </div>`);
      });
    }
  } catch (err) {
    console.error('[app.js] loadReport error:', err);

    // Hide skeleton on error too
    const sk = document.getElementById('loadingSkeleton');
    if (sk) sk.style.display = 'none';

    const articleBody = document.getElementById('articleBody');
    if (articleBody) {
      articleBody.innerHTML = `
        <div class="article-section">
          <h2 class="article-section-title">리포트를 불러올 수 없습니다</h2>
          <p>slug: <code>${slug}</code> 에 해당하는 리포트 파일을 찾을 수 없습니다.<br>
          URL 파라미터 <code>?slug=xxx</code>가 올바른지 확인해 주세요.</p>
        </div>`;
    }
    const cardsGrid = document.getElementById('cardsGrid');
    if (cardsGrid) {
      cardsGrid.innerHTML = `
        <div class="card-empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary);margin-bottom:12px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>리포트를 불러올 수 없습니다</p>
          <button class="card-empty-retry" onclick="location.reload()">다시 시도</button>
        </div>`;
    }
  }
}

// ============================================
// 4. 읽기 시간 계산
// ============================================
function calcReadingTime(data) {
  const text = (data.sections || []).map(s => {
    let t = s.lead || '';
    if (s.component?.data?.groups) {
      s.component.data.groups.forEach(g => { t += g.items.join(' '); });
    }
    if (s.terms) s.terms.forEach(t2 => { t += t2.term + t2.definition; });
    return t;
  }).join(' ');
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 300));
  return `약 ${minutes}분 읽기`;
}

// ============================================
// 5. 모바일 TOC 드로어
// ============================================
function initMobileToc() {
  const fab = document.getElementById('tocFab');
  const drawer = document.getElementById('tocDrawer');
  const overlay = document.getElementById('tocOverlay');
  const drawerList = document.getElementById('tocDrawerList');
  if (!fab || !drawer || !overlay) return;

  function openDrawer() {
    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      drawer.classList.add('open');
    });
    fab.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    setTimeout(() => { overlay.style.display = 'none'; }, 250);
  }

  fab.addEventListener('click', openDrawer);
  overlay.addEventListener('click', closeDrawer);

  window._syncMobileToc = function() {
    const mainLinks = document.querySelectorAll('#sectionIndexList a');
    drawerList.innerHTML = '';
    mainLinks.forEach(link => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent;
      a.addEventListener('click', closeDrawer);
      li.appendChild(a);
      drawerList.appendChild(li);
    });
  };
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
// Section Entrance Animations
// ============================================
function initSectionAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const sections = document.querySelectorAll('#articleBody .article-section');
  if (!sections.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  sections.forEach(s => observer.observe(s));
}

// ============================================
// Share Button
// ============================================
function initShareButton() {
  const btn = document.getElementById('shareBtn');
  const toast = document.getElementById('shareToast');
  if (!btn) return;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  btn.addEventListener('click', async () => {
    const url = window.location.href;
    const title = document.getElementById('reportTitle')?.textContent || '공고 분석 리포트';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (e) {
        // user cancelled — no toast needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('링크가 복사됐어요!');
      } catch (e) {
        showToast('복사에 실패했습니다');
      }
    }
  });
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initViewToggle();
  initScrollProgress();
  initMobileToc();
  initShareButton();

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
