/**
 * 财务目标 API 服务
 */
import { httpService } from '../http';
import type {
  FinancialGoalData,
  CreateFinancialGoalDto,
  UpdateFinancialGoalDto,
  FinancialGoalProgress,
} from '../../types/financial-goal';
import type { ApiResponse } from '../../types/api';

class FinancialGoalsService {
  private basePath = '/financial-goals';

  async getAll(): Promise<ApiResponse<FinancialGoalData[]>> {
    return httpService.get<FinancialGoalData[]>(this.basePath);
  }

  async getById(id: number): Promise<ApiResponse<FinancialGoalData>> {
    return httpService.get<FinancialGoalData>(`${this.basePath}/${id}`);
  }

  async create(data: CreateFinancialGoalDto): Promise<ApiResponse<FinancialGoalData>> {
    return httpService.post<FinancialGoalData>(this.basePath, data);
  }

  async update(id: number, data: UpdateFinancialGoalDto): Promise<ApiResponse<void>> {
    return httpService.patch<void>(`${this.basePath}/${id}`, data);
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return httpService.delete<void>(`${this.basePath}/${id}`);
  }

  async getProgress(): Promise<ApiResponse<FinancialGoalProgress[]>> {
    return httpService.get<FinancialGoalProgress[]>(`${this.basePath}/progress`);
  }
}

export const financialGoalsService = new FinancialGoalsService();
