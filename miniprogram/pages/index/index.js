const api = require('../../utils/api');

Page({
  data: {
    hasFavorites: false,
    favoriteCount: 0
  },

  onShow() {
    // Check for favorites
    try {
      const favs = wx.getStorageSync('favorites') || [];
      this.setData({
        hasFavorites: favs.length > 0,
        favoriteCount: favs.length
      });
    } catch (e) {
      // ignore
    }

    // Log page view
    api.logStat('page_view').catch(() => {});
  },

  onStartTap() {
    wx.navigateTo({
      url: '/pages/form/form'
    });
  },

  onFavoritesTap() {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    });
  }
});
