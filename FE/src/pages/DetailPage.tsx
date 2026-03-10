import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Loader2,
  Pause,
  Play,
  Save,
  Send,
} from "lucide-react";
import { buildCourseAudioUrl, fetchAsrText, saveAsrText, triggerAsr, type CourseCard } from "../api/client";

type Student = {
  id: string;
  name: string;
  status: "success" | "error" | "pending";
  comment: string;
};

const STUDENTS: Student[] = [
  { id: "s1", name: "张小明", status: "success", comment: "课堂参与度高，回答问题积极。" },
  { id: "s2", name: "王诗雨", status: "error", comment: "文案已生成，但家长ID缺失。" },
  { id: "s3", name: "李子轩", status: "pending", comment: "等待人工核对后发送。" },
  { id: "s4", name: "赵若曦", status: "success", comment: "表达清晰，互动自然。" },
  { id: "s5", name: "周宇轩", status: "success", comment: "课堂专注，完成度高。" },
];

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function DetailPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const location = useLocation();
  const course = (location.state as { course?: CourseCard } | null)?.course;

  const [selectedStudentId, setSelectedStudentId] = useState(STUDENTS[0].id);
  const selectedStudent = useMemo(
    () => STUDENTS.find((s) => s.id === selectedStudentId) ?? STUDENTS[0],
    [selectedStudentId],
  );
  const [comment, setComment] = useState(selectedStudent.comment);
  const [prompt, setPrompt] = useState("");

  const [asrText, setAsrText] = useState("");
  const [asrHint, setAsrHint] = useState("尚未生成ASR结果，请先点击“开始ASR”");
  const [runningAsr, setRunningAsr] = useState(false);
  const [savingAsr, setSavingAsr] = useState(false);

  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [audioSrc, setAudioSrc] = useState("");
  const [audioError, setAudioError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!courseId) return;

    let alive = true;
    (async () => {
      try {
        const res = await fetchAsrText(courseId);
        if (!alive) return;
        setAsrText(res.content);
        setAsrHint("已加载本地ASR文件，可人工修改后保存");
      } catch {
        if (!alive) return;
        setAsrText("");
        setAsrHint("尚未生成ASR结果，请先点击“开始ASR”");
      }
    })();

    return () => {
      alive = false;
    };
  }, [courseId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setAudioCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => setAudioDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      setIsPlaying(false);
      setAudioError("录音文件不存在或无法播放");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [audioSrc]);

  const handleStartAsr = async () => {
    if (!courseId) {
      window.alert("缺少课程ID，无法触发ASR");
      return;
    }

    setRunningAsr(true);
    try {
      await triggerAsr(courseId);
      const res = await fetchAsrText(courseId);
      setAsrText(res.content);
      setAsrHint("ASR初稿已生成到本地文件，可人工修改");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      window.alert(`ASR生成失败${message ? `\n${message}` : ""}`);
    } finally {
      setRunningAsr(false);
    }
  };

  const handleSaveAsr = async () => {
    if (!courseId) {
      window.alert("缺少课程ID，无法保存ASR");
      return;
    }

    setSavingAsr(true);
    try {
      await saveAsrText({ course_id: courseId, content: asrText });
      setAsrHint("ASR修改结果已保存到本地文件");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      window.alert(`保存ASR失败${message ? `\n${message}` : ""}`);
    } finally {
      setSavingAsr(false);
    }
  };

  const handleViewAudio = () => {
    if (!courseId) {
      window.alert("缺少课程ID，无法查看录音");
      return;
    }

    const nextShow = !showAudioPanel;
    setShowAudioPanel(nextShow);
    if (!nextShow) return;

    setAudioError("");
    const src = buildCourseAudioUrl(courseId);
    setAudioSrc(src);
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
      setAudioError("录音播放失败，请稍后重试");
    }
  };

  const handleSeek = (next: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = next;
    setAudioCurrentTime(next);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50">
      <header className="z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="text-base font-black text-slate-900">{course?.course_name ?? "分析看板"}</div>
            <div className="text-[11px] font-bold text-slate-400">
              {course?.class_name ?? ""} {courseId ? `| ${courseId}` : ""}
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
          <Send size={15} />
          批量重发
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <section className="flex w-[30%] flex-col border-r border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">ASR结果</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  void handleStartAsr();
                }}
                disabled={runningAsr}
                className="flex items-center gap-1 rounded-md border border-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-600 disabled:opacity-70"
              >
                {runningAsr ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                开始ASR
              </button>
              <button
                onClick={handleViewAudio}
                className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600"
              >
                查看录音
              </button>
              <button
                onClick={() => {
                  void handleSaveAsr();
                }}
                disabled={savingAsr || runningAsr}
                className="flex items-center gap-1 rounded-md border border-blue-100 px-2 py-1 text-[11px] font-bold text-blue-600 disabled:opacity-70"
              >
                {savingAsr ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                保存ASR
              </button>
            </div>
          </div>

          <div className="px-4 pt-2 text-[11px] text-slate-500">{asrHint}</div>

          {showAudioPanel && (
            <div className="mx-4 mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <audio ref={audioRef} src={audioSrc} preload="metadata" className="hidden" />
              <div className="mb-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    void togglePlay();
                  }}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white"
                >
                  <span className="inline-flex items-center gap-1">
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    {isPlaying ? "暂停" : "播放"}
                  </span>
                </button>
                <span className="text-[11px] font-mono text-slate-500">
                  {formatDuration(audioCurrentTime)} / {formatDuration(audioDuration)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={audioDuration > 0 ? audioDuration : 0}
                step={0.1}
                value={audioCurrentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full"
              />
              {audioError && <div className="mt-2 text-[11px] text-rose-600">{audioError}</div>}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            <textarea
              value={asrText}
              onChange={(e) => setAsrText(e.target.value)}
              placeholder="点击“开始ASR”后将在这里加载初步转写结果；你可以手动修改后点击“保存ASR”。"
              className="h-full min-h-[320px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex items-center justify-center gap-5 border-t border-slate-100 bg-white p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <button className="flex items-center gap-1 hover:text-blue-600">
              <ArrowUpToLine size={12} /> 置顶
            </button>
            <button className="flex items-center gap-1 hover:text-blue-600">
              <ArrowDownToLine size={12} /> 置底
            </button>
          </div>
        </section>

        <section className="flex flex-1 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3 text-sm font-black text-slate-700">
            {selectedStudent.name} 的评价编辑
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="rounded-[2rem] border border-blue-50 bg-[#fcfdfe] p-8">
                <div className="mb-5 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">AI 分析文案</div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="h-64 w-full resize-none border-none bg-transparent text-sm leading-relaxed text-slate-700 outline-none"
                />
              </div>

              <div className="flex gap-3 rounded-2xl border-2 border-slate-200 bg-white p-3 focus-within:border-blue-500">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入迭代指令，例如：语气更温和并突出课堂互动"
                  className="flex-1 text-sm outline-none"
                />
                <button className="rounded-xl bg-[#121826] px-5 py-2 text-xs font-black uppercase tracking-widest text-white">
                  迭代分析
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="flex w-[24%] flex-col bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-700">发送看板</div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {STUDENTS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedStudentId(s.id);
                  setComment(s.comment);
                }}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  s.id === selectedStudent.id
                    ? "border-blue-500 bg-white ring-4 ring-blue-50"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-800">{s.name}</div>
                  <div className="flex items-center gap-1.5">
                    <Copy size={13} className="text-blue-500" />
                    {s.status === "success" ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <span className="text-[10px] font-black text-rose-500">异常</span>
                    )}
                  </div>
                </div>
                <div className="line-clamp-2 text-[11px] text-slate-500">{s.comment}</div>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <button className="w-full rounded-2xl bg-blue-600 py-3 text-xs font-black uppercase tracking-widest text-white">
              一键推送全班
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}