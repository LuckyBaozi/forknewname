const favorite = require('../../utils/favorite');

Page({
  data: {
    favorites: []
  },

  onShow() {
    this.loadFavorites();
  },

  loadFavorites() {
    const favs = favorite.getAll();
    this.setData({ favorites: favs });
  },

  onRemoveItem(e) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个收藏吗？',
      success: (res) => {
        if (res.confirm) {
          const result = favorite.remove(e.detail.fullName);
          if (result.success) {
            this.loadFavorites();
            wx.showToast({ title: '已删除', icon: 'none' });
          } else {
            wx.showToast({ title: result.message, icon: 'none' });
          }
        }
      }
    });
  },

  onClearAll() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空全部收藏吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          const result = favorite.clearAll();
          if (result.success) {
            this.setData({ favorites: [] });
            wx.showToast({ title: '已清空', icon: 'none' });
          } else {
            wx.showToast({ title: result.message, icon: 'none' });
          }
        }
      }
    });
  },

  onGoHome() {
    wx.navigateBack();
  }
});
