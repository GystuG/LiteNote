package com.litenote.notification

/**
 * 分类数据类
 * 用于从 API 获取的分类信息
 */
data class CategoryData(
    val id: Int,
    val name: String,
    val icon: String?,
    val color: String?
)

/**
 * API 响应包装类
 */
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val message: String?
)

/**
 * 创建账单请求数据类
 */
data class CreateBillRequest(
    val amount: Double,
    val type: String,
    val categoryId: Int,
    val description: String,
    val date: String
)
