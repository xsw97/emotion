# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

## 空中花园项目说明

### 功能模块
- **情绪打卡**：5 级情绪选择（非常开心→很难过），记录到 localStorage
- **花园天气**：根据情绪动态渲染天气效果（晴天→暴风雨）
- **任务系统**：5 种情绪调节任务（深呼吸、感恩日记、冥想等），完成后增加阳光/养分
- **种植系统**：点击侧边栏种植按钮，再点击花园草坪种植植物，随等级解锁新植物
- **花园等级**：种子→发芽→成长→茂盛→花园王国（5 级）
- **统计面板**：总打卡数、连续天数、情绪趋势图、最近打卡记录
- **用户认证**：邮箱登录注册，每个用户独立花园世界（Supabase Auth + localStorage）

### 关键文件
- `src/app/garden/page.tsx` - 花园主页面（核心逻辑）
- `src/app/auth/login/page.tsx` - 登录页面
- `src/app/auth/register/page.tsx` - 注册页面
- `src/app/api/garden/route.ts` - 花园数据 API
- `src/middleware.ts` - 路由保护中间件
- `src/lib/supabase.ts` - 浏览器端 Supabase 客户端
- `src/app/globals.css` - 全局样式（含花园动画定义）

### 数据存储
- 用户认证：Supabase Auth（邮箱+密码）
- 花园数据：localStorage（key: `garden_{userId}`）
- Supabase 数据库表 `user_gardens`（可选，通过 API 同步）

### 设计规范
- 🎨 梦幻治愈系风格，粉紫蓝渐变主色调
- 🏝️ 天空之城浮岛样式（椭圆形草坪+岩石底部）
- 🌤️ 天气效果随情绪动态变化
- 🌸 植物使用 emoji 渲染，种植时随机大小
