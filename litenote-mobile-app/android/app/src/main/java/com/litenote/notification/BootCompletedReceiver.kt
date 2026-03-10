package com.litenote.notification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * 开机完成广播接收器
 * 
 * 监听系统开机完成事件，确保 NotificationListenerService 在开机后能够正常启动。
 * 
 * 注意：NotificationListenerService 通常由系统自动管理，
 * 此接收器主要用于记录日志和执行可能需要的初始化操作。
 * 
 * @author LiteNote
 * @since 1.0.0
 */
class BootCompletedReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootCompletedReceiver"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.i(TAG, "开机完成，通知监听服务将由系统自动启动")
            
            // NotificationListenerService 由系统管理，无需手动启动
            // 如果用户已授权通知访问权限，系统会自动启动服务
        }
    }
}
