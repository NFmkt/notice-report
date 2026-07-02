// admin/js/list.js

let allReports = [];
let activeFilter = 'all';
let activeSort = 'createdAt-desc';
let searchQuery = '';

// ── 토스트 ────────────────────────────────────────────────────────────────── //
function showToast(msg, error = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = error ? '#DC2626' : '#1E293B';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── 확인 모달 ─────────────────────────────────────────────────────────────── //
function confirmDialog(msg) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmMsg').textContent = msg;
    modal.hidden = false;
    const ok = document.getElementById('confirmOk');
    const cancel = document.getElementById('confirmCancel');
    const close = (val) => { modal.hidden = true; resolve(val); };
    ok.onclick = () => close(true);
    cancel.onclick = () => close(false);
  });
}

// ── 날짜 포맷 ─────────────────────────────────────────────────────────────── //
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

// ── 필터·정렬·검색 적용 ──────────────────────────────────────────────────── //
function getFiltered() {
  let list = allReports.slice();

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(r => r.title.toLowerCase().includes(q) || r.badge.toLowerCase().includes(q));
  }

  if (activeFilter !== 'all') {
    list = list.filter(r => r.status === activeFilter);
  }

  list.sort((a, b) => {
    if (activeSort === 'createdAt-desc')   return new Date(b.createdAt) - new Date(a.createdAt);
    if (activeSort === 'createdAt-asc')    return new Date(a.createdAt) - new Date(b.createdAt);
    if (activeSort === 'publishedAt-desc') return (b.publishedAt || '').localeCompare(a.publishedAt || '');
    return 0;
  });

  return list;
}

// ── 카운트 배지 업데이트 ─────────────────────────────────────────────────── //
function updateCounts() {
  const total     = allReports.length;
  const drafts    = allReports.filter(r => r.status === 'draft').length;
  const published = allReports.filter(r => r.status === 'published').length;

  document.getElementById('countAll').textContent       = total;
  document.getElementById('countDraft').textContent     = drafts;
  document.getElementById('countPublished').textContent = published;
  document.getElementById('reportCount').textContent    = `총 ${total}건`;
}

// ── 테이블 렌더 ───────────────────────────────────────────────────────────── //
function renderList() {
  const list = getFiltered();
  const tbody = document.getElementById('reportList');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">리포트가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => {
    const statusClass  = r.status === 'published' ? 'badge-published' : 'badge-draft';
    const statusLabel  = r.status === 'published' ? '배포완료' : '초안';
    const previewUrl   = `http://localhost:4710/report?slug=${encodeURIComponent(r.slug)}`;
    const editUrl      = `/edit.html?slug=${encodeURIComponent(r.slug)}`;

    return `
      <tr data-slug="${r.slug}">
        <td class="col-title">
          <div class="title-cell">
            <span class="title-main">${r.title}</span>
            ${r.badge ? `<span class="badge badge-category">${r.badge}</span>` : ''}
          </div>
        </td>
        <td class="col-status"><span class="badge ${statusClass}"><span class="status-dot"></span>${statusLabel}</span></td>
        <td class="col-date date-cell">${formatDate(r.createdAt)}</td>
        <td class="col-date date-cell">${r.publishedAt || '—'}</td>
        <td class="col-actions">
          <div class="row-actions">
            <a class="icon-btn" href="${editUrl}" title="편집" aria-label="편집">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </a>
            <a class="icon-btn" href="${previewUrl}" target="_blank" title="미리보기" aria-label="미리보기">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </a>
            <button class="icon-btn icon-btn--danger delete-btn" title="삭제" aria-label="삭제"
              data-slug="${r.slug}" data-title="${r.title}">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  // 삭제 버튼 이벤트
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog(`"${btn.dataset.title}"을(를) 삭제합니다.`);
      if (!ok) return;
      const res = await fetch(`/api/reports/${encodeURIComponent(btn.dataset.slug)}`, { method: 'DELETE' });
      if (res.ok) {
        allReports = allReports.filter(r => r.slug !== btn.dataset.slug);
        updateCounts();
        renderList();
        showToast('삭제했습니다.');
      } else {
        showToast('삭제 실패', true);
      }
    });
  });
}

// ── 데이터 로드 ───────────────────────────────────────────────────────────── //
async function loadReports() {
  try {
    const res = await fetch('/api/reports');
    allReports = await res.json();
    updateCounts();
    renderList();
  } catch {
    document.getElementById('reportList').innerHTML =
      `<tr><td colspan="5" class="empty-state">리포트를 불러올 수 없습니다.</td></tr>`;
  }
}

// ── 새 리포트 슬러그 자동 생성 ───────────────────────────────────────────── //
function todaySlug() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `${ymd}-`;
}

// ── 이벤트 바인딩 ─────────────────────────────────────────────────────────── //

// 검색
document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  renderList();
});

// 필터 탭
document.getElementById('filterTabs').addEventListener('click', e => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = btn.dataset.filter;
  renderList();
});

// 정렬
document.getElementById('sortSelect').addEventListener('change', e => {
  activeSort = e.target.value;
  renderList();
});

// 배포
document.getElementById('deployBtn').addEventListener('click', async () => {
  const btn = document.getElementById('deployBtn');
  btn.disabled = true;
  btn.textContent = '배포 중...';
  try {
    const res = await fetch('/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `update reports ${new Date().toISOString().slice(0,10)}` })
    });
    const data = await res.json();
    if (res.ok) showToast('배포 완료!');
    else showToast('배포 실패: ' + data.error, true);
  } catch {
    showToast('배포 실패', true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1v9M5 4l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg> 배포`;
  }
});

// 새 리포트 모달
const newModal  = document.getElementById('newModal');
const newSlug   = document.getElementById('newSlug');
const newBadge  = document.getElementById('newBadge');

document.getElementById('newBtn').addEventListener('click', () => {
  newSlug.value  = todaySlug();
  newBadge.value = '청년주택 공고 분석';
  newModal.hidden = false;
  setTimeout(() => newSlug.focus(), 50);
});

function closeNewModal() { newModal.hidden = true; }
document.getElementById('newModalClose').addEventListener('click', closeNewModal);
document.getElementById('newModalCancel').addEventListener('click', closeNewModal);

document.getElementById('newModalConfirm').addEventListener('click', async () => {
  const slug  = newSlug.value.trim();
  const badge = newBadge.value.trim();
  if (!slug) { newSlug.focus(); return; }

  const btn = document.getElementById('newModalConfirm');
  btn.disabled = true;
  btn.textContent = '만드는 중...';

  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, badge })
    });
    const data = await res.json();
    if (res.status === 409) { showToast('이미 존재하는 슬러그입니다.', true); return; }
    if (!res.ok) { showToast('생성 실패: ' + data.error, true); return; }
    closeNewModal();
    window.location.href = `/edit.html?slug=${encodeURIComponent(slug)}`;
  } catch {
    showToast('생성 실패', true);
  } finally {
    btn.disabled = false;
    btn.textContent = '만들기';
  }
});

// ESC로 모달 닫기
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!newModal.hidden) closeNewModal();
    if (!document.getElementById('confirmModal').hidden) {
      document.getElementById('confirmModal').hidden = true;
    }
  }
});

loadReports();
