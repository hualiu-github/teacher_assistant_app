# [cite_start]存储架构与目录规范 [cite: 50]

## [cite_start]1. 目录层级结构 [cite: 52]
系统根据用户配置的根目录，按以下格式创建：
- [cite_start]**一级目录 (日期)**: `YYYY年MM月DD日` (例如: 2026年02月27日) [cite: 53, 54] 
- [cite_start]**二级目录 (课程详情)**: `课程名_班级名_开始时间` [cite: 55]
- [cite_start]**一级目录 (班级学生家长微信关系关系)**: `config`
- [cite_start]**二级目录 ()**: `Relationship.xlsx`

## [cite_start]2. 文件组织示例 [cite: 56]
/Root/
  └── 2026年02月27日/
      └── 英语课_1班_0900/
          [cite_start]├── 英语课_1班_0900.wav          # 原始录音 [cite: 58]
          [cite_start]├── 英语课_1班_0900_ASR.md       # 流式转写文本 [cite: 58, 59]
          [cite_start]├── 英语课_1班_0900_Analysis.md  # LLM 生成的评价报告 [cite: 59]
          [cite_start]├── _Status.json                 # 状态持久化文件 (核心) [cite: 59, 68]
          [cite_start]└── segments/                    # 流式 ASR 临时切片 [cite: 59]
    └── config/
      └── Relationship.xlsx

## [cite_start]3. _Status.json 协议 [cite: 36, 68]
必须包含以下字段：
- [cite_start]`courseInfo`: 课程名、班级、起止时间 [cite: 10]。
- [cite_start]`progress`: 录音、ASR、Analysis、Push 的实时状态位 [cite: 11]。
- [cite_start]`studentList`: 存储每个学生的发送记录与推送状态（已发送/失败/缺失ID） [cite: 29, 68]。

## 4. Relationship.xlsx 结构
- [cite_start]`StudentID`: 学生ID。 
- [cite_start]`StudentName`: 学生姓名。
- [cite_start]`ClassName`: 班级名称。
- [cite_start]`ParentName`: 家长姓名。
- [cite_start]`ParentWX`: 家长微信。

## 5. 全局配置 (Settings.json)
* 存储 OpenAI和阿里ASR 协议相关的 `base_url`、`api_key` 以及推送 API 凭证。
