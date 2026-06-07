const api = require('../../utils/api');
const cache = require('../../utils/cache');

const app = getApp();

Page({
  data: {
    adStatus: 'loading', // loading | playing | error
    errorMsg: ''
  },

  videoAd: null,

  onLoad() {
    const formData = app.globalData.pendingForm;

    // If no form data, go back
    if (!formData) {
      wx.showToast({ title: '请先填写信息', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    // Check if ads are enabled in config
    if (app.globalData.config.enableAds === false) {
      // Skip ad, go directly to generate
      this.generateNames(formData);
      return;
    }

    this.loadAd();
  },

  loadAd() {
    const adUnitId = app.globalData.config.adUnitId;

    if (!adUnitId) {
      // No ad unit ID configured — skip ad in dev mode
      console.warn('[Ad] No adUnitId configured, skipping ad');
      const formData = app.globalData.pendingForm;
      this.generateNames(formData);
      return;
    }

    try {
      this.videoAd = wx.createRewardedVideoAd({ adUnitId });

      this.videoAd.onLoad(() => {
        this.setData({ adStatus: 'playing' });
        this.videoAd.show().catch(() => {
          // show() can fail if called not in a user gesture context
          // In that case, retry
        });
      });

      this.videoAd.onError((err) => {
        console.error('[Ad] Load error:', err);
        this.setData({
          adStatus: 'error',
          errorMsg: '网络异常，广告加载失败，请稍后重试'
        });
      });

      this.videoAd.onClose((res) => {
        if (res && res.isEnded) {
          // Ad completed — generate names
          const formData = app.globalData.pendingForm;
          this.generateNames(formData);
        } else {
          // Ad abandoned mid-way
          wx.showToast({
            title: '广告未看完，请重新提交',
            icon: 'none',
            duration: 2000
          });
          setTimeout(() => wx.navigateBack(), 2000);
        }
      });

      this.videoAd.load();
    } catch (err) {
      console.error('[Ad] Create ad failed:', err);
      // Fallback: skip ad
      const formData = app.globalData.pendingForm;
      this.generateNames(formData);
    }
  },

  onRetry() {
    this.setData({ adStatus: 'loading', errorMsg: '' });
    if (this.videoAd) {
      this.videoAd.load();
    } else {
      this.loadAd();
    }
  },

  onBack() {
    wx.navigateBack();
  },

  async generateNames(formData) {
    wx.showLoading({ title: '正在起名...' });

    try {
      const res = await api.generateName(formData);

      wx.hideLoading();

      if (res.code === 0) {
        // Cache result
        cache.setResult(formData.formHash, formData, res.data.names);

        // Log ad complete
        api.logStat('ad_complete', formData.formHash).catch(() => {});

        // Navigate to result
        wx.redirectTo({
          url: `/pages/result/result?formHash=${formData.formHash}`
        });
      } else if (res.code === 2) {
        // No matching names
        wx.showModal({
          title: '提示',
          content: res.message || '暂无合适名字，请调整风格/生肖后重试',
          showCancel: false,
          success: () => wx.navigateBack()
        });
      } else {
        // Other error
        wx.showModal({
          title: '提示',
          content: res.message || '请求失败，请稍后重试',
          showCancel: true,
          confirmText: '重试',
          cancelText: '返回',
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.generateNames(formData);
            } else {
              wx.navigateBack();
            }
          }
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('[Ad] generateNames error:', err);
      wx.showModal({
        title: '网络异常',
        content: '网络异常，请检查网络后重试',
        showCancel: true,
        confirmText: '重试',
        cancelText: '返回',
        success: (modalRes) => {
          if (modalRes.confirm) {
            this.generateNames(formData);
          } else {
            wx.navigateBack();
          }
        }
      });
    }
  }
});
