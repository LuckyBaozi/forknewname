-- ============================================================
-- NAMES TABLE — 名字库
-- Each row is one given-name candidate (not including surname)
-- ============================================================
CREATE TABLE IF NOT EXISTS names (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  given_name      TEXT    NOT NULL,
  gender          TEXT    NOT NULL CHECK(gender IN ('boy','girl')),
  name_length     INTEGER NOT NULL CHECK(name_length IN (2, 3)),
  styles          TEXT    NOT NULL DEFAULT '[]',
  zodiac_suits    TEXT    NOT NULL DEFAULT '[]',
  zodiac_avoids   TEXT    NOT NULL DEFAULT '[]',
  pronunciation   TEXT    NOT NULL,
  char_meaning    TEXT    NOT NULL,
  overall_meaning TEXT    NOT NULL,
  region_tags     TEXT    NOT NULL DEFAULT '["全国通用"]',
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_names_gender  ON names(gender, is_active);
CREATE INDEX IF NOT EXISTS idx_names_length  ON names(name_length, is_active);
CREATE INDEX IF NOT EXISTS idx_names_styles  ON names(styles);
CREATE INDEX IF NOT EXISTS idx_names_active  ON names(is_active);

-- ============================================================
-- BLACKLIST TABLE — 生僻字/不良字黑名单
-- ============================================================
CREATE TABLE IF NOT EXISTS blacklist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  character  TEXT    NOT NULL UNIQUE,
  reason     TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_blacklist_char ON blacklist(character);

-- ============================================================
-- STATS TABLE — 基础数据统计
-- ============================================================
CREATE TABLE IF NOT EXISTS stats (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT    NOT NULL,
  form_hash  TEXT    DEFAULT NULL,
  user_ip    TEXT    DEFAULT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stats_type ON stats(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_stats_date ON stats(created_at);

-- ============================================================
-- CONFIG TABLE — 系统配置
-- ============================================================
CREATE TABLE IF NOT EXISTS config (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT    NOT NULL UNIQUE,
  value      TEXT    NOT NULL,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO config (key, value) VALUES ('adUnitId', '""');
INSERT OR IGNORE INTO config (key, value) VALUES ('resultCount', '8');
INSERT OR IGNORE INTO config (key, value) VALUES ('styleTags', '["文雅","顺口","大气","温婉","古风"]');
INSERT OR IGNORE INTO config (key, value) VALUES ('enableAds', 'true');
