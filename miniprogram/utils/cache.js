/**
 * 本地缓存工具 — 表单哈希 → 起名结果
 *
 * 同一组表单数据，重复查看无需再次看广告。
 * Cache key: 'name_result_' + formHash
 * Max entries: 20 (FIFO eviction)
 */

const MAX_CACHE_ENTRIES = 20;
const CACHE_PREFIX = 'name_result_';
const INDEX_KEY = 'cache_index'; // stores ordered list of formHash keys

/**
 * Simple hash function for form data object.
 * Sorts keys for deterministic output.
 */
function hashForm(formData) {
  const sorted = {};
  Object.keys(formData).sort().forEach(key => {
    sorted[key] = formData[key];
  });
  const str = JSON.stringify(sorted);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'fh_' + Math.abs(hash).toString(36);
}

/**
 * Get cached result by form hash.
 * @returns {object|null} cached data or null
 */
function getResult(formHash) {
  try {
    const data = wx.getStorageSync(CACHE_PREFIX + formHash);
    return data || null;
  } catch (e) {
    return null;
  }
}

/**
 * Set cached result.
 * @param {string} formHash
 * @param {object} formData — original form data
 * @param {array} names — name results
 */
function setResult(formHash, formData, names) {
  try {
    const entry = {
      formHash,
      formData,
      names,
      cachedAt: new Date().toISOString()
    };

    // Update index
    let index = [];
    try {
      index = wx.getStorageSync(INDEX_KEY) || [];
    } catch (e) { /* ignore */ }

    // Remove existing entry for same hash
    index = index.filter(h => h !== formHash);

    // Add to front (most recent first)
    index.unshift(formHash);

    // FIFO eviction
    while (index.length > MAX_CACHE_ENTRIES) {
      const removed = index.pop();
      try {
        wx.removeStorageSync(CACHE_PREFIX + removed);
      } catch (e) { /* ignore */ }
    }

    wx.setStorageSync(CACHE_PREFIX + formHash, entry);
    wx.setStorageSync(INDEX_KEY, index);
  } catch (e) {
    console.warn('[Cache] Failed to set cache:', e);
  }
}

/**
 * Check if cache exists for given form data.
 * Returns cached data or null.
 */
function checkCache(formData) {
  const formHash = hashForm(formData);
  return {
    formHash,
    cached: getResult(formHash)
  };
}

module.exports = {
  hashForm,
  getResult,
  setResult,
  checkCache
};
