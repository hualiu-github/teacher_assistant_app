import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  FileText, 
  Wand2, 
  Send, 
  ChevronRight, 
  Play, 
  Pause,
  RotateCcw, 
  Copy, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  History, 
  MoreVertical, 
  ChevronLeft, 
  Search, 
  MessageSquare, 
  X, 
  Plus, 
  Lock, 
  Users, 
  UserPlus, 
  Trash2, 
  Filter, 
  ExternalLink, 
  ChevronDown, 
  CalendarDays,
  Sparkles,
  Volume2,
  Database,
  Globe,
  Key,
  Check,
  ArrowUpToLine,
  ArrowDownToLine,
  Save,
  Loader2,
  Edit
} from 'lucide-react';

// --- 数据常量定义 ---
const INITIAL_COURSES = [
  {
    id: 'c1',
    name: '创意绘画：星空下的梦想',
    className: '小一班',
    time: '09:00 - 10:30',
    date: '2026-02-26',
    status: { rec: 'done', asr: 'done', analysis: 'done', push: 'processing' },
    pushProgress: 18,
    totalStudents: 25,
    lastUpdate: '10分钟前',
    transcript: "老师：张小明，你来看看这个星星，你觉得它的颜色应该是怎么样的？\n张小明：我觉得是深蓝色的，还有一点点发亮。\n老师：很好，那我们尝试用笔尖轻轻点出这种发亮的感觉。\n老师：大家看，除了深蓝色，我们还可以加入一些紫色，增加星空的深邃感。\n王诗涵：老师，我的星星可以画成五角形的吗？\n老师：当然可以，每个人的梦想星空都是不一样的。\n李子轩：我想要画一个巨大的银河！\n老师：非常有创意的想法，那我们先用淡白色刷出一层底色...\n老师：同学们，注意颜料的水分，不要太多了，否则会浸透纸张。"
  },
  {
    id: 'c2',
    name: '绘本阅读：猜猜我有多爱你',
    className: '小二班',
    time: '14:00 - 15:00',
    date: '2026-02-26',
    status: { rec: 'processing', asr: 'pending', analysis: 'pending', push: 'pending' },
    pushProgress: 0,
    totalStudents: 22,
    lastUpdate: '正在录音...',
    transcript: ""
  },
  {
    id: 'c3',
    name: '逻辑思维：数感启蒙',
    className: '中三班',
    time: '10:00 - 11:30',
    date: '2026-02-25',
    status: { rec: 'done', asr: 'done', analysis: 'done', push: 'done' },
    pushProgress: 30,
    totalStudents: 30,
    lastUpdate: '昨日已完成',
    transcript: "老师：大家数一数，盘子里有几个苹果？"
  }
];

const INITIAL_STUDENTS = [
  { id: 's1', name: '张小明', status: 'success', comment: '今天在课堂上表现非常活跃，对色彩的敏感度很高，画出的星空非常有层次感。' },
  { id: 's2', name: '王诗涵', status: 'error', errorType: 'ID缺失', comment: '诗涵今天尝试了新的笔触，虽然一开始有点犹豫，但最后完成得很棒。' },
  { id: 's3', name: '李子轩', status: 'pending', comment: '子轩非常专注，在处理星星细节的时候很有耐心。' },
  { id: 's4', name: '赵若曦', status: 'success', comment: '若曦今天的构思很巧妙，把家里的宠物也画进了星空里。' },
  { id: 's5', name: '周宇轩', status: 'success', comment: '宇轩今天在课堂互动中非常积极，回答问题声音响亮。' },
  { id: 's6', name: '陈子涵', status: 'success', comment: '子涵在小组讨论中表现优异，能带动其他小朋友一起思考。' },
  { id: 's7', name: '孙悟空', status: 'pending', comment: '今天在课堂上非常有活力，对各种实验器材都充满了好奇心。' },
  { id: 's8', name: '林黛玉', status: 'error', errorType: 'ID缺失', comment: '课堂表现文静细腻，对故事细节的把握非常精准。' },
  { id: 's9', name: '贾宝玉', status: 'success', comment: '思维跳跃，总是能给出意想不到的答案，非常棒！' },
  { id: 's10', name: '薛宝钗', status: 'success', comment: '非常守纪律，且能完美完成老师交地的每一个步骤。' },
];

const MOCK_DATES = [
  { id: '2026-02-26', label: '今天', fullDate: '2026年02月26日' },
  { id: '2026-02-25', label: '昨天', fullDate: '2026年02月25日' },
  { id: '2026-02-24', label: '前天', fullDate: '2026年02月24日' },
];

// --- 辅助函数 ---
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const StatusLight = ({ type, state }) => {
  const colors = {
    pending: 'bg-gray-200 border-gray-300',
    processing: 'bg-blue-500 border-blue-200 animate-pulse',
    done: 'bg-green-500 border-green-200',
    error: 'bg-red-500 border-red-200'
  };
  const labels = { Rec: '录制', ASR: '转写', AI: '分析', Push: '推送' };
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-2.5 h-2.5 rounded-full border-2 ${colors[state] || colors.pending}`} />
      <span className="text-[9px] text-gray-400 font-bold tracking-tighter">{labels[type]}</span>
    </div>
  );
};

// --- [核心组件：详情看板] ---
const DetailView = ({ course, onBack }) => {
  const [selectedStudent, setSelectedStudent] = useState(INITIAL_STUDENTS[0]);
  const [comment, setComment] = useState(INITIAL_STUDENTS[0].comment);
  
  // ASR 编辑逻辑状态
  const [localTranscript, setLocalTranscript] = useState(course?.transcript || "");
  const [editingLineIdx, setEditingLineIdx] = useState(null);
  const [isSavingASR, setIsSavingASR] = useState(false);
  const [hasSavedASR, setHasSavedASR] = useState(false);

  const studentListRef = useRef(null);
  const transcriptScrollRef = useRef(null);

  // 音频播放逻辑
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = 2712; 

  // 进度条百分比计算
  const pushedCount = INITIAL_STUDENTS.filter(s => s.status === 'success').length;
  const pushProgressPercent = (pushedCount / INITIAL_STUDENTS.length) * 100;

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => (prev < totalDuration ? prev + 1 : (setIsPlaying(false), prev)));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleUpdateLine = (idx, newValue) => {
    const lines = localTranscript.split('\n');
    lines[idx] = newValue;
    setLocalTranscript(lines.join('\n'));
  };

  const handleGlobalSaveASR = () => {
    setIsSavingASR(true);
    setTimeout(() => {
      setIsSavingASR(false);
      setHasSavedASR(true);
      setTimeout(() => setHasSavedASR(false), 2000);
    }, 1000);
  };

  const scrollToTop = (ref) => ref.current?.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = (ref) => ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden font-sans animate-in fade-in duration-300">
      {/* 1. 固定头部栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90"><ChevronLeft size={20} /></button>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">{course.name}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{course.className} · {course.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-black uppercase tracking-widest">
             AI 分析接口：在线
           </div>
           <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all active:scale-95">
             <Send size={16} /> 批量推送全班
           </button>
        </div>
      </header>

      {/* 2. 主三栏隔离布局 */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* A. 左侧：资产区 (物理隔离 + 播放进度 + ASR 编辑) */}
        <div className="w-[30%] border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden relative">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 font-black text-[11px] uppercase tracking-widest text-gray-500 flex justify-between items-center">
            <span className="flex items-center gap-2"><Mic size={14} className="text-blue-500" /> 原始资产</span>
            <button 
              onClick={handleGlobalSaveASR}
              disabled={isSavingASR}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${
                hasSavedASR ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
              }`}
            >
              {isSavingASR ? <Loader2 size={12} className="animate-spin" /> : (hasSavedASR ? <CheckCircle2 size={12} /> : <Save size={12} />)}
              {hasSavedASR ? '已保存' : '保存转写'}
            </button>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            {/* 这里的滚动条是独立一块的，带有 overscroll-contain 隔离 */}
            <div ref={transcriptScrollRef} className="absolute inset-0 overflow-y-scroll overscroll-contain custom-scrollbar-isolated p-5 space-y-6" style={{ scrollbarGutter: 'stable' }}>
              
              {/* 播放器卡片及高精度进度条 */}
              <div className="bg-[#0f172a] rounded-[2.5rem] p-6 shadow-2xl border border-slate-800 sticky top-0 z-20">
                 <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase mb-4 tracking-widest">
                   <span>录音播放进度</span>
                   <span className="text-blue-400 font-mono tracking-normal">{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
                 </div>
                 
                 <div className="h-16 flex items-end gap-1 mb-6 px-1">
                    {[...Array(40)].map((_, i) => (<div key={i} className={`flex-1 rounded-t-full transition-all duration-300 ${i < (currentTime/totalDuration)*40 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700/30'}`} style={{ height: `${15 + Math.random()*85}%` }} />))}
                 </div>

                 {/* 交互进度条控制组件 */}
                 <div className="relative mb-6 group">
                    <input 
                      type="range" min="0" max={totalDuration} value={currentTime} 
                      onChange={(e) => setCurrentTime(parseInt(e.target.value))} 
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full pointer-events-none" style={{ width: `${(currentTime/totalDuration)*100}%` }} />
                 </div>

                 <div className="flex justify-center items-center gap-8">
                    <button onClick={() => setCurrentTime(0)} className="text-slate-500 hover:text-white transition-colors active:scale-90"><RotateCcw size={20} /></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all shadow-blue-900/40">
                      {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                    </button>
                    <button className="text-slate-500 hover:text-white transition-colors"><Volume2 size={20} /></button>
                 </div>
              </div>

              {/* ASR 转写文本流 (交互编辑模式) */}
              <div className="text-xs space-y-4 text-gray-600 pb-20">
                 <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                    <span className="font-black text-[10px] text-gray-400 uppercase tracking-widest text-center">ASR 转写文本流 (点击文本可局部修正)</span>
                 </div>
                 {localTranscript.split('\n').map((l, i) => {
                    const isEditing = editingLineIdx === i;
                    return (
                      <div 
                        key={i} 
                        onClick={() => !isEditing && setEditingLineIdx(i)}
                        className={`border-l-2 pl-4 py-2 transition-all cursor-text rounded-r-xl ${
                          isEditing ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-100 shadow-sm' : 'border-transparent hover:border-blue-400 hover:bg-gray-50/50'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                             <div className="flex items-center justify-between">
                                <span className="font-black text-[10px] text-blue-600 uppercase tracking-widest">{l.split('：')[0] || '发言人'}</span>
                                <button onClick={(e) => { e.stopPropagation(); setEditingLineIdx(null); }} className="p-1 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"><Check size={12} /></button>
                             </div>
                             <textarea autoFocus value={l} onChange={(e) => handleUpdateLine(i, e.target.value)} onBlur={() => setEditingLineIdx(null)} className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs text-gray-800 outline-none focus:ring-4 focus:ring-blue-100/50 resize-none font-medium leading-relaxed" rows={3} />
                          </div>
                        ) : (
                          <><div className="flex items-center justify-between mb-1"><p className="font-black text-gray-800 text-[11px]">{l.split('：')[0]}</p><span className="text-[9px] text-gray-300 font-mono">00:{i*12}</span></div><p className="leading-relaxed font-medium text-gray-700">{l.split('：')[1] || l}</p></>
                        )}
                      </div>
                    )
                 })}
              </div>
            </div>
          </div>
          {/* 左侧固定页脚：置顶/置底 */}
          <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0 z-10 flex justify-center gap-6">
              <button onClick={() => scrollToTop(transcriptScrollRef)} className="text-[9px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-1 transition-colors"><ArrowUpToLine size={12}/> 置顶</button>
              <button onClick={() => scrollToBottom(transcriptScrollRef)} className="text-[9px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-1 transition-colors"><ArrowDownToLine size={12}/> 置底</button>
          </div>
        </div>

        {/* B. 中部：评价编辑区 (自适应独立滚动) */}
        <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-white font-black text-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs uppercase">{selectedStudent.name[0]}</div>
               <span>{selectedStudent.name} 的评价修订记录</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors active:rotate-12"><RotateCcw size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 overscroll-contain">
             <div className="max-w-xl mx-auto space-y-8 pb-10">
                <div className="bg-[#fcfdfe] border border-blue-50 rounded-[2.5rem] p-10 shadow-sm min-h-[450px]">
                   <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] mb-8 flex items-center gap-2"><Wand2 size={12}/> AI 生成评价结论 (V2.1)</h4>
                   <p className="font-black text-gray-900 mb-6 border-b border-gray-50 pb-2 inline-block">亲爱的 {selectedStudent.name} 家长：</p>
                   <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-transparent border-none outline-none resize-none h-[350px] text-gray-700 leading-loose font-medium" />
                </div>
                <div className="relative bg-white border border-gray-200 rounded-2xl p-3 flex gap-3 shadow-sm border-2 focus-within:border-blue-500 transition-all">
                   <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><MessageSquare size={20} /></div>
                   <input type="text" className="flex-1 outline-none text-sm font-medium" placeholder="输入修正指令（如：语气再柔和点）..." />
                   <button className="px-8 bg-[#121826] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md">迭代生成</button>
                </div>
             </div>
          </div>
        </div>

        {/* C. 右侧：全班推送状态 (物理隔离 + 班级完成进度条) */}
        <div className="w-[24%] bg-[#f8f9fb] flex flex-col h-full border-l border-gray-200 relative overflow-hidden">
          {/* 右侧固定头部：推送进度看板 */}
          <div className="p-5 border-b border-gray-100 bg-white flex-shrink-0 z-10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2"><History size={14} className="text-blue-500" /> 全班推送状态</span>
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-widest">12 人列表</span>
            </div>
            {/* 全班任务分发完成度进度条 */}
            <div className="space-y-2">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                  <span className="text-gray-400">分发完成度</span>
                  <span className="text-blue-600 font-mono">{Math.round(pushProgressPercent)}%</span>
               </div>
               <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.4)]" style={{ width: `${pushProgressPercent}%` }} />
               </div>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            {/* 极致物理隔离滚动区块 */}
            <div ref={studentListRef} className="absolute inset-0 overflow-y-scroll overscroll-contain custom-scrollbar-isolated p-4 space-y-3" style={{ scrollbarGutter: 'stable', background: '#f8f9fb' }}>
              {INITIAL_STUDENTS.map((s) => (
                <div key={s.id} onClick={() => { setSelectedStudent(s); setComment(s.comment); }} className={`p-4 rounded-2xl border transition-all cursor-pointer relative shadow-sm hover:shadow-md ${selectedStudent.id === s.id ? 'bg-white border-blue-500 ring-4 ring-blue-50 scale-[1.02] z-10' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800 text-sm tracking-tight">{s.name}</span>
                    <div className="flex items-center gap-1.5">
                       <button className="p-1.5 bg-gray-50 hover:bg-blue-50 rounded-lg text-blue-500 border border-transparent transition-colors"><Copy size={12}/></button>
                       {s.status === 'success' ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-red-500" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-2 italic leading-relaxed font-medium">"{s.comment}"</p>
                </div>
              ))}
              {/* 填充占位符，增加滚动感 */}
              {[...Array(6)].map((_, i) => (<div key={i} className="p-4 rounded-2xl border border-dashed border-gray-200 opacity-20 bg-gray-100/50 pointer-events-none"><div className="w-16 h-3 bg-gray-200 rounded mb-2" /><div className="w-full h-2 bg-gray-100 rounded" /></div>))}
            </div>
          </div>

          {/* 右侧固定底部：操作按钮 */}
          <div className="p-5 bg-white border-t border-gray-100 flex-shrink-0 z-10 flex flex-col items-center gap-4 shadow-[0_-8px_20px_rgba(0,0,0,0.02)]">
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest">
                 一键推送全班评价
              </button>
              <div className="flex justify-center gap-6">
                 <button onClick={() => scrollToTop(studentListRef)} className="text-[9px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-1"><ArrowUpToLine size={12}/> 置顶</button>
                 <button onClick={() => scrollToBottom(studentListRef)} className="text-[9px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-1"><ArrowDownToLine size={12}/> 置底</button>
              </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* 独立滚动条槽位与滑块样式 */
        .custom-scrollbar-isolated::-webkit-scrollbar { width: 8px; } 
        .custom-scrollbar-isolated::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); border-radius: 0; border-left: 1px solid rgba(0,0,0,0.03); }
        .custom-scrollbar-isolated::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f8f9fb; }
        .custom-scrollbar-isolated::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } 
      ` }} />
    </div>
  );
};

// --- [主视图组件：课程工作台] ---
export default function App() {
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [selectedDateId, setSelectedDateId] = useState('2026-02-26');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [inDetailView, setInDetailView] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const currentDayInfo = MOCK_DATES.find(d => d.id === selectedDateId) || MOCK_DATES[0];
  const filteredCourses = courses.filter(c => c.date === selectedDateId);

  if (inDetailView && selectedCourse) {
    return <DetailView course={selectedCourse} onBack={() => setInDetailView(false)} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8f9fa] overflow-hidden font-sans">
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <aside className="w-72 bg-[#121826] text-slate-400 flex flex-col border-r border-slate-800 flex-shrink-0">
          <div className="p-6 border-b border-slate-800/50">
            <div className="flex items-center gap-3 text-white mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><Mic size={22} /></div>
              <h1 className="font-black text-lg tracking-tight leading-none">声绘课堂</h1>
            </div>
            <nav className="space-y-2">
              <button onClick={() => setView('dashboard')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-xl scale-105 shadow-blue-600/30' : 'hover:bg-slate-800'}`}>
                <div className="flex items-center gap-3"><Calendar size={18}/><span className="font-bold">课程工作台</span></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${view === 'dashboard' ? 'bg-blue-400 text-white' : 'bg-slate-700'}`}>{filteredCourses.length}</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl transition-all font-bold group"><Users size={18} className="group-hover:text-white"/><span className="ml-3 group-hover:text-white">关系维护中心</span></button>
            </nav>
          </div>
          <div className="mt-auto p-6 text-[10px] font-black text-slate-600 uppercase tracking-widest border-t border-slate-800/50">
             <p className="mb-1">系统自检状态</p>
             <p className="text-green-500 font-black text-[10px] tracking-tighter uppercase flex items-center gap-1 animate-pulse">● API 接口已在线并加密</p>
          </div>
        </aside>

        {/* 主内容区域 */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-white">
          <header className="h-16 bg-white border-b border-gray-100 px-10 flex items-center justify-end flex-shrink-0">
            <div className="text-[10px] font-black text-gray-400 border px-3 py-1 rounded-full uppercase tracking-widest font-mono">Teacher_Cloud_Sync_Ready</div>
          </header>

          <section className="flex-1 overflow-y-auto p-10 overscroll-contain custom-scrollbar">
            <div className="max-w-6xl mx-auto">
              {/* 标题与日期选择 */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">课程工作台</h1>
                  <div className="bg-white border rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-black text-blue-600 shadow-sm border-blue-100"><CalendarDays size={14}/>{currentDayInfo.fullDate}</div>
                </div>
                <button onClick={() => setModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={18}/></button>
              </div>

              {/* 日期快速切换条 */}
              <div className="mb-10 animate-in slide-in-from-top-2">
                <p className="text-gray-400 text-sm font-medium mb-4 italic">当前共有 <span className="text-gray-800 font-black not-italic underline underline-offset-4 decoration-blue-500">{filteredCourses.length}</span> 节排课。双击已录制卡片进分析详情。</p>
                <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 rounded-2xl w-fit border border-gray-100 shadow-inner">
                  {MOCK_DATES.map((d) => (
                    <button key={d.id} onClick={() => setSelectedDateId(d.id)} className={`px-8 py-2 rounded-xl text-xs font-bold transition-all ${selectedDateId === d.id ? 'bg-white text-blue-600 shadow-sm border border-gray-200 scale-105' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}>{d.label}</button>
                  ))}
                </div>
              </div>

              {/* 课程卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                {filteredCourses.map(course => (
                  <div 
                    key={course.id} 
                    onClick={() => !isRecording && setSelectedCourse(course)} 
                    onDoubleClick={() => !isRecording && course.status.rec === 'done' && (setSelectedCourse(course), setInDetailView(true))} 
                    className={`bg-white border-2 p-6 rounded-[2rem] shadow-sm transition-all cursor-pointer relative group ${selectedCourse?.id === course.id ? 'border-blue-500 ring-4 ring-blue-50 scale-[1.02]' : 'border-transparent hover:border-gray-200 hover:shadow-md'}`}
                  >
                    <h3 className="font-bold text-gray-800 text-lg mb-4 leading-tight group-hover:text-blue-600 transition-colors">{course.name}</h3>
                    <div className="flex justify-around bg-gray-50/80 py-4 rounded-2xl mb-4 border border-gray-100">
                      <StatusLight type="Rec" state={course.status.rec}/>
                      <StatusLight type="ASR" state={course.status.asr}/>
                      <StatusLight type="AI" state={course.status.analysis}/>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span>已推送完成 {course.pushProgress}/25</span>
                      <span className={course.status.rec === 'done' ? 'text-blue-500 font-black underline decoration-2' : ''}>{course.status.rec === 'done' ? '详情分析已就绪' : course.lastUpdate}</span>
                    </div>
                  </div>
                ))}
                {/* 预约位 */}
                <div onClick={() => setModalOpen(true)} className="border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center p-10 text-gray-300 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer group active:scale-95">
                   <Plus size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                   <p className="font-black text-xs uppercase tracking-widest text-center">预约后续课堂流程</p>
                </div>
              </div>
            </div>
          </section>

          {/* 录音浮动大按钮 */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
             <button 
              disabled={selectedCourse?.status.rec === 'done'} 
              className={`px-14 py-5 rounded-full flex items-center gap-4 text-white shadow-2xl transition-all active:scale-95 ${selectedCourse?.status.rec === 'done' ? 'bg-gray-600 grayscale cursor-not-allowed shadow-none' : 'bg-[#121826] hover:scale-105'}`}
             >
               <Mic size={24} className={isRecording ? 'animate-pulse' : ''} />
               <span className="font-black uppercase tracking-widest leading-none">{selectedCourse?.status.rec === 'done' ? '录音已入库 (双击进入分析)' : selectedCourse ? `开始录制：${selectedCourse.name}` : '请在上方选择左侧课堂卡片'}</span>
             </button>
          </div>
        </main>
      </div>

      {/* 预约弹窗 */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300 p-4">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 border border-white/20 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600"><Calendar size={32}/></div>
            <h2 className="text-2xl font-black mb-2 text-gray-900 tracking-tight">排课预约</h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed font-medium">系统将为您同步本地存储路径与模型引擎，请确认排课信息无误。</p>
            <button onClick={() => setModalOpen(false)} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all uppercase tracking-widest">确认开启工作流</button>
          </div>
        </div>
      )}
    </div>
  );
}