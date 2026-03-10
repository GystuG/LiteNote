/**
 * 日期工具函数
 * 提供日期格式化、计算等常用功能
 */

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 获取月份的第一天
 */
export const getMonthFirstDay = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-01`;
};

/**
 * 获取月份的最后一天
 */
export const getMonthLastDay = (year: number, month: number): string => {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
};

/**
 * 获取当月的日期范围
 */
export const getCurrentMonthRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  return {
    startDate: getMonthFirstDay(now.getFullYear(), now.getMonth() + 1),
    endDate: getMonthLastDay(now.getFullYear(), now.getMonth() + 1),
  };
};

/**
 * 获取上月的日期范围
 */
export const getLastMonthRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const actualLastMonth = lastMonth + 1; // JavaScript月份是0-11，我们需要1-12
  
  return {
    startDate: getMonthFirstDay(lastMonthYear, actualLastMonth),
    endDate: getMonthLastDay(lastMonthYear, actualLastMonth),
  };
};

/**
 * 获取本季度的日期范围
 */
export const getCurrentQuarterRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const startMonth = quarter * 3 + 1;
  const endMonth = quarter * 3 + 3;
  
  return {
    startDate: getMonthFirstDay(now.getFullYear(), startMonth),
    endDate: getMonthLastDay(now.getFullYear(), endMonth),
  };
};

/**
 * 获取本年度的日期范围
 */
export const getCurrentYearRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  return {
    startDate: `${now.getFullYear()}-01-01`,
    endDate: `${now.getFullYear()}-12-31`,
  };
};

/**
 * 格式化月份显示（如：2024年1月）
 */
export const formatMonthDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
};
