# 港口闸口车辆预约桌面客户端

基于 Electron + Vue 3 + TypeScript + Element Plus 构建的港口闸口车辆预约管理系统。

## 功能模块

### 1. 预约登记
- 新增预约登记
- 修改预约时段
- 查询车辆资质信息
- 搜索和筛选预约记录

### 2. 车辆排队
- 实时显示排队号码
- 呼叫车辆进场
- 闸口状态监控
- 拥堵情况展示
- 实时数据统计

### 3. 证件核验
- 司机证件校验
- 拍照留存功能
- 危险品车辆标记
- 核验结果处理

### 4. 箱单核对
- 提还箱信息匹配
- 现场称重记录
- 铅封检查
- 箱体状态检查

### 5. 闸道放行
- 手动放行功能
- 退回资料重验
- 打印通行凭证
- 闸道状态控制

### 6. 异常补录
- 爽约车辆处理
- 迟到车辆管理
- 异常记录登记
- 处理情况跟踪

### 7. 班次统计
- 班次数据统计
- 车队服务评价
- 可视化图表展示
- 报表导出功能

## 技术栈

- **框架**: Electron 28 + Vue 3
- **语言**: TypeScript
- **UI 组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **构建工具**: Vite 5
- **图表**: ECharts + vue-echarts
- **日期处理**: Day.js

## 安装运行

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
.
├── electron/              # Electron 主进程代码
│   ├── main/             # 主进程
│   └── preload/          # 预加载脚本
├── src/                   # 渲染进程代码
│   ├── components/       # 公共组件
│   ├── views/            # 页面视图
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   ├── types/            # TypeScript 类型定义
│   ├── mock/             # 模拟数据
│   ├── styles/           # 全局样式
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
