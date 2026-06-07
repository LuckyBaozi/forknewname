/**
 * 起名小程序 — App 入口
 */
App({
  globalData: {
    // API base URL — change for production
    apiBase: 'http://localhost:3000',

    // Pending form data (used to pass from form → ad page)
    pendingForm: null,

    // Cached config from server
    config: {
      adUnitId: '',
      resultCount: 8,
      styleTags: ['文雅', '顺口', '大气', '温婉', '古风'],
      enableAds: true
    }
  },

  onLaunch() {
    // Fetch server config on startup
    this.fetchConfig();
  },

  fetchConfig() {
    wx.request({
      url: this.globalData.apiBase + '/api/config',
      success: (res) => {
        if (res.data && res.data.code === 0) {
          this.globalData.config = { ...this.globalData.config, ...res.data.data };
        }
      },
      fail: () => {
        // Use defaults if server unreachable
        console.warn('[App] Failed to fetch config, using defaults');
      }
    });
  }
});
