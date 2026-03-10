# [cite_start]UI 交互架构规范 [cite: 5]

## [cite_start]1. 主界面 (课程资源管理器) [cite: 7]
- [cite_start]**左侧导航**: 按日期生成的文件夹列表 [cite: 8]。
- [cite_start]**中部视图**: 课程卡片流。每个卡片需展示四个状态灯（Recording, ASR, Analysis, Push） [cite: 9, 11]。
- [cite_start]**底部控制台**: 常驻“开始录音”大按钮 [cite: 12]。

## [cite_start]2. 课堂详情看板 (Secondary View) [cite: 13]
[cite_start]点击卡片进入，分为三个工作区 [cite: 13, 14]：
* [cite_start]**资产区**: 播放音频、查看 ASR 转写 [cite: 15]。
* [cite_start]**编辑区**: 展示 AI 文案，支持“左右对比”视图及手动编辑 [cite: 16, 25]。
* [cite_start]**发送看板**: 列出全班学生状态，支持批量/单发，并在行末提供“复制评价”紧急出口 [cite: 17, 32]。

## [cite_start]3. 实时监控 [cite: 76]
- [cite_start]必须具备“自动刷新”逻辑，监控本地文件夹变化以更新卡片状态 [cite: 69, 76]。

## 4. 视觉反馈
* [cite_start]**错误提示**: 针对“ID 缺失”提供显眼的标识及“打开配置表”快捷按钮 [cite: 29]。
* **进度反馈**: ASR 及 LLM 生成过程中需有实时的进度显示。


