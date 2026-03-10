/**
 * 账单相关API服务
 */
import { httpService } from '../http';
import type { 
  BillData, 
  CreateBillDto, 
  UpdateBillDto, 
  BillQueryParams, 
  BillStatistics 
} from '../../types/bill';
import type { ApiResponse, PaginatedResponse } from '../../types/api';

// 账单列表响应类型别名
type BillListResponse = PaginatedResponse<BillData>;

class BillsService {
  /**
   * 创建账单
   */
  async createBill(data: CreateBillDto): Promise<ApiResponse<BillData>> {
    return httpService.post('/bills', data);
  }

  /**
   * 获取账单列表
   */
  async getBills(params?: BillQueryParams): Promise<PaginatedResponse<BillData>> {
    // 后端返回的数据格式是 { success, message, data, pagination }
    // 直接返回整个响应，因为它已经包含了 data 和 pagination
    return httpService.get('/bills', { params }) as Promise<PaginatedResponse<BillData>>;
  }

  /**
   * 获取账单详情
   */
  async getBillById(id: number): Promise<ApiResponse<BillData>> {
    return httpService.get(`/bills/${id}`);
  }

  /**
   * 更新账单
   */
  async updateBill(id: number, data: UpdateBillDto): Promise<ApiResponse<BillData>> {
    return httpService.patch(`/bills/${id}`, data);
  }

  /**
   * 删除账单
   */
  async deleteBill(id: number): Promise<ApiResponse> {
    return httpService.delete(`/bills/${id}`);
  }

  /**
   * 获取账单统计信息
   */
  async getBillStatistics(params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'daily' | 'monthly';
  }): Promise<ApiResponse<BillStatistics>> {
    const queryParams: any = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.granularity) queryParams.granularity = params.granularity;

    return httpService.get('/bills/statistics', { params: queryParams });
  }

  /**
   * 获取今日账单
   */
  async getTodayBills(): Promise<BillListResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.getBills({
      startDate: today,
      endDate: today,
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });
  }

  /**
   * 获取本月账单
   */
  async getMonthBills(year?: number, month?: number): Promise<BillListResponse> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    
    const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
    const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];
    
    return this.getBills({
      startDate,
      endDate,
      orderBy: 'date',
      orderDirection: 'desc',
      limit: 100,
    });
  }

  /**
   * 按分类获取账单
   */
  async getBillsByCategory(categoryId: number, params?: BillQueryParams): Promise<BillListResponse> {
    return this.getBills({
      ...params,
      categoryId,
    });
  }

  /**
   * 按类型获取账单
   */
  async getBillsByType(type: 'income' | 'expense', params?: BillQueryParams): Promise<BillListResponse> {
    return this.getBills({
      ...params,
      type,
    });
  }
}

export const billsService = new BillsService();
