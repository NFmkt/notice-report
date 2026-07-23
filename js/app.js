/**
 * app.js — 공고 리포트 뷰어
 */
import { renderReport } from './renderer.js';
import { initLocationMaps } from './location-map.js';


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
    const thumbnailEl = document.getElementById('heroThumbnail');
    if (titleEl) titleEl.textContent = data.meta.title;
    if (subtitleEl) subtitleEl.textContent = data.meta.subtitle;
    if (badgeEl && data.meta.badge) badgeEl.textContent = data.meta.badge;
    if (thumbnailEl) {
      if (data.meta.thumbnail) {
        thumbnailEl.src = data.meta.thumbnail;
        thumbnailEl.hidden = false;
      } else {
        thumbnailEl.hidden = true;
      }
    }

    const articleBody = document.getElementById('articleBody');
    const sectionIndexList = document.getElementById('sectionIndexList');
    renderReport(data, articleBody, sectionIndexList);
    initLocationMaps();
    initSectionObserver();
    if (window._syncMobileToc) window._syncMobileToc();
    initSectionAnimations();

    // Hide skeleton after render
    const sk = document.getElementById('loadingSkeleton');
    if (sk) sk.style.display = 'none';

  } catch (err) {
    console.error('[app.js] loadReport error:', err);

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
  }
}

// ============================================
// 4. 모바일 TOC 드로어
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
    // ?slug= 형태로 열려 있어도, 링크 미리보기(카톡 등)가 정상 동작하는 /report/슬러그 형태로 공유한다
    // (report.html은 파일이 하나뿐이라 og:title/image가 슬러그별로 안 나뉨 — report/{slug}/index.html이 그 역할을 함)
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const url = slug
      ? window.location.origin + window.location.pathname.replace(/\/report\.html$/, '') + '/report/' + encodeURIComponent(slug) + window.location.hash
      : window.location.href;
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
  } else {
    showNoSlugError();
  }
});

// slug 파라미터 자체가 없을 때 — 스켈레톤이 무한 로딩처럼 보이는 것을 방지
function showNoSlugError() {
  const sk = document.getElementById('loadingSkeleton');
  if (sk) sk.style.display = 'none';

  const articleBody = document.getElementById('articleBody');
  if (articleBody) {
    articleBody.innerHTML = `
      <div class="article-section">
        <h2 class="article-section-title">리포트 주소가 올바르지 않습니다</h2>
        <p>URL에 <code>?slug=xxx</code> 파라미터가 없습니다.<br>
        예: <code>report.html?slug=리포트slug</code> 또는 <code>/report/리포트slug</code> 형식으로 접속해 주세요.<br>
        ("report.html?slug=..." 형태 그대로는 로컬 서버(serve)의 clean-URL 리다이렉트로 쿼리가 날아갈 수 있으니, 로컬 테스트 시 확장자 없는 <code>/report?slug=...</code> 사용을 권장합니다.)</p>
      </div>`;
  }
}
