# === 构建阶段 ===
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# === 生产阶段 ===
FROM node:20-alpine
WORKDIR /app

# 只复制生产运行所需的文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# 创建持久化目录
RUN mkdir -p uploads/avatars public/downloads

EXPOSE 3006

# 启动服务（数据库 schema 通过 prisma db push 手动管理）
CMD ["node", "dist/main.js"]
