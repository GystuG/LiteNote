/**
 * 服务层统一导出
 */

export * from './http';
export * from './api';
export { billsService } from './api/bills';
export { categoriesService } from './api/categories';
export { accountsService } from './api/accounts';
export { budgetsService } from './api/budgets';

// 支付通知服务（仅用于权限管理）
export { paymentNotificationService } from './paymentNotification';
export type { PermissionStatus } from './paymentNotification';

// 重新导出类型
export type {
  BillData,
  CreateBillDto,
  UpdateBillDto,
  BillQueryParams,
  BillStatistics
} from '../types/bill';

export type {
  CategoryData,
  CreateCategoryDto,
  UpdateCategoryDto
} from '../types/category';

export type {
  AccountData,
  CreateAccountDto,
  UpdateAccountDto,
  AccountBalance,
  AccountType
} from '../types/account';

export type {
  BudgetData,
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetProgress,
  BudgetPeriod
} from '../types/budget';
