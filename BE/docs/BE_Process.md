# 后端业务流程 (BE Process)

## 1. 关系维护与元数据录入
* [cite_start]**Excel 解析**: 从 `Relationship.xlsx` 中检索课程与班级信息。 [cite: 4, 20]
* [cite_start]**姓名匹配**: 自动从 ASR 转写文本中识别“点名”逻辑，并与 Excel 名单进行模糊匹配。 [cite: 22]

## 2. 文件接收与归档
* **接收上传**: 提供 `/upload` 接口，接收前端上传的录音文件块或完整临时文件。
* [cite_start]**目录创建**: 接收成功后，根据当前课程元数据（课程名_班级名_时间）在根目录下创建物理文件夹 [cite: 34, 35]。
* [cite_start]**永久存储**: 将临时音频移动至正式路径，命名为 `audio.wav` [cite: 35]。

## 3. 自动化 AI 处理
* [cite_start]**触发机制**: 文件存储完成后，自动初始化 `_Status.json` 状态为 "ASR_Processing" 。
* **顺序调用**: 
    1. [cite_start]调用符合 OpenAI 协议的 Whisper V3 接口进行转写 [cite: 21, 39]。
    2. [cite_start]转写完成后，利用 LLM 进行首次评价分析 [cite: 24, 39]。
    3. 更新 `_Status.json`，通知前端任务完成。

## 4. 推送逻辑
* [cite_start]**通道**: 调用企业微信外部联系人 API 执行精准推送。 [cite: 4, 40]

