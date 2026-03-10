package com.litenote.notification

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * 支付通知监听 React Native Package
 * 
 * 将 PaymentNotificationModule 注册到 React Native 中。
 * 需要在 MainApplication.kt 中添加此 Package。
 * 
 * @author LiteNote
 * @since 1.0.0
 */
class PaymentNotificationPackage : ReactPackage {

    /**
     * 创建原生模块列表
     * 
     * @param reactContext React 应用上下文
     * @return 原生模块列表
     */
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(PaymentNotificationModule(reactContext))
    }

    /**
     * 创建视图管理器列表
     * 
     * @param reactContext React 应用上下文
     * @return 视图管理器列表（此模块不包含自定义视图）
     */
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
