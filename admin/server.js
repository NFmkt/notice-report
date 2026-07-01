const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 4711;
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// GET /api/reports — list all (exclude legacy/ subdirectory)
app.get('/api/reports', (req, res) => {
  try {
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'schema-example.json')
      .map(f => {
        const slug = f.replace('.json', '');
        const content = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, f), 'utf8'));
        return {
          slug,
          title: content.meta?.title || slug,
          badge: content.meta?.badge || '',
          publishedAt: content.meta?.publishedAt || '',
          totalUnits: content.summary?.totalUnits || null,
        };
      })
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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
