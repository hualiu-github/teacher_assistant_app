# 后端技术核心原则 (BE Technical Core)

## 1. 定位与架构
* [cite_start]**角色**: 本地 Sidecar (边车) 进程，为前端提供业务逻辑、文件 I/O 及 AI 转发。 [cite: 3, 38]
* [cite_start]**技术栈**: Python 3.10+, FastAPI, `openai` SDK (协议适配),阿里ASR接口, `pandas` (Excel 处理)。 [cite: 38, 39]
* **通信协议**: 匹配 **OpenAI API 协议**，通过动态配置 `base_url` 和 `api_key` 兼容各种模型服务商（如 DeepSeek, OpenAI）。匹配 **阿里 ASR 协议**，通过动态配置 `base_url` 和 `api_key` 兼容各种模型服务商（如 DeepSeek, OpenAI）。

## 2. 核心约束
* [cite_start]**无状态性**: 逻辑上不使用关系型数据库，所有状态持久化至本地文件。 [cite: 33]
* **异步处理**: 必须使用 `asyncio` 处理 ASR 与 LLM 请求，确保不阻塞本地文件操作。
* [cite_start]**错误处理**: API 需返回结构化的错误码（如 `4001: ID_MISSING`, `5001: API_TIMEOUT`）供前端渲染。 [cite: 28, 29, 30]