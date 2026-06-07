/**
 * 常量数据 — 生肖、风格、性别等枚举
 */

// 十二生肖
const ZODIACS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 性别选项
const GENDERS = [
  { value: 'boy', label: '男孩' },
  { value: 'girl', label: '女孩' },
  { value: 'neutral', label: '中性' }
];

// 名字字数
const NAME_LENGTHS = [
  { value: 2, label: '两字名（如：张伟）' },
  { value: 3, label: '三字名（如：张晓明）' }
];

// 名字风格（默认列表，会被服务器配置覆盖）
const STYLE_TAGS = ['文雅', '顺口', '大气', '温婉', '古风'];

// 时辰选项
const BIRTH_HOURS = [
  { value: '00:00', label: '子时 (23:00-01:00)' },
  { value: '01:00', label: '丑时 (01:00-03:00)' },
  { value: '03:00', label: '寅时 (03:00-05:00)' },
  { value: '05:00', label: '卯时 (05:00-07:00)' },
  { value: '07:00', label: '辰时 (07:00-09:00)' },
  { value: '09:00', label: '巳时 (09:00-11:00)' },
  { value: '11:00', label: '午时 (11:00-13:00)' },
  { value: '13:00', label: '未时 (13:00-15:00)' },
  { value: '15:00', label: '申时 (15:00-17:00)' },
  { value: '17:00', label: '酉时 (17:00-19:00)' },
  { value: '19:00', label: '戌时 (19:00-21:00)' },
  { value: '21:00', label: '亥时 (21:00-23:00)' },
  { value: 'unknown', label: '时辰未知' }
];

module.exports = {
  ZODIACS,
  GENDERS,
  NAME_LENGTHS,
  STYLE_TAGS,
  BIRTH_HOURS
};
