package com.litenote.notification

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.TextView
import com.litenote.R

/**
 * 支付悬浮窗管理器
 *
 * 在 App 不在前台时，通过系统悬浮窗显示支付提醒。
 * 支持直接在悬浮窗中选择分类并完成记账。
 * 需要 SYSTEM_ALERT_WINDOW 权限。
 *
 * @author LiteNote
 * @since 1.0.0
 */
class PaymentOverlayManager(private val context: Context) {

    companion object {
        private const val TAG = "PaymentOverlayManager"

        /** 广播 Action：账单创建成功 */
        const val ACTION_BILL_CREATED = "com.litenote.BILL_CREATED"

        /** 悬浮窗自动消失时间（毫秒） */
        private const val AUTO_DISMISS_DELAY = 60000L

        /** 成功反馈显示时间（毫秒） */
        private const val SUCCESS_DISPLAY_DELAY = 1500L

        /** 失败反馈显示时间（毫秒） */
        private const val ERROR_DISPLAY_DELAY = 3000L

        /** 每行显示的分类数量 */
    private val CATEGORIES_PER_ROW = 3

    /** 最多显示的行数（超出部分纵向滚动） */
    private val MAX_VISIBLE_ROWS = 3
        private const val PREFS_NAME = "payment_overlay_prefs"

        /** 上次选择的分类 ID 键 */
        private const val KEY_LAST_CATEGORY_ID = "last_category_id"
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var autoDismissRunnable: Runnable? = null

    // API 服务
    private val apiService = BillApiService(context)

    // SharedPreferences 用于存储上次选择的分类
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // 当前选中的分类
    private var selectedCategory: CategoryData? = null

    // 分类按钮引用列表（用于更新选中状态）
    private val categoryViews = mutableListOf<Pair<TextView, CategoryData>>()

    /**
     * 检查是否有悬浮窗权限
     */
    fun hasOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    /**
     * 请求悬浮窗权限
     */
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }

    /**
     * 获取上次选择的分类 ID
     */
    private fun getLastCategoryId(): Int {
        return prefs.getInt(KEY_LAST_CATEGORY_ID, -1)
    }

    /**
     * 保存上次选择的分类 ID
     */
    private fun saveLastCategoryId(categoryId: Int) {
        prefs.edit().putInt(KEY_LAST_CATEGORY_ID, categoryId).apply()
    }

    /**
     * 发送账单创建成功广播
     */
    private fun sendBillCreatedBroadcast() {
        val intent = Intent(ACTION_BILL_CREATED)
        androidx.localbroadcastmanager.content.LocalBroadcastManager.getInstance(context).sendBroadcast(intent)
        Log.i(TAG, "账单创建成功广播已发送")
    }

    /**
     * 显示支付提醒悬浮窗
     *
     * @param amount 支付金额
     * @param source 支付来源 (wechat/alipay)
     * @param onConfirm 确认记账回调（不再使用，保留接口兼容）
     * @param onDismiss 关闭回调
     */
    fun showPaymentOverlay(
        amount: Double,
        source: String,
        onConfirm: () -> Unit,
        onDismiss: () -> Unit
    ) {
        Log.i(TAG, "显示支付悬浮窗: 金额=$amount, 来源=$source")
        Log.i(TAG, "设备信息: ${Build.MANUFACTURER} ${Build.MODEL}, SDK: ${Build.VERSION.SDK_INT}")

        val hasPermission = hasOverlayPermission()
        Log.i(TAG, "悬浮窗权限检查: $hasPermission")

        if (!hasPermission) {
            Log.w(TAG, "没有悬浮窗权限，无法显示悬浮窗")
            return
        }

        // 取消之前可能存在的自动消失任务
        autoDismissRunnable?.let {
            mainHandler.removeCallbacks(it)
            Log.d(TAG, "已取消之前的自动消失任务")
        }
        autoDismissRunnable = null

        mainHandler.post {
            Log.d(TAG, "在主线程执行，当前悬浮窗状态=${overlayView != null}")
            try {
                // 如果已有悬浮窗，先移除
                if (overlayView != null) {
                    try {
                        windowManager?.removeView(overlayView)
                        Log.d(TAG, "已移除现有悬浮窗视图")
                    } catch (e: Exception) {
                        Log.w(TAG, "移除现有悬浮窗失败: ${e.message}")
                    }
                    overlayView = null
                }

                // 重置选中状态
                selectedCategory = null
                categoryViews.clear()

                windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                Log.d(TAG, "已获取WindowManager")

                // 创建悬浮窗视图
                val newOverlayView = createOverlayView(amount, source, onDismiss)
                Log.d(TAG, "悬浮窗视图已创建")

                // 设置悬浮窗参数
                val params = createLayoutParams()
                Log.d(TAG, "布局参数: type=${params.type}, flags=${params.flags}, gravity=${params.gravity}")

                // 添加悬浮窗
                windowManager?.addView(newOverlayView, params)
                overlayView = newOverlayView
                Log.i(TAG, "支付悬浮窗已添加到WindowManager: 金额=$amount, 来源=$source")

                // 延迟检查悬浮窗是否仍然存在
                mainHandler.postDelayed({
                    if (overlayView != null && overlayView?.isAttachedToWindow == true) {
                        Log.i(TAG, "悬浮窗在500ms后仍然可见 - 成功!")
                    } else {
                        Log.w(TAG, "悬浮窗被系统移除!")
                    }
                }, 500)

                // 设置自动消失
                scheduleAutoDismiss(onDismiss)

                // 加载分类数据
                loadCategories(newOverlayView)

            } catch (e: Exception) {
                Log.e(TAG, "显示悬浮窗失败: ${e.message}", e)
                e.printStackTrace()
            }
        }
    }

    /**
     * 关闭悬浮窗
     */
    fun dismissOverlay() {
        Log.d(TAG, "关闭悬浮窗被调用")
        mainHandler.post {
            dismissOverlayInternal()
        }
    }

    /**
     * 内部关闭悬浮窗方法（必须在主线程调用）
     */
    private fun dismissOverlayInternal() {
        try {
            // 取消自动消失
            autoDismissRunnable?.let { mainHandler.removeCallbacks(it) }
            autoDismissRunnable = null

            // 移除悬浮窗
            overlayView?.let {
                windowManager?.removeView(it)
                overlayView = null
            }

            // 清理状态
            selectedCategory = null
            categoryViews.clear()

            Log.d(TAG, "支付悬浮窗已内部关闭")
        } catch (e: Exception) {
            Log.e(TAG, "关闭悬浮窗失败: ${e.message}", e)
        }
    }

    /**
     * 显示成功反馈
     */
    private fun showSuccessFeedback(view: View, amount: Double, categoryName: String) {
        // 隐藏主内容
        view.findViewById<LinearLayout>(R.id.content_main)?.visibility = View.GONE

        // 显示成功反馈
        val successContent = view.findViewById<LinearLayout>(R.id.content_success)
        successContent?.visibility = View.VISIBLE

        // 设置成功详情
        val successDetail = view.findViewById<TextView>(R.id.tv_success_detail)
        successDetail?.text = "¥${String.format("%.2f", amount)} - $categoryName"

        // 延迟关闭
        mainHandler.postDelayed({
            dismissOverlay()
        }, SUCCESS_DISPLAY_DELAY)
    }

    /**
     * 显示失败反馈
     */
    private fun showErrorFeedback(view: View, amount: Double, errorMessage: String?, onRetry: () -> Unit) {
        // 隐藏主内容
        view.findViewById<LinearLayout>(R.id.content_main)?.visibility = View.GONE

        // 显示失败反馈
        val errorContent = view.findViewById<LinearLayout>(R.id.content_error)
        errorContent?.visibility = View.VISIBLE

        // 设置错误信息
        val errorText = view.findViewById<TextView>(R.id.tv_error_message)
        errorText?.text = errorMessage ?: "请稍后重试"

        // 重试按钮
        val retryButton = view.findViewById<Button>(R.id.btn_retry)
        retryButton?.setOnClickListener {
            // 隐藏错误反馈，显示主内容
            errorContent?.visibility = View.GONE
            view.findViewById<LinearLayout>(R.id.content_main)?.visibility = View.VISIBLE
            onRetry()
        }
    }

    /**
     * 创建悬浮窗视图
     */
    private fun createOverlayView(
        amount: Double,
        source: String,
        onDismiss: () -> Unit
    ): View {
        val inflater = LayoutInflater.from(context)
        val view = inflater.inflate(R.layout.payment_overlay, null)

        // 设置金额
        val amountText = view.findViewById<TextView>(R.id.tv_amount)
        amountText.text = String.format("¥ %.2f", amount)

        // 设置来源
        val sourceText = view.findViewById<TextView>(R.id.tv_source)
        val sourceName = when (source) {
            "wechat" -> "微信支付"
            "alipay" -> "支付宝"
            else -> "支付"
        }
        sourceText.text = "检测到 $sourceName 消费"

        // 获取确认按钮引用
        val confirmButton = view.findViewById<Button>(R.id.btn_confirm)
        val remarkInput = view.findViewById<EditText>(R.id.et_remark)

        // 记账按钮
        confirmButton.setOnClickListener {
            Log.d(TAG, "确认按钮被点击")

            val category = selectedCategory
            if (category == null) {
                // 简单提示
                return@setOnClickListener
            }

            // 禁用按钮防止重复点击
            confirmButton.isEnabled = false
            confirmButton.text = "记账中..."

            // 调用 API 创建账单
            val remark = remarkInput.text?.toString()?.trim().orEmpty().ifBlank { null }
            apiService.createBill(
                amount = amount,
                categoryId = category.id,
                description = remark
            ) { success, errorMessage ->
                mainHandler.post {
                    if (success) {
                        // 保存分类选择
                        saveLastCategoryId(category.id)

                        // 发送广播通知 RN 层刷新数据
                        sendBillCreatedBroadcast()

                        // 显示成功反馈
                        showSuccessFeedback(view, amount, category.name)
                    } else {
                        // 显示失败反馈
                        showErrorFeedback(view, amount, errorMessage) {
                            // 重试时恢复按钮状态
                            confirmButton.isEnabled = true
                            confirmButton.text = "记账"
                        }
                    }
                }
            }
        }

        // 关闭按钮
        val closeButton = view.findViewById<Button>(R.id.btn_close)
        closeButton.setOnClickListener {
            Log.d(TAG, "关闭按钮被点击")
            dismissOverlay()
            onDismiss()
        }

        // 右上角关闭按钮
        val closeXButton = view.findViewById<ImageButton>(R.id.btn_close_x)
        closeXButton.setOnClickListener {
            Log.d(TAG, "X关闭按钮被点击")
            dismissOverlay()
            onDismiss()
        }

        return view
    }

    /**
     * 加载分类数据
     */
    private fun loadCategories(view: View) {
        val loadingContainer = view.findViewById<LinearLayout>(R.id.loading_container)
        val categoriesContainer = view.findViewById<LinearLayout>(R.id.container_categories)
        val scrollView = view.findViewById<View>(R.id.scroll_categories)
        val confirmButton = view.findViewById<Button>(R.id.btn_confirm)
        categoriesContainer.removeAllViews()

        // 显示加载状态
        loadingContainer.visibility = View.VISIBLE
        scrollView.visibility = View.GONE

        apiService.getExpenseCategories { categories ->
            mainHandler.post {
                loadingContainer.visibility = View.GONE

                if (categories.isNullOrEmpty()) {
                    Log.w(TAG, "获取分类列表为空或失败")
                    // 显示错误提示
                    val errorText = TextView(context).apply {
                        text = "加载分类失败，请稍后重试"
                        setTextColor(0xFF737373.toInt())  // Neo-Brutalism: textTertiary
                        textSize = 13f
                    }
                    categoriesContainer.addView(errorText)
                    scrollView.visibility = View.VISIBLE
                    return@post
                }

                Log.d(TAG, "加载到 ${categories.size} 个分类")

                val density = context.resources.displayMetrics.density
                val lastCategoryId = getLastCategoryId()
                val rowHeight = (40 * density).toInt()
                val rowGap = (8 * density).toInt()

                // 按每行 CATEGORIES_PER_ROW 个分组，创建网格布局
                val chunked = categories.chunked(CATEGORIES_PER_ROW)
                chunked.forEachIndexed { rowIndex, rowCategories ->
                    val rowLayout = LinearLayout(context).apply {
                        orientation = LinearLayout.HORIZONTAL
                        layoutParams = LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT
                        ).apply {
                            if (rowIndex < chunked.size - 1) {
                                bottomMargin = rowGap
                            }
                        }
                    }

                    rowCategories.forEach { category ->
                        val categoryView = createCategoryView(category, confirmButton)
                        rowLayout.addView(categoryView)
                        categoryViews.add(Pair(categoryView, category))

                        // 如果是上次选择的分类，自动选中
                        if (category.id == lastCategoryId) {
                            selectCategory(categoryView, category, confirmButton)
                        }
                    }

                    // 不满一行时用空 View 占位，保持等宽
                    val remaining = CATEGORIES_PER_ROW - rowCategories.size
                    repeat(remaining) {
                        val spacer = View(context).apply {
                            layoutParams = LinearLayout.LayoutParams(
                                0, 1, 1f
                            ).apply {
                                marginStart = (4 * density).toInt()
                                marginEnd = (4 * density).toInt()
                            }
                        }
                        rowLayout.addView(spacer)
                    }

                    categoriesContainer.addView(rowLayout)
                }

                // 超过 MAX_VISIBLE_ROWS 行时，限制 ScrollView 高度以支持纵向滚动
                val totalRows = chunked.size
                if (totalRows > MAX_VISIBLE_ROWS) {
                    val maxHeight = MAX_VISIBLE_ROWS * rowHeight + (MAX_VISIBLE_ROWS - 1) * rowGap
                    scrollView.layoutParams = scrollView.layoutParams.apply {
                        height = maxHeight
                    }
                }

                scrollView.visibility = View.VISIBLE
            }
        }
    }

    /**
     * 创建分类按钮视图 (Neo-Brutalism 风格, 等宽网格)
     */
    private fun createCategoryView(category: CategoryData, confirmButton: Button): TextView {
        val categoryView = TextView(context).apply {
            // 显示图标和名称
            text = "${category.icon ?: "📦"} ${category.name}"
            textSize = 14f
            setTextColor(0xFF1A1A1A.toInt())  // Neo-Brutalism: 深色文字
            setBackgroundResource(R.drawable.btn_category_unselected)
            setTypeface(typeface, android.graphics.Typeface.BOLD)

            // 设置内边距
            val density = context.resources.displayMetrics.density
            val horizontalPadding = (12 * density).toInt()
            val verticalPadding = (8 * density).toInt()
            setPadding(horizontalPadding, verticalPadding, horizontalPadding, verticalPadding)

            // 等宽布局: weight=1, width=0
            val params = LinearLayout.LayoutParams(
                0,
                (40 * density).toInt(),
                1f
            ).apply {
                marginStart = (4 * density).toInt()
                marginEnd = (4 * density).toInt()
            }
            layoutParams = params

            gravity = android.view.Gravity.CENTER

            // 点击事件
            setOnClickListener {
                selectCategory(this, category, confirmButton)
            }
        }

        return categoryView
    }

    /**
     * 选择分类 (Neo-Brutalism 风格)
     */
    private fun selectCategory(selectedView: TextView, category: CategoryData, confirmButton: Button) {
        Log.d(TAG, "选择分类: ${category.name} (id=${category.id})")

        // 更新选中状态
        selectedCategory = category

        // 更新所有分类按钮的样式
        categoryViews.forEach { (view, cat) ->
            if (cat.id == category.id) {
                view.setBackgroundResource(R.drawable.btn_category_selected)
                view.setTextColor(0xFF1D4ED8.toInt())  // Neo-Brutalism: primaryDark
            } else {
                view.setBackgroundResource(R.drawable.btn_category_unselected)
                view.setTextColor(0xFF1A1A1A.toInt())  // Neo-Brutalism: stroke/dark
            }
        }

        // 启用确认按钮
        confirmButton.isEnabled = true
        confirmButton.alpha = 1.0f
    }

    /**
     * 创建悬浮窗布局参数
     */
    private fun createLayoutParams(): WindowManager.LayoutParams {
        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }
    }

    /**
     * 设置自动消失定时器
     */
    private fun scheduleAutoDismiss(onDismiss: () -> Unit) {
        autoDismissRunnable = Runnable {
            Log.d(TAG, "${AUTO_DISMISS_DELAY}ms后自动消失触发")
            dismissOverlay()
            onDismiss()
        }
        mainHandler.postDelayed(autoDismissRunnable!!, AUTO_DISMISS_DELAY)
        Log.d(TAG, "已设置${AUTO_DISMISS_DELAY}ms后自动消失")
    }
}
