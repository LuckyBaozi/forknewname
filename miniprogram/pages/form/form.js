const validator = require('../../utils/validator');
const cache = require('../../utils/cache');
const api = require('../../utils/api');
const constants = require('../../utils/constants');

const app = getApp();

// 生肖推算: (year - 4) % 12
const ZODIACS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

function getZodiacFromDate(dateStr) {
  if (!dateStr) return '';
  const year = parseInt(dateStr.split('-')[0]);
  if (isNaN(year)) return '';
  return ZODIACS[(year - 4) % 12];
}

Page({
  data: {
    // Form fields
    surname: '',
    gender: '',
    birthDate: '',
    birthTime: '',
    birthTimeIndex: -1,
    zodiac: '',
    nameLength: '',
    styles: [],

    // Options
    genders: constants.GENDERS,
    nameLengths: constants.NAME_LENGTHS,
    birthHours: constants.BIRTH_HOURS,
    styleTags: app.globalData.config.styleTags || constants.STYLE_TAGS,

    // Validation
    errors: {},
    isFormValid: false,

    // Date picker max
    today: new Date().toISOString().split('T')[0]
  },

  onShow() {
    if (app.globalData.config.styleTags) {
      this.setData({ styleTags: app.globalData.config.styleTags });
    }

    const preserved = app.globalData.pendingForm;
    if (preserved) {
      this.restoreForm(preserved);
      app.globalData.pendingForm = null;
    }

    api.logStat('page_view').catch(() => {});
  },

  // --- Input handlers ---

  onSurnameChange(e) {
    this.setData({ surname: e.detail.value });
    this.validateField('surname');
  },

  onGenderChange(e) {
    this.setData({ gender: e.currentTarget.dataset.value });
    this.validateField('gender');
  },

  onBirthDateChange(e) {
    const birthDate = e.detail.value;
    const zodiac = getZodiacFromDate(birthDate);
    this.setData({ birthDate, zodiac });
    this.validateField('birthDate');
  },

  onBirthTimeChange(e) {
    const index = parseInt(e.detail.value);
    const item = constants.BIRTH_HOURS[index];
    this.setData({
      birthTimeIndex: index,
      birthTime: item.value === 'unknown' ? item.label : item.value
    });
    this.validateField('birthTime');
  },

  onNameLengthChange(e) {
    this.setData({ nameLength: e.currentTarget.dataset.value });
    this.validateField('nameLength');
  },

  onStyleToggle(e) {
    const tag = e.currentTarget.dataset.tag;
    let styles = [...this.data.styles];
    const idx = styles.indexOf(tag);
    if (idx > -1) styles.splice(idx, 1);
    else styles.push(tag);
    this.setData({ styles });
    this.validateField('styles');
  },

  // --- Validation ---
  validateField(field) {
    const errors = { ...this.data.errors };
    const validators = {
      surname: () => validator.validateSurname(this.data.surname),
      gender: () => validator.validateGender(this.data.gender),
      birthDate: () => validator.validateBirthDate(this.data.birthDate),
      birthTime: () => validator.validateBirthTime(this.data.birthTime),
      nameLength: () => validator.validateNameLength(this.data.nameLength),
      styles: () => validator.validateStyles(this.data.styles)
    };

    if (validators[field]) {
      const result = validators[field]();
      if (result.valid) delete errors[field];
      else errors[field] = result.message;
    }

    const isFormValid = Object.keys(errors).length === 0 &&
      this.data.surname && this.data.gender &&
      this.data.birthDate && this.data.birthTime &&
      this.data.nameLength && this.data.styles.length > 0;

    this.setData({ errors, isFormValid });
  },

  // --- Submit ---
  onSubmit() {
    const formData = this.buildFormData();
    const result = validator.validateForm(formData);

    if (!result.valid) {
      this.setData({ errors: result.errors });
      wx.showToast({ title: '请完善必填信息', icon: 'none' });
      return;
    }

    api.logStat('form_submit').catch(() => {});

    const { formHash, cached } = cache.checkCache(formData);

    if (cached) {
      wx.navigateTo({
        url: `/pages/result/result?formHash=${formHash}&fromCache=1`
      });
      return;
    }

    this.directGenerate(formData, formHash);
  },

  async directGenerate(formData, formHash) {
    wx.showLoading({ title: '正在起名...' });

    try {
      const res = await api.generateName(formData);
      wx.hideLoading();

      if (res.code === 0) {
        cache.setResult(formHash, formData, res.data.names);
        api.logStat('result_view', formHash).catch(() => {});
        wx.navigateTo({
          url: `/pages/result/result?formHash=${formHash}`
        });
      } else if (res.code === 2) {
        wx.showModal({
          title: '提示',
          content: res.message || '暂无合适名字，请调整风格/生肖后重试',
          showCancel: false
        });
      } else {
        wx.showModal({
          title: '提示',
          content: res.message || '请求失败，请稍后重试',
          showCancel: true,
          confirmText: '重试',
          cancelText: '取消',
          success: (r) => { if (r.confirm) this.directGenerate(formData, formHash); }
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('[Form] generateNames error:', err);
      wx.showModal({
        title: '网络异常',
        content: '网络异常，请检查网络后重试',
        showCancel: true,
        confirmText: '重试',
        cancelText: '取消',
        success: (r) => { if (r.confirm) this.directGenerate(formData, formHash); }
      });
    }
  },

  // --- Reset ---
  onReset() {
    this.setData({
      surname: '',
      gender: '',
      birthDate: '',
      birthTime: '',
      birthTimeIndex: -1,
      zodiac: '',
      nameLength: '',
      styles: [],
      errors: {},
      isFormValid: false
    });
    wx.showToast({ title: '已清空', icon: 'none' });
  },

  // --- Helpers ---
  buildFormData() {
    return {
      surname: this.data.surname.trim(),
      gender: this.data.gender,
      zodiac: this.data.zodiac,
      birthDate: this.data.birthDate,
      birthTime: this.data.birthTime,
      nameLength: this.data.nameLength,
      styles: this.data.styles
    };
  },

  restoreForm(data) {
    const birthTimeIndex = constants.BIRTH_HOURS.findIndex(
      h => h.value === data.birthTime || h.label === data.birthTime
    );

    this.setData({
      surname: data.surname || '',
      gender: data.gender || '',
      birthDate: data.birthDate || '',
      birthTime: data.birthTime || '',
      birthTimeIndex: birthTimeIndex >= 0 ? birthTimeIndex : -1,
      zodiac: getZodiacFromDate(data.birthDate) || data.zodiac || '',
      nameLength: data.nameLength || '',
      styles: data.styles || []
    });

    ['surname', 'gender', 'birthDate', 'birthTime', 'nameLength', 'styles'].forEach(key => {
      this.validateField(key);
    });
  }
});
