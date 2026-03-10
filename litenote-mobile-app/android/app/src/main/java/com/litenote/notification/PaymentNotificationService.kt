package com.litenote.notification

import android.app.Notification
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.litenote.MainActivity
import com.litenote.utils.SentryLogger
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * 支付通知监听服务
 * 
 * 监听系统通知栏的所有通知，过滤并解析微信、支付宝的支付通知。
 * 继承自 Android 系统的 NotificationListenerService，需要用户在系统设置中授权。
 * 
 * 工作原理：
 * 1. 用户授权通知读取权限后，系统会自动启动此服务
 * 2. 任何 App 发送通知时，系统会调用 onNotificationPosted
 * 3. 服务解析通知内容，提取支付信息
 * 4. 通过 LocalBroadcast 将支付信息发送给 React Native 层
 * 
 * @author LiteNote
 * @since 1.0.0
 */
class PaymentNotificationService : NotificationListenerService() {

    companion object {
        private const val TAG = "PaymentNotificationService"

        /** 广播 Action：检测到支付通知 */
        const val ACTION_PAYMENT_DETECTED = "com.litenote.PAYMENT_DETECTED"

        /** 广播 Extra Key：支付数据 JSON */
        const val EXTRA_PAYMENT_DATA = "payment_data"

        /** 微信包名 */
        private const val WECHAT_PACKAGE = "com.tencent.mm"

        /** 支付宝包名 */
        private const val ALIPAY_PACKAGE = "com.eg.android.AlipayGphone"

        /** 默认支持的支付 App 包名列表 */
        private val DEFAULT_SUPPORTED_PACKAGES = setOf(WECHAT_PACKAGE, ALIPAY_PACKAGE)

        /** 默认支付关键词（用于识别支付通知） */
        private val DEFAULT_PAYMENT_KEYWORDS = listOf(
            "支付", "付款", "消费", "扣款",
            "支出",           // 支付宝：你有一笔xx元的支出
            "交易提醒",       // 支付宝通知标题
            "花呗",           // 花呗支付
            "余额宝",         // 余额宝支付
            "已支付",         // 微信：已支付¥xx
        )

        /** 排除关键词（用于排除收款通知） */
        private val EXCLUDE_KEYWORDS = listOf("收款", "到账", "收到", "转入", "红包")

        /** 金额匹配正则表达式 */
        private val AMOUNT_PATTERNS = listOf(
            Regex("""¥\s*([0-9]+\.?[0-9]*)"""),           // ¥50.00
            Regex("""([0-9]+\.?[0-9]*)\s*元"""),          // 50.00元 或 0.01元的支出
            Regex("""CNY\s*([0-9]+\.?[0-9]*)"""),         // CNY 50.00
            Regex("""人民币\s*([0-9]+\.?[0-9]*)"""),      // 人民币50.00
            Regex("""金额[：:]\s*([0-9]+\.?[0-9]*)"""),   // 金额：50.00
            Regex("""([0-9]+\.?[0-9]*)\s*元的"""),        // 支付宝：0.01元的支出
        )

        /** 日期格式化器 */
        private val DATE_FORMAT = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    }

    /** 悬浮窗管理器 */
    private var overlayManager: PaymentOverlayManager? = null

    /** 支持的支付 App 包名列表（动态加载） */
    private var supportedPackages: Set<String> = DEFAULT_SUPPORTED_PACKAGES

    /** 支付关键词列表（动态加载） */
    private var paymentKeywords: List<String> = DEFAULT_PAYMENT_KEYWORDS

    /** 配置变更监听器 */
    private val configChangeListener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        when (key) {
            "monitored_apps", "filter_keywords" -> {
                Log.i(TAG, "检测到配置变更: $key，重新加载配置...")
                loadMonitoringConfig()
            }
        }
    }

    /** 心跳定时器 */
    private val heartbeatHandler = Handler(Looper.getMainLooper())
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            Log.i(TAG, "💓 Service 心跳 - 监听列表: $supportedPackages (${supportedPackages.size}个应用)")
            heartbeatHandler.postDelayed(this, 60000) // 每分钟输出一次
        }
    }

    /**
     * 服务创建时调用
     */
    override fun onCreate() {
        super.onCreate()

        // 记录服务启动事件到 Sentry
        SentryLogger.i(TAG, "========== 支付通知服务启动 ==========")
        SentryLogger.addBreadcrumb("PaymentNotificationService 启动", category = "service_lifecycle")

        Log.i(TAG, "========== 支付通知服务启动 ==========")
        overlayManager = PaymentOverlayManager(this)
        loadMonitoringConfig()

        // 注册配置变更监听器
        val prefs = getSharedPreferences("payment_notification_config", Context.MODE_PRIVATE)
        prefs.registerOnSharedPreferenceChangeListener(configChangeListener)
        Log.i(TAG, "✓ 配置变更监听器已注册")

        // 启动心跳定时器
        heartbeatHandler.post(heartbeatRunnable)
        Log.i(TAG, "✓ 心跳定时器已启动")

        Log.i(TAG, "支付通知服务已创建")
    }

    /**
     * 加载监听配置
     */
    private fun loadMonitoringConfig() {
        Log.i(TAG, "开始加载监听配置...")
        SentryLogger.addBreadcrumb("开始加载监听配置", category = "config")

        try {
            val prefs = getSharedPreferences("payment_notification_config", Context.MODE_PRIVATE)

            // 加载监听应用列表
            val appsJson = prefs.getString("monitored_apps", null)
            Log.d(TAG, "读取到的配置: monitored_apps = $appsJson")

            if (appsJson != null && appsJson.isNotEmpty()) {
                val apps = JSONArray(appsJson)
                val packages = mutableSetOf<String>()
                for (i in 0 until apps.length()) {
                    val app = apps.getJSONObject(i)
                    val packageName = app.getString("packageName")
                    val enabled = app.optBoolean("enabled", true)
                    Log.d(TAG, "应用配置: $packageName, enabled=$enabled")
                    if (enabled) {
                        packages.add(packageName)
                    }
                }

                supportedPackages = packages
                Log.i(TAG, "✓ 配置加载成功: ${packages.size} 个监听应用: $packages")

                // 记录配置加载成功到 Sentry
                SentryLogger.setContext("monitoring_config", mapOf(
                    "apps_count" to packages.size,
                    "apps" to packages.joinToString(",")
                ))
            } else {
                Log.w(TAG, "⚠ 未找到用户配置，使用默认配置: $DEFAULT_SUPPORTED_PACKAGES")

                // 记录警告到 Sentry
                SentryLogger.w(TAG, "未找到用户配置，使用默认配置", mapOf(
                    "default_packages" to DEFAULT_SUPPORTED_PACKAGES.joinToString(",")
                ))

                supportedPackages = DEFAULT_SUPPORTED_PACKAGES
            }

            // 加载过滤关键词列表
            val keywordsJson = prefs.getString("filter_keywords", null)
            Log.d(TAG, "读取到的配置: filter_keywords = $keywordsJson")

            if (keywordsJson != null && keywordsJson.isNotEmpty()) {
                val keywords = JSONArray(keywordsJson)
                val keywordList = mutableListOf<String>()
                for (i in 0 until keywords.length()) {
                    keywordList.add(keywords.getString(i))
                }
                if (keywordList.isNotEmpty()) {
                    paymentKeywords = keywordList
                    Log.i(TAG, "✓ 关键词加载成功: ${keywordList.size} 个关键词: $keywordList")
                } else {
                    Log.w(TAG, "⚠ 关键词列表为空，使用默认关键词")
                    paymentKeywords = DEFAULT_PAYMENT_KEYWORDS
                }
            } else {
                Log.w(TAG, "⚠ 未找到关键词配置，使用默认关键词")
                paymentKeywords = DEFAULT_PAYMENT_KEYWORDS
            }

            Log.i(TAG, "配置加载完成 - 监听应用: $supportedPackages")

            // 添加配置加载成功的面包屑
            SentryLogger.addBreadcrumb(
                "配置加载完成",
                data = mapOf(
                    "apps_count" to supportedPackages.size,
                    "keywords_count" to paymentKeywords.size
                ),
                category = "config"
            )

        } catch (e: Exception) {
            Log.e(TAG, "❌ 加载配置失败，使用默认配置", e)

            // 记录错误到 Sentry
            SentryLogger.e(TAG, "加载配置失败，使用默认配置", e, mapOf(
                "error_type" to "config_load_failed"
            ))

            supportedPackages = DEFAULT_SUPPORTED_PACKAGES
            paymentKeywords = DEFAULT_PAYMENT_KEYWORDS
        }
    }

    /**
     * 服务销毁时调用
     */
    override fun onDestroy() {
        super.onDestroy()

        // 记录服务销毁事件到 Sentry
        SentryLogger.i(TAG, "========== 支付通知服务销毁 ==========")
        SentryLogger.addBreadcrumb("PaymentNotificationService 销毁", category = "service_lifecycle")

        Log.i(TAG, "========== 支付通知服务销毁 ==========")

        // 停止心跳定时器
        heartbeatHandler.removeCallbacks(heartbeatRunnable)
        Log.i(TAG, "✓ 心跳定时器已停止")

        // 注销配置变更监听器
        try {
            val prefs = getSharedPreferences("payment_notification_config", Context.MODE_PRIVATE)
            prefs.unregisterOnSharedPreferenceChangeListener(configChangeListener)
            Log.i(TAG, "✓ 配置变更监听器已注销")
        } catch (e: Exception) {
            Log.e(TAG, "注销配置监听器失败", e)
            SentryLogger.e(TAG, "注销配置监听器失败", e)
        }

        overlayManager?.dismissOverlay()
        overlayManager = null
        Log.i(TAG, "支付通知服务已销毁")
    }

    /**
     * 服务连接时调用
     */
    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.i(TAG, "========== 通知监听服务已连接 ==========")
        Log.i(TAG, "当前监听应用: $supportedPackages")
        Log.i(TAG, "当前过滤关键词: $paymentKeywords")
    }

    /**
     * 服务断开时调用
     */
    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.w(TAG, "========== 通知监听服务已断开 ==========")
    }

    /**
     * 收到新通知时调用
     * 
     * @param sbn 状态栏通知对象
     */
    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        Log.d(TAG, "收到通知回调, 包名: ${sbn?.packageName}")
        
        if (sbn == null) {
            Log.w(TAG, "通知对象为空，跳过处理")
            return
        }
        
        Log.d(TAG, "正在处理来自 ${sbn.packageName} 的通知")
        
        try {
            processNotification(sbn)
        } catch (e: Exception) {
            Log.e(TAG, "处理通知时发生错误", e)
        }
    }

    /**
     * 通知被移除时调用
     * 
     * @param sbn 状态栏通知对象
     */
    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // 暂不处理通知移除事件
    }

    /**
     * 处理通知
     *
     * @param sbn 状态栏通知对象
     */
    private fun processNotification(sbn: StatusBarNotification) {
        val packageName = sbn.packageName
        Log.d(TAG, "========================================")
        Log.d(TAG, "处理通知: 包名=$packageName")
        Log.d(TAG, "当前监听列表: $supportedPackages")
        Log.d(TAG, "监听列表大小: ${supportedPackages.size}")
        Log.d(TAG, "========================================")

        // 只处理支持的支付 App
        if (packageName !in supportedPackages) {
            Log.d(TAG, "包名 $packageName 不在支持列表中，跳过")
            return
        }

        Log.d(TAG, "✓ 包名 $packageName 在支持列表中，开始处理...")

        val notification = sbn.notification ?: return
        val extras = notification.extras ?: return

        // 提取通知内容
        val notificationData = extractNotificationData(packageName, notification, extras, sbn.postTime)
        Log.d(TAG, "通知内容: ${notificationData.getAllContent()}")

        // 检查是否为支付通知
        if (!isPaymentNotification(notificationData)) {
            Log.d(TAG, "不是支付通知，跳过")
            // 记录非支付通知（用于调试为什么没有触发）
            SentryLogger.addBreadcrumb(
                "收到通知但不是支付通知",
                data = mapOf(
                    "package_name" to packageName,
                    "content" to notificationData.getAllContent().take(100)
                ),
                category = "notification_filter"
            )
            return
        }

        Log.d(TAG, "这是一条支付通知!")

        // 提取支付金额
        val amount = extractAmount(notificationData)
        if (amount == null || amount <= 0) {
            Log.d(TAG, "无法提取有效金额，跳过")
            // 记录无法提取金额的警告（这是关键问题）
            SentryLogger.w(
                TAG,
                "支付通知无法提取金额",
                mapOf(
                    "package_name" to packageName,
                    "content" to notificationData.getAllContent()
                )
            )
            return
        }

        Log.d(TAG, "提取到金额: $amount")

        // 构建支付数据
        val paymentData = buildPaymentData(packageName, amount, notificationData)

        Log.i(TAG, "检测到支付: $paymentData")

        // 记录支付检测事件到 Sentry
        // 开发环境：发送 INFO 事件（可在 Sentry 中查看）
        // 生产环境：只添加面包屑（节省配额）
        val paymentInfo = mapOf(
            "package_name" to packageName,
            "amount" to amount,
            "source" to when (packageName) {
                WECHAT_PACKAGE -> "微信"
                ALIPAY_PACKAGE -> "支付宝"
                else -> packageName
            }
        )

        if (com.litenote.BuildConfig.DEBUG) {
            // 开发环境：发送事件到 Sentry
            SentryLogger.captureMessage(
                "检测到支付通知: ${paymentInfo["source"]} ¥$amount",
                io.sentry.SentryLevel.INFO,
                paymentInfo
            )
        } else {
            // 生产环境：只添加面包屑
            SentryLogger.addBreadcrumb(
                "检测到支付通知",
                data = paymentInfo,
                category = "payment_detection"
            )
        }

        // 显示悬浮窗提醒
        showPaymentOverlay(amount, packageName, paymentData)
    }


    /**
     * 提取通知数据
     * 
     * @param packageName 应用包名
     * @param notification 通知对象
     * @param extras 通知附加数据
     * @param postTime 通知发送时间
     * @return 通知数据 Map
     */
    private fun extractNotificationData(
        packageName: String,
        notification: Notification,
        extras: Bundle,
        postTime: Long
    ): NotificationData {
        return NotificationData(
            app = packageName,
            time = DATE_FORMAT.format(Date(postTime)),
            title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: "",
            titleBig = extras.getCharSequence(Notification.EXTRA_TITLE_BIG)?.toString() ?: "",
            text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: "",
            subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: "",
            summaryText = extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT)?.toString() ?: "",
            bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: "",
            infoText = extras.getCharSequence(Notification.EXTRA_INFO_TEXT)?.toString() ?: "",
            tickerText = notification.tickerText?.toString() ?: ""
        )
    }

    /**
     * 检查是否为支付通知
     *
     * @param data 通知数据
     * @return 是否为支付通知
     */
    private fun isPaymentNotification(data: NotificationData): Boolean {
        val content = data.getAllContent()

        // 检查是否包含排除关键词（收款通知）
        if (EXCLUDE_KEYWORDS.any { content.contains(it) }) {
            Log.d(TAG, "通知包含排除关键词，跳过")
            return false
        }

        // 检查是否包含支付关键词
        return paymentKeywords.any { content.contains(it) }
    }

    /**
     * 从通知内容中提取金额
     * 
     * @param data 通知数据
     * @return 金额，如果无法提取则返回 null
     */
    private fun extractAmount(data: NotificationData): Double? {
        val content = data.getAllContent()
        
        for (pattern in AMOUNT_PATTERNS) {
            val match = pattern.find(content)
            if (match != null) {
                val amountStr = match.groupValues[1]
                try {
                    val amount = amountStr.toDouble()
                    if (amount > 0) {
                        Log.d(TAG, "提取到金额: $amount，匹配模式: ${pattern.pattern}")
                        return amount
                    }
                } catch (e: NumberFormatException) {
                    Log.w(TAG, "解析金额失败: $amountStr", e)
                }
            }
        }
        
        return null
    }

    /**
     * 构建支付数据 JSON
     * 
     * @param packageName 应用包名
     * @param amount 支付金额
     * @param notificationData 通知数据
     * @return 支付数据 JSON 字符串
     */
    private fun buildPaymentData(
        packageName: String,
        amount: Double,
        notificationData: NotificationData
    ): String {
        val source = when (packageName) {
            WECHAT_PACKAGE -> "wechat"
            ALIPAY_PACKAGE -> "alipay"
            else -> "unknown"
        }
        
        val json = JSONObject().apply {
            put("amount", amount)
            put("source", source)
            put("packageName", packageName)
            put("time", notificationData.time)
            put("title", notificationData.title)
            put("text", notificationData.text)
            put("bigText", notificationData.bigText)
            put("rawContent", notificationData.getAllContent())
        }
        
        return json.toString()
    }

    /**
     * 显示支付悬浮窗
     * 
     * @param amount 支付金额
     * @param packageName 支付来源包名
     * @param paymentData 支付数据 JSON
     */
    private fun showPaymentOverlay(amount: Double, packageName: String, paymentData: String) {
        Log.i(TAG, "显示支付悬浮窗: 金额=$amount, 包名=$packageName")

        val source = when (packageName) {
            WECHAT_PACKAGE -> "wechat"
            ALIPAY_PACKAGE -> "alipay"
            else -> "unknown"
        }

        if (overlayManager == null) {
            Log.e(TAG, "悬浮窗管理器为空!")
            // 记录严重错误到 Sentry
            SentryLogger.e(
                TAG,
                "悬浮窗管理器为空，无法显示支付提醒",
                data = mapOf(
                    "amount" to amount,
                    "package_name" to packageName
                )
            )
            return
        }

        Log.i(TAG, "正在调用悬浮窗管理器显示悬浮窗...")

        try {
            overlayManager?.showPaymentOverlay(
                amount = amount,
                source = source,
                onConfirm = {
                    // 点击"立即记账"，打开 App 并传递支付数据
                    Log.d(TAG, "悬浮窗确认按钮被点击")
                    launchAppWithPayment(paymentData)
                },
                onDismiss = {
                    // 点击"稍后记账"或自动消失，数据已通过广播发送
                    Log.d(TAG, "悬浮窗已关闭")
                }
            )

            Log.i(TAG, "悬浮窗管理器调用完成")

            // 记录成功显示悬浮窗
            SentryLogger.addBreadcrumb(
                "悬浮窗显示成功",
                data = mapOf(
                    "amount" to amount,
                    "source" to source
                ),
                category = "overlay"
            )
        } catch (e: Exception) {
            Log.e(TAG, "显示悬浮窗失败", e)
            // 记录悬浮窗显示失败的错误
            SentryLogger.e(
                TAG,
                "显示悬浮窗失败",
                e,
                mapOf(
                    "amount" to amount,
                    "package_name" to packageName,
                    "source" to source
                )
            )
        }
    }

    /**
     * 启动 App 并传递支付数据
     */
    private fun launchAppWithPayment(paymentData: String) {
        try {
            val intent = Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                putExtra(EXTRA_PAYMENT_DATA, paymentData)
            }
            startActivity(intent)
            Log.d(TAG, "已启动App并传递支付数据")
        } catch (e: Exception) {
            Log.e(TAG, "启动App失败", e)
        }
    }

    /**
     * 通知数据类
     */
    private data class NotificationData(
        val app: String,
        val time: String,
        val title: String,
        val titleBig: String,
        val text: String,
        val subText: String,
        val summaryText: String,
        val bigText: String,
        val infoText: String,
        val tickerText: String
    ) {
        /**
         * 获取所有内容的合并字符串，用于关键词匹配
         */
        fun getAllContent(): String {
            return listOf(title, titleBig, text, subText, summaryText, bigText, infoText, tickerText)
                .filter { it.isNotBlank() }
                .joinToString(" ")
        }
    }
}
