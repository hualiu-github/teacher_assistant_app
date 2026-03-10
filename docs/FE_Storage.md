# 前端存储与状态 (FE Storage)

## 1. 配置持久化
* **Settings**: 存储用户选择的“存储根路径”、OpenAI 协议配置。
* **持久化工具**: 使用 `electron-store` 或直接读写后端的 `Settings.json`。

## 2. UI 状态管理
* [cite_start]实时轮询或监听后端 `_Status.json` 的变化，以更新课程卡片的进度条和状态灯。 [cite: 11]