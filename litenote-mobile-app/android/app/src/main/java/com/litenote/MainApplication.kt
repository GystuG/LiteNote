package com.litenote

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.litenote.notification.PaymentNotificationPackage
import com.litenote.utils.InstallApkPackage
import com.litenote.utils.SentryLogger
import com.litenote.auth.AuthTokenPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // 添加支付通知监听模块
              add(PaymentNotificationPackage())
              // 添加 APK 安装模块
              add(InstallApkPackage())
              // 添加 Auth Token 模块（用于原生层获取认证 Token）
              add(AuthTokenPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    initializeSentry()
  }

  private fun initializeSentry() {
    val sentryDsn = BuildConfig.SENTRY_DSN
    if (sentryDsn.isBlank()) {
      android.util.Log.w("MainApplication", "SENTRY_DSN 未配置，跳过 Sentry 初始化")
      return
    }

    val environment = if (BuildConfig.DEBUG) "development" else "production"

    SentryLogger.init(
      context = this,
      dsn = sentryDsn,
      environment = environment,
      enabled = true
    )

    SentryLogger.setTag("app_module", "payment_notification")
    SentryLogger.setTag("platform", "android")

    if (BuildConfig.DEBUG) {
      SentryLogger.captureMessage("Sentry test message - app started", io.sentry.SentryLevel.INFO)
    }

    android.util.Log.i("MainApplication", "Sentry 日志监控已初始化")
  }
}
