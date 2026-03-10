/**
 * 录音服务 - 基于 react-native-audio-recorder-player
 *
 * 封装录音、停止、取消功能，返回 base64 编码的音频数据用于 ASR 转写
 * 支持 Android 和 iOS 双端
 *
 * 注意：当前使用的 react-native-audio-recorder-player (Nitro 版本) 存在已知 bug：
 * 当 MediaRecorder.stop() 失败时（如无音频帧输入），库内部的 metering Timer 线程
 * 不会被清理，后续 Timer 访问已释放的 MediaRecorder 会导致 SIGSEGV。
 * 本服务通过以下策略规避：
 * 1. 使用 MIC 音源代替 VOICE_RECOGNITION，确保始终有音频帧输入
 * 2. stopRecorder 失败后标记为"已污染"，阻止后续录音（因 Timer 泄漏无法修复）
 * 3. 禁用 metering（meteringEnabled=false）从根本上避免 Timer 线程创建
 */

import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
  type RecordBackType,
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid } from 'react-native';

// ============ 类型定义 ============

export type RecordingState = 'idle' | 'starting' | 'recording' | 'stopping';

export interface RecordingResult {
  /** 音频文件路径 */
  filePath: string;
  /** 音频时长（秒） */
  duration: number;
  /** Base64 编码的音频数据 */
  base64: string;
  /** MIME 类型 */
  mimeType: string;
  /** 文件大小（字节） */
  fileSize: number;
}

export interface RecordingProgress {
  /** 当前录音时长（毫秒） */
  currentPosition: number;
  /** 当前音量（0-1 归一化） */
  currentMetering?: number;
}

// ============ 服务实现 ============

class AudioRecorderService {
  private state: RecordingState = 'idle';
  private recordingPath: string = '';
  private recordingStartTime: number = 0;
  /** 跟踪 startRecording 的异步操作，供 stop/cancel 等待 */
  private startPromise: Promise<void> | null = null;
  /**
   * 标记原生录音模块是否已污染（stopRecorder 失败后 Timer 泄漏）
   * 一旦污染，后续录音全部拒绝，直到 App 重启
   */
  private poisoned: boolean = false;

  /**
   * 请求麦克风权限
   * - Android: 运行时请求 RECORD_AUDIO
   * - iOS: 由 Info.plist 声明，系统在首次调用录音 API 时自动弹窗
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: '麦克风权限',
          message: '需要麦克风权限来进行语音识别',
          buttonNeutral: '稍后询问',
          buttonNegative: '拒绝',
          buttonPositive: '允许',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('[AudioRecorder] 请求权限失败:', err);
      return false;
    }
  }

  /**
   * 开始录音
   * @param onProgress 录音进度回调（含时长和音量）
   */
  async startRecording(
    onProgress?: (progress: RecordingProgress) => void,
  ): Promise<void> {
    // 如果上次 stopRecorder 失败导致原生 Timer 泄漏，拒绝新录音
    if (this.poisoned) {
      throw new Error('录音模块异常，请重启应用后再试');
    }

    // 非 idle 状态一律拒绝，防止并发启动
    if (this.state !== 'idle') {
      console.warn('[AudioRecorder] 无法开始录音，当前状态:', this.state);
      return;
    }

    // 检查权限
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('麦克风权限被拒绝');
    }

    // 标记为 starting，阻止重复调用；同时保存 promise 供 stop/cancel 等待
    this.state = 'starting';
    this.startPromise = this.doStart(onProgress);

    try {
      await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  /**
   * 实际启动录音的内部方法
   */
  private async doStart(
    onProgress?: (progress: RecordingProgress) => void,
  ): Promise<void> {
    try {
      // 生成临时文件路径
      const timestamp = Date.now();
      const dir = RNFS.CachesDirectoryPath;
      this.recordingPath = `${dir}/voice_${timestamp}.m4a`;

      // 注册进度回调（在 startRecorder 之前）
      // 注意：仅用于接收 JS 层的时长回调，metering 由原生时钟驱动的问题见下方
      AudioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
        if (this.state !== 'recording' || !onProgress) {
          return;
        }

        onProgress({
          currentPosition: e.currentPosition,
          // metering 已禁用，返回固定值供 UI 使用
          currentMetering: 0.5,
        });
      });

      // 开始录音（双端配置）
      // 关键：meteringEnabled 设为 false，避免库创建原生 Timer 线程
      // 该 Timer 在 stopRecorder 失败时不会被清理，会导致 SIGSEGV
      await AudioRecorderPlayer.startRecorder(
        this.recordingPath,
        {
          // Android: 使用 MIC 而非 VOICE_RECOGNITION
          // VOICE_RECOGNITION 在模拟器或低端设备上可能不产生音频帧，
          // 导致 MediaRecorder.stop() 抛出 -1007 (INVALID_OPERATION)
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
          // iOS
          AVFormatIDKeyIOS: 'aac' as any,
          AVSampleRateKeyIOS: 44100,
          AVNumberOfChannelsKeyIOS: 1,
          AVEncoderAudioQualityKeyIOS: 96 as any,
        },
        false, // meteringEnabled = false，禁用原生 getMaxAmplitude Timer
      );

      // 如果在 await 期间已经被 cancel/stop 了（state 不再是 starting），不转为 recording
      if (this.state === 'starting') {
        this.state = 'recording';
        this.recordingStartTime = Date.now();
        console.log('[AudioRecorder] 录音开始:', this.recordingPath);
      }
    } catch (error: any) {
      console.error('[AudioRecorder] 开始录音失败:', error);
      this.safeCleanup();
      throw new Error(error.message || '开始录音失败');
    }
  }

  /**
   * 停止录音并返回结果
   */
  async stopRecording(): Promise<RecordingResult | null> {
    // 如果 start 还在进行中，等它完成
    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        // start 失败了，没有东西可以 stop
        return null;
      }
    }

    if (this.state !== 'recording') {
      console.warn('[AudioRecorder] 无法停止，当前状态:', this.state);
      return null;
    }

    // 确保 MediaRecorder 有足够时间写入数据，否则 stop() 会抛 RuntimeException
    const elapsed = Date.now() - this.recordingStartTime;
    const MIN_RECORD_MS = 500;
    if (elapsed < MIN_RECORD_MS) {
      const waitTime = MIN_RECORD_MS - elapsed;
      console.log(`[AudioRecorder] 录音时间过短(${elapsed}ms)，等待 ${waitTime}ms`);
      await new Promise<void>(resolve => setTimeout(resolve, waitTime));
    }

    this.state = 'stopping';

    // 先移除 JS 层回调
    try {
      AudioRecorderPlayer.removeRecordBackListener();
    } catch {
      // ignore
    }

    try {
      const result = await AudioRecorderPlayer.stopRecorder();

      const filePath = result || this.recordingPath;
      const duration = (Date.now() - this.recordingStartTime) / 1000;

      // 确认文件存在
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        console.warn('[AudioRecorder] 录音文件不存在:', filePath);
        this.state = 'idle';
        return null;
      }

      // 读取文件信息
      const stat = await RNFS.stat(filePath);
      const fileSize = Number(stat.size);

      // 读取文件为 base64
      const base64 = await RNFS.readFile(filePath, 'base64');

      console.log('[AudioRecorder] 录音完成:', {
        duration: duration.toFixed(1) + 's',
        fileSize: (fileSize / 1024).toFixed(1) + 'KB',
      });

      this.state = 'idle';

      return {
        filePath,
        duration,
        base64,
        mimeType: 'audio/mp4',
        fileSize,
      };
    } catch (error: any) {
      console.error('[AudioRecorder] 停止录音失败:', error);
      // stopRecorder 失败意味着原生 Timer 可能泄漏，标记为污染状态
      // 后续不允许再次录音，防止 SIGSEGV
      this.poisoned = true;
      this.state = 'idle';
      this.recordingPath = '';
      console.error('[AudioRecorder] 原生模块已污染，后续录音将被拒绝直到 App 重启');
      return null;
    }
  }

  /**
   * 取消录音（不保存）
   */
  async cancelRecording(): Promise<void> {
    // 如果 start 还在进行中，等它完成再取消
    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        // start 失败，已经清理过了
        this.state = 'idle';
        return;
      }
    }

    if (this.state !== 'recording' && this.state !== 'starting') {
      this.state = 'idle';
      return;
    }

    // 先移除 JS 层回调
    try {
      AudioRecorderPlayer.removeRecordBackListener();
    } catch {
      // ignore
    }

    try {
      await AudioRecorderPlayer.stopRecorder();
      console.log('[AudioRecorder] 录音已取消');
    } catch (error) {
      console.warn('[AudioRecorder] 取消时 stop 失败:', error);
      // 同样标记污染
      this.poisoned = true;
      console.error('[AudioRecorder] 原生模块已污染，后续录音将被拒绝直到 App 重启');
    } finally {
      this.deleteRecordingFile();
      this.state = 'idle';
    }
  }

  /**
   * 获取当前录音状态
   */
  getState(): RecordingState {
    return this.state;
  }

  /**
   * 是否正在录音（包括正在启动中）
   */
  isRecording(): boolean {
    return this.state === 'recording' || this.state === 'starting';
  }

  /**
   * 模块是否已污染（stopRecorder 曾失败）
   */
  isPoisoned(): boolean {
    return this.poisoned;
  }

  /**
   * 清理临时录音文件
   */
  async deleteRecordingFile(): Promise<void> {
    if (this.recordingPath) {
      try {
        const exists = await RNFS.exists(this.recordingPath);
        if (exists) {
          await RNFS.unlink(this.recordingPath);
        }
      } catch {
        // 忽略清理错误
      }
      this.recordingPath = '';
    }
  }

  /**
   * 安全清理（容错，不抛异常）
   */
  private safeCleanup(): void {
    try {
      AudioRecorderPlayer.removeRecordBackListener();
    } catch {
      // ignore
    }
    this.state = 'idle';
    this.recordingPath = '';
  }
}

// 导出单例
export const audioRecorderService = new AudioRecorderService();
