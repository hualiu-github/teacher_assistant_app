import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8766",
  timeout: 10000,
});

export type Progress = "pending" | "processing" | "done" | "failed";

function extractApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (detail && typeof detail === "object") {
      const msg = (detail as { message?: unknown }).message;
      if (typeof msg === "string" && msg.trim()) return msg;
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Request failed";
}

export interface CourseCard {
  course_id: string;
  date: string;
  course_name: string;
  class_name: string;
  start_time: string;
  progress: {
    recording: Progress;
    asr: Progress;
    analysis: Progress;
    push: Progress;
  };
}

export interface InitPayload {
  storage_root: string;
  dates: string[];
  relationship_exists: boolean;
}

export async function fetchInit() {
  const { data } = await api.get("/init");
  return data as InitPayload;
}

export async function fetchCourses(date: string) {
  const { data } = await api.get(`/courses/${encodeURIComponent(date)}`);
  return data as CourseCard[];
}

export interface SettingsUpdatePayload {
  storage_root?: string;
  openai_base_url?: string;
  openai_api_key?: string;
  asr_base_url?: string;
  asr_api_key?: string;
}

export interface SettingsPayload {
  storage_root: string;
  openai_base_url: string;
  openai_api_key: string;
  asr_base_url: string;
  asr_api_key: string;
}

export async function fetchSettings() {
  const { data } = await api.get("/settings");
  return data as SettingsPayload;
}

export async function updateSettings(payload: SettingsUpdatePayload) {
  const { data } = await api.post("/settings", payload);
  return data as SettingsPayload;
}

export interface CreateCoursePayload {
  date: string;
  course_name: string;
  class_name: string;
  start_time: string;
}

export async function createCourse(payload: CreateCoursePayload) {
  const { data } = await api.post("/courses/create", payload);
  return data as {
    course_id: string;
    date: string;
    course_name: string;
    class_name: string;
    start_time: string;
    status: "created";
  };
}

export interface UploadRecordPayload {
  file: Blob;
  file_name: string;
  date: string;
  course_name: string;
  class_name: string;
  start_time: string;
}

export async function uploadRecord(payload: UploadRecordPayload) {
  const formData = new FormData();
  formData.append("file", payload.file, payload.file_name);
  formData.append("date", payload.date);
  formData.append("course_name", payload.course_name);
  formData.append("class_name", payload.class_name);
  formData.append("start_time", payload.start_time);

  const { data } = await api.post("/record/upload", formData);
  return data as {
    course_id: string;
    audio_path: string;
    status: "ASR_Processing";
  };
}

export interface SaveAsrPayload {
  course_id: string;
  content: string;
}

export async function saveAsrText(payload: SaveAsrPayload) {
  const { data } = await api.post("/asr/save", payload);
  return data as {
    course_id: string;
    asr_file: string;
    status: "saved";
  };
}

export async function triggerAsr(courseId: string) {
  try {
    const { data } = await api.post(`/task/trigger/${encodeURIComponent(courseId)}/asr`, undefined, { timeout: 600000 });
    return data as {
      course_id: string;
      status: "done";
    };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
}

export async function fetchAsrText(courseId: string) {
  const { data } = await api.get(`/asr/${encodeURIComponent(courseId)}`);
  return data as {
    course_id: string;
    content: string;
    asr_file: string;
  };
}

export function buildCourseAudioUrl(courseId: string) {
  return `${api.defaults.baseURL}/audio/${encodeURIComponent(courseId)}`;
}

export interface RelationshipRow {
  StudentID: string;
  StudentName: string;
  ClassName: string;
  ParentName: string;
  ParentWX: string;
}

export async function syncRelationships(rows: RelationshipRow[]) {
  const { data } = await api.post("/relationship/sync", { rows });
  return data as {
    updated_count: number;
    file_path: string;
  };
}
