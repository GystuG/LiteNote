package com.litenote.auth

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

/**
 * Auth Token Native Module
 * 用于在 React Native 和 Android 原生层之间共享认证 Token
 */
class AuthTokenModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AuthTokenModule"
        private const val PREFS_NAME = "AuthTokenPrefs"
        private const val KEY_AUTH_TOKEN = "auth_token"

        /**
         * 静态方法：供 Android 原生代码获取 Token
         */
        fun getToken(context: Context): String? {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return prefs.getString(KEY_AUTH_TOKEN, null)
        }
    }

    override fun getName(): String = "AuthTokenModule"

    private fun getPrefs(): SharedPreferences {
        return reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    /**
     * 保存 Token（从 RN 调用）
     */
    @ReactMethod
    fun setToken(token: String, promise: Promise) {
        try {
            Log.d(TAG, "保存 Token 到 SharedPreferences")
            getPrefs().edit().putString(KEY_AUTH_TOKEN, token).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "保存 Token 失败: ${e.message}", e)
            promise.reject("SET_TOKEN_ERROR", e.message, e)
        }
    }

    /**
     * 获取 Token（从 RN 调用）
     */
    @ReactMethod
    fun getToken(promise: Promise) {
        try {
            val token = getPrefs().getString(KEY_AUTH_TOKEN, null)
            promise.resolve(token)
        } catch (e: Exception) {
            Log.e(TAG, "获取 Token 失败: ${e.message}", e)
            promise.reject("GET_TOKEN_ERROR", e.message, e)
        }
    }

    /**
     * 清除 Token（登出时调用）
     */
    @ReactMethod
    fun clearToken(promise: Promise) {
        try {
            Log.d(TAG, "清除 Token")
            getPrefs().edit().remove(KEY_AUTH_TOKEN).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "清除 Token 失败: ${e.message}", e)
            promise.reject("CLEAR_TOKEN_ERROR", e.message, e)
        }
    }
}
