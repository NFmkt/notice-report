// js/list.js

function showToast(msg, error = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = error ? '#DC2626' : '#111';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function confirmDialog(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box">
        <h3>정말 삭제할까요?</h3>
        <p>${msg}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" id="cancelBtn">취소</button>
          <button class="btn btn-danger" id="confirmBtn">삭제</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#cancelBtn').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('#confirmBtn').onclick = () => { overlay.remove(); resolve(true); };
  });
}

async function loadReports() {
  const grid = document.getElementById('reportGrid');
  try {
    const res = await fetch('/api/reports');
    const reports = await res.json();
    if (!reports.length) {
      grid.innerHTML = '<div class="empty-state">리포트가 없습니다.</div>';
      return;
    }
    grid.innerHTML = reports.map(r => `
      <div class="report-card">
        <span class="report-card-badge">${r.badge || '공고'}</span>
        <div class="report-card-title">${r.title}</div>
        <div class="report-card-meta">
          ${r.publishedAt ? `<span>${r.publishedAt}</span>` : ''}
          ${r.totalUnits ? `<span>${r.totalUnits.toLocaleString()}호</span>` : ''}
        </div>
        <div class="report-card-actions">
          <a class="btn btn-secondary" href="/edit.html?slug=${encodeURIComponent(r.slug)}">편집</a>
          <a class="btn btn-ghost" href="http://localhost:4710/report?slug=${encodeURIComponent(r.slug)}" target="_blank">미리보기</a>
          <button class="btn btn-danger" data-slug="${r.slug}" data-title="${r.title}">삭제</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-slug]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await confirmDialog(`"${btn.dataset.title}" 을(를) 삭제합니다.`);
        if (!ok) return;
        const res = await fetch(`/api/reports/${encodeURIComponent(btn.dataset.slug)}`, { method: 'DELETE' });
        if (res.ok) { showToast('삭제됐습니다.'); loadReports(); }
        else showToast('삭제 실패', true);
      });
    });
  } catch (e) {
    grid.innerHTML = '<div class="empty-state">리포트를 불러올 수 없습니다.</div>';
  }
}

document.getElementById('deployBtn').addEventListener('click', async () => {
  const btn = document.getElementById('deployBtn');
  btn.textContent = '배포 중...';
  btn.disabled = true;
  try {
    const res = await fetch('/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `update reports ${new Date().toISOString().slice(0,10)}` })
    });
    const data = await res.json();
    if (res.ok) showToast('배포 완료!');
    else showToast('배포 실패: ' + data.error, true);
  } catch (e) {
    showToast('배포 실패', true);
  } finally {
    btn.textContent = '🚀 전체 배포';
    btn.disabled = false;
  }
});

loadReports();
