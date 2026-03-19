package com.litenote.notification

import android.content.Context
import android.util.Log
import com.litenote.BuildConfig
import com.litenote.auth.AuthTokenModule
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

/**
 * 账单 API 服务
 * 用于悬浮窗直接调用后端 API
 */
class BillApiService(private val context: Context) {

    companion object {
        private const val TAG = "BillApiService"
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
        .writeTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    /**
     * 获取 API Base URL（确保末尾没有斜杠）
     */
    private fun getBaseUrl(): String {
        val baseUrl = BuildConfig.API_BASE_URL.trimEnd('/')
        Log.i(TAG, "API Base URL: $baseUrl")
        return baseUrl
    }

    /**
     * 获取认证 Token
     */
    private fun getAuthToken(): String? {
        return AuthTokenModule.getToken(context)
    }

    /**
     * 构建带认证头的请求
     */
    private fun buildAuthenticatedRequest(url: String): Request.Builder {
        val builder = Request.Builder().url(url)
        val token = getAuthToken()
        if (token != null) {
            builder.addHeader("Authorization", "Bearer $token")
            Log.d(TAG, "已添加 Authorization header")
        } else {
            Log.w(TAG, "未找到认证 Token，请求可能会失败")
        }
        return builder
    }

    /**
     * 获取支出分类列表
     *
     * @param callback 回调函数，参数为分类列表，失败时为 null
     */
    fun getExpenseCategories(callback: (List<CategoryData>?) -> Unit) {
        val url = "${getBaseUrl()}/categories?type=expense"
        Log.i(TAG, "【获取分类】URL: $url")

        val request = buildAuthenticatedRequest(url)
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "获取分类列表失败: ${e.message}", e)
                callback(null)
            }

            override fun onResponse(call: Call, response: Response) {
                try {
                    if (!response.isSuccessful) {
                        Log.e(TAG, "获取分类列表失败: HTTP ${response.code}")
                        if (response.code == 401) {
                            Log.e(TAG, "认证失败，请重新登录")
                        }
                        callback(null)
                        return
                    }

                    val body = response.body?.string()
                    Log.d(TAG, "分类列表响应: $body")

                    if (body.isNullOrEmpty()) {
                        callback(null)
                        return
                    }

                    // 解析 JSON 响应
                    val type = object : TypeToken<ApiResponse<List<CategoryData>>>() {}.type
                    val apiResponse: ApiResponse<List<CategoryData>> = gson.fromJson(body, type)

                    if (apiResponse.success && apiResponse.data != null) {
                        Log.d(TAG, "成功获取 ${apiResponse.data.size} 个分类")
                        callback(apiResponse.data)
                    } else {
                        Log.e(TAG, "API 响应失败: ${apiResponse.message}")
                        callback(null)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "解析分类列表失败: ${e.message}", e)
                    callback(null)
                }
            }
        })
    }

    /**
     * 创建账单
     *
     * @param amount 金额
     * @param categoryId 分类 ID
     * @param description 描述（支付来源）
     * @param callback 回调函数，参数为 (是否成功, 错误信息)
     */
    fun createBill(
        amount: Double,
        categoryId: Int,
        description: String?,
        callback: (Boolean, String?) -> Unit
    ) {
        val url = "${getBaseUrl()}/bills"
        Log.d(TAG, "创建账单: $url, 金额=$amount, 分类=$categoryId")

        // 构建请求体
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val today = dateFormat.format(Date())

        val requestBody = CreateBillRequest(
            amount = amount,
            type = "expense",
            categoryId = categoryId,
            description = description,
            date = today
        )

        val jsonBody = gson.toJson(requestBody)
        Log.d(TAG, "请求体: $jsonBody")

        val request = buildAuthenticatedRequest(url)
            .post(jsonBody.toRequestBody(JSON_MEDIA_TYPE))
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "创建账单失败: ${e.message}", e)
                callback(false, "网络错误: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                try {
                    val body = response.body?.string()
                    Log.d(TAG, "创建账单响应: HTTP ${response.code}, body=$body")

                    if (!response.isSuccessful) {
                        if (response.code == 401) {
                            callback(false, "认证失败，请重新登录")
                        } else {
                            callback(false, "服务器错误: HTTP ${response.code}")
                        }
                        return
                    }

                    if (body.isNullOrEmpty()) {
                        callback(false, "服务器返回空响应")
                        return
                    }

                    // 解析响应
                    val type = object : TypeToken<ApiResponse<Any>>() {}.type
                    val apiResponse: ApiResponse<Any> = gson.fromJson(body, type)

                    if (apiResponse.success) {
                        Log.i(TAG, "账单创建成功")
                        callback(true, null)
                    } else {
                        Log.e(TAG, "账单创建失败: ${apiResponse.message}")
                        callback(false, apiResponse.message ?: "创建失败")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "解析创建账单响应失败: ${e.message}", e)
                    callback(false, "解析响应失败: ${e.message}")
                }
            }
        })
    }
}
