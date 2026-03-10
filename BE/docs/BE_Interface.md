# 后端 API 接口定义 (BE Interface)

## 1. 系统类
* `GET /init`: 加载配置、日期列表及 Excel 中的元数据。
* `POST /settings`: 更新 API Key 及存储路径配置。

## 2. 课程与文件类
* [cite_start]`GET /courses/{date}`: 获取指定日期下所有课程卡片的状态及进度灯信息 [cite: 9, 11]。
* `POST /record/upload`: 接收前端临时录音文件。
  * Request: Multipart Form (File, CourseMeta).
  * Action: 将文件移至正式目录，触发 ASR。

## 3. AI 交互类
* `GET /task/status/{course_id}/ASR`: 获取 ASR 任务进度。
* `GET /task/status/{course_id}/Analysis`: 获取 Analysis 任务进度。
* `POST /analysis/iterate`: 
  * Request: `{course_id, user_suggestion}`.
  * Action: LLM 基于建议重写。

## 4. 发送类
* [cite_start]`POST /push/batch`: 批量或单发评价。记录结果至 `_Status.json` [cite: 36]。