# 前端存储与状态 (FE Storage)

## 1. 配置持久化
* **Settings**: 存储用户选择的“存储根路径”、OpenAI 协议配置。
* **持久化工具**: 使用 `electron-store` 或直接读写后端的 `Settings.json`。

## 2. UI 状态管理
* 使用 `React Query` 缓存 API 返回的课程卡片数据，减少不必要的重复请求。