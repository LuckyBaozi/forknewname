/**
 * 表单校验工具
 */

/**
 * 校验姓氏
 * @returns {{valid: boolean, message: string}}
 */
function validateSurname(value) {
  if (!value || value.trim() === '') {
    return { valid: false, message: '请输入姓氏' };
  }
  const trimmed = value.trim();
  if (!/^[一-鿿]{1,2}$/.test(trimmed)) {
    return { valid: false, message: '姓氏限1-2个汉字，不能包含数字或符号' };
  }
  return { valid: true, message: '' };
}

/**
 * 校验性别
 */
function validateGender(value) {
  if (!value || !['boy', 'girl'].includes(value)) {
    return { valid: false, message: '请选择性别' };
  }
  return { valid: true, message: '' };
}

/**
 * 校验出生日期
 */
function validateBirthDate(value) {
  if (!value) {
    return { valid: false, message: '请选择出生日期' };
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return { valid: false, message: '日期格式不合法' };
  }
  if (d > new Date()) {
    return { valid: false, message: '不可选择未来日期' };
  }
  return { valid: true, message: '' };
}

/**
 * 校验出生时间
 */
function validateBirthTime(value) {
  if (!value) {
    return { valid: false, message: '请选择出生时间' };
  }
  return { valid: true, message: '' };
}

/**
 * 校验名字字数
 */
function validateNameLength(value) {
  if (![2, 3].includes(value)) {
    return { valid: false, message: '请选择名字字数' };
  }
  return { valid: true, message: '' };
}

/**
 * 校验风格标签
 */
function validateStyles(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return { valid: false, message: '请至少选择1个名字风格' };
  }
  return { valid: true, message: '' };
}

/**
 * 校验整个表单
 * @param {object} formData
 * @returns {{valid: boolean, errors: object}}
 */
function validateForm(formData) {
  const fields = {
    surname: validateSurname(formData.surname),
    gender: validateGender(formData.gender),
    birthDate: validateBirthDate(formData.birthDate),
    birthTime: validateBirthTime(formData.birthTime),
    nameLength: validateNameLength(formData.nameLength),
    styles: validateStyles(formData.styles)
  };

  const errors = {};
  let valid = true;

  for (const [field, result] of Object.entries(fields)) {
    if (!result.valid) {
      errors[field] = result.message;
      valid = false;
    }
  }

  return { valid, errors };
}

module.exports = {
  validateSurname,
  validateGender,
  validateBirthDate,
  validateBirthTime,
  validateNameLength,
  validateStyles,
  validateForm
};
