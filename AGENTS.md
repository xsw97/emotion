# AGENTS.md - 空中花园情绪管理应用

## 项目概览
**空中花园**是一个梦幻治愈系的情绪管理 Web 应用。用户拥有一个漂浮在云端的虚拟花园，花园的天气和植物状态直接映射用户的情绪。通过情绪打卡和完成调节任务，用户可以为花园获取阳光和养分，促进花园成长。

## 技术栈
- **前端框架**: 无框架，纯原生实现
- **语言**: HTML + CSS + JavaScript (ES6+)
- **数据存储**: localStorage
- **动画**: CSS Animation + requestAnimationFrame (Canvas)
- **音频**: Web Audio API

## 项目结构
```
/workspace/projects/
├── index.html            # 主页面（单页应用）
├── styles/
│   └── main.css          # 主样式文件（含所有动画）
├── scripts/
│   ├── storage.js        # localStorage 数据管理模块
│   ├── audio.js          # Web Audio API 音频模块
│   ├── weather.js        # 天气系统模块
│   ├── garden.js         # 花园场景渲染模块
│   ├── tasks.js          # 情绪调节任务模块
│   ├── stats.js          # 统计与可视化模块
│   └── app.js            # 主应用控制器
├── DESIGN.md             # 设计规范文件
├── AGENTS.md             # 项目文档（本文件）
└── .coze                 # Coze 配置文件
```

## 核心功能模块

### 1. 情绪识别模块 (Storage + App)
- 情绪打卡：5个等级（非常开心😊 → 很难过😢）
- localStorage 持久化
- 连续打卡统计

### 2. 花园天气系统 (Weather)
- 情绪 → 天气映射：
  - 非常开心 → 阳光灿烂 + 彩虹 + 蝴蝶
  - 开心 → 晴朗舒适 + 白云
  - 一般 → 多云微阴
  - 低落 → 细雨绵绵
  - 很难过 → 暴风雨 + 雷电
- CSS 动画：云朵漂浮、雨滴下落、雷电闪烁、蝴蝶飞舞等
- 粒子系统：星星、花瓣、阳光粒子

### 3. 花园场景渲染 (Garden)
- 漂浮平台 + 草地 + 植物（花、树、草）
- 植物状态随情绪变化：盛开 → 健康 → 中性 → 枯萎
- 花园等级系统（种子 → 发芽 → 成长 → 茂盛 → 花园王国）

### 4. 情绪调节任务系统 (Tasks)
- 5种任务：深呼吸、感恩日记、正念冥想、自我对话、音乐放松
- 任务进度环动画
- 完成奖励：阳光值 + 养分值

### 5. 数据统计 (Stats)
- 情绪日历（月历视图）
- 情绪趋势图（Canvas 折线图）
- 统计卡片：连续打卡、总记录、开心天数比例、完成任务数

### 6. 音频系统 (Audio)
- Web Audio API 生成背景音乐
- 呼吸引导音效
- 任务完成音效
- 升级庆祝音效

## 数据结构

### localStorage 键名
- `skygarden_mood_records`: 情绪记录数组
- `skygarden_task_history`: 任务完成历史
- `skygarden_garden_state`: 花园状态（等级、阳光、养分、植物）
- `skygarden_settings`: 用户设置（音乐开关）
- `skygarden_streak`: 连续打卡数据

### 情绪记录结构
```javascript
{
  mood: 1-5,
  note: string,
  timestamp: number,
  date: 'YYYY-MM-DD'
}
```

### 花园状态结构
```javascript
{
  level: 1-5,
  levelName: string,
  sunshine: 0-100,
  nutrient: 0-100,
  plants: array,
  unlockedPlants: array
}
```

## 设计规范
详见 `DESIGN.md` 文件，包含：
- 配色方案（情绪-天气映射色）
- Design Tokens（CSS 变量）
- 动效规范
- 响应式断点
- 设计禁忌

## 启动命令
项目使用 Coze CLI 管理：
- `coze dev`: 启动开发服务器（端口 5000）
- `coze build`: 构建生产版本
- `coze start`: 启动生产服务器

## 代码风格指南
- **命名**: 使用 camelCase，避免缩写
- **注释**: 函数必须有文档注释
- **模块化**: 每个功能模块独立文件
- **事件绑定**: 在 `app.js` 统一管理
- **CSS**: 使用 CSS 变量和 BEM 风格类名

## 响应式设计
- 移动端优先（375px）
- 断点：480px、768px、1024px
- 桌面端最大宽度：面板 500px，花园平台 700px

## 性能优化
- CSS 动画优先（GPU 加速）
- Canvas 用于数据可视化
- `prefers-reduced-motion` 媒体查询支持
- 页面可见性 API 管理音频

## 常见问题修复
1. **动画卡顿**: 检查 `will-change` 和 `transform` 属性
2. **音频不播放**: 确保用户交互后调用 `Audio.init()`
3. **数据丢失**: 检查 localStorage quota 和 JSON.parse 错误
4. **Canvas 空白**: 确保 canvas 尺寸正确设置

## 后续优化建议
- 添加更多植物种类和装饰
- 实现社交分享功能
- 添加每日提醒通知
- 支持多语言
- PWA 支持（离线访问）