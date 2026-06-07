const express = require('express');
const { getDB, saveDB } = require('../db/database');
const auth = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth
router.use(auth);

// ============================================================
// NAMES CRUD
// ============================================================

// GET /admin/names — list all names
router.get('/names', async (req, res) => {
  try {
    const db = await getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const countRows = db.exec('SELECT COUNT(*) AS cnt FROM names');
    const total = countRows[0].values[0][0];

    const rows = db.exec(`
      SELECT * FROM names
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const names = rows.length ? rows[0].values.map(row => {
      const obj = {};
      rows[0].columns.forEach((col, i) => obj[col] = row[i]);
      // Parse JSON fields
      ['styles', 'zodiac_suits', 'zodiac_avoids', 'region_tags'].forEach(f => {
        try { obj[f] = JSON.parse(obj[f]); } catch { obj[f] = []; }
      });
      return obj;
    }) : [];

    res.json({ code: 0, data: { names, total, page, limit } });
  } catch (err) {
    console.error('[admin/names]', err);
    res.status(500).json({ code: -1, message: '获取名字列表失败' });
  }
});

// POST /admin/names — create a name
router.post('/names', async (req, res) => {
  try {
    const db = await getDB();
    const {
      given_name, gender, name_length, styles, zodiac_suits,
      zodiac_avoids, pronunciation, char_meaning, overall_meaning, region_tags
    } = req.body;

    if (!given_name || !gender || !name_length) {
      return res.status(400).json({ code: 1, message: '缺少必填字段' });
    }

    db.run(`
      INSERT INTO names (given_name, gender, name_length, styles, zodiac_suits, zodiac_avoids, pronunciation, char_meaning, overall_meaning, region_tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      given_name,
      gender,
      name_length,
      JSON.stringify(styles || []),
      JSON.stringify(zodiac_suits || []),
      JSON.stringify(zodiac_avoids || []),
      pronunciation || '',
      char_meaning || '',
      overall_meaning || '',
      JSON.stringify(region_tags || ['全国通用'])
    ]);
    saveDB();

    res.json({ code: 0, message: '添加成功' });
  } catch (err) {
    console.error('[admin/names create]', err);
    res.status(500).json({ code: -1, message: '添加名字失败' });
  }
});

// PUT /admin/names/:id — update a name
router.put('/names/:id', async (req, res) => {
  try {
    const db = await getDB();
    const { id } = req.params;
    const {
      given_name, gender, name_length, styles, zodiac_suits,
      zodiac_avoids, pronunciation, char_meaning, overall_meaning, region_tags, is_active
    } = req.body;

    db.run(`
      UPDATE names SET
        given_name = ?, gender = ?, name_length = ?,
        styles = ?, zodiac_suits = ?, zodiac_avoids = ?,
        pronunciation = ?, char_meaning = ?, overall_meaning = ?,
        region_tags = ?, is_active = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      given_name, gender, name_length,
      JSON.stringify(styles || []), JSON.stringify(zodiac_suits || []), JSON.stringify(zodiac_avoids || []),
      pronunciation, char_meaning, overall_meaning,
      JSON.stringify(region_tags || ['全国通用']), is_active !== false ? 1 : 0,
      id
    ]);
    saveDB();

    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('[admin/names update]', err);
    res.status(500).json({ code: -1, message: '更新名字失败' });
  }
});

// DELETE /admin/names/:id — soft-delete a name
router.delete('/names/:id', async (req, res) => {
  try {
    const db = await getDB();
    const { id } = req.params;

    db.run("UPDATE names SET is_active = 0, updated_at = datetime('now') WHERE id = ?", [id]);
    saveDB();

    res.json({ code: 0, message: '已停用' });
  } catch (err) {
    console.error('[admin/names delete]', err);
    res.status(500).json({ code: -1, message: '删除失败' });
  }
});

// ============================================================
// BLACKLIST CRUD
// ============================================================

router.get('/blacklist', async (_req, res) => {
  try {
    const db = await getDB();
    const rows = db.exec('SELECT * FROM blacklist ORDER BY id DESC');
    const items = rows.length ? rows[0].values.map(row => {
      const obj = {};
      rows[0].columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    }) : [];
    res.json({ code: 0, data: items });
  } catch (err) {
    console.error('[admin/blacklist]', err);
    res.status(500).json({ code: -1, message: '获取黑名单失败' });
  }
});

router.post('/blacklist', async (req, res) => {
  try {
    const db = await getDB();
    const { character, reason } = req.body;

    if (!character || character.length !== 1) {
      return res.status(400).json({ code: 1, message: '请输入单个汉字' });
    }

    db.run('INSERT OR IGNORE INTO blacklist (character, reason) VALUES (?, ?)', [
      character, reason || ''
    ]);
    saveDB();

    res.json({ code: 0, message: '已添加到黑名单' });
  } catch (err) {
    console.error('[admin/blacklist create]', err);
    res.status(500).json({ code: -1, message: '添加失败' });
  }
});

router.delete('/blacklist/:id', async (req, res) => {
  try {
    const db = await getDB();
    db.run('DELETE FROM blacklist WHERE id = ?', [req.params.id]);
    saveDB();
    res.json({ code: 0, message: '已移除' });
  } catch (err) {
    console.error('[admin/blacklist delete]', err);
    res.status(500).json({ code: -1, message: '删除失败' });
  }
});

// ============================================================
// CONFIG
// ============================================================

router.get('/config', async (_req, res) => {
  try {
    const db = await getDB();
    const rows = db.exec('SELECT key, value FROM config ORDER BY id');
    const config = {};
    if (rows.length && rows[0].values) {
      for (const [key, value] of rows[0].values) {
        try { config[key] = JSON.parse(value); } catch { config[key] = value; }
      }
    }
    res.json({ code: 0, data: config });
  } catch (err) {
    console.error('[admin/config]', err);
    res.status(500).json({ code: -1, message: '获取配置失败' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const db = await getDB();
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      db.run(
        "INSERT INTO config (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        [key, jsonValue]
      );
    }
    saveDB();

    res.json({ code: 0, message: '配置已更新' });
  } catch (err) {
    console.error('[admin/config update]', err);
    res.status(500).json({ code: -1, message: '更新配置失败' });
  }
});

// ============================================================
// STATS
// ============================================================

router.get('/stats', async (req, res) => {
  try {
    const db = await getDB();
    const days = parseInt(req.query.days) || 7;

    const summary = db.exec(`
      SELECT event_type, COUNT(*) AS cnt
      FROM stats
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY event_type
    `);

    const stats = {};
    if (summary.length && summary[0].values) {
      for (const [type, count] of summary[0].values) {
        stats[type] = count;
      }
    }

    const totalRows = db.exec('SELECT COUNT(*) AS cnt FROM stats');
    const total = totalRows[0].values[0][0];

    res.json({ code: 0, data: { stats, total, periodDays: days } });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ code: -1, message: '获取统计失败' });
  }
});

module.exports = router;
