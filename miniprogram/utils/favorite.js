/**
 * 收藏管理 — 微信本地缓存
 *
 * Storage key: 'favorites'
 * Structure: JSON array of name objects
 * Max: 50 entries
 */

const FAVORITES_KEY = 'favorites';
const MAX_FAVORITES = 50;

/**
 * Get all favorites.
 * @returns {Array}
 */
function getAll() {
  try {
    return wx.getStorageSync(FAVORITES_KEY) || [];
  } catch (e) {
    return [];
  }
}

/**
 * Add a name to favorites.
 * @param {object} name — { fullName, pronunciation, charMeaning, overallMeaning, styleTags, zodiacNote }
 * @returns {{success: boolean, message: string}}
 */
function add(name) {
  const favs = getAll();

  // Check duplicates (by fullName)
  if (favs.some(f => f.fullName === name.fullName)) {
    return { success: false, message: '已收藏过该名字' };
  }

  // Check capacity
  if (favs.length >= MAX_FAVORITES) {
    return { success: false, message: '收藏已达上限（50个）' };
  }

  // Add timestamp
  name.savedAt = new Date().toISOString();
  favs.unshift(name);

  try {
    wx.setStorageSync(FAVORITES_KEY, favs);
    return { success: true, message: '已收藏' };
  } catch (e) {
    return { success: false, message: '收藏失败，存储空间不足' };
  }
}

/**
 * Remove a name from favorites by fullName.
 */
function remove(fullName) {
  let favs = getAll();
  favs = favs.filter(f => f.fullName !== fullName);
  try {
    wx.setStorageSync(FAVORITES_KEY, favs);
    return { success: true, message: '已取消收藏' };
  } catch (e) {
    return { success: false, message: '操作失败' };
  }
}

/**
 * Clear all favorites.
 */
function clearAll() {
  try {
    wx.removeStorageSync(FAVORITES_KEY);
    return { success: true, message: '已清空' };
  } catch (e) {
    return { success: false, message: '清空失败' };
  }
}

/**
 * Check if a name is favorited.
 */
function isFavorited(fullName) {
  const favs = getAll();
  return favs.some(f => f.fullName === fullName);
}

module.exports = {
  getAll,
  add,
  remove,
  clearAll,
  isFavorited
};
