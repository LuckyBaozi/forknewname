/**
 * 起名匹配引擎 — 名字库检索模式
 *
 * Pipeline: FETCH → SCORE → FILTER → SORT → LIMIT
 */

// Twelve zodiac signs
const ALL_ZODIACS = [
  '鼠', '牛', '虎', '兔', '龙', '蛇',
  '马', '羊', '猴', '鸡', '狗', '猪'
];

/**
 * Parse a JSON text column from SQLite, falling back to default.
 */
function parseJSON(val, fallback) {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

/**
 * Count how many user-selected style tags match the name's style tags.
 */
function computeStyleScore(nameStyles, userStyles) {
  if (!userStyles.length) return 0;
  const intersection = userStyles.filter(s => nameStyles.includes(s));
  return (intersection.length / userStyles.length) * 30;
}

/**
 * Zodiac compatibility score.
 * +20 if any user zodiac matches the name's suitable list
 * -20 if any user zodiac matches the name's avoid list
 * 0 otherwise
 */
function computeZodiacScore(zodiacSuits, zodiacAvoids, userZodiac) {
  if (zodiacAvoids.includes(userZodiac)) return -20;
  if (zodiacSuits.includes(userZodiac)) return 20;
  return 0;
}

/**
 * Region bonus: +10 for exact match, +5 for "全国通用", 0 otherwise.
 */
function computeRegionScore(regionTags, userRegion) {
  if (!userRegion) return 0;
  if (regionTags.includes(userRegion)) return 10;
  if (regionTags.includes('全国通用')) return 5;
  return 0;
}

/**
 * Check that all characters in the given_name are not in the blacklist.
 */
function hasBlacklistedChar(givenName, blacklistChars) {
  for (const ch of givenName) {
    if (blacklistChars.has(ch)) return true;
  }
  return false;
}

/**
 * Main matching function.
 *
 * @param {object} db - sql.js Database instance
 * @param {object} params
 * @param {string} params.gender - 'boy' | 'girl' | 'neutral'
 * @param {string} params.zodiac - e.g. '龙'
 * @param {number} params.nameLength - 2 or 3
 * @param {string[]} params.styles - e.g. ['文雅', '大气']
 * @param {string} [params.region] - e.g. '广东'
 * @param {number} resultCount - max results to return (from config)
 * @returns {object[]} matched name records with scores
 */
function match(db, params, resultCount = 8) {
  const { gender, zodiac, nameLength, styles, region } = params;

  // Phase 1 — FETCH candidates (use OR instead of IN for broader SQL compatibility)
  let genderSQL;
  if (gender === 'neutral') {
    genderSQL = "gender = 'neutral'";
  } else {
    genderSQL = `(gender = '${gender}' OR gender = 'neutral')`;
  }

  const sql = `
    SELECT * FROM names
    WHERE is_active = 1
      AND ${genderSQL}
      AND name_length = ${nameLength}
  `;

  const rows = db.exec(sql);

  if (!rows.length || !rows[0].values.length) {
    return [];
  }

  const columns = rows[0].columns;
  const candidates = rows[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  // Load blacklist chars
  let blacklistChars = new Set();
  const blRows = db.exec('SELECT character FROM blacklist');
  if (blRows.length && blRows[0].values.length) {
    blacklistChars = new Set(blRows[0].values.map(r => r[0]));
  }

  // Phase 2 — SCORE
  const scored = candidates.map(c => {
    const nameStyles = parseJSON(c.styles, []);
    const zodiacSuits = parseJSON(c.zodiac_suits, []);
    const zodiacAvoids = parseJSON(c.zodiac_avoids, []);
    const regionTags = parseJSON(c.region_tags, ['全国通用']);

    const styleScore = computeStyleScore(nameStyles, styles);
    const zodiacScore = computeZodiacScore(zodiacSuits, zodiacAvoids, zodiac);
    const regionScore = computeRegionScore(regionTags, region);

    const totalScore = 40 + styleScore + zodiacScore + regionScore;

    return {
      ...c,
      styles: nameStyles,
      zodiac_suits: zodiacSuits,
      zodiac_avoids: zodiacAvoids,
      region_tags: regionTags,
      _score: totalScore
    };
  });

  // Phase 3 — FILTER
  const filtered = scored.filter(c => {
    // Hard filter: blacklisted characters
    if (hasBlacklistedChar(c.given_name, blacklistChars)) return false;
    // Hard filter: strongly zodiac-avoided (negative total)
    if (c._score < 0) return false;
    return true;
  });

  // Phase 4 — SORT & LIMIT
  filtered.sort((a, b) => b._score - a._score);

  const top = filtered.slice(0, resultCount);

  // Clean up internal score field before returning
  return top.map(({ _score, ...rest }) => rest);
}

module.exports = { match, ALL_ZODIACS };
