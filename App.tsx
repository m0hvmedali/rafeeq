
import React, { useState, useEffect, useRef } from 'react';
import { WeeklySchedule, AnalysisResponse, UserProfile, GradeLevel, UserPreferences, UserStats } from './types.ts';
import ScheduleManager from './components/ScheduleManager.tsx';
import AnalysisDisplay from './components/AnalysisDisplay.tsx';
import Dashboard from './components/Dashboard.tsx';
import ResourcesLibrary from './components/ResourcesLibrary.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import FocusMode from './components/FocusMode.tsx';
import VoiceRecap from './components/VoiceRecap.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import { Logo } from './components/Logo.tsx';
import { smartAnalyzeDay } from './services/orchestrator.ts';
import * as storage from './services/storage.ts';
import * as memoryStore from './services/memoryStore.ts'; 
import * as resilientDB from './services/resilientDB.ts'; 
import { updateStatsOnEntry, DEFAULT_PREFERENCES, DEFAULT_STATS } from './services/recommendationEngine.ts';
import { supabase } from './lib/supabase.ts';
import { Sparkles, LayoutDashboard, Calendar, PenTool, BookOpen, Settings, Cloud, CloudOff, Menu, X, Loader2, Send, Mic, MicOff, Brain, Mic2, Book, Clock, CheckSquare } from 'lucide-react';
import './index.css';

const INITIAL_SCHEDULE: WeeklySchedule = {
  "السبت": [],
  "الأحد": [],
  "الاثنين": [],
  "الثلاثاء": [],
  "الأربعاء": [],
  "الخميس": [],
  "الجمعة": []
};

type View = 'dashboard' | 'daily' | 'report' | 'planner' | 'resources' | 'focus' | 'voice-tutor' | 'settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [schedule, setSchedule] = useState<WeeklySchedule>(INITIAL_SCHEDULE);
  const [dailyReflection, setDailyReflection] = useState('');
  
  const [subject, setSubject] = useState('');
  const [lesson, setLesson] = useState('');
  const [solved, setSolved] = useState(false);
  const [hours, setHours] = useState<number>(1);

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const savedUser = storage.getLastUser();
    if (savedUser) setCurrentUser(savedUser);
    setInitializing(false);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      try {
        resilientDB.syncWithCloud(currentUser.name);
        const [savedSchedule, savedEntry, savedPrefs, savedStats] = await Promise.all([
          storage.getSchedule(currentUser.name),
          storage.getDailyEntry(currentUser.name),
          storage.getUserPreferences(currentUser.name),
          storage.getUserStats(currentUser.name)
        ]);
        if (savedSchedule) setSchedule(savedSchedule);
        if (savedEntry) {
          setDailyReflection(savedEntry.reflection || '');
          if (savedEntry.analysis?.summary) setAnalysis(savedEntry.analysis);
        }
        if (savedPrefs) setPreferences(savedPrefs);
        
        // تأمين البيانات الرقمية لمنع NaN
        setStats({
            xp: Number(savedStats?.xp) || 0,
            level: Number(savedStats?.level) || 1,
            streak: Number(savedStats?.streak) || 0,
            lastLoginDate: savedStats?.lastLoginDate || new Date().toISOString().split('T')[0],
            totalEntries: Number(savedStats?.totalEntries) || 0
        });
      } catch (e) {
        console.error("Load error", e);
      }
    };
    if (currentUser) loadData();
  }, [currentUser]);

  useEffect(() => {
      document.body.className = `font-sans antialiased overflow-x-hidden ${preferences.theme === 'high-contrast' ? 'bg-black text-white contrast-125' : 'bg-midnight text-slate-200'}`;
      document.documentElement.style.fontSize = preferences.fontSize === 'xl' ? '18px' : preferences.fontSize === 'large' ? '17px' : '16px';
  }, [preferences.theme, preferences.fontSize]);

  const handleLogin = (profile: UserProfile) => {
      storage.saveUserProfile(profile);
      setCurrentUser(profile);
  };

  const handleLogout = () => {
      storage.logoutUser();
      setCurrentUser(null);
      setSchedule(INITIAL_SCHEDULE);
      setDailyReflection('');
      setAnalysis(null);
  };

  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
      setPreferences(newPrefs);
      if (currentUser) storage.saveUserPreferences(currentUser.name, newPrefs);
  };

  const handleFeedback = async (contentType: any, type: 'like' | 'dislike') => {
      if (!currentUser) return;
      const result = await memoryStore.recordInteraction(
          currentUser.name,
          'quote', 
          `Feedback on ${contentType}`,
          [contentType],
          type,
          stats,
          preferences.interestProfile
      );
      setStats(result.newStats);
      setPreferences(prev => ({ ...prev, interestProfile: result.newProfile }));
      await storage.saveUserStats(currentUser.name, result.newStats);
      await storage.saveUserPreferences(currentUser.name, { ...preferences, interestProfile: result.newProfile });
  };

  const handleAnalyze = async () => {
    if (!subject.trim() || !lesson.trim() || !currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const numericHours = Number(hours);
      const safeHours = isNaN(numericHours) ? 1 : Math.max(1, numericHours);
      
      const lessonData = { 
          subject, 
          lesson, 
          solved, 
          hours: safeHours 
      };
      
      const result = await smartAnalyzeDay(
          dailyReflection, 
          schedule, 
          new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date(Date.now() + 86400000)), 
          currentUser.grade,
          lessonData,
          preferences, 
          stats 
      );
      
      if (result?.summary) {
        setAnalysis(result);
        const mem = await memoryStore.recordInteraction(currentUser.name, 'analysis', `${subject}: ${lesson}`, ['analysis', subject], null, stats, preferences.interestProfile);
        setStats(mem.newStats);
        await storage.saveUserStats(currentUser.name, mem.newStats);
        await storage.saveDailyEntry(currentUser.name, dailyReflection, result);
        setCurrentView('report');
      }
    } catch (err: any) {
      setError("نواجه ضغطاً في الاتصال. تم تفعيل وضع الطوارئ الذكي.");
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) return alert("المتصفح لا يدعم الصوت.");
      const rec = new SpeechRecognition();
      rec.lang = 'ar-EG';
      rec.onresult = (e: any) => setDailyReflection(prev => prev + ' ' + e.results[0][0].transcript);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    }
  };

  if (initializing) return <div className="min-h-screen bg-midnight flex items-center justify-center text-gold-500"><Loader2 className="w-12 h-12 animate-spin" /></div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'daily', label: 'إدخال اليوم', icon: PenTool },
    { id: 'report', label: 'التوجيه والإرشاد', icon: Sparkles },
    { id: 'voice-tutor', label: 'المعلم الصوتي', icon: Mic2 },
    { id: 'focus', label: 'التركيز العميق', icon: Brain }, 
    { id: 'planner', label: 'الجدول الأسبوعي', icon: Calendar },
    { id: 'resources', label: 'المصادر', icon: BookOpen },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex font-sans selection:bg-gold-500/30 selection:text-gold-200 ${preferences.theme === 'high-contrast' ? 'text-white' : 'text-slate-200'}`}>
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 backdrop-blur-xl border-l border-white/5 transform transition-transform duration-500 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} ${preferences.theme === 'high-contrast' ? 'bg-black border-white' : 'bg-midnight/80'} flex flex-col h-full`}>
        <div className="p-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center border border-gold-500/20 shadow-lg group-hover:scale-110 transition-all">
                    <Logo className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">رفيق</h1>
                    <span className="text-gold-500 text-[10px] font-medium tracking-widest uppercase block">الملاح الواعي</span>
                </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <nav className="px-6 space-y-2 mt-2 flex-1 overflow-y-auto no-scrollbar">
            {NAV_ITEMS.map(item => (
                <button
                    key={item.id}
                    onClick={() => { setCurrentView(item.id as View); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                        currentView === item.id 
                        ? 'bg-gradient-to-r from-gold-500/10 to-transparent text-gold-400 font-bold border-r-2 border-gold-500' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-r-2 border-transparent'
                    }`}
                >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-white/5 space-y-4 shrink-0 mt-auto">
             <div className="flex items-center gap-2 justify-center text-xs text-slate-600 bg-black/40 py-2 rounded-lg border border-white/5">
                {supabase ? <Cloud className="w-3 h-3 text-gold-500" /> : <CloudOff className="w-3 h-3" />}
                {supabase ? 'متصل سحابياً' : 'تخزين محلي'}
            </div>
        </div>
      </aside>

      <div className="flex-1 lg:mr-72 relative">
        <header className="lg:hidden p-4 flex items-center justify-between bg-midnight/80 backdrop-blur border-b border-white/5 sticky top-0 z-40">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg flex items-center justify-center"><Logo className="w-6 h-6" /></div>
                <h1 className="text-lg font-bold">رفيق</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-300"><Menu className="w-6 h-6" /></button>
        </header>
        <main className="max-w-6xl mx-auto p-4 lg:p-12 relative z-10">
            {currentView === 'dashboard' && <Dashboard lastAnalysis={analysis} onNavigate={(v) => setCurrentView(v as View)} stats={stats} onFeedback={handleFeedback} preferences={preferences} />}
            
            {currentView === 'daily' && (
                <div className="max-w-3xl mx-auto animate-fade-in">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gold-200 to-gold-500 mb-2">إدخال اليوم</h2>
                        <p className="text-slate-400">سجل إنجازاتك للحصول على تحليل دقيق ومبني على البحث</p>
                    </div>
                    
                    <div className="glass-panel p-8 rounded-[2rem] space-y-8 bg-void/50 border border-white/5">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2"><Book className="w-3 h-3" /> اسم المادة</label>
                                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="مثال: فيزياء" className="glass-input w-full py-3" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2"><Sparkles className="w-3 h-3" /> اسم الدرس</label>
                                <input type="text" value={lesson} onChange={e => setLesson(e.target.value)} placeholder="مثال: الحركة الموجية" className="glass-input w-full py-3" />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2"><Clock className="w-3 h-3" /> ساعات المذاكرة</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="20" 
                                    value={isNaN(hours) ? "" : hours} 
                                    onChange={e => {
                                        const val = parseInt(e.target.value);
                                        setHours(isNaN(val) ? 0 : val);
                                    }} 
                                    className="glass-input w-full py-3" 
                                />
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <input type="checkbox" id="solved" checked={solved} onChange={e => setSolved(e.target.checked)} className="w-5 h-5 accent-gold-500" />
                                <label htmlFor="solved" className="text-sm font-bold text-slate-300 flex items-center gap-2 cursor-pointer"><CheckSquare className="w-4 h-4 text-gold-500" /> هل قمت بحل الأسئلة؟</label>
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">انعكاسك الشخصي (اختياري)</label>
                            <textarea value={dailyReflection} onChange={e => setDailyReflection(e.target.value)} placeholder="كيف شعرت أثناء المذاكرة؟ هل واجهت صعوبات؟" className="glass-input w-full h-40 py-4 resize-none" />
                            <button onClick={toggleVoiceInput} className={`absolute bottom-4 left-4 p-2 rounded-full ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-slate-500'}`}><Mic className="w-5 h-5" /></button>
                        </div>

                        <div className="flex justify-center">
                            <button onClick={handleAnalyze} disabled={loading || !subject || !lesson} className="btn-gold w-full md:w-auto px-16 py-4 flex items-center gap-3">
                                {loading ? <Loader2 className="animate-spin" /> : <Send />}
                                {loading ? 'جاري التحليل...' : 'بدء التحليل الذكي'}
                            </button>
                        </div>
                        {error && <p className="text-amber-400 text-sm text-center animate-pulse mt-4">{error}</p>}
                    </div>
                </div>
            )}

            {currentView === 'report' && (
                analysis ? <AnalysisDisplay data={analysis} onFeedback={handleFeedback} /> : <div className="text-center py-20 text-slate-500">بانتظار التحليل...</div>
            )}

            {currentView === 'voice-tutor' && currentUser && <VoiceRecap gradeLevel={currentUser.grade} onComplete={() => {}} />}
            {currentView === 'focus' && <FocusMode onCompleteSession={() => {}} />}
            {currentView === 'planner' && <ScheduleManager schedule={schedule} setSchedule={setSchedule} onCompleteTask={() => {}} />}
            {currentView === 'resources' && <ResourcesLibrary />}
            {currentView === 'settings' && currentUser && <SettingsPanel prefs={preferences} stats={stats} onUpdatePrefs={handleUpdatePreferences} onLogout={handleLogout} currentUser={currentUser} />}
        </main>
      </div>
    </div>
  );
}
