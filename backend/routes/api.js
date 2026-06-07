const express = require('express');
const { getDB, saveDB } = require('../db/database');
const nameMatcher = require('../services/nameMatcher');

const router = express.Router();

/**
 * POST /api/generateName
 * Submit form data → match names → return results
 */
router.post('/generateName', async (req, res) => {
  try {
    const db = await getDB();
    const {
      surname,
      gender,
      birthDate,
      birthTime,
      region,
      nameLength,
      styles
    } = req.body;
    let zodiac = req.body.zodiac;

    // --- Server-side validation ---
    const errors = [];

    if (!surname || !/^[一-鿿]{1,2}$/.test(surname)) {
      errors.push({ field: 'surname', message: '姓氏限1-2个汉字' });
    }
    if (!['boy', 'girl'].includes(gender)) {
      errors.push({ field: 'gender', message: '请选择性别' });
    }
    // Auto-compute zodiac from birthDate if not provided
    if (!zodiac && birthDate) {
      const year = parseInt(birthDate.split('-')[0]);
      if (!isNaN(year)) {
        zodiac = nameMatcher.ALL_ZODIACS[(year - 4) % 12];
      }
    }
    if (!nameMatcher.ALL_ZODIACS.includes(zodiac)) {
      errors.push({ field: 'zodiac', message: '无法确定生肖，请检查出生日期' });
    }
    if (!birthDate || isNaN(Date.parse(birthDate))) {
      errors.push({ field: 'birthDate', message: '请选择出生日期' });
    }
    if (![2, 3].includes(nameLength)) {
      errors.push({ field: 'nameLength', message: '请选择名字字数' });
    }
    if (!Array.isArray(styles) || styles.length === 0) {
      errors.push({ field: 'styles', message: '请至少选择1个名字风格' });
    }

    if (errors.length > 0) {
      return res.status(400).json({ code: 1, message: '表单校验不通过', errors });
    }

    // Get resultCount from config
    const configRows = db.exec("SELECT value FROM config WHERE key = 'resultCount'");
    let resultCount = 8;
    if (configRows.length && configRows[0].values.length) {
      try {
        resultCount = JSON.parse(configRows[0].values[0][0]);
      } catch {
        resultCount = 8;
      }
    }

    // Match names
    const matched = nameMatcher.match(db, {
      gender,
      zodiac,
      nameLength,
      styles,
      region
    }, resultCount);

    if (matched.length === 0) {
      return res.status(200).json({
        code: 2,
        message: '暂无合适名字，请调整风格/生肖后重试',
        data: { names: [] }
      });
    }

    // Build response: prepend surname to given_name
    const names = matched.map(m => {
      const fullName = surname + m.given_name;
      // Build zodiac compatibility note
      const zodiacSuits = typeof m.zodiac_suits === 'string'
        ? JSON.parse(m.zodiac_suits) : m.zodiac_suits;
      const zodiacAvoids = typeof m.zodiac_avoids === 'string'
        ? JSON.parse(m.zodiac_avoids) : m.zodiac_avoids;

      let zodiacNote = '';
      if (zodiacSuits.includes(zodiac)) {
        zodiacNote = `与生肖${zodiac}相合，宜用`;
      } else if (zodiacAvoids.includes(zodiac)) {
        zodiacNote = `生肖${zodiac}需留意`;
      } else {
        zodiacNote = `与生肖${zodiac}无冲克`;
      }

      return {
        fullName,
        givenName: m.given_name,
        pronunciation: m.pronunciation,
        charMeaning: m.char_meaning,
        overallMeaning: m.overall_meaning,
        styleTags: typeof m.styles === 'string' ? JSON.parse(m.styles) : m.styles,
        zodiacNote
      };
    });

    // Log stat
    db.run("INSERT INTO stats (event_type, user_ip) VALUES ('result_view', ?)", [
      req.ip || 'unknown'
    ]);
    saveDB();

    res.json({
      code: 0,
      data: { names }
    });
  } catch (err) {
    console.error('[generateName]', err);
    res.status(500).json({ code: -1, message: '服务器内部错误，请稍后重试' });
  }
});

/**
 * GET /api/config
 * Return public-facing configuration (adUnitId, resultCount, styleTags)
 */
router.get('/config', async (_req, res) => {
  try {
    const db = await getDB();
    const rows = db.exec("SELECT key, value FROM config WHERE key IN ('adUnitId', 'resultCount', 'styleTags', 'enableAds')");

    const config = {};
    if (rows.length && rows[0].values) {
      for (const [key, value] of rows[0].values) {
        try {
          config[key] = JSON.parse(value);
        } catch {
          config[key] = value;
        }
      }
    }

    res.json({ code: 0, data: config });
  } catch (err) {
    console.error('[config]', err);
    res.status(500).json({ code: -1, message: '服务器内部错误' });
  }
});

/**
 * POST /api/stats
 * Log a client-side event (page_view, form_submit, ad_complete)
 */
router.post('/stats', async (req, res) => {
  try {
    const db = await getDB();
    const { eventType, formHash } = req.body;

    const validTypes = ['page_view', 'form_submit', 'ad_complete', 'result_view'];
    if (!validTypes.includes(eventType)) {
      return res.status(400).json({ code: 1, message: '无效的事件类型' });
    }

    db.run("INSERT INTO stats (event_type, form_hash, user_ip) VALUES (?, ?, ?)", [
      eventType,
      formHash || null,
      req.ip || 'unknown'
    ]);
    saveDB();

    res.json({ code: 0 });
  } catch (err) {
    console.error('[stats]', err);
    res.status(500).json({ code: -1, message: '服务器内部错误' });
  }
});

module.exports = router;
