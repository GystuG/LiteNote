/**
 * 预算 API 服务
 */
import { httpService } from '../http';
import type {
  BudgetData,
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetProgress,
} from '../../types/budget';
import type { ApiResponse } from '../../types/api';

class BudgetsService {
  private basePath = '/budgets';

  async getAll(): Promise<ApiResponse<BudgetData[]>> {
    return httpService.get<BudgetData[]>(this.basePath);
  }

  async getById(id: number): Promise<ApiResponse<BudgetData>> {
    return httpService.get<BudgetData>(`${this.basePath}/${id}`);
  }

  async create(data: CreateBudgetDto): Promise<ApiResponse<BudgetData>> {
    return httpService.post<BudgetData>(this.basePath, data);
  }

  async update(id: number, data: UpdateBudgetDto): Promise<ApiResponse<void>> {
    return httpService.patch<void>(`${this.basePath}/${id}`, data);
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return httpService.delete<void>(`${this.basePath}/${id}`);
  }

  async getProgress(): Promise<ApiResponse<BudgetProgress[]>> {
    return httpService.get<BudgetProgress[]>(`${this.basePath}/progress`);
  }
}

export const budgetsService = new BudgetsService();
