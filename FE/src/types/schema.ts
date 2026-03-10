/**
 * Core data models based on docs/FOLDER_SPEC.md
 * - Date folder: YYYY年MM月DD日
 * - Course folder: 课程名_班级名_开始时间
 * - Persistent state file: _Status.json
 */

export const DATE_FOLDER_REGEX = /^\d{4}年\d{2}月\d{2}日$/;
export const COURSE_FOLDER_REGEX = /^.+_.+_(?:[01]\d|2[0-3])[0-5]\d$/;

export type DateFolderName = string;
export type CourseFolderName = string;

export type PipelineStage = "recording" | "asr" | "analysis" | "push";

export type StageStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface CourseInfo {
  courseName: string;
  className: string;
  startTime: string; // HHmm, e.g. "0900"
  endTime?: string; // HHmm
}

export interface ProgressState {
  recording: StageStatus;
  asr: StageStatus;
  analysis: StageStatus;
  push: StageStatus;
}

export type StudentPushStatus = "pending" | "sent" | "failed" | "missing_id";

export interface StudentPushRecord {
  studentId?: string;
  studentName: string;
  externalUserId?: string;
  status: StudentPushStatus;
  lastError?: string;
  sentAt?: string; // ISO datetime
}

export interface StatusFileSchema {
  schemaVersion?: string;
  courseInfo: CourseInfo;
  progress: ProgressState;
  studentList: StudentPushRecord[];
  updatedAt?: string; // ISO datetime
}

export interface CourseFolderPaths {
  rootDir: string;
  dateDirName: DateFolderName;
  courseDirName: CourseFolderName;
  audioFile: string;
  asrFile: string;
  analysisFile: string;
  statusFile: string; // _Status.json
  segmentsDir: string;
}

export const CONFIG_DIR_NAME = "config";
export const RELATIONSHIP_FILE_NAME = "Relationship.xlsx";

/**
 * Row schema mapped from config/Relationship.xlsx
 * Column names follow docs/FOLDER_SPEC.md exactly.
 */
export interface RelationshipRow {
  StudentID: string;
  StudentName: string;
  ClassName: string;
  ParentName: string;
  ParentWX: string;
}

/**
 * Normalized business model for internal use.
 * Keep RelationshipRow for exact Excel column mapping.
 */
export interface RelationshipEntry {
  studentId: string;
  studentName: string;
  className: string;
  parentName: string;
  parentWx: string;
}

export interface RelationshipConfigPaths {
  rootDir: string;
  configDir: string; // <root>/config
  relationshipFile: string; // <root>/config/Relationship.xlsx
}

export type RelationshipMapByClass = Record<string, RelationshipRow[]>;
export type RelationshipMapByStudentId = Record<string, RelationshipRow>;

export const PIPELINE_STAGE_LABEL_ZH_CN: Record<PipelineStage, string> = {
  recording: "录音",
  asr: "转写",
  analysis: "分析",
  push: "推送",
};

export const STAGE_STATUS_LABEL_ZH_CN: Record<StageStatus, string> = {
  pending: "待处理",
  running: "进行中",
  completed: "已完成",
  failed: "失败",
};

export const STUDENT_PUSH_STATUS_LABEL_ZH_CN: Record<StudentPushStatus, string> =
  {
    pending: "待发送",
    sent: "已发送",
    failed: "发送失败",
    missing_id: "缺失ID",
  };

export const RELATIONSHIP_ENTRY_FIELD_LABEL_ZH_CN: Record<
  keyof RelationshipEntry,
  string
> = {
  studentId: "学生ID",
  studentName: "学生姓名",
  className: "班级名称",
  parentName: "家长姓名",
  parentWx: "家长微信号",
};

export function isValidDateFolderName(value: string): value is DateFolderName {
  return DATE_FOLDER_REGEX.test(value);
}

export function isValidCourseFolderName(
  value: string,
): value is CourseFolderName {
  return COURSE_FOLDER_REGEX.test(value);
}

export function getPipelineStageLabel(stage: PipelineStage): string {
  return PIPELINE_STAGE_LABEL_ZH_CN[stage];
}

export function getStageStatusLabel(status: StageStatus): string {
  return STAGE_STATUS_LABEL_ZH_CN[status];
}

export function getStudentPushStatusLabel(status: StudentPushStatus): string {
  return STUDENT_PUSH_STATUS_LABEL_ZH_CN[status];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStageStatus(value: unknown): value is StageStatus {
  return (
    value === "pending" ||
    value === "running" ||
    value === "completed" ||
    value === "failed"
  );
}

function isStudentPushStatus(value: unknown): value is StudentPushStatus {
  return (
    value === "pending" ||
    value === "sent" ||
    value === "failed" ||
    value === "missing_id"
  );
}

export function isRelationshipRow(value: unknown): value is RelationshipRow {
  if (!isRecord(value)) return false;
  return (
    typeof value.StudentID === "string" &&
    typeof value.StudentName === "string" &&
    typeof value.ClassName === "string" &&
    typeof value.ParentName === "string" &&
    typeof value.ParentWX === "string"
  );
}

export function toRelationshipEntry(row: RelationshipRow): RelationshipEntry {
  return {
    studentId: row.StudentID,
    studentName: row.StudentName,
    className: row.ClassName,
    parentName: row.ParentName,
    parentWx: row.ParentWX,
  };
}

export function isStatusFileSchema(value: unknown): value is StatusFileSchema {
  if (!isRecord(value)) return false;
  if (!isRecord(value.courseInfo)) return false;
  if (!isRecord(value.progress)) return false;
  if (!Array.isArray(value.studentList)) return false;

  const courseInfo = value.courseInfo;
  const progress = value.progress;

  const isCourseInfoValid =
    typeof courseInfo.courseName === "string" &&
    typeof courseInfo.className === "string" &&
    typeof courseInfo.startTime === "string" &&
    (courseInfo.endTime === undefined || typeof courseInfo.endTime === "string");

  if (!isCourseInfoValid) return false;

  const isProgressValid =
    isStageStatus(progress.recording) &&
    isStageStatus(progress.asr) &&
    isStageStatus(progress.analysis) &&
    isStageStatus(progress.push);

  if (!isProgressValid) return false;

  const areStudentsValid = value.studentList.every((student) => {
    if (!isRecord(student)) return false;
    return (
      (student.studentId === undefined || typeof student.studentId === "string") &&
      typeof student.studentName === "string" &&
      (student.externalUserId === undefined ||
        typeof student.externalUserId === "string") &&
      isStudentPushStatus(student.status) &&
      (student.lastError === undefined || typeof student.lastError === "string") &&
      (student.sentAt === undefined || typeof student.sentAt === "string")
    );
  });

  if (!areStudentsValid) return false;

  return (
    (value.schemaVersion === undefined ||
      typeof value.schemaVersion === "string") &&
    (value.updatedAt === undefined || typeof value.updatedAt === "string")
  );
}
