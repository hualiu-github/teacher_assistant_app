# 前端技术核心原则 (FE Technical Core)

## 1. 技术栈
* [cite_start]**框架**: Electron + Vite + React + Tailwind CSS。 [cite: 38]
* **状态管理**: 推荐使用 `React Query (TanStack Query)` 处理与 FastAPI 的异步请求。

## 2. 进程管理
* **Sidecar 启动**: 在 Electron 主进程 (`main.ts`) 中使用 `child_process` 静默启动 Python 编译后的后端服务。
* **生命周期**: 确保 App 关闭时，后端进程被安全 `SIGTERM`。

## 3. 安全约束
* 渲染进程严禁使用 Node.js 原生模块。所有本地操作必须通过调用 `localhost` 后端接口或 `contextBridge` 实现。