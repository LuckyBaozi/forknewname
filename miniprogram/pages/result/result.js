const cache = require('../../utils/cache');
const api = require('../../utils/api');

Page({
  data: {
    names: [],
    fromCache: false,
    loading: true
  },

  onLoad(options) {
    const { formHash, fromCache } = options;

    if (fromCache === '1') {
      this.setData({ fromCache: true });
    }

    // Load result from cache
    const cached = cache.getResult(formHash);
    if (cached && cached.names) {
      this.setData({
        names: cached.names,
        loading: false
      });

      // Log result view
      api.logStat('result_view', formHash).catch(() => {});
    } else {
      this.setData({
        names: [],
        loading: false
      });
    }
  },

  onRestart() {
    // Navigate back to form with preserved data
    // Form page will restore from pendingForm in app.globalData
    wx.navigateBack();
  },

  onHome() {
    wx.navigateBack({
      delta: 3 // back through ad, form, to index
    });
  },

  /**
   * Share handler — WeChat mini-program share
   */
  onShareAppMessage() {
    const first = this.data.names[0];
    return {
      title: first
        ? `我在起名神器给宝宝起了个名字：${first.fullName}，你也来试试吧！`
        : '起名神器 — 智能起名，为你甄选好名字',
      path: '/pages/index/index'
    };
  }
});
