# 户外露营装备租赁平台

一个全栈的户外露营装备在线租赁平台，支持装备浏览、在线下单、订单管理和管理员后台统计。

## 技术栈

- **前端：** Vite + React 18 + TypeScript（端口 5173）
- **后端：** Express + TypeScript + better-sqlite3（端口 3000）
- **认证：** JWT + bcryptjs
- **启动工具：** concurrently

## 快速启动

```bash
# 安装所有依赖
npm run install:all

# 启动项目（前后端同时启动）
npm run dev
```

启动后访问 http://localhost:5173

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 普通用户 | user | 123456 |

## 功能说明

### 用户端
- **登录注册：** 支持用户名密码登录和新用户注册
- **装备库：** 按分类筛选（帐篷/睡袋/炊具/照明/桌椅），支持关键词搜索，库存为零显示"已借完"
- **装备详情：** 查看装备信息，选择租期自动计算费用，提交租赁订单
- **我的租赁：** 查看所有订单状态、租期、费用明细，支持取消待处理订单和确认归还
- **个人中心：** 查看和修改个人信息

### 管理员端
- **装备管理：** 录入新装备（名称、分类、品牌、日租金、押金、数量、描述），编辑和删除装备
- **订单管理：** 确认出库、标记租赁中、归还检查（无损坏退押金/有损坏扣押金并填写损坏说明）
- **数据统计：** 装备总数/库存/总订单/活跃订单/租赁收入/押金池/损坏订单/用户数统计，按分类的使用率报表和收入报表，最近订单列表

## 数据库说明

使用 SQLite，首次启动自动建表并 seed 默认数据（2个测试账号 + 12件装备），无需手动初始化。

## 项目结构

```
├── package.json          # 根配置（concurrently）
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts      # Express 入口
│       ├── db/database.ts    # 数据库初始化和 seed
│       ├── middleware/auth.ts # JWT 认证中间件
│       └── routes/
│           ├── auth.ts       # 登录注册
│           ├── equipment.ts  # 装备 CRUD
│           ├── orders.ts     # 订单管理
│           └── stats.ts      # 统计接口
└── client/
    ├── package.json
    ├── vite.config.ts
    ├── index.html         # 全局样式写在 style 标签
    └── src/
        ├── main.tsx
        ├── App.tsx        # 路由配置
        ├── types/index.ts # TypeScript 类型
        ├── api/index.ts   # API 请求封装
        ├── components/
        │   ├── AuthContext.tsx  # 认证上下文
        │   └── Navbar.tsx      # 导航栏
        └── pages/
            ├── LoginPage.tsx
            ├── GearListPage.tsx
            ├── GearDetailPage.tsx
            ├── GearFormPage.tsx
            ├── AdminEquipmentsPage.tsx
            ├── AdminOrdersPage.tsx
            ├── AdminStatsPage.tsx
            ├── MyOrdersPage.tsx
            └── ProfilePage.tsx
```

## 注意事项

- 前端通过 Vite proxy 将 `/api` 请求转发到后端 3000 端口
- 所有样式写在 `client/index.html` 的 `<style>` 标签中，不使用 CSS 文件和第三方 UI 库
- 数据库文件生成在 `server/camp-gear.db`，首次启动自动初始化
- 装备分类固定为：帐篷(tent)、睡袋(sleeping_bag)、炊具(cookware)、照明(lighting)、桌椅(furniture)
- 订单状态流转：待确认 -> 已确认 -> 租赁中 -> 已归还 -> 已完成/损坏处理
