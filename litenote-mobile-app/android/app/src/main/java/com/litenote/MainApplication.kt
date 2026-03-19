package com.litenote

import android.app.Application
import android.content.Context
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
import com.litenote.hotupdate.HotUpdatePackage
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.JSBundleLoader
import java.io.File

class MainApplication : Application(), ReactApplication {

  // 缓存热更新路径，避免重复调用导致 crash_count 多次递增
  @Volatile
  private var hotBundlePathCache: String? = null
  private var hotBundlePathChecked = false

  /**
   * 获取热更新 bundle 路径（含崩溃检测）
   * 结果会被缓存，整个 App 生命周期只计算一次
   */
  private fun getHotBundlePath(): String? {
      if (hotBundlePathChecked) {
          return hotBundlePathCache
      }
      hotBundlePathChecked = true

      val hotBundlePath = File(filesDir, "hot_update/index.android.bundle")
      android.util.Log.i("HotUpdate", "检查热更新 bundle: exists=${hotBundlePath.exists()}, size=${if (hotBundlePath.exists()) hotBundlePath.length() else 0}")

      if (hotBundlePath.exists() && hotBundlePath.length() > 0) {
          val prefs = getSharedPreferences("hot_update", Context.MODE_PRIVATE)
          val crashCount = prefs.getInt("crash_count", 0)
          android.util.Log.i("HotUpdate", "当前 crash_count=$crashCount")

          if (crashCount < 2) {
              prefs.edit().putInt("crash_count", crashCount + 1).apply()
              android.util.Log.i("HotUpdate", "使用热更新 bundle (crash_count: ${crashCount + 1})")
              hotBundlePathCache = hotBundlePath.absolutePath
          } else {
              android.util.Log.w("HotUpdate", "崩溃次数过多 ($crashCount)，删除热更新，回退内置 bundle")
              hotBundlePath.parentFile?.deleteRecursively()
              prefs.edit().clear().apply()
              hotBundlePathCache = null
          }
      } else {
          android.util.Log.i("HotUpdate", "无热更新 bundle，使用内置")
          hotBundlePathCache = null
      }
      return hotBundlePathCache
  }

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(PaymentNotificationPackage())
              add(InstallApkPackage())
              add(AuthTokenPackage())
              add(HotUpdatePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED

        override fun getJSBundleFile(): String? {
            return getHotBundlePath()
        }

        override fun createReactInstanceManager(): ReactInstanceManager {
            val manager = super.createReactInstanceManager()

            val hotPath = hotBundlePathCache
            if (hotPath != null) {
                // 替换 BundleLoader：从文件加载 bundle，但 sourceURL 设为 "assets://"
                // 这样 React Native 图片解析仍走 APK 内置资源
                try {
                    val field = ReactInstanceManager::class.java.getDeclaredField("mBundleLoader")
                    field.isAccessible = true
                    field.set(manager, JSBundleLoader.createFileLoader(
                        hotPath, "assets://index.android.bundle", false
                    ))
                } catch (e: Exception) {
                    android.util.Log.w("HotUpdate", "替换 BundleLoader 失败: ${e.message}")
                }
            }

            return manager
        }
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
