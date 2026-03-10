import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppVersionDto } from './dto/app-version.dto';

@Injectable()
export class AppVersionService {
  constructor(private prisma: PrismaService) {}

  // 版本号转 versionCode: "1.2.3" -> 10203
  private versionToCode(version: string): number {
    const [major, minor, patch] = version.split('.').map(Number);
    return major * 10000 + minor * 100 + patch;
  }

  // 创建或覆盖版本（相同版本号则更新）
  async create(dto: CreateAppVersionDto, downloadUrl: string) {
    const versionCode = this.versionToCode(dto.version);
    const platform = dto.platform ?? 'android';

    const data = {
      versionCode,
      downloadUrl,
      updateLog: dto.updateLog,
      forceUpdate: dto.forceUpdate ?? false,
      platform,
    };

    return this.prisma.appVersion.upsert({
      where: { version: dto.version },
      create: { version: dto.version, ...data },
      update: data,
    });
  }

  // 获取最新版本
  async getLatest(platform = 'android') {
    const version = await this.prisma.appVersion.findFirst({
      where: { platform },
      orderBy: { versionCode: 'desc' },
    });

    if (!version) {
      throw new NotFoundException('暂无版本信息');
    }

    return version;
  }

  // 检查更新
  async checkUpdate(currentVersion: string, platform = 'android') {
    const currentCode = this.versionToCode(currentVersion);
    const latest = await this.prisma.appVersion.findFirst({
      where: { platform },
      orderBy: { versionCode: 'desc' },
    });

    if (!latest || latest.versionCode <= currentCode) {
      return { hasUpdate: false };
    }

    return {
      hasUpdate: true,
      latestVersion: latest,
    };
  }

  // 获取所有版本
  async findAll(platform?: string) {
    return this.prisma.appVersion.findMany({
      where: platform ? { platform } : undefined,
      orderBy: { versionCode: 'desc' },
    });
  }

  // 删除版本
  async remove(id: number) {
    return this.prisma.appVersion.delete({ where: { id } });
  }
}
