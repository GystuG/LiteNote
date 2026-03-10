package com.litenote.notification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

/**
 * 支付通知监听 React Native 模块
 * 
 * 提供给 JavaScript 层的接口，用于：
 * 1. 检查通知监听权限状态
 * 2. 请求通知监听权限
 * 3. 接收支付通知事件
 * 
 * 使用方式（JavaScript）：
 * ```javascript
 * import { NativeModules, NativeEventEmitter } from 'react-native';
 * 
 * const { PaymentNotificationModule } = NativeModules;
 * const eventEmitter = new NativeEventEmitter(PaymentNotificationModule);
 * 
 * // 检查权限
 * const status = await PaymentNotificationModule.getPermissionStatus();
 * 
 * // 请求权限
 * PaymentNotificationModule.requestPermission();
 * 
 * // 监听支付事件
 * eventEmitter.addListener('onPaymentDetected', (event) => {
 *   console.log('Payment detected:', event);
 * });
 * ```
 * 
 * @author LiteNote
 * @since 1.0.0
 */
class PaymentNotificationModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    companion object {
        private const val TAG = "PaymentNotificationModule"

        /** 模块名称，JavaScript 中通过此名称访问 */
        const val MODULE_NAME = "PaymentNotificationModule"

        /** 事件名称：账单创建成功 */
        const val EVENT_BILL_CREATED = "onBillCreated"

        /** 权限状态：已授权 */
        const val PERMISSION_AUTHORIZED = "authorized"
        
        /** 权限状态：未授权 */
        const val PERMISSION_DENIED = "denied"
        
        /** 权限状态：未知 */
        const val PERMISSION_UNKNOWN = "unknown"
    }

    /** 支付通知广播接收器 */
    private var paymentReceiver: BroadcastReceiver? = null
    
    /** 是否已注册广播接收器 */
    private var isReceiverRegistered = false

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String = MODULE_NAME

    /**
     * 获取通知监听权限状态
     * 
     * @param promise Promise 对象，返回权限状态字符串
     */
    @ReactMethod
    fun getPermissionStatus(promise: Promise) {
        try {
            val status = checkNotificationListenerPermission()
            promise.resolve(status)
        } catch (e: Exception) {
            Log.e(TAG, "检查权限状态失败", e)
            promise.reject("ERROR", "检查权限状态失败", e)
        }
    }

    /**
     * 请求通知监听权限
     * 
     * 打开系统设置页面，让用户手动授权通知访问权限
     */
    @ReactMethod
    fun requestPermission() {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            Log.i(TAG, "已打开通知监听权限设置页面")
        } catch (e: Exception) {
            Log.e(TAG, "打开通知监听权限设置页面失败", e)
        }
    }

    /**
     * 检查服务是否正在运行
     * 
     * @param promise Promise 对象，返回布尔值
     */
    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        try {
            val isRunning = checkNotificationListenerPermission() == PERMISSION_AUTHORIZED
            promise.resolve(isRunning)
        } catch (e: Exception) {
            Log.e(TAG, "检查服务状态失败", e)
            promise.reject("ERROR", "检查服务状态失败", e)
        }
    }

    /**
     * 检查悬浮窗权限状态
     * 
     * @param promise Promise 对象，返回权限状态字符串
     */
    @ReactMethod
    fun getOverlayPermissionStatus(promise: Promise) {
        try {
            val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(reactContext)
            } else {
                true
            }
            promise.resolve(if (hasPermission) PERMISSION_AUTHORIZED else PERMISSION_DENIED)
        } catch (e: Exception) {
            Log.e(TAG, "检查悬浮窗权限失败", e)
            promise.reject("ERROR", "检查悬浮窗权限失败", e)
        }
    }

    /**
     * 请求悬浮窗权限
     * 
     * 打开系统设置页面，让用户手动授权悬浮窗权限
     */
    @ReactMethod
    fun requestOverlayPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    android.net.Uri.parse("package:${reactContext.packageName}")
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(intent)
                Log.i(TAG, "已打开悬浮窗权限设置页面")
            }
        } catch (e: Exception) {
            Log.e(TAG, "打开悬浮窗权限设置页面失败", e)
        }
    }

    /**
     * 获取设备厂商名称
     * 
     * @param promise Promise 对象，返回厂商名称字符串
     */
    @ReactMethod
    fun getDeviceManufacturer(promise: Promise) {
        try {
            promise.resolve(Build.MANUFACTURER)
        } catch (e: Exception) {
            Log.e(TAG, "获取设备厂商失败", e)
            promise.reject("ERROR", "获取设备厂商失败", e)
        }
    }

    /**
     * 启动监听
     * 
     * 注册广播接收器，开始接收支付通知事件
     */
    @ReactMethod
    fun startListening() {
        registerPaymentReceiver()
        Log.i(TAG, "已开始监听支付通知")
    }

    /**
     * 停止监听
     *
     * 注销广播接收器，停止接收支付通知事件
     */
    @ReactMethod
    fun stopListening() {
        unregisterPaymentReceiver()
        Log.i(TAG, "已停止监听支付通知")
    }

    /**
     * 保存监听应用配置
     *
     * @param monitoredApps 监听应用列表
     * @param filterKeywords 过滤关键词列表
     * @param promise Promise 对象
     */
    @ReactMethod
    fun saveMonitoringConfig(monitoredApps: ReadableArray, filterKeywords: ReadableArray, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("payment_notification_config", Context.MODE_PRIVATE)
            val editor = prefs.edit()

            // 保存监听应用列表
            val appsJson = JSONArray()
            for (i in 0 until monitoredApps.size()) {
                val app = monitoredApps.getMap(i)
                val appJson = JSONObject().apply {
                    put("packageName", app?.getString("packageName") ?: "")
                    put("appName", app?.getString("appName") ?: "")
                    put("enabled", app?.getBoolean("enabled") ?: true)
                }
                appsJson.put(appJson)
            }
            editor.putString("monitored_apps", appsJson.toString())

            // 保存过滤关键词列表
            val keywordsJson = JSONArray()
            for (i in 0 until filterKeywords.size()) {
                keywordsJson.put(filterKeywords.getString(i))
            }
            editor.putString("filter_keywords", keywordsJson.toString())

            editor.apply()
            promise.resolve(true)
            Log.i(TAG, "配置已保存: ${appsJson.length()} 个应用, ${keywordsJson.length()} 个关键词")
        } catch (e: Exception) {
            Log.e(TAG, "保存配置失败", e)
            promise.reject("ERROR", "保存配置失败", e)
        }
    }

    /**
     * 获取已安装应用列表
     *
     * @param promise Promise 对象，返回应用列表
     */
    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val appList: WritableArray = Arguments.createArray()

            for (app in packages) {
                val appInfo = Arguments.createMap().apply {
                    putString("packageName", app.packageName)
                    putString("appName", app.loadLabel(pm).toString())
                }
                appList.pushMap(appInfo)
            }

            promise.resolve(appList)
            Log.i(TAG, "已获取 ${appList.size()} 个已安装应用")
        } catch (e: Exception) {
            Log.e(TAG, "获取已安装应用失败", e)
            promise.reject("ERROR", "获取已安装应用失败", e)
        }
    }

    /**
     * 检查通知监听权限
     *
     * @return 权限状态字符串
     */
    private fun checkNotificationListenerPermission(): String {
        return try {
            val packageName = reactContext.packageName
            val enabledListeners = Settings.Secure.getString(
                reactContext.contentResolver,
                "enabled_notification_listeners"
            )
            
            when {
                enabledListeners == null -> PERMISSION_UNKNOWN
                enabledListeners.contains(packageName) -> PERMISSION_AUTHORIZED
                else -> PERMISSION_DENIED
            }
        } catch (e: Exception) {
            Log.e(TAG, "检查通知监听权限失败", e)
            PERMISSION_UNKNOWN
        }
    }

    /**
     * 注册账单创建广播接收器
     */
    private fun registerPaymentReceiver() {
        if (isReceiverRegistered) {
            Log.d(TAG, "账单创建广播接收器已注册")
            return
        }

        paymentReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action == PaymentOverlayManager.ACTION_BILL_CREATED) {
                    Log.d(TAG, "收到账单创建成功广播")
                    sendBillCreatedEventToJS()
                }
            }
        }

        val filter = IntentFilter(PaymentOverlayManager.ACTION_BILL_CREATED)
        LocalBroadcastManager.getInstance(reactContext).registerReceiver(paymentReceiver!!, filter)
        isReceiverRegistered = true

        Log.d(TAG, "账单创建广播接收器注册成功")
    }

    /**
     * 注销支付通知广播接收器
     */
    private fun unregisterPaymentReceiver() {
        if (!isReceiverRegistered || paymentReceiver == null) {
            return
        }
        
        try {
            LocalBroadcastManager.getInstance(reactContext).unregisterReceiver(paymentReceiver!!)
            paymentReceiver = null
            isReceiverRegistered = false
            Log.d(TAG, "支付广播接收器已注销")
        } catch (e: Exception) {
            Log.e(TAG, "注销支付广播接收器失败", e)
        }
    }

    /**
     * 发送账单创建成功事件到 JavaScript 层
     */
    private fun sendBillCreatedEventToJS() {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_BILL_CREATED, null)

            Log.d(TAG, "账单创建事件已发送到JS")
        } catch (e: Exception) {
            Log.e(TAG, "发送账单创建事件到JS失败", e)
        }
    }

    // LifecycleEventListener 实现

    override fun onHostResume() {
        registerPaymentReceiver()
    }

    override fun onHostPause() {
        // 保持接收器注册，以便在后台也能接收事件
    }

    override fun onHostDestroy() {
        unregisterPaymentReceiver()
    }
}
