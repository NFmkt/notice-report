const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 4711;
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

app.use(express.json());
// 개발용: 정적 파일 캐시 비활성화 (편집 즉시 반영)
const noCache = { etag: false, lastModified: false, setHeaders: (res) => res.setHeader('Cache-Control', 'no-store') };
app.use(express.static(path.join(__dirname), noCache));
app.use(express.static(path.join(__dirname, '..'), noCache));

// GET /api/reports — list all
app.get('/api/reports', (req, res) => {
  try {
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'schema-example.json')
      .map(f => {
        const filePath = path.join(REPORTS_DIR, f);
        const slug = f.replace('.json', '');
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const stat = fs.statSync(filePath);
        return {
          slug,
          title: content.meta?.title || slug,
          badge: content.meta?.badge || '',
          publishedAt: content.meta?.publishedAt || '',
          status: content.meta?.status || 'draft',
          createdAt: stat.birthtime.toISOString(),
          totalUnits: content.summary?.totalUnits || null,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reports/:slug
app.get('/api/reports/:slug', (req, res) => {
  try {
    const filePath = path.join(REPORTS_DIR, req.params.slug + '.json');
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reports — 새 리포트 생성
app.post('/api/reports', (req, res) => {
  try {
    const { slug, badge } = req.body;
    if (!slug) return res.status(400).json({ error: 'slug 필요' });
    const filePath = path.join(REPORTS_DIR, slug + '.json');
    if (fs.existsSync(filePath)) return res.status(409).json({ error: '이미 존재하는 슬러그' });
    const template = {
      meta: { slug, title: '새 리포트', subtitle: '', publishedAt: '', sourceUrl: '', badge: badge || '청년주택 공고 분석', status: 'draft' },
      summary: { organizer: '', totalUnits: 0, minRent: '', applyStart: '', applyEnd: '' },
      intro: { headline: '', body: '<p></p>' },
      sections: [
        { id: 'eligibility', emoji: '🙋', title: '신청 자격', lead: '', component: { type: 'bullet-card', data: { groups: [] } }, terms: [] },
        { id: 'lease', emoji: '💰', title: '임대조건', lead: '', component: { type: 'table-card', data: { rows: [] } }, terms: [] },
        { id: 'schedule', emoji: '📅', title: '신청 방법 및 일정', lead: '', component: { type: 'timeline', data: { method: '', steps: [] } }, terms: [] },
        { id: 'caution', emoji: '⚠️', title: '주의사항', lead: '', component: { type: 'qa-list', data: { qa: [] } }, terms: [] },
      ],
      outro: { body: '', ctaLabel: '공고문 확인하기', ctaUrl: '' }
    };
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf8');
    res.json({ ok: true, slug });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/reports/:slug — save
app.put('/api/reports/:slug', (req, res) => {
  try {
    const filePath = path.join(REPORTS_DIR, req.params.slug + '.json');
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/reports/:slug
app.delete('/api/reports/:slug', (req, res) => {
  try {
    const filePath = path.join(REPORTS_DIR, req.params.slug + '.json');
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    fs.unlinkSync(filePath);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/deploy — git add + commit + push
app.post('/api/deploy', (req, res) => {
  const cwd = path.join(__dirname, '..');
  const msg = req.body.message || `update reports ${new Date().toISOString().slice(0,10)}`;
  exec(`git add -A && git commit -m "${msg}" && git push`, { cwd }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message, stdout });
    res.json({ ok: true, stdout });
  });
});

app.listen(PORT, () => {
  console.log(`Admin running at http://localhost:${PORT}`);
});
