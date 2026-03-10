import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAIConfigDto,
  UpdateAIConfigDto,
  AIConfigResponseDto,
  AIConfigDetailResponseDto,
} from './dto/ai-config.dto';

/**
 * AI 模型配置服务
 */
@Injectable()
export class AIConfigService {
  private readonly logger = new Logger(AIConfigService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户的所有 AI 模型配置
   */
  async findAll(userId: string): Promise<AIConfigResponseDto[]> {
    const configs = await this.prisma.aIModelConfig.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return configs.map(this.toResponseDto);
  }

  /**
   * 获取单个配置
   */
  async findOne(userId: string, id: number): Promise<AIConfigResponseDto> {
    const config = await this.prisma.aIModelConfig.findFirst({
      where: { id, userId },
    });

    if (!config) {
      throw new NotFoundException('模型配置不存在');
    }

    return this.toResponseDto(config);
  }

  /**
   * 获取单个配置（包含 API Key，用于编辑）
   */
  async findOneDetail(userId: string, id: number): Promise<AIConfigDetailResponseDto> {
    const config = await this.prisma.aIModelConfig.findFirst({
      where: { id, userId },
    });

    if (!config) {
      throw new NotFoundException('模型配置不存在');
    }

    return this.toDetailResponseDto(config);
  }

  /**
   * 获取用户的默认配置
   */
  async findDefault(userId: string) {
    return this.prisma.aIModelConfig.findFirst({
      where: { userId, isDefault: true },
    });
  }

  /**
   * 创建配置
   */
  async create(
    userId: string,
    dto: CreateAIConfigDto,
  ): Promise<AIConfigResponseDto> {
    // 如果设为默认，先取消其他默认配置
    if (dto.isDefault) {
      await this.clearDefaultConfig(userId);
    }

    const config = await this.prisma.aIModelConfig.create({
      data: {
        userId,
        name: dto.name,
        provider: dto.provider,
        apiKey: dto.apiKey,
        apiBaseUrl: dto.apiBaseUrl,
        model: dto.model,
        supportsVision: dto.supportsVision ?? false,
        isDefault: dto.isDefault ?? false,
      },
    });

    return this.toResponseDto(config);
  }

  /**
   * 更新配置
   */
  async update(
    userId: string,
    id: number,
    dto: UpdateAIConfigDto,
  ): Promise<AIConfigResponseDto> {
    // 检查配置是否存在
    await this.findOne(userId, id);

    // 如果设为默认，先取消其他默认配置
    if (dto.isDefault) {
      await this.clearDefaultConfig(userId);
    }

    const config = await this.prisma.aIModelConfig.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.provider !== undefined && { provider: dto.provider }),
        ...(dto.apiKey !== undefined && { apiKey: dto.apiKey }),
        ...(dto.apiBaseUrl !== undefined && { apiBaseUrl: dto.apiBaseUrl }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.supportsVision !== undefined && {
          supportsVision: dto.supportsVision,
        }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });

    return this.toResponseDto(config);
  }

  /**
   * 删除配置
   */
  async remove(userId: string, id: number): Promise<void> {
    // 检查配置是否存在
    await this.findOne(userId, id);

    await this.prisma.aIModelConfig.delete({
      where: { id },
    });
  }

  /**
   * 设置默认配置
   */
  async setDefault(userId: string, id: number): Promise<AIConfigResponseDto> {
    // 检查配置是否存在
    await this.findOne(userId, id);

    // 取消其他默认配置
    await this.clearDefaultConfig(userId);

    // 设置为默认
    const config = await this.prisma.aIModelConfig.update({
      where: { id },
      data: { isDefault: true },
    });

    return this.toResponseDto(config);
  }

  /**
   * 获取完整配置（包含 API Key，用于内部调用）
   */
  async getFullConfig(userId: string, id: number) {
    const config = await this.prisma.aIModelConfig.findFirst({
      where: { id, userId },
    });

    if (!config) {
      throw new NotFoundException('模型配置不存在');
    }

    return config;
  }

  /**
   * 取消用户所有默认配置
   */
  private async clearDefaultConfig(userId: string): Promise<void> {
    await this.prisma.aIModelConfig.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  /**
   * 转换为响应 DTO（隐藏敏感信息）
   */
  private toResponseDto(config: any): AIConfigResponseDto {
    return {
      id: config.id,
      name: config.name,
      provider: config.provider,
      model: config.model,
      apiBaseUrl: config.apiBaseUrl,
      isDefault: config.isDefault,
      supportsVision: config.supportsVision,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * 转换为详情响应 DTO（包含 API Key）
   */
  private toDetailResponseDto(config: any): AIConfigDetailResponseDto {
    return {
      ...this.toResponseDto(config),
      apiKey: config.apiKey,
    };
  }
}
