import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  FileText, 
  Wand2, 
  Send, 
  ChevronRight, 
  Play, 
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
  Activity
} from 'lucide-react';

// --- 初始模拟数据 ---
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
    transcript: "老师：张小明，你来看看这个星星，你觉得它的颜色应该是怎么样的？\n张小明：我觉得是深蓝色的，还有一点点发亮。\n老师：很好，那我们尝试用笔尖轻轻点出这种发亮的感觉。"
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

const INITIAL_RELATIONSHIPS = [
  { id: 'r1', studentName: '张小明', className: '小一班', parentName: '张大明', parentId: 'wxid_zxm_998', status: 'verified' },
  { id: 'r2', studentName: '王诗涵', className: '小一班', parentName: '王大伟', parentId: '', status: 'missing' },
  { id: 'r3', studentName: '李子轩', className: '小一班', parentName: '李芳', parentId: 'wxid_lzx_123', status: 'verified' },
  { id: 'r4', studentName: '赵若曦', className: '小二班', parentName: '赵雷', parentId: 'wxid_zrx_556', status: 'verified' },
  { id: 'r5', studentName: '周宇轩', className: '小二班', parentName: '周亮', parentId: 'wxid_zyx_778', status: 'verified' },
];

const INITIAL_STUDENTS = [
  { id: 's1', name: '张小明', status: 'success', comment: '今天在课堂上表现非常活跃，对色彩的敏感度很高，画出的星空非常有层次感。' },
  { id: 's2', name: '王诗涵', status: 'error', errorType: 'ID缺失', comment: '诗涵今天尝试了新的笔触，虽然一开始有点犹豫，但最后完成得很棒。' },
  { id: 's3', name: '李子轩', status: 'pending', comment: '子轩非常专注，在处理星星细节的时候很有耐心。' },
  { id: 's4', name: '赵若曦', status: 'success', comment: '若曦今天的构思很巧妙，把家里的宠物也画进了星空里。' },
  { id: 's5', name: '周宇轩', status: 'success', comment: '宇轩今天在课堂互动中非常积极，回答问题声音响亮。' },
];

const MOCK_DATES = [
  { id: '2026-02-26', label: '今天', fullDate: '2026年02月26日' },
  { id: '2026-02-25', label: '昨天', fullDate: '2026年02月25日' },
  { id: '2026-02-24', label: '前天', fullDate: '2026年02月24日' },
];

// --- 子组件：状态灯 ---
const StatusLight = ({ type, state }) => {
  const colors = {
    pending: 'bg-gray-200 border-gray-300',
    processing: 'bg-blue-500 border-blue-200 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]',
    done: 'bg-green-500 border-green-200',
    error: 'bg-red-500 border-red-200'
  };
  const labels = { Rec: '录制', ASR: '转写', AI: '分析', Push: '推送' };
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-2.5 h-2.5 rounded-full border-2 ${colors[state]}`} />
      <span className="text-[9px] text-gray-400 font-bold tracking-tighter">{labels[type]}</span>
    </div>
  );
};

// --- 详情看板组件 ---
const DetailView = ({ course, onBack, config }) => {
  const [selectedStudent, setSelectedStudent] = useState(INITIAL_STUDENTS[0]);
  const [comment, setComment] = useState(INITIAL_STUDENTS[0].comment);

  return (
    <div className="h-full flex flex-col bg-gray-50 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><ChevronLeft size={20} /></button>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">{course.name}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{course.className} · {course.date} · {course.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-black">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 uppercase tracking-tighter">
             接口：{config.apiUrl ? '已连通' : '未配置'}
          </div>
          <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"><Send size={16} /> 批量重发</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[28%] border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between"><span className="text-xs font-black text-gray-600 uppercase tracking-widest">原始资产</span></div>
          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            <div className="bg-slate-900 rounded-2xl p-4 shadow-inner">
               <div className="flex items-center justify-between mb-3 font-black text-[9px] text-slate-500 uppercase tracking-widest">音频波形</div>
               <div className="h-12 flex items-end gap-1 px-1">{[...Array(30)].map((_, i) => (<div key={i} className="flex-1 bg-blue-500/40 rounded-t-sm" style={{ height: `${20 + Math.random() * 80}%` }} />))}</div>
               <div className="mt-4 flex justify-center"><button className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white"><Play size={20} fill="currentColor" /></button></div>
            </div>
            <div className="space-y-4 text-xs text-gray-600">
                {course.transcript && course.transcript.split('\n').map((line, idx) => (
                  <div key={idx} className="border-l-2 border-transparent hover:border-blue-500 pl-4 py-1 transition-all"><p className="font-bold text-gray-900">{line.split('：')[0]}</p><p>{line.split('：')[1] || line}</p></div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white flex flex-col border-r border-gray-200 shadow-inner">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between shadow-sm">
            <span className="font-black text-gray-900">{selectedStudent.name} 的评价分析</span>
            <div className="flex gap-2"><button className="p-2 text-gray-400 hover:text-blue-500"><Volume2 size={18} /></button><button className="p-2 text-gray-400 hover:text-blue-500"><RotateCcw size={18} /></button></div>
          </div>
          <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
            <div className="w-full max-w-2xl space-y-8">
              <div className="bg-[#fcfdfe] border border-blue-50 rounded-[2.5rem] p-10 shadow-sm relative min-h-[400px]">
                <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] mb-8 flex items-center gap-2"><Wand2 size={12} className="text-blue-400" /> AI 精准分析建议 (Gemini 驱动)</h4>
                <div className="prose prose-sm leading-loose text-gray-700 text-lg font-medium">
                  <p className="mb-6 font-black text-gray-900">亲爱的 {selectedStudent.name} 家长：</p>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-transparent border-none outline-none resize-none h-64" />
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2rem] blur opacity-15 transition duration-500"></div>
                <div className="relative bg-white border border-gray-200 rounded-[1.5rem] p-3 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><MessageSquare size={20} /></div>
                  <input type="text" placeholder="输入指令重塑评价文案..." className="flex-1 outline-none text-sm font-medium px-2" />
                  <button className="px-6 py-3 bg-[#121826] text-white text-xs font-black uppercase rounded-xl">迭代分析</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[24%] bg-gray-50/50 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-white/50"><span className="text-xs font-black text-gray-500 uppercase tracking-widest">全班推送看板</span></div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {INITIAL_STUDENTS.map((student) => (
              <div key={student.id} onClick={() => { setSelectedStudent(student); setComment(student.comment); }} className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedStudent.id === student.id ? 'bg-white border-blue-200 shadow-md' : 'bg-transparent border-transparent hover:bg-white/60'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-gray-800 text-sm">{student.name}</span>
                  {student.status === 'success' ? <CheckCircle2 size={12} className="text-green-500" /> : <AlertCircle size={12} className="text-red-500" />}
                </div>
                <p className="text-[10px] text-gray-500 line-clamp-2 italic font-medium">"{student.comment}"</p>
              </div>
            ))}
          </div>
          <div className="p-4 bg-white border-t border-gray-100"><button className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-xl hover:bg-blue-700 uppercase tracking-widest transition-all">一键推送全班</button></div>
        </div>
      </div>
    </div>
  );
};

// --- 主应用组件 ---
export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'relationships', 'settings'
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [relationships, setRelationships] = useState(INITIAL_RELATIONSHIPS);
  const [selectedDateId, setSelectedDateId] = useState('2026-02-26');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [inDetailView, setInDetailView] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [relSearch, setRelSearch] = useState('');

  // --- 系统配置状态 (大模型 URL, Key, ASR URL, ASR Key, 存储路径) ---
  const [sysConfig, setSysConfig] = useState({
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
    apiKey: '',
    asrUrl: 'https://api.voicegraph.com/v1/asr',
    asrKey: '',
    storagePath: 'C:\\Users\\Teacher\\Documents\\VoiceGraph_Storage'
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({ name: '', className: '', time: '09:00 - 10:30' });

  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) setShowDatePicker(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentDayInfo = MOCK_DATES.find(d => d.id === selectedDateId) || { id: selectedDateId, fullDate: selectedDateId, label: '选择日期' };
  const filteredCourses = courses.filter(c => c.date === selectedDateId);
  const isSelectedCourseRecorded = selectedCourse?.status.rec === 'done';

  const stats = {
    total: filteredCourses.length,
    recorded: filteredCourses.filter(c => c.status.rec === 'done').length,
    pending: filteredCourses.filter(c => c.status.rec !== 'done').length
  };

  const handleSaveCourse = () => {
    if (!formData.name || !formData.className) return;
    if (editingCourse) {
      setCourses(courses.map(c => c.id === editingCourse.id ? { ...c, ...formData } : c));
    } else {
      const newCourse = {
        id: `c${Date.now()}`, ...formData, date: selectedDateId,
        status: { rec: 'pending', asr: 'pending', analysis: 'pending', push: 'pending' },
        pushProgress: 0, totalStudents: 20, lastUpdate: '刚刚创建', transcript: "课堂录制尚未开始..."
      };
      setCourses([...courses, newCourse]);
      setSelectedCourse(newCourse);
    }
    setModalOpen(false);
  };

  if (inDetailView && selectedCourse) {
    return <DetailView course={selectedCourse} onBack={() => setInDetailView(false)} config={sysConfig} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] text-gray-800 font-sans overflow-hidden select-none">
      
      {/* 侧边栏 */}
      <aside className="w-72 bg-[#121826] text-slate-400 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3 text-white mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"><Mic size={22} /></div>
            <div><h1 className="font-black text-lg tracking-tight leading-none text-white">声绘课堂</h1><span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">声绘 AI 助手</span></div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 pl-2 font-mono">WORKSPACE</p>
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-800 hover:text-white'}`}>
                <div className="flex items-center gap-3"><Calendar size={18} /><span className="font-bold">课程工作台</span></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${view === 'dashboard' ? 'bg-blue-400 text-white' : 'bg-slate-700'}`}>{courses.length}</span>
            </button>
            <button onClick={() => setView('relationships')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all mt-2 ${view === 'relationships' ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-800 hover:text-white'}`}>
                <div className="flex items-center gap-3"><Users size={18} /><span className="font-bold">关系维护中心</span></div>
            </button>
            <button onClick={() => setView('settings')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all mt-2 ${view === 'settings' ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-800 hover:text-white'}`}>
                <div className="flex items-center gap-3"><Settings size={18} /><span className="font-bold">系统参数配置</span></div>
            </button>
          </div>
        </div>
        <div className="p-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 pl-2 font-mono">QUICK ACTIONS</p>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white"><FileText size={16} /> 导出当日简报</button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white mt-1"><ExternalLink size={16} /> 打开资源文件夹</button>
        </div>
        <div className="mt-auto p-6 bg-slate-950/30 border-t border-slate-800/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-black text-white">陈</div>
          <div className="flex-1 min-w-0"><p className="text-xs font-black text-white truncate uppercase">陈老师</p><p className="text-[9px] text-slate-500 font-bold uppercase">状态：在线</p></div>
        </div>
      </aside>

      {/* 主面板 */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
        <header className="h-16 border-b border-gray-100 px-10 flex items-center justify-end z-10 bg-white/80 backdrop-blur-md">
           <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" /> 
             存储根目录：{sysConfig.storagePath.substring(0, 30)}...
           </div>
        </header>

        {view === 'dashboard' ? (
          /* --- 工作台视图 --- */
          <>
            <section className="flex-1 overflow-y-auto p-10">
              <div className="max-w-6xl mx-auto">
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">课程工作台</h1>
                        <div className="relative" ref={datePickerRef}>
                          <button onClick={() => setShowDatePicker(!showDatePicker)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all shadow-sm ${showDatePicker ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-blue-600 border-gray-200'}`}><CalendarDays size={14} />{currentDayInfo.fullDate}<ChevronDown size={14} /></button>
                          {showDatePicker && (
                            <div className="absolute top-full left-0 mt-3 w-80 bg-white border border-gray-100 rounded-[2rem] shadow-2xl z-50 p-5 origin-top-left"><div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div></div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm font-medium italic">已录音课程请<span className="text-blue-600 font-black ml-1">双击</span>进入分析页面。</p>
                    </div>
                    <button onClick={() => { setEditingCourse(null); setModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-all"><Plus size={18} /> 预约新课程</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                  {filteredCourses.map(course => (
                    <div key={course.id} onClick={() => !isRecording && setSelectedCourse(course)} onDoubleClick={() => !isRecording && course.status.rec === 'done' && (setSelectedCourse(course), setInDetailView(true))} className={`bg-white border-2 rounded-2xl p-5 shadow-sm transition-all cursor-pointer relative group ${selectedCourse?.id === course.id ? 'border-blue-500 ring-4 ring-blue-50 shadow-md scale-[1.02]' : 'border-transparent hover:border-gray-200 hover:shadow-md'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1"><h3 className="font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">{course.name}</h3><p className="text-xs text-gray-500 flex items-center gap-2 mt-2 font-medium"><span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{course.className}</span><span className="flex items-center gap-1"><Clock size={12} /> {course.time}</span></p></div>
                        </div>
                        <div className="flex justify-around bg-gray-50/80 py-3 rounded-xl border border-gray-100 mb-4">
                            <StatusLight type="Rec" state={course.status.rec} /><StatusLight type="ASR" state={course.status.asr} /><StatusLight type="AI" state={course.status.analysis} /><StatusLight type="Push" state={course.status.push} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                            <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${(course.pushProgress / course.totalStudents) * 100}%` }} /></div><span>已推 {course.pushProgress}/{course.totalStudents}</span></div>
                            <span className={course.status.rec === 'done' ? 'text-blue-500 font-black underline underline-offset-2' : ''}>{course.status.rec === 'done' ? '双击进入详情' : course.lastUpdate}</span>
                        </div>
                    </div>
                  ))}
                  <div onClick={() => { setEditingCourse(null); setModalOpen(true); }} className="border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center p-10 text-gray-300 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer bg-gray-50/10"><Plus size={24} className="mb-2" /><p className="font-black text-xs uppercase tracking-widest text-center">新建课程记录</p></div>
                </div>
              </div>
            </section>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
                <div className={`relative group ${(!selectedCourse || isSelectedCourseRecorded) && !isRecording ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <div className={`absolute -inset-2 rounded-full blur-xl opacity-20 transition duration-500 ${isSelectedCourseRecorded ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}></div>
                    <button onClick={() => (!isSelectedCourseRecorded || isRecording) && setIsRecording(!isRecording)} disabled={isSelectedCourseRecorded && !isRecording} className={`relative px-14 py-5 rounded-full flex flex-col items-center transition-all transform active:scale-95 shadow-2xl ${isRecording ? 'bg-red-500' : isSelectedCourseRecorded ? 'bg-gray-600' : 'bg-[#121826]'} text-white border border-white/10`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-3.5 h-3.5 rounded-full ${isRecording ? 'bg-white animate-ping' : isSelectedCourseRecorded ? 'bg-gray-400' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'}`} />
                            <span className="text-base font-black tracking-[0.1em] uppercase">{isRecording ? '正在录音... 点击结束' : isSelectedCourseRecorded ? '录音锁定 (双击卡片进入详情)' : selectedCourse ? `开始录制：${selectedCourse.name}` : '请选择课堂卡片'}</span>
                            <div className="h-6 w-px bg-white/10 mx-1" />
                            {isSelectedCourseRecorded ? <Lock size={20} className="text-gray-400" /> : <Mic size={24} className={isRecording ? 'animate-pulse' : ''} />}
                        </div>
                    </button>
                </div>
            </div>
          </>
        ) : view === 'relationships' ? (
          <section className="flex-1 p-12 overflow-y-auto bg-gray-50/30">
             <h1 className="text-4xl font-black text-gray-900 mb-8">关系维护中心</h1>
             <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left font-medium">
                  <thead>
                    <tr className="bg-gray-50/50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-8 py-5">学生姓名</th>
                      <th className="px-8 py-5">执教班级</th>
                      <th className="px-8 py-5">家长姓名</th>
                      <th className="px-8 py-5">企微关联 ID</th>
                      <th className="px-8 py-5 text-center">状态及操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {relationships.map(r => (
                      <tr key={r.id} className="hover:bg-blue-50/20 group">
                        <td className="px-8 py-5 font-bold text-gray-800">{r.studentName}</td>
                        <td className="px-8 py-5 text-gray-500">{r.className}</td>
                        <td className="px-8 py-5 text-gray-700">{r.parentName}</td>
                        <td className="px-8 py-5 text-xs font-mono text-blue-500">{r.parentId || '---'}</td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {r.status === 'verified' ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-bold">
                                <CheckCircle2 size={14} /> 已配置
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-500 rounded-md text-[10px] font-bold">
                                <AlertCircle size={14} /> 待配置
                              </div>
                            )}
                            <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all text-gray-400 hover:text-blue-600" title="配置选项">
                              <Settings size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </section>
        ) : (
          /* --- 系统设置中心 (新增功能) --- */
          <section className="flex-1 overflow-y-auto p-10 bg-white animate-in slide-in-from-right-4 duration-500">
             <div className="max-w-3xl mx-auto space-y-12">
                <div>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">系统参数配置</h1>
                  <p className="text-gray-400 text-sm font-medium italic">配置大模型接口地址与本地存储路径，确保 AI 处理与数据同步正常进行。</p>
                </div>

                {/* 配置组：大模型集成 */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <Globe size={20} className="text-blue-600" />
                      <h3 className="font-black text-lg text-gray-800 uppercase tracking-widest">大模型集成</h3>
                   </div>
                   <div className="grid gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">模型生成接口 URL (ENDPOINT)</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                          <input 
                            type="text" 
                            value={sysConfig.apiUrl}
                            onChange={(e) => setSysConfig({...sysConfig, apiUrl: e.target.value})}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-sm font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">API 访问密钥 (SECRET KEY)</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                          <input 
                            type="password" 
                            value={sysConfig.apiKey}
                            onChange={(e) => setSysConfig({...sysConfig, apiKey: e.target.value})}
                            placeholder="请输入您的生成模型密钥..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-sm"
                          />
                        </div>
                      </div>
                   </div>
                </div>

                {/* 新增配置组：ASR 接口配置 */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <Activity size={20} className="text-indigo-600" />
                      <h3 className="font-black text-lg text-gray-800 uppercase tracking-widest">ASR 转写接口配置</h3>
                   </div>
                   <div className="grid gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">ASR 接口 URL</label>
                        <div className="relative">
                          <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                          <input 
                            type="text" 
                            value={sysConfig.asrUrl}
                            onChange={(e) => setSysConfig({...sysConfig, asrUrl: e.target.value})}
                            placeholder="https://api.example.com/v1/asr"
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">ASR 访问密钥 (KEY)</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                          <input 
                            type="password" 
                            value={sysConfig.asrKey}
                            onChange={(e) => setSysConfig({...sysConfig, asrKey: e.target.value})}
                            placeholder="请输入 ASR 接口密钥..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all text-sm"
                          />
                        </div>
                      </div>
                   </div>
                </div>

                {/* 配置组：本地存储 */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <Database size={20} className="text-indigo-600" />
                      <h3 className="font-black text-lg text-gray-800 uppercase tracking-widest">本地存储策略</h3>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">音频与 JSON 存储根路径</label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                          <input 
                            type="text" 
                            value={sysConfig.storagePath}
                            onChange={(e) => setSysConfig({...sysConfig, storagePath: e.target.value})}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white transition-all text-sm font-medium"
                          />
                        </div>
                        <button className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-xs font-black uppercase hover:bg-gray-200 transition-all">选择文件夹</button>
                      </div>
                      <p className="mt-3 text-[10px] text-gray-400 leading-relaxed px-1 font-medium">注意：系统将自动在选定路径下创建按<span className="text-blue-600">日期</span>命名的子文件夹，用于存放 `.wav` 及 `_Status.json` 文件。</p>
                   </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex justify-end gap-4">
                   <div className="flex-1 flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-4 rounded-2xl">
                      <CheckCircle2 size={14} /> 所有参数已自动保存至本地配置文件
                   </div>
                   <button onClick={() => setView('dashboard')} className="px-10 py-4 bg-[#121826] text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-blue-500/10 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">应用并返回</button>
                </div>
             </div>
          </section>
        )}
      </main>

      {/* 课程编辑弹窗 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden border border-white/20">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"><h2 className="text-xl font-black text-gray-900 tracking-tight">{editingCourse ? '修改课程信息' : '预约新课堂记录'}</h2><button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"><X size={20} /></button></div>
            <div className="p-10 space-y-6 text-sm">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-600 font-bold flex items-center gap-3"><div className="p-2 bg-white rounded-xl shadow-sm"><Calendar size={16} /></div><span>目标日期：{currentDayInfo.fullDate}</span></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">课堂主题名称</label><input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner" placeholder="输入课堂主题..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">班级</label><input value={formData.className} onChange={(e) => setFormData({...formData, className: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner" placeholder="小一班" /></div>
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">时段</label><input value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner" /></div>
              </div>
            </div>
            <div className="p-10 pt-0 flex gap-4"><button onClick={() => setModalOpen(false)} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-all">取消</button><button onClick={handleSaveCourse} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl transition-all active:scale-95">保存更改</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// 辅助渲染日历逻辑
const renderCalendarDays = () => {
    const days = [];
    for (let i = 1; i <= 28; i++) {
        days.push(<div key={i} className="h-9 w-9 flex items-center justify-center text-xs font-bold rounded-xl hover:bg-gray-100 cursor-pointer">{i}</div>);
    }
    return days;
};