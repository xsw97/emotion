# ===== 构建阶段 =====
FROM node:24-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# 复制依赖配置文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile --prefer-offline

# 复制源码
COPY . .

# 构建项目
RUN pnpm next build

# 打包服务端
RUN pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

# ===== 运行阶段 =====
FROM node:24-alpine

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["node", "dist/server.js"]