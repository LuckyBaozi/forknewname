const favorite = require('../../utils/favorite');

Component({
  properties: {
    name: {
      type: Object,
      value: {}
    },
    showActions: {
      type: Boolean,
      value: true
    },
    showDelete: {
      type: Boolean,
      value: false
    }
  },

  data: {
    isFav: false
  },

  lifetimes: {
    attached() {
      if (this.properties.name.fullName) {
        this.setData({
          isFav: favorite.isFavorited(this.properties.name.fullName)
        });
      }
    }
  },

  observers: {
    'name.fullName'(fullName) {
      if (fullName) {
        this.setData({
          isFav: favorite.isFavorited(fullName)
        });
      }
    }
  },

  methods: {
    onFavorite() {
      const { name } = this.properties;
      if (this.data.isFav) {
        const result = favorite.remove(name.fullName);
        if (result.success) {
          this.setData({ isFav: false });
          wx.showToast({ title: '已取消收藏', icon: 'none' });
        }
      } else {
        const result = favorite.add(name);
        if (result.success) {
          this.setData({ isFav: true });
          wx.showToast({ title: '已收藏', icon: 'none' });
        } else {
          wx.showToast({ title: result.message, icon: 'none' });
        }
      }
    },

    onRemove() {
      this.triggerEvent('remove', { fullName: this.properties.name.fullName });
    }
  }
});
