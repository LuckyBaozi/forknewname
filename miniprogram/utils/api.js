/**
 * API 请求封装
 */

const app = getApp();

/**
 * 基础请求
 */
function request(path, options = {}) {
  const base = app.globalData.apiBase;
  return new Promise((resolve, reject) => {
    wx.request({
      url: base + path,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(options.header || {})
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

/**
 * 提交起名请求
 * @param {object} formData — 表单数据
 * @returns {Promise<{code, data: {names[]}}>}
 */
function generateName(formData) {
  return request('/api/generateName', {
    method: 'POST',
    data: formData
  });
}

/**
 * 获取服务端配置
 */
function fetchConfig() {
  return request('/api/config');
}

/**
 * 上报事件统计
 * @param {string} eventType — page_view | form_submit | ad_complete | result_view
 * @param {string} formHash — 表单哈希（可选）
 */
function logStat(eventType, formHash) {
  return request('/api/stats', {
    method: 'POST',
    data: { eventType, formHash }
  });
}

module.exports = {
  request,
  generateName,
  fetchConfig,
  logStat
};
