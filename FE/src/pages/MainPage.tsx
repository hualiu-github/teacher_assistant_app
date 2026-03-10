import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Key,
  Mic,
  Plus,
  Search,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import { createCourse, type CourseCard, syncRelationships, updateSettings, uploadRecord } from "../api/client";
import { useCourses, useInit, useSettings } from "../hooks/useCourses";

type ViewMode = "dashboard" | "relationships" | "settings";

type RelationshipRowView = {
  id: string;
  studentName: string;
  className: string;
  parentName: string;
  parentWX: string;
  status: "verified" | "missing";
};

const MOCK_RELATIONSHIPS: RelationshipRowView[] = [
  { id: "S001", studentName: "张小明", className: "小一班", parentName: "张先生", parentWX: "wxid_zxm_001", status: "verified" },
  { id: "S002", studentName: "王诗雨", className: "小一班", parentName: "王女士", parentWX: "", status: "missing" },
  { id: "S003", studentName: "李子轩", className: "小二班", parentName: "李女士", parentWX: "wxid_lzx_002", status: "verified" },
  { id: "S004", studentName: "赵若曦", className: "小二班", parentName: "赵先生", parentWX: "wxid_zrx_003", status: "verified" },
  { id: "S005", studentName: "周宇轩", className: "小三班", parentName: "周女士", parentWX: "", status: "missing" },
];

function StatusLight({ label, status }: { label: string; status: "pending" | "processing" | "done" | "failed" }) {
  const colorMap = {
    pending: "bg-slate-200 border-slate-300",
    processing: "bg-blue-500 border-blue-200 animate-pulse",
    done: "bg-emerald-500 border-emerald-200",
    failed: "bg-rose-500 border-rose-200",
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-full border-2 ${colorMap[status]}`} />
      <span className="text-[10px] font-bold text-slate-500">{label}</span>
    </div>
  );
}

function toTimeRange(startTime: string): string {
  if (!/^\d{4}$/.test(startTime)) return startTime;
  const hh = Number(startTime.slice(0, 2));
  const mm = Number(startTime.slice(2, 4));
  const endHour = (hh + 1).toString().padStart(2, "0");
  return `${startTime.slice(0, 2)}:${startTime.slice(2, 4)} - ${endHour}:${mm.toString().padStart(2, "0")}`;
}

function hhmmNow(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
}

function buildChineseDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}年${month.toString().padStart(2, "0")}月${day.toString().padStart(2, "0")}日`;
}

function parseDate(value: string): { year: number; month: number; day: number } | null {
  const zh = value.match(/^(\d{4})年(\d{2})月(\d{2})日$/);
  if (zh) {
    return { year: Number(zh[1]), month: Number(zh[2]), day: Number(zh[3]) };
  }
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  }
  return null;
}

function systemTodayChineseDate(): string {
  const now = new Date();
  return buildChineseDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function MainPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: initData } = useInit();
  const { data: settingsData } = useSettings();
  const settingsInitializedRef = useRef(false);

  const [view, setView] = useState<ViewMode>("dashboard");
  const [selectedDate, setSelectedDate] = useState(systemTodayChineseDate());
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [relationshipSearch, setRelationshipSearch] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [relationships, setRelationships] = useState<RelationshipRowView[]>(MOCK_RELATIONSHIPS);
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null);
  const [relationshipForm, setRelationshipForm] = useState({ studentName: '', className: '', parentName: '', parentWX: '' });
  const datePickerRef = useRef<HTMLDivElement | null>(null);
  const uploadAudioInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTarget, setRecordingTarget] = useState<{ date: string; course_name: string; class_name: string; start_time: string } | null>(null);

  const [courseForm, setCourseForm] = useState({
    course_name: "",
    class_name: "",
    start_time: "0900",
  });

  const [config, setConfig] = useState({
    storage_root: "",
    openai_base_url: "",
    openai_api_key: "",
    asr_base_url: "",
    asr_api_key: "",
  });
  const [showAsrKey, setShowAsrKey] = useState(false);
  const [showModelKey, setShowModelKey] = useState(false);

  const dates = initData?.dates ?? [];

  useEffect(() => {
    if (settingsInitializedRef.current || !settingsData) return;
    setConfig({
      storage_root: settingsData.storage_root,
      openai_base_url: settingsData.openai_base_url,
      openai_api_key: settingsData.openai_api_key,
      asr_base_url: settingsData.asr_base_url,
      asr_api_key: settingsData.asr_api_key,
    });
    settingsInitializedRef.current = true;
  }, [settingsData]);

  useEffect(() => {
    if (settingsInitializedRef.current) return;
    if (!settingsData && initData?.storage_root) {
      setConfig((prev) => ({ ...prev, storage_root: initData.storage_root }));
    }
  }, [initData, settingsData]);

  useEffect(() => {
    const onDown = (ev: MouseEvent) => {
      if (!datePickerRef.current) return;
      if (!datePickerRef.current.contains(ev.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    return () => {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch {
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const { data: courses = [] } = useCourses(selectedDate);

  const selectedCourse = courses.find((course) => course.course_id === selectedCourseId) ?? null;
  const isSelectedRecorded = selectedCourse?.progress.recording === "done";

  const createCourseMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["init"] });
      await queryClient.invalidateQueries({ queryKey: ["courses", selectedDate] });
      setShowCourseModal(false);
      setCourseForm({ course_name: "", class_name: "", start_time: hhmmNow() });
    },
  });

  const uploadRecordMutation = useMutation({
    mutationFn: uploadRecord,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["courses", variables.date] });
    },
    onSettled: () => {
      setRecordingTarget(null);
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: async (data) => {
      setConfig({
        storage_root: data.storage_root,
        openai_base_url: data.openai_base_url,
        openai_api_key: data.openai_api_key,
        asr_base_url: data.asr_base_url,
        asr_api_key: data.asr_api_key,
      });
      settingsInitializedRef.current = true;
      await queryClient.invalidateQueries({ queryKey: ["init"] });
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const syncRelationshipMutation = useMutation({
    mutationFn: syncRelationships,
  });

  const filteredRelationships = relationships.filter((item) => {
    const q = relationshipSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      item.studentName.toLowerCase().includes(q) ||
      item.className.toLowerCase().includes(q) ||
      item.parentName.toLowerCase().includes(q) ||
      item.parentWX.toLowerCase().includes(q)
    );
  });
  const syncRelationshipRows = (rows: RelationshipRowView[]) => {
    syncRelationshipMutation.mutate(
      rows.map((r) => ({
        StudentID: r.id,
        StudentName: r.studentName,
        ClassName: r.className,
        ParentName: r.parentName,
        ParentWX: r.parentWX,
      })),
    );
  };

  const openRelationshipEditor = (item: RelationshipRowView) => {
    setEditingRelationshipId(item.id);
    setRelationshipForm({
      studentName: item.studentName,
      className: item.className,
      parentName: item.parentName,
      parentWX: item.parentWX,
    });
  };

  const openCreateRelationship = () => {
    setEditingRelationshipId("__new__");
    setRelationshipForm({ studentName: "", className: "", parentName: "", parentWX: "" });
  };

  const submitRelationshipEdit = () => {
    if (!editingRelationshipId) return;

    const nextWX = relationshipForm.parentWX.trim();
    const nextItem: RelationshipRowView = {
      id: editingRelationshipId === "__new__" ? `S${Date.now()}` : editingRelationshipId,
      studentName: relationshipForm.studentName,
      className: relationshipForm.className,
      parentName: relationshipForm.parentName,
      parentWX: nextWX,
      status: nextWX ? "verified" : "missing",
    };

    const nextRows =
      editingRelationshipId === "__new__"
        ? [...relationships, nextItem]
        : relationships.map((row) => (row.id === editingRelationshipId ? nextItem : row));

    setRelationships(nextRows);
    syncRelationshipRows(nextRows);
    setEditingRelationshipId(null);
  };

  const today = new Date();
  const todayDate = buildChineseDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowDate = buildChineseDate(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayDate = buildChineseDate(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate());

  const dateOptions = [
    { id: todayDate, label: "今天", fullDate: todayDate },
    { id: tomorrowDate, label: "明天", fullDate: tomorrowDate },
    { id: yesterdayDate, label: "昨天", fullDate: yesterdayDate },
  ];

  const currentDayInfo = dateOptions.find((d) => d.id === selectedDate) ?? { id: selectedDate, label: selectedDate, fullDate: selectedDate };

  const selectedParsed = parseDate(selectedDate);
  const now = new Date();
  const activeYear = selectedParsed?.year ?? now.getFullYear();
  const activeMonth = selectedParsed?.month ?? now.getMonth() + 1;
  const activeDay = selectedParsed?.day ?? now.getDate();

  const onCalendarDayClick = (day: number) => {
    const next = buildChineseDate(activeYear, activeMonth, day);
    setSelectedDate(next);
    setShowDatePicker(false);
  };

  const submitCreateCourse = () => {
    if (!selectedDate || !courseForm.course_name || !courseForm.class_name || !courseForm.start_time) return;
    createCourseMutation.mutate({
      date: selectedDate,
      course_name: courseForm.course_name,
      class_name: courseForm.class_name,
      start_time: courseForm.start_time,
    });
  };

  const stopRecordingStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (!selectedCourse) return;

    if (typeof window === "undefined" || !window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
      window.alert("当前环境不支持录音");
      return;
    }

    const target = {
      date: selectedDate,
      course_name: selectedCourse.course_name,
      class_name: selectedCourse.class_name,
      start_time: selectedCourse.start_time,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);
        mediaRecorderRef.current = null;
        stopRecordingStream();

        const currentMimeType = recorder.mimeType || mimeType || "audio/webm";
        const ext = currentMimeType.includes("mp4") ? "m4a" : currentMimeType.includes("wav") ? "wav" : "webm";
        const blob = new Blob(audioChunksRef.current, { type: currentMimeType });
        audioChunksRef.current = [];

        if (!blob.size) {
          window.alert("录音内容为空，请重试");
          setRecordingTarget(null);
          return;
        }

        uploadRecordMutation.mutate({
          file: blob,
          file_name: `${target.course_name}_${target.class_name}_${target.start_time}.${ext}`,
          date: target.date,
          course_name: target.course_name,
          class_name: target.class_name,
          start_time: target.start_time,
        });
      };

      recorder.onerror = () => {
        setIsRecording(false);
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setRecordingTarget(null);
        stopRecordingStream();
        window.alert("录音失败，请重试");
      };

      mediaRecorderRef.current = recorder;
      setRecordingTarget(target);
      setIsRecording(true);
      recorder.start();
    } catch (error) {
      setIsRecording(false);
      setRecordingTarget(null);
      stopRecordingStream();

      const errName = error instanceof DOMException ? error.name : "UnknownError";
      const errMessage = error instanceof Error ? error.message : "";
      window.alert(`无法访问麦克风（${errName}）。请检查系统与应用权限。${errMessage ? `\n${errMessage}` : ""}`);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
    mediaRecorderRef.current.stop();
  };

  const handleRecordAction = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!selectedCourse || isSelectedRecorded || uploadRecordMutation.isPending) return;
    await startRecording();
  };

  const handleUploadAudioClick = () => {
    if (!selectedCourse || isRecording || uploadRecordMutation.isPending) return;
    uploadAudioInputRef.current?.click();
  };

  const handleUploadAudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedCourse) return;

    uploadRecordMutation.mutate({
      file,
      file_name: file.name,
      date: selectedDate,
      course_name: selectedCourse.course_name,
      class_name: selectedCourse.class_name,
      start_time: selectedCourse.start_time,
    });
  };


  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8f9fa] text-slate-800">
      <aside className="flex w-72 flex-col border-r border-slate-800 bg-[#121826] text-slate-300">
        <div className="border-b border-slate-800/60 p-6">
          <div className="mb-8 flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <Mic size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">声绘课堂</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">VoiceGraph AI Assistant</p>
            </div>
          </div>

          <p className="mb-4 pl-1 text-[10px] font-black uppercase tracking-widest text-slate-600">WORKSPACE</p>
          <div className="space-y-2">
            <button
              onClick={() => setView("dashboard")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${view === "dashboard" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            >
              <Calendar size={18} />
              课程工作台
            </button>
            <button
              onClick={() => setView("relationships")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${view === "relationships" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            >
              <Users size={18} />
              关系维护中心
            </button>
            <button
              onClick={() => setView("settings")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${view === "settings" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            >
              <Settings size={18} />
              系统参数配置
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="mb-4 pl-1 text-[10px] font-black uppercase tracking-widest text-slate-600">快捷操作</p>
          <button className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-slate-500 transition hover:bg-slate-800 hover:text-white">
            <FileText size={15} /> 导出当日简报
          </button>
        </div>

        <div className="mt-auto border-t border-slate-800/60 bg-slate-950/40 p-6 text-[10px] uppercase tracking-widest text-slate-500">
          <p>Storage Root</p>
          <p className="mt-1 truncate text-[11px] font-bold text-slate-300">{initData?.storage_root ?? "(not set)"}</p>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden bg-white">
        <header className="flex h-16 items-center justify-end border-b border-slate-100 px-10">
          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            存储根目录：{(config.storage_root || "未配置").slice(0, 36)}
          </div>
        </header>

        {view === "dashboard" && (
          <>
            <section className="flex-1 overflow-y-auto p-10">
              <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <h2 className="text-4xl font-black tracking-tight text-slate-900">课程工作台</h2>
                      <div className="relative" ref={datePickerRef}>
                        <button
                          onClick={() => setShowDatePicker((v) => !v)}
                          className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600"
                        >
                          <CalendarDays size={13} />
                          {currentDayInfo.fullDate}
                          <ChevronDown size={12} className={showDatePicker ? "rotate-180" : ""} />
                        </button>

                        {showDatePicker && (
                          <div className="absolute left-0 top-full z-30 mt-2 w-80 origin-top-left rounded-3xl border border-slate-100 bg-white p-4 shadow-2xl">
                            <div className="mb-3 grid grid-cols-3 gap-2">
                              {dateOptions.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    setSelectedDate(item.id);
                                    setShowDatePicker(false);
                                  }}
                                  className={`rounded-xl px-2 py-2 text-xs font-bold ${item.id === selectedDate ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {activeYear}年{activeMonth.toString().padStart(2, "0")}月
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <button
                                  key={day}
                                  onClick={() => onCalendarDayClick(day)}
                                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${day === activeDay ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">已录音课程请双击课程卡进入分析页面。</p>
                  </div>

                  <button
                    onClick={() => setShowCourseModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white"
                  >
                    <Plus size={16} /> 预约新课程
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 pb-32 md:grid-cols-2 xl:grid-cols-3">
                  {courses.map((course: CourseCard) => {
                    const active = selectedCourseId === course.course_id;
                    return (
                      <div
                        key={course.course_id}
                        onClick={() => setSelectedCourseId(course.course_id)}
                        onDoubleClick={() => {
                          if (course.progress.recording !== "done") return;
                          navigate(`/detail/${course.course_id}`, { state: { course } });
                        }}
                        className={`rounded-2xl border-2 bg-white p-5 shadow-sm transition ${active ? "border-blue-500 ring-4 ring-blue-50" : "border-transparent hover:border-slate-200 hover:shadow-md"}`}
                      >
                        <div className="mb-2 text-base font-bold text-slate-800">{course.course_name}</div>
                        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                          <span className="rounded bg-slate-100 px-2 py-0.5">{course.class_name}</span>
                          <Clock size={12} />
                          {toTimeRange(course.start_time)}
                        </div>

                        <div className="mb-4 flex justify-around rounded-xl border border-slate-100 bg-slate-50 py-3">
                          <StatusLight label="录音" status={course.progress.recording} />
                          <StatusLight label="ASR" status={course.progress.asr} />
                          <StatusLight label="分析" status={course.progress.analysis} />
                          <StatusLight label="推送" status={course.progress.push} />
                        </div>

                        <div className="text-[11px] font-bold text-slate-400">
                          {course.progress.recording === "done" ? "双击进入详情" : "待录音"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2">
              <input
                ref={uploadAudioInputRef}
                type="file"
                accept=".pcm,.wav,.mp3,.opus,.speex,.aac,.amr,.m4a,.webm,.ogg,.flac,audio/*"
                onChange={handleUploadAudioChange}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <button
                onClick={() => {
                  void handleRecordAction();
                }}
                disabled={!selectedCourse || (isSelectedRecorded && !isRecording) || uploadRecordMutation.isPending}
                className={`pointer-events-auto rounded-full px-14 py-5 text-sm font-black tracking-widest text-white shadow-2xl disabled:opacity-70 ${!selectedCourse ? "bg-slate-500" : isRecording ? "bg-rose-600" : isSelectedRecorded ? "bg-slate-600" : uploadRecordMutation.isPending ? "bg-amber-600" : "bg-[#121826]"}`}
              >
                {!selectedCourse
                  ? "请先选择课程卡片"
                  : isRecording
                    ? `停止录音并上传：${recordingTarget?.course_name ?? selectedCourse.course_name}`
                    : uploadRecordMutation.isPending
                      ? "上传中..."
                      : isSelectedRecorded
                        ? "录音已完成（双击卡片进入详情）"
                        : `开始录音：${selectedCourse.course_name}`}
              </button>
                <button
                  onClick={handleUploadAudioClick}
                  disabled={!selectedCourse || isRecording || uploadRecordMutation.isPending}
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#1f2937] px-6 py-4 text-xs font-black tracking-wider text-white shadow-2xl disabled:opacity-70"
                >
                  <Upload size={14} />
                  上传音频
                </button>
              </div>
            </div>
          </>
        )}

        {view === "relationships" && (
          <section className="flex-1 overflow-y-auto bg-slate-50/40 p-10">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-end justify-between">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">关系维护中心</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={relationshipSearch}
                      onChange={(e) => setRelationshipSearch(e.target.value)}
                      placeholder="搜索学生/班级/家长/微信ID"
                      className="w-72 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <button
                    onClick={openCreateRelationship}
                    className="rounded-xl bg-[#121826] px-4 py-2 text-sm font-bold text-white"
                  >
                    <span className="inline-flex items-center gap-1"><Plus size={14} /> 新增关系</span>
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-6 py-4">学生姓名</th>
                      <th className="px-6 py-4">班级</th>
                      <th className="px-6 py-4">家长姓名</th>
                      <th className="px-6 py-4">家长微信ID</th>
                      <th className="px-6 py-4">״̬</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRelationships.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30">
                        <td className="px-6 py-4 font-bold text-slate-800">{item.studentName}</td>
                        <td className="px-6 py-4 text-slate-600">{item.className}</td>
                        <td className="px-6 py-4 text-slate-700">{item.parentName}</td>
                        <td className="px-6 py-4 font-mono text-xs text-blue-600">{item.parentWX || "--"}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {item.status === "verified" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                                <CheckCircle2 size={12} /> 已配置
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                                <AlertCircle size={12} /> 缺少ID
                              </span>
                            )}
                            <button
                              onClick={() => openRelationshipEditor(item)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                              title="修改维护信息"
                            >
                              <Settings size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {view === "settings" && (
          <section className="flex-1 overflow-y-auto bg-white p-10">
            <div className="mx-auto max-w-3xl space-y-10">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900">系统参数配置</h2>
                <p className="mt-2 text-sm text-slate-500">配置模型接口地址、密钥以及本地存储路径。</p>
              </div>

              <div className="space-y-8 rounded-3xl border border-slate-200 bg-slate-50/40 p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-black text-slate-700">
                    <Globe size={16} className="text-indigo-600" /> ASR 接口
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">ASR URL</label>
                    <input
                      value={config.asr_base_url}
                      onChange={(e) => setConfig((p) => ({ ...p, asr_base_url: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-400"
                      placeholder="https://asr.example.com/v1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">ASR Key</label>
                    <div className="relative">
                      <input
                        type={showAsrKey ? "text" : "password"}
                        value={config.asr_api_key}
                        onChange={(e) => setConfig((p) => ({ ...p, asr_api_key: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 pr-16 text-sm outline-none focus:border-indigo-400"
                        placeholder="ASR Key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAsrKey((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showAsrKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-black text-slate-700">
                    <Globe size={16} className="text-blue-600" /> 大模型接口
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Base URL</label>
                    <input
                      value={config.openai_base_url}
                      onChange={(e) => setConfig((p) => ({ ...p, openai_base_url: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400"
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">API Key</label>
                    <div className="relative">
                      <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showModelKey ? "text" : "password"}
                        value={config.openai_api_key}
                        onChange={(e) => setConfig((p) => ({ ...p, openai_api_key: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-16 text-sm outline-none focus:border-blue-400"
                        placeholder="sk-..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowModelKey((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showModelKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-black text-slate-700">
                    <Database size={16} className="text-emerald-600" /> 本地存储
                  </div>
                  <input
                    value={config.storage_root}
                    onChange={(e) => setConfig((p) => ({ ...p, storage_root: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-400"
                    placeholder="D:\\TeacherData"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-bold text-slate-500">
                    {updateSettingsMutation.isSuccess ? "配置已保存到本地 Settings.json" : "保存后将同步到后端配置"}
                  </span>
                  <button
                    onClick={() => updateSettingsMutation.mutate(config)}
                    disabled={updateSettingsMutation.isPending}
                    className="rounded-xl bg-[#121826] px-6 py-2 text-sm font-bold text-white disabled:opacity-70"
                  >
                    {updateSettingsMutation.isPending ? "保存中..." : "保存配置"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {editingRelationshipId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-slate-50 px-8 py-6">
              <h3 className="text-xl font-black text-slate-900">修改维护信息</h3>
              <p className="mt-1 text-xs text-slate-500">可编辑学生、班级、家长及微信ID</p>
            </div>

            <div className="space-y-4 p-8 text-sm">
              <div>
                <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">学生姓名</label>
                <input
                  value={relationshipForm.studentName}
                  onChange={(e) => setRelationshipForm((p) => ({ ...p, studentName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">班级</label>
                <input
                  value={relationshipForm.className}
                  onChange={(e) => setRelationshipForm((p) => ({ ...p, className: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">家长姓名</label>
                <input
                  value={relationshipForm.parentName}
                  onChange={(e) => setRelationshipForm((p) => ({ ...p, parentName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">家长微信ID</label>
                <input
                  value={relationshipForm.parentWX}
                  onChange={(e) => setRelationshipForm((p) => ({ ...p, parentWX: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex gap-3 px-8 pb-8">
              <button
                onClick={() => setEditingRelationshipId(null)}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                onClick={submitRelationshipEdit}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-slate-50 px-8 py-6">
              <h3 className="text-xl font-black text-slate-900">预约新课程</h3>
              <p className="mt-1 text-xs text-slate-500">目标日期：{selectedDate || "未选择"}</p>
            </div>

            <div className="space-y-4 p-8 text-sm">
              <div>
                <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">课程名称</label>
                <input
                  value={courseForm.course_name}
                  onChange={(e) => setCourseForm((p) => ({ ...p, course_name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-blue-400"
                  placeholder="创意绘画：星空课堂"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">班级</label>
                  <input
                    value={courseForm.class_name}
                    onChange={(e) => setCourseForm((p) => ({ ...p, class_name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-blue-400"
                    placeholder="小一班"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">开始时间(HHmm)</label>
                  <input
                    value={courseForm.start_time}
                    onChange={(e) => setCourseForm((p) => ({ ...p, start_time: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-blue-400"
                    placeholder="0900"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-8 pb-8">
              <button
                onClick={() => setShowCourseModal(false)}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                onClick={submitCreateCourse}
                disabled={createCourseMutation.isPending}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-70"
              >
                {createCourseMutation.isPending ? "创建中..." : "创建课程卡片"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
