# LiteNote

一款 AI 智能记账应用，支持语音记账、拍照记账、AI 对话记账和支付通知自动记账。
<p align="center">
 <img src="docs/screenshots/banner.png" alt="LiteNote Banner" width="100%" />
</p>

## 特色功能

### AI 智能记账

通过自然语言与 AI 助手对话，自动创建、查询、删除和统计账单，取决了你提供了哪些tool。支持多模型切换（Claude / OpenAI / DeepSeek / Qwen），保留原生llm能力，不局限于记账。
<div align="center">
  <img src="docs/screenshots/textChat1.png" width="48%" alt="AI 对话 1" />
  <img src="docs/screenshots/textChat2.png" width="48%" alt="AI 对话 2" />
</div>
<div align="center">
  <img src="docs/screenshots/aiConfig1.png" width="48%" alt="AI 模型配置 1" />
  <img src="docs/screenshots/aiConfig2.png" width="48%" alt="AI 模型配置 2" />
</div>

### 语音记账

按住录音按钮说出消费内容，AI 自动识别并创建账单。
<p align="center">
  <img src="docs/screenshots/asrChat.gif" alt="语音记账演示" width="70%" />
  <br />
</p>

### 拍照记账

拍摄或上传小票、发票，AI 识别自动解析金额、分类和日期,支持多张图片。
<p align="center">
  <img src="docs/screenshots/mutPhotoChat.png" width="80%" alt="拍照记账" />
</p>

### 支付通知自动记账

监听微信、支付宝等应用的支付通知，自动创建对应账单，无需手动录入。
<div align="center">
  <img src="docs/screenshots/autoNote1.gif" alt="支付通知自动记账 1" width="48%" />
  <img src="docs/screenshots/autoNote2.gif" alt="支付通知自动记账 2" width="48%" />
</div>

### 统计与预算

多维度收支统计、分类趋势图表、预算追踪与超额预警。
<div align="center">
  <img src="docs/screenshots/chart1.png" width="32%" alt="统计报表1" />
  <img src="docs/screenshots/chart2.png" width="32%" alt="统计报表2" />
  <img src="docs/screenshots/chart3.png" width="32%" alt="统计报表3" />
</div>

<p align="center">
  <img src="docs/screenshots/homeCard.gif" alt="主页卡片动态" width="70%" />
</p>




## 技术栈

| 层级 | 技术 |
|------|------|
| **后端** | NestJS 10 · Prisma 6 · PostgreSQL · JWT · Swagger |
| **移动端** | React Native 0.81 · TypeScript · React Navigation 7 · React Query 5 |
| **AI** | 多模型适配器（Claude / OpenAI / DeepSeek / Qwen）· SSE 流式响应 · Tool Calling |
| **语音** | OpenAI Whisper 兼容协议 ASR |

## 项目结构

```
lite-note-app/
├── litenote-backend/        # NestJS REST API 后端
│   ├── src/
│   │   ├── auth/            # JWT 认证
│   │   ├── bills/           # 账单 CRUD + 统计
│   │   ├── categories/      # 分类管理
│   │   ├── accounts/        # 多账户管理
│   │   ├── budgets/         # 预算追踪
│   │   ├── ai/              # AI 对话 + 工具调用 + ASR
│   │   └── app-version/     # 移动端版本管理
│   └── prisma/              # 数据库 Schema
├── litenote-mobile-app/     # React Native 移动应用
│   ├── src/
│   │   ├── screens/         # 18 个屏幕
│   │   ├── components/      # UI / 业务 / 图表组件
│   │   ├── services/        # HTTP · API · 语音 · 通知
│   │   ├── hooks/           # 自定义 Hooks
│   │   └── theme/           # Light/Dark/System 主题
│   └── android/             # Android 原生层
└── package.json             # Monorepo 根配置
```

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL（本地或云托管，如 [Neon](https://neon.tech)、[Supabase](https://supabase.com)）
- Android Studio（移动端开发）
- JDK 17

### 1. 克隆并安装依赖

```bash
git clone https://github.com/your-username/lite-note-app.git
cd lite-note-app
npm run install:all
```

### 2. 配置后端环境变量

```bash
cp litenote-backend/.env.example litenote-backend/.env
```

编辑 `litenote-backend/.env`，至少配置：

```env
JWT_SECRET=your-random-secret-key
DATABASE_URL="postgresql://user:password@localhost:5432/litenote"
```

### 3. 初始化数据库

```bash
npm run backend:prisma:migrate:dev
```

### 4. 启动后端

```bash
npm run backend:start:dev
```

后端默认运行在 `http://localhost:3006`，API 文档位于 `http://localhost:3006/api-docs`。

### 5. 启动移动端

移动端默认连接 `http://localhost:3006`（在 `litenote-mobile-app/.env.development` 中配置）。

```bash
npm run mobile:android:dev
```

## 环境变量参考

### 后端 (`litenote-backend/.env`)

| 变量 | 必填 | 说明 |
|------|------|------|
| `PORT` | 否 | 服务端口，默认 `3006` |
| `JWT_SECRET` | **是** | JWT 签名密钥 |
| `DATABASE_URL` | **是** | PostgreSQL 连接字符串 |
| `API_BASE_URL` | 否 | 外部访问地址（留空则自动从请求获取） |
| `ASR_API_URL` | 否 | 语音识别 API 地址（兼容 OpenAI Whisper 协议） |
| `ASR_API_KEY` | 否 | 语音识别 API Key |
| `ASR_MODEL` | 否 | 语音识别模型名称 |

### 移动端 (`litenote-mobile-app/.env.development`)

| 变量 | 说明 |
|------|------|
| `API_BASE_URL` | 后端 API 地址 |
| `SENTRY_DSN` | Sentry 错误监控 DSN（留空则不初始化） |
| `SENTRY_DSN_ANDROID` | Android 原生层 Sentry DSN（留空则不初始化） |
<div align="center">
  <img src="docs/screenshots/log.png" width="48%" alt="日志" />
  <p>方便埋点定位一些刁钻问题</p>
</div>
## 常用命令

```bash
# 后端
npm run backend:start:dev          # 热重载开发
npm run backend:prisma:migrate:dev # 创建数据库迁移
npm run backend:prisma:studio      # Prisma Studio GUI

# 移动端
npm run mobile:android:dev         # Android 开发环境
npm run mobile:build:dev           # 构建 Debug APK
npm run mobile:build:prod          # 构建 Release APK
```

## CI/CD

- 本仓库是 monorepo：一次提交即可并行触发前端与后端两个工作流，保持交付节奏一致。
- `.github/workflows/build-android.yml`： GitHub Actions + `scripts/release.js` :推送代码后，同步远端 main/tags → 版本号递增 → 更新 Android 版本号 → Gradle 编译 APK → 上传 APK 到后端 → 提交并打 Tag（CI 模式下自  动 push）
- `.github/workflows/deploy-backend.yml`：模板示例里使用了阿里云容器镜像服务（ACR）登录推送，可根据需要替换，只需改动 registry 相关的环境变量和 `docker login` 步骤即可。Secrets/Variables 要按自身云厂商配置。
<div align="center">
  <img src="docs/screenshots/update.png" width="48%" alt="自动升级" />
</div>


## License

MIT
