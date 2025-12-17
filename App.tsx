
import React, { useState, useEffect, useRef } from 'react';
import { WeeklySchedule, AnalysisResponse, UserProfile, GradeLevel } from './types';
import ScheduleManager from './components/ScheduleManager';
import AnalysisDisplay from './components/AnalysisDisplay';
import Dashboard from './components/Dashboard';
import ResourcesLibrary from './components/ResourcesLibrary';
import LoginScreen from './components/LoginScreen';
import FocusMode from './components/FocusMode';
import VoiceRecap from './components/VoiceRecap';
import { Logo } from './components/Logo';
// UPDATE: Import from orchestrator
import { smartAnalyzeDay } from './services/orchestrator';
import * as storage from './services/storage';
import { supabase } from './lib/supabase';
import { Sparkles, LayoutDashboard, Calendar, PenTool, BookOpen, Settings, Cloud, CloudOff, Menu, X, Loader2, Send, LogOut, ShieldAlert, Mic, MicOff, Brain, Mic2 } from 'lucide-react';

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

function App() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [schedule, setSchedule] = useState<WeeklySchedule>(INITIAL_SCHEDULE);
  const [dailyReflection, setDailyReflection] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // --- AUTH CHECK ---
  useEffect(() => {
    const savedUser = storage.getLastUser();
    if (savedUser) {
        setCurrentUser(savedUser);
    }
    setInitializing(false);
  }, []);

  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      setIsDataLoaded(false);

      try {
        const [savedSchedule, savedEntry] = await Promise.all([
          storage.getSchedule(currentUser.name),
          storage.getDailyEntry(currentUser.name)
        ]);
        
        if (savedSchedule) {
            setSchedule(savedSchedule);
        } else {
            setSchedule(INITIAL_SCHEDULE);
        }

        if (savedEntry) {
          setDailyReflection(savedEntry.reflection);
          setAnalysis(savedEntry.analysis);
        } else {
            setDailyReflection('');
            setAnalysis(null);
        }
      } catch (e) {
        console.error("Error loading user data", e);
      } finally {
        setIsDataLoaded(true);
      }
    };
    
    if (currentUser) {
        loadData();
    }
  }, [currentUser]);

  // --- PERSISTENCE ---
  useEffect(() => {
    if (currentUser && !initializing && isDataLoaded) {
      storage.saveSchedule(currentUser.name, schedule).catch(console.error);
    }
  }, [schedule, currentUser, initializing, isDataLoaded]);

  useEffect(() => {
    if (currentUser && !initializing && isDataLoaded) {
        const handler = setTimeout(() => {
            storage.saveDailyEntry(currentUser.name, dailyReflection, analysis);
        }, 1000);
        return () => clearTimeout(handler);
    }
  }, [dailyReflection, analysis, currentUser, initializing, isDataLoaded]);

  // --- LOGIC ---
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
      setIsDataLoaded(false);
  };

  const getNextDayName = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
  };

  const handleAnalyze = async () => {
    if (!dailyReflection.trim() || !currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // UPDATE: Use smartAnalyzeDay orchestrator
      const result = await smartAnalyzeDay(dailyReflection, schedule, getNextDayName(), currentUser.grade);
      setAnalysis(result);
      await storage.saveDailyEntry(currentUser.name, dailyReflection, result);
      setCurrentView('report');
    } catch (err: any) {
      console.error("Final Fallback Error:", err);
      // Even if orchestrator fails completely (shouldn't happen due to static fallback), show message
      setError("حدث خطأ غير متوقع في نظام التحليل. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  // --- VOICE INPUT LOGIC ---
  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("المتصفح لا يدعم تحويل الصوت لنص. يرجى استخدام Chrome أو Edge.");
        return;
      }
      
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           setDailyReflection(prev => prev + ' ' + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center text-gold-500">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  // --- NAVIGATION CONFIG ---
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
    <div className="min-h-screen text-slate-200 flex font-sans selection:bg-gold-500/30 selection:text-gold-200">
      
      {/* Sidebar (Desktop) */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 bg-midnight/80 backdrop-blur-xl border-l border-white/5 transform transition-transform duration-500 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-500/10 to-gold-700/10 rounded-xl flex items-center justify-center border border-gold-500/20 shadow-lg shadow-gold-500/10 group-hover:scale-110 transition-transform duration-300">
                    <Logo className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">رفيق</h1>
                    <span className="text-gold-500 text-[10px] font-medium tracking-widest uppercase block">الملاح الواعي</span>
                    <span className="text-slate-500 text-[10px] block mt-1 truncate max-w-[100px]">{currentUser.name}</span>
                </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <nav className="px-6 space-y-2 mt-2">
            {NAV_ITEMS.map(item => (
                <button
                    key={item.id}
                    onClick={() => { setCurrentView(item.id as View); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                        currentView === item.id 
                        ? 'bg-gradient-to-r from-gold-500/10 to-transparent text-gold-400 font-bold border-r-2 border-gold-500' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-r-2 border-transparent'
                    }`}
                >
                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                    {item.label}
                </button>
            ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-white/5 space-y-4">
             <div className="flex items-center gap-2 justify-center text-xs text-slate-600 bg-black/40 py-2 rounded-lg border border-white/5">
                {supabase ? <Cloud className="w-3 h-3 text-gold-500" /> : <CloudOff className="w-3 h-3" />}
                {supabase ? 'متصل سحابياً' : 'تخزين محلي'}
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:mr-72 relative">
        {/* Mobile Header */}
        <header className="lg:hidden p-4 flex items-center justify-between bg-midnight/80 backdrop-blur border-b border-white/5 sticky top-0 z-40">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <Logo className="w-6 h-6" />
                </div>
                <h1 className="text-lg font-bold">رفيق</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-300">
                <Menu className="w-6 h-6" />
            </button>
        </header>

        <main className="max-w-6xl mx-auto p-4 lg:p-12 relative z-10">
            {currentView === 'dashboard' && (
                <Dashboard lastAnalysis={analysis} onNavigate={(v) => setCurrentView(v as View)} />
            )}

            {currentView === 'daily' && (
                <div className="max-w-3xl mx-auto animate-fade-in">
                    <div className="text-center mb-10 animate-float">
                        <div className="inline-block relative">
                             <div className="absolute -inset-1 bg-gradient-to-r from-gold-600 to-transparent rounded-lg blur opacity-25"></div>
                             <h2 className="relative text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gold-200 to-gold-500 mb-2">إدخال اليوم</h2>
                        </div>
                        <p className="text-slate-400 text-lg font-light mt-2">مساحة آمنة للتفريغ الذهني والتحليل الواعي</p>
                    </div>
                    
                    <div className="glass-panel p-1 rounded-[2rem] transition-all duration-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                        <div className="bg-void/50 rounded-[30px] p-8 border border-white/5 relative">
                            <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">سجل أفكارك ومشاعرك</label>
                            <div className="relative">
                                <textarea
                                    value={dailyReflection}
                                    onChange={(e) => setDailyReflection(e.target.value)}
                                    placeholder="كيف سارت أمور يومك؟ هل واجهت ضغوطاً؟ صف مشاعرك وأداءك بصدق... (يمكنك استخدام الميكروفون للتحدث)"
                                    className="glass-input w-full h-72 p-6 rounded-2xl text-lg text-slate-200 placeholder-slate-600 outline-none resize-none leading-loose mb-8 font-serif pb-16"
                                />
                                <button 
                                    onClick={toggleVoiceInput}
                                    className={`absolute bottom-12 left-6 p-3 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/50' : 'bg-white/5 text-slate-400 hover:text-gold-400 border border-white/10'}`}
                                    title="تحدث بدلاً من الكتابة"
                                >
                                    {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                </button>
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-full">
                                    <Sparkles className="w-3 h-3 text-gold-500" />
                                    تحليل مدعوم بـ Gemini + بحث Google
                                </div>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading || !dailyReflection.trim()}
                                    className="w-full md:w-auto bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    {loading ? 'جاري استدعاء الحكمة...' : 'تحليل وإرشاد'}
                                </button>
                            </div>
                            {error && (
                                <div className="mt-6 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-200 text-sm text-center animate-pulse">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {currentView === 'report' && (
                <>
                    {analysis ? (
                            <AnalysisDisplay data={analysis} />
                    ) : (
                        <div className="text-center py-24 animate-fade-in glass-panel rounded-3xl border-dashed border-2 border-slate-800">
                            <Sparkles className="w-20 h-20 text-slate-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-slate-500 mb-3">بانتظار مدخلاتك</h3>
                            <p className="text-slate-600 mb-8">لم تقم بتحليل يومك بعد. ابدأ الآن للحصول على التوجيه.</p>
                            <button onClick={() => setCurrentView('daily')} className="text-gold-500 hover:text-gold-400 font-bold border-b border-gold-500/30 hover:border-gold-500 pb-1 transition-all">
                                الذهاب لإدخال بيانات اليوم &larr;
                            </button>
                        </div>
                    )}
                </>
            )}

            {currentView === 'voice-tutor' && currentUser && (
                <VoiceRecap gradeLevel={currentUser.grade} />
            )}

            {currentView === 'focus' && (
                <FocusMode />
            )}

            {currentView === 'planner' && (
                <div className="animate-fade-in">
                        <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 mb-2">الجدول الأسبوعي</h2>
                        <p className="text-slate-500">هندسة الوقت بوعي (Time Blocking)</p>
                    </div>
                    <ScheduleManager schedule={schedule} setSchedule={setSchedule} />
                </div>
            )}

            {currentView === 'resources' && <ResourcesLibrary />}
            
            {currentView === 'settings' && (
                    <div className="max-w-xl mx-auto glass-panel p-10 rounded-[30px] text-center border-t border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity"></div>
                    <Settings className="w-16 h-16 mx-auto mb-6 text-slate-700 group-hover:text-gold-500 transition-colors duration-500" />
                    <h3 className="text-2xl font-bold text-slate-300 mb-2">الإعدادات الشخصية</h3>
                     <div className="space-y-4 text-slate-400 text-sm mb-8">
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <p className="mb-1 uppercase text-xs font-bold text-slate-600">الاسم المسجل</p>
                            <span className="text-gold-400 text-lg font-bold">{currentUser.name}</span>
                        </div>
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <p className="mb-1 uppercase text-xs font-bold text-slate-600">المرحلة الدراسية</p>
                            <span className="text-gold-400 text-lg font-bold">{currentUser.grade}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        تسجيل الخروج وحذف البيانات المحلية
                    </button>
                    <p className="mt-4 text-xs text-slate-600">
                        <ShieldAlert className="w-3 h-3 inline ml-1" />
                        سيتم الاحتفاظ ببياناتك في السحابة بناءً على اسمك.
                    </p>
                    </div>
            )}
        </main>
      </div>
    </div>
  );
}

export default App;
