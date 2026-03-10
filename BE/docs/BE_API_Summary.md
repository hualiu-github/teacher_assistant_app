# BE API Summary

Base URL: `http://127.0.0.1:8765`

## 1. Health
### `GET /health`
- 用途: 健康检查
- Response:
```json
{ "status": "ok" }
```

## 2. System
### `GET /init`
- 用途: 初始化页面数据
- Response:
```json
{
  "storage_root": "D:/.../storage",
  "dates": ["2026年03月05日"],
  "relationship_exists": true
}
```

### `POST /settings`
- 用途: 保存系统配置并刷新运行时
- Request:
```json
{
  "storage_root": "D:/TeacherData",
  "openai_base_url": "https://api.openai.com/v1",
  "openai_api_key": "sk-...",
  "asr_base_url": "https://asr.example.com/v1",
  "asr_api_key": "asr-key"
}
```
- Response: 返回合并后的 `Settings.json` 内容

## 3. Course & Record
### `GET /courses/{date}`
- 用途: 获取某日期课程卡片
- Path 参数:
  - `date`: 例如 `2026年03月05日`
- Response:
```json
[
  {
    "course_id": "English_Class1_0900",
    "date": "2026年03月05日",
    "course_name": "English",
    "class_name": "Class1",
    "start_time": "0900",
    "progress": {
      "recording": "done",
      "asr": "done",
      "analysis": "pending",
      "push": "pending"
    }
  }
]
```

### `POST /courses/create`
- 用途: 创建课程卡片（预约课），初始化课程目录与 `_Status.json`
- Request:
```json
{
  "date": "2026年03月05日",
  "course_name": "English",
  "class_name": "Class1",
  "start_time": "0900"
}
```
- Response:
```json
{
  "course_id": "English_Class1_0900",
  "date": "2026年03月05日",
  "course_name": "English",
  "class_name": "Class1",
  "start_time": "0900",
  "status": "created"
}
```
- 错误:
  - `409` + `{"code":4091,"message":"COURSE_ALREADY_EXISTS"}`

### `POST /record/upload`
- 用途: 上传录音并初始化课程状态
- Content-Type: `multipart/form-data`
- Form 字段:
  - `file`: 音频文件
  - `course_name`: 课程名
  - `class_name`: 班级名
  - `start_time`: 开始时间(如 `0900`)
- Response:
```json
{
  "course_id": "English_Class1_0900",
  "audio_path": "D:/.../English_Class1_0900.wav",
  "status": "ASR_Processing"
}
```

## 4. Task & Analysis
### `GET /task/status/{course_id}/{task_type}`
- 用途: 查询任务进度
- Path 参数:
  - `course_id`: 课程目录名
  - `task_type`: `ASR` | `Analysis`
- Response:
```json
{
  "course_id": "English_Class1_0900",
  "task_type": "ASR",
  "status": "done",
  "percent": 100
}
```
- 错误:
  - `400` + `{"code":4000,"message":"INVALID_TASK_TYPE"}`
  - `404` + `{"code":4040,"message":"COURSE_NOT_FOUND"}`

### `POST /task/trigger/{course_id}/asr`
- 用途: 手动触发 ASR 占位流程
- Response:
```json
{ "course_id": "English_Class1_0900", "status": "done" }
```
- 错误:
  - `404` + `{"code":4040,"message":"COURSE_NOT_FOUND"}`

### `POST /analysis/iterate`
- 用途: 根据人工建议迭代分析文案
- Request:
```json
{
  "course_id": "English_Class1_0900",
  "user_suggestion": "请更口语化并突出课堂参与度"
}
```
- Response:
```json
{ "course_id": "English_Class1_0900", "status": "done" }
```
- 错误:
  - `404` + `{"code":4040,"message":"COURSE_NOT_FOUND"}`

## 5. Push
### `POST /push/batch`
- 用途: 批量/单发推送（当前为占位实现）
- Request:
```json
{
  "course_id": "English_Class1_0900",
  "student_ids": ["S001", "S002"]
}
```
- Response:
```json
{
  "course_id": "English_Class1_0900",
  "result": {
    "S001": "sent",
    "S002": "sent"
  }
}
```
- 错误:
  - `404` + `{"code":4040,"message":"COURSE_NOT_FOUND"}`

## 6. Relationship
### `POST /relationship/sync`
- 用途: 前端关系维护中心全量同步关系数据，覆盖写入 `config/Relationship.xlsx`
- Request:
```json
{
  "rows": [
    {
      "StudentID": "S001",
      "StudentName": "张小明",
      "ClassName": "1班",
      "ParentName": "张先生",
      "ParentWX": "wxid_zxm_001"
    },
    {
      "StudentID": "S002",
      "StudentName": "王诗涵",
      "ClassName": "1班",
      "ParentName": "王女士",
      "ParentWX": ""
    }
  ]
}
```
- Response:
```json
{
  "updated_count": 2,
  "file_path": "D:/.../storage/config/Relationship.xlsx"
}
```

## 7. Status values
`progress` 字段状态值:
- `pending`
- `processing`
- `done`
- `failed`

## 8. Current placeholder behavior
- `run_asr`: 写入 `{course_id}_ASR.md`
- `run_analysis`: 写入 `{course_id}_Analysis.md`
- `run_push`: 返回全部 `sent`

以上行为位于 `app/services/pipeline_service.py`，后续可替换为真实 ASR / LLM / 企业微信推送实现。
