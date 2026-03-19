import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadHotUpdateDto } from './dto/hot-update.dto';

@Injectable()
export class HotUpdateService {
  constructor(private prisma: PrismaService) {}

  // 版本号转数字码: "0.0.29" -> 29
  versionToCode(version: string): number {
    const [major, minor, patch] = version.split('.').map(Number);
    return major * 10000 + minor * 100 + patch;
  }

  // 创建或覆盖热更新版本（相同 bundleVersion 则更新）
  async create(dto: UploadHotUpdateDto, downloadUrl: string, fileSize: number) {
    const data = {
      targetVersion: dto.targetVersion,
      minNativeCode: dto.minNativeCode,
      maxNativeCode: dto.maxNativeCode ?? null,
      bundleType: dto.bundleType || 'business',
      downloadUrl,
      fileHash: dto.fileHash,
      fileSize,
      updateLog: dto.updateLog,
      forceUpdate: dto.forceUpdate ?? false,
      platform: dto.platform || 'android',
      // 重新上传时清空旧的补丁信息
      patchFromVersion: null,
      patchUrl: null,
      patchHash: null,
      patchSize: null,
    };

    return this.prisma.hotUpdate.upsert({
      where: { bundleVersion: dto.bundleVersion },
      create: { bundleVersion: dto.bundleVersion, ...data },
      update: data,
    });
  }

  // 更新补丁信息
  async updatePatchInfo(
    id: number,
    patchInfo: {
      patchFromVersion: number;
      patchUrl: string;
      patchHash: string;
      patchSize: number;
    },
  ) {
    return this.prisma.hotUpdate.update({
      where: { id },
      data: patchInfo,
    });
  }

  // 检查热更新
  async checkUpdate(
    nativeVersion: string,
    bundleVersion: number,
    platform = 'android',
  ) {
    const nativeCode = this.versionToCode(nativeVersion);

    // 查找兼容当前原生版本、比当前 bundleVersion 更新、且活跃的最新版本
    const latest = await this.prisma.hotUpdate.findFirst({
      where: {
        platform,
        isActive: true,
        bundleVersion: { gt: bundleVersion },
        minNativeCode: { lte: nativeCode },
        OR: [
          { maxNativeCode: null },
          { maxNativeCode: { gte: nativeCode } },
        ],
      },
      orderBy: { bundleVersion: 'desc' },
    });

    if (!latest) {
      return { hasUpdate: false };
    }

    // 检查是否有从客户端当前版本到最新版本的 diff 补丁
    const patchAvailable =
      latest.patchFromVersion === bundleVersion &&
      !!latest.patchUrl &&
      !!latest.patchHash;

    return {
      hasUpdate: true,
      bundle: {
        bundleVersion: latest.bundleVersion,
        bundleType: latest.bundleType,
        downloadUrl: latest.downloadUrl,
        fileHash: latest.fileHash,
        fileSize: latest.fileSize,
        patchAvailable,
        patchUrl: patchAvailable ? latest.patchUrl : undefined,
        patchHash: patchAvailable ? latest.patchHash : undefined,
        patchSize: patchAvailable ? latest.patchSize : undefined,
        updateLog: latest.updateLog,
        forceUpdate: latest.forceUpdate,
      },
    };
  }

  // 获取所有版本
  async findAll(platform?: string) {
    return this.prisma.hotUpdate.findMany({
      where: platform ? { platform } : undefined,
      orderBy: { bundleVersion: 'desc' },
    });
  }

  // 停用版本
  async deactivate(id: number) {
    const record = await this.prisma.hotUpdate.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`热更新版本 #${id} 不存在`);
    }
    return this.prisma.hotUpdate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // 删除版本
  async remove(id: number) {
    const record = await this.prisma.hotUpdate.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`热更新版本 #${id} 不存在`);
    }
    return this.prisma.hotUpdate.delete({ where: { id } });
  }

  // 根据 bundleVersion 查找
  async findByBundleVersion(bundleVersion: number) {
    return this.prisma.hotUpdate.findUnique({
      where: { bundleVersion },
    });
  }
}
