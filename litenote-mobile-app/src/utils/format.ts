/**
 * 格式化工具类
 */

/**
 * 货币格式化
 */
export const formatCurrency = (
  amount: number,
  currency: string = '¥',
  decimals: number = 2
): string => {
  if (isNaN(amount)) {
    return `${currency}0.00`;
  }

  const formatted = amount.toFixed(decimals);
  const parts = formatted.split('.');
  
  // 添加千分位分隔符
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${currency}${parts.join('.')}`;
};

/**
 * 日期格式化
 */
export const formatDate = (
  date: string | Date,
  format: 'YYYY-MM-DD' | 'MM-DD' | 'YYYY年MM月DD日' | 'MM月DD日' = 'YYYY-MM-DD'
): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM-DD':
      return `${month}-${day}`;
    case 'YYYY年MM月DD日':
      return `${year}年${month}月${day}日`;
    case 'MM月DD日':
      return `${month}月${day}日`;
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * 时间格式化
 */
export const formatTime = (
  date: string | Date,
  format: 'HH:mm' | 'HH:mm:ss' = 'HH:mm'
): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'HH:mm':
      return `${hours}:${minutes}`;
    case 'HH:mm:ss':
      return `${hours}:${minutes}:${seconds}`;
    default:
      return `${hours}:${minutes}`;
  }
};

/**
 * 相对时间格式化
 */
export const formatRelativeTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return formatDate(d, 'MM-DD');
  }
};

/**
 * 数字格式化
 */
export const formatNumber = (
  num: number,
  decimals: number = 0,
  separator: string = ','
): string => {
  if (isNaN(num)) {
    return '0';
  }

  const fixed = num.toFixed(decimals);
  const parts = fixed.split('.');
  
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  
  return parts.join('.');
};

/**
 * 百分比格式化
 */
export const formatPercentage = (
  value: number,
  total: number,
  decimals: number = 1
): string => {
  if (total === 0) {
    return '0%';
  }

  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * 文件大小格式化
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 B';
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 手机号格式化
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  
  return phone;
};

/**
 * 银行卡号格式化
 */
export const formatBankCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
};

/**
 * 截断文本
 */
export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * 首字母大写
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * 驼峰转下划线
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * 下划线转驼峰
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
