package com.litenote.utils

import android.content.Context
import android.util.Log
import io.sentry.Breadcrumb
import io.sentry.Sentry
import io.sentry.SentryLevel
import io.sentry.android.core.SentryAndroid
import io.sentry.protocol.User

/**
 * Sentry 日志工具类
 *
 * 功能：
 * 1. 统一的日志接口，同时输出到 Logcat 和 Sentry
 * 2. 支持添加面包屑（Breadcrumbs）追踪用户行为
 * 3. 支持添加上下文信息（Context）
 * 4. 支持捕获异常和错误
 *
 * 使用方式：
 * ```kotlin
 * // 初始化（在 Application.onCreate 中调用）
 * SentryLogger.init(context, "YOUR_SENTRY_DSN")
 *
 * // 记录日志
 * SentryLogger.i("TAG", "Info message")
 * SentryLogger.w("TAG", "Warning message")
 * SentryLogger.e("TAG", "Error message", exception)
 *
 * // 添加面包屑
 * SentryLogger.addBreadcrumb("User clicked button", mapOf("button_id" to "submit"))
 *
 * // 添加上下文
 * SentryLogger.setContext("payment", mapOf("amount" to 100.0, "source" to "alipay"))
 * ```
 *
 * @author LiteNote
 * @since 1.0.0
 */
object SentryLogger {

    private const val TAG = "SentryLogger"

    /** 是否已初始化 */
    private var isInitialized = false

    /** 是否启用 Sentry（可通过配置控制） */
    private var isEnabled = true

    /**
     * 初始化 Sentry
     *
     * @param context 应用上下文
     * @param dsn Sentry DSN（Data Source Name）
     *            获取方式：登录 Sentry -> 创建项目 -> 获取 DSN
     *            格式：https://[key]@[organization].ingest.sentry.io/[project-id]
     * @param environment 环境标识（development/production）
     * @param enabled 是否启用 Sentry（默认 true）
     */
    fun init(
        context: Context,
        dsn: String,
        environment: String = "production",
        enabled: Boolean = true
    ) {
        if (isInitialized) {
            Log.w(TAG, "Sentry 已经初始化，跳过重复初始化")
            return
        }

        isEnabled = enabled

        if (!isEnabled) {
            Log.i(TAG, "Sentry 已禁用，不进行初始化")
            return
        }

        try {
            SentryAndroid.init(context) { options ->
                // 设置 DSN
                options.dsn = dsn

                // 设置环境
                options.environment = environment

                // 设置发布版本（从 BuildConfig 获取）
                options.release = "${context.packageName}@${com.litenote.BuildConfig.VERSION_NAME}"

                // 设置采样率（1.0 = 100%，0.5 = 50%）
                // 生产环境建议降低采样率以节省配额
                options.tracesSampleRate = if (environment == "production") 0.2 else 1.0

                // 启用自动面包屑收集
                options.isEnableAutoSessionTracking = true

                // 设置日志级别（只发送 WARNING 及以上级别到 Sentry）
                options.setDiagnosticLevel(SentryLevel.WARNING)

                // 启用 ANR（Application Not Responding）检测
                options.isAnrEnabled = true

                // 设置 ANR 超时时间（毫秒）
                options.anrTimeoutIntervalMillis = 5000

                // 附加上下文信息
                options.setBeforeSend { event, hint ->
                    // 可以在这里过滤或修改事件
                    // 返回 null 表示不发送该事件
                    event
                }
            }

            isInitialized = true
            Log.i(TAG, "✓ Sentry 初始化成功 - 环境: $environment")

        } catch (e: Exception) {
            Log.e(TAG, "❌ Sentry 初始化失败", e)
            isEnabled = false
        }
    }

    /**
     * 设置用户信息
     *
     * @param userId 用户 ID
     * @param email 用户邮箱（可选）
     * @param username 用户名（可选）
     */
    fun setUser(userId: String, email: String? = null, username: String? = null) {
        if (!isEnabled) return

        try {
            val user = User().apply {
                id = userId
                this.email = email
                this.username = username
            }
            Sentry.setUser(user)
            Log.d(TAG, "✓ 已设置用户信息: userId=$userId")
        } catch (e: Exception) {
            Log.e(TAG, "设置用户信息失败", e)
        }
    }

    /**
     * 清除用户信息
     */
    fun clearUser() {
        if (!isEnabled) return

        try {
            Sentry.setUser(null)
            Log.d(TAG, "✓ 已清除用户信息")
        } catch (e: Exception) {
            Log.e(TAG, "清除用户信息失败", e)
        }
    }

    /**
     * 添加面包屑（Breadcrumb）
     *
     * 面包屑用于追踪用户行为路径，帮助重现问题
     *
     * @param message 面包屑消息
     * @param data 附加数据（可选）
     * @param category 分类（可选，如 "navigation", "user_action", "network"）
     * @param level 级别（默认 INFO）
     */
    fun addBreadcrumb(
        message: String,
        data: Map<String, Any>? = null,
        category: String? = null,
        level: SentryLevel = SentryLevel.INFO
    ) {
        if (!isEnabled) return

        try {
            val breadcrumb = Breadcrumb().apply {
                this.message = message
                this.category = category
                this.level = level
                data?.forEach { (key, value) ->
                    setData(key, value)
                }
            }
            Sentry.addBreadcrumb(breadcrumb)
            Log.d(TAG, "🍞 面包屑: $message")
        } catch (e: Exception) {
            Log.e(TAG, "添加面包屑失败", e)
        }
    }

    /**
     * 设置上下文信息
     *
     * 上下文信息会附加到所有后续的事件中
     *
     * @param key 上下文键（如 "payment", "user_action"）
     * @param data 上下文数据
     */
    fun setContext(key: String, data: Map<String, Any>) {
        if (!isEnabled) return

        try {
            Sentry.configureScope { scope ->
                data.forEach { (k, v) ->
                    scope.setExtra("${key}_${k}", v.toString())
                }
            }
            Log.d(TAG, "✓ 已设置上下文: $key")
        } catch (e: Exception) {
            Log.e(TAG, "设置上下文失败", e)
        }
    }

    /**
     * 设置标签
     *
     * 标签用于分类和过滤事件
     *
     * @param key 标签键
     * @param value 标签值
     */
    fun setTag(key: String, value: String) {
        if (!isEnabled) return

        try {
            Sentry.setTag(key, value)
            Log.d(TAG, "✓ 已设置标签: $key=$value")
        } catch (e: Exception) {
            Log.e(TAG, "设置标签失败", e)
        }
    }

    /**
     * Info 级别日志
     *
     * 用于记录一般信息，不会发送到 Sentry
     *
     * @param tag 日志标签
     * @param message 日志消息
     */
    fun i(tag: String, message: String) {
        Log.i(tag, message)

        // Info 级别只添加面包屑，不发送事件
        if (isEnabled) {
            addBreadcrumb(message, category = tag, level = SentryLevel.INFO)
        }
    }

    /**
     * Debug 级别日志
     *
     * 用于调试信息，不会发送到 Sentry
     *
     * @param tag 日志标签
     * @param message 日志消息
     */
    fun d(tag: String, message: String) {
        Log.d(tag, message)

        // Debug 级别只添加面包屑，不发送事件
        if (isEnabled) {
            addBreadcrumb(message, category = tag, level = SentryLevel.DEBUG)
        }
    }

    /**
     * Warning 级别日志
     *
     * 用于警告信息，会发送到 Sentry
     *
     * @param tag 日志标签
     * @param message 日志消息
     * @param data 附加数据（可选）
     */
    fun w(tag: String, message: String, data: Map<String, Any>? = null) {
        Log.w(tag, message)

        if (!isEnabled) return

        try {
            // 添加面包屑
            addBreadcrumb(message, data, category = tag, level = SentryLevel.WARNING)

            // 发送警告事件到 Sentry
            Sentry.captureMessage(message, SentryLevel.WARNING)
        } catch (e: Exception) {
            Log.e(TAG, "发送警告到 Sentry 失败", e)
        }
    }

    /**
     * Error 级别日志
     *
     * 用于错误信息，会发送到 Sentry
     *
     * @param tag 日志标签
     * @param message 日志消息
     * @param throwable 异常对象（可选）
     * @param data 附加数据（可选）
     */
    fun e(tag: String, message: String, throwable: Throwable? = null, data: Map<String, Any>? = null) {
        Log.e(tag, message, throwable)

        if (!isEnabled) return

        try {
            // 添加面包屑
            addBreadcrumb(message, data, category = tag, level = SentryLevel.ERROR)

            // 发送错误到 Sentry
            if (throwable != null) {
                Sentry.captureException(throwable) { scope ->
                    if (data != null) {
                        data.forEach { (k, v) ->
                            scope.setExtra("error_$k", v.toString())
                        }
                    }
                }
            } else {
                Sentry.captureMessage(message, SentryLevel.ERROR)
            }
        } catch (e: Exception) {
            Log.e(TAG, "发送错误到 Sentry 失败", e)
        }
    }

    /**
     * 捕获异常
     *
     * 直接捕获异常并发送到 Sentry
     *
     * @param throwable 异常对象
     * @param message 附加消息（可选）
     * @param data 附加数据（可选）
     */
    fun captureException(throwable: Throwable, message: String? = null, data: Map<String, Any>? = null) {
        Log.e(TAG, message ?: "捕获异常", throwable)

        if (!isEnabled) return

        try {
            Sentry.captureException(throwable) { scope ->
                if (message != null) {
                    scope.setExtra("exception_message", message)
                }
                if (data != null) {
                    data.forEach { (k, v) ->
                        scope.setExtra("exception_$k", v.toString())
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "捕获异常到 Sentry 失败", e)
        }
    }

    /**
     * 手动发送消息到 Sentry
     *
     * @param message 消息内容
     * @param level 日志级别
     * @param data 附加数据（可选）
     */
    fun captureMessage(message: String, level: SentryLevel = SentryLevel.INFO, data: Map<String, Any>? = null) {
        Log.i(TAG, "发送消息到 Sentry: $message")

        if (!isEnabled) return

        try {
            Sentry.captureMessage(message, level) { scope ->
                if (data != null) {
                    data.forEach { (k, v) ->
                        scope.setExtra("message_$k", v.toString())
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "发送消息到 Sentry 失败", e)
        }
    }

    /**
     * 刷新 Sentry 缓存
     *
     * 确保所有待发送的事件都被发送
     * 通常在应用退出前调用
     *
     * @param timeoutMillis 超时时间（毫秒）
     */
    fun flush(timeoutMillis: Long = 2000) {
        if (!isEnabled) return

        try {
            Sentry.flush(timeoutMillis)
            Log.d(TAG, "✓ Sentry 缓存已刷新")
        } catch (e: Exception) {
            Log.e(TAG, "刷新 Sentry 缓存失败", e)
        }
    }

    /**
     * 关闭 Sentry
     *
     * 通常在应用退出时调用
     */
    fun close() {
        if (!isEnabled) return

        try {
            Sentry.close()
            isInitialized = false
            Log.i(TAG, "✓ Sentry 已关闭")
        } catch (e: Exception) {
            Log.e(TAG, "关闭 Sentry 失败", e)
        }
    }
}
