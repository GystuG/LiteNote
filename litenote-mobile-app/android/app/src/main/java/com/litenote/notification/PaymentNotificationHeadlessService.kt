package com.litenote.notification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.util.Log
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * 支付通知 Headless JS 服务
 * 
 * 当 App 不在前台时，通过 Headless JS 执行 JavaScript 代码处理支付通知。
 * 这允许在 App 被杀死或在后台时仍能处理支付事件。
 * 
 * 工作原理：
 * 1. PaymentNotificationService 检测到支付通知
 * 2. 启动此 HeadlessJsTaskService
 * 3. 执行注册的 Headless JS Task
 * 4. JavaScript 代码处理支付数据（如存储到 AsyncStorage）
 * 
 * JavaScript 端注册方式：
 * ```javascript
 * import { AppRegistry } from 'react-native';
 * 
 * const PaymentNotificationHeadlessTask = async (data) => {
 *   console.log('Headless task received:', data);
 *   // 处理支付数据
 * };
 * 
 * AppRegistry.registerHeadlessTask(
 *   'PaymentNotificationHeadlessTask',
 *   () => PaymentNotificationHeadlessTask
 * );
 * ```
 * 
 * @author LiteNote
 * @since 1.0.0
 */
class PaymentNotificationHeadlessService : HeadlessJsTaskService() {

    companion object {
        private const val TAG = "PaymentHeadlessService"
        
        /** Headless Task 名称，JavaScript 端需要使用相同名称注册 */
        const val TASK_NAME = "PaymentNotificationHeadlessTask"
        
        /** Intent Extra Key：支付数据 */
        const val EXTRA_PAYMENT_DATA = "paymentData"
        
        /** Task 超时时间（毫秒） */
        private const val TASK_TIMEOUT_MS = 30000L
        
        /**
         * 启动 Headless 服务处理支付数据
         * 
         * @param context 上下文
         * @param paymentData 支付数据 JSON 字符串
         */
        fun startService(context: Context, paymentData: String) {
            val intent = Intent(context, PaymentNotificationHeadlessService::class.java).apply {
                putExtra(EXTRA_PAYMENT_DATA, paymentData)
            }
            
            try {
                context.startService(intent)
                Log.d(TAG, "Headless服务已启动")
            } catch (e: Exception) {
                Log.e(TAG, "启动Headless服务失败", e)
            }
        }
    }

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val paymentData = intent?.getStringExtra(EXTRA_PAYMENT_DATA)
        
        if (paymentData == null) {
            Log.w(TAG, "Intent中没有支付数据")
            return null
        }
        
        Log.d(TAG, "正在创建Headless任务配置，数据: $paymentData")
        
        // 解析 JSON 并转换为 Bundle
        val extras = Bundle().apply {
            putString("paymentData", paymentData)
        }
        
        return HeadlessJsTaskConfig(
            TASK_NAME,
            Arguments.fromBundle(extras),
            TASK_TIMEOUT_MS,
            true // 允许在前台运行
        )
    }
}
