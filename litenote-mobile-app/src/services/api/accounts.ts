/**
 * 账户 API 服务
 */
import { httpService } from '../http';
import type {
  AccountData,
  CreateAccountDto,
  UpdateAccountDto,
  AccountBalance,
} from '../../types/account';
import type { ApiResponse } from '../../types/api';

class AccountsService {
  private basePath = '/accounts';

  async getAll(): Promise<ApiResponse<AccountData[]>> {
    return httpService.get<AccountData[]>(this.basePath);
  }

  async getById(id: number): Promise<ApiResponse<AccountData>> {
    return httpService.get<AccountData>(`${this.basePath}/${id}`);
  }

  async create(data: CreateAccountDto): Promise<ApiResponse<AccountData>> {
    return httpService.post<AccountData>(this.basePath, data);
  }

  async update(id: number, data: UpdateAccountDto): Promise<ApiResponse<void>> {
    return httpService.patch<void>(`${this.basePath}/${id}`, data);
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return httpService.delete<void>(`${this.basePath}/${id}`);
  }

  async getTotalBalance(): Promise<ApiResponse<AccountBalance>> {
    return httpService.get<AccountBalance>(`${this.basePath}/balance`);
  }
}

export const accountsService = new AccountsService();
