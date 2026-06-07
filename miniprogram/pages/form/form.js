const validator = require('../../utils/validator');
const cache = require('../../utils/cache');
const api = require('../../utils/api');
const constants = require('../../utils/constants');

const app = getApp();

Page({
  data: {
    // Form fields
    surname: '',
    gender: '',
    zodiac: '',
    zodiacIndex: -1,
    birthDate: '',
    birthTime: '',
    birthTimeIndex: -1,
    region: [],
    regionStr: '',
    nameLength: '',
    styles: [],

    // Options
    genders: constants.GENDERS,
    zodiacs: constants.ZODIACS,
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
    // Update style tags from config
    if (app.globalData.config.styleTags) {
      this.setData({ styleTags: app.globalData.config.styleTags });
    }

    // Check for preserved form data (from "重新起名")
    const preserved = app.globalData.pendingForm;
    if (preserved) {
      this.restoreForm(preserved);
      app.globalData.pendingForm = null;
    }

    // Log page view
    api.logStat('page_view').catch(() => {});
  },

  // --- Input handlers ---

  onSurnameChange(e) {
    const surname = e.detail.value;
    this.setData({ surname });
    this.validateField('surname');
  },

  onGenderChange(e) {
    const gender = e.currentTarget.dataset.value;
    this.setData({ gender });
    this.validateField('gender');
  },

  onZodiacChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      zodiacIndex: index,
      zodiac: constants.ZODIACS[index]
    });
    this.validateField('zodiac');
  },

  onBirthDateChange(e) {
    this.setData({ birthDate: e.detail.value });
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

  onRegionChange(e) {
    const region = e.detail.value;
    this.setData({
      region: region,
      regionStr: region.join('-')
    });
  },

  onNameLengthChange(e) {
    const nameLength = e.currentTarget.dataset.value;
    this.setData({ nameLength });
    this.validateField('nameLength');
  },

  onStyleToggle(e) {
    const tag = e.currentTarget.dataset.tag;
    let styles = [...this.data.styles];
    const idx = styles.indexOf(tag);
    if (idx > -1) {
      styles.splice(idx, 1);
    } else {
      styles.push(tag);
    }
    this.setData({ styles });
    this.validateField('styles');
  },

  // --- Validation ---
  validateField(field) {
    const errors = { ...this.data.errors };
    const validators = {
      surname: () => validator.validateSurname(this.data.surname),
      gender: () => validator.validateGender(this.data.gender),
      zodiac: () => validator.validateZodiac(this.data.zodiac),
      birthDate: () => validator.validateBirthDate(this.data.birthDate),
      birthTime: () => validator.validateBirthTime(this.data.birthTime),
      nameLength: () => validator.validateNameLength(this.data.nameLength),
      styles: () => validator.validateStyles(this.data.styles)
    };

    if (validators[field]) {
      const result = validators[field]();
      if (result.valid) {
        delete errors[field];
      } else {
        errors[field] = result.message;
      }
    }

    const isFormValid = Object.keys(errors).length === 0 &&
      this.data.surname && this.data.gender && this.data.zodiac &&
      this.data.birthDate && this.data.birthTime &&
      this.data.nameLength && this.data.styles.length > 0;

    this.setData({ errors, isFormValid });
  },

  // --- Submit ---
  onSubmit() {
    // Full form validation
    const formData = this.buildFormData();
    const result = validator.validateForm(formData);

    if (!result.valid) {
      this.setData({ errors: result.errors });
      wx.showToast({ title: '请完善必填信息', icon: 'none' });
      return;
    }

    // Log form submit
    api.logStat('form_submit').catch(() => {});

    // Check cache first
    const { formHash, cached } = cache.checkCache(formData);

    if (cached) {
      // Cache hit — skip ad, go directly to result
      wx.navigateTo({
        url: `/pages/result/result?formHash=${formHash}&fromCache=1`
      });
      return;
    }

    // Cache miss — store form data and navigate to ad page
    app.globalData.pendingForm = {
      ...formData,
      formHash
    };

    wx.navigateTo({
      url: '/pages/ad/ad'
    });
  },

  // --- Reset ---
  onReset() {
    this.setData({
      surname: '',
      gender: '',
      zodiac: '',
      zodiacIndex: -1,
      birthDate: '',
      birthTime: '',
      birthTimeIndex: -1,
      region: [],
      regionStr: '',
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
      region: this.data.regionStr || '',
      nameLength: this.data.nameLength,
      styles: this.data.styles
    };
  },

  restoreForm(data) {
    const zodiacIndex = constants.ZODIACS.indexOf(data.zodiac);
    const birthTimeIndex = constants.BIRTH_HOURS.findIndex(
      h => h.value === data.birthTime || h.label === data.birthTime
    );

    this.setData({
      surname: data.surname || '',
      gender: data.gender || '',
      zodiac: data.zodiac || '',
      zodiacIndex: zodiacIndex >= 0 ? zodiacIndex : -1,
      birthDate: data.birthDate || '',
      birthTime: data.birthTime || '',
      birthTimeIndex: birthTimeIndex >= 0 ? birthTimeIndex : -1,
      region: data.region ? data.region.split('-') : [],
      regionStr: data.region || '',
      nameLength: data.nameLength || '',
      styles: data.styles || []
    });

    // Validate all fields on restore
    Object.keys(this.data).forEach(key => {
      if (['surname', 'gender', 'zodiac', 'birthDate', 'birthTime', 'nameLength', 'styles'].includes(key)) {
        this.validateField(key);
      }
    });
  }
});
