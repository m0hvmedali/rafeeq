
import React, { useState } from 'react';
import { UserPreferences, UserStats } from '../types';
import { Moon, Monitor, Type, Eye, Award, Zap, Mic, PenTool, CheckCircle, Calendar } from 'lucide-react';

interface SettingsPanelProps {
    prefs: UserPreferences;
    stats: UserStats;
    onUpdatePrefs: (newPrefs: UserPreferences) => void;
    onLogout: () => void;
    currentUser: { name: string, grade: string };
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ prefs, stats, onUpdatePrefs, onLogout, currentUser }) => {
    const [showLevels, setShowLevels] = useState(false);

    const handleToggleTheme = () => {
        const newTheme = prefs.theme === 'dark' ? 'high-contrast' : 'dark';
        onUpdatePrefs({ ...prefs, theme: newTheme });
    };

    const handleFontSize = (size: 'normal' | 'large' | 'xl') => {
        onUpdatePrefs({ ...prefs, fontSize: size });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white mb-2">الإعدادات والتفضيلات</h2>
                <p className="text-slate-500">خصص تجربتك في رفيق</p>
            </div>

            {/* Profile Card */}
            <div className="glass-panel p-6 rounded-[30px] flex items-center gap-6 border border-white/10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-black font-bold text-2xl shadow-lg shadow-gold-500/20">
                    {currentUser.name.charAt(0)}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{currentUser.name}</h3>
                    <p className="text-slate-400 text-sm">{currentUser.grade}</p>
                </div>
            </div>

            {/* Gamification Stats & Guide */}
            <div className="glass-panel p-6 rounded-[30px] border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50"></div>
                
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <Award className="w-5 h-5 text-gold-500" /> إحصائياتك
                    </h3>
                    <button 
                        onClick={() => setShowLevels(!showLevels)} 
                        className="text-xs text-gold-400 hover:text-gold-300 underline font-bold"
                    >
                        {showLevels ? "إخفاء الدليل" : "كيف أطور مستواي؟"}
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div className="bg-white/5 p-4 rounded-2xl">
                        <div className="text-2xl font-bold text-gold-400">{stats.level}</div>
                        <div className="text-xs text-slate-500 uppercase">المستوى</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl">
                        <div className="text-2xl font-bold text-blue-400">{stats.xp}</div>
                        <div className="text-xs text-slate-500 uppercase">نقاط XP</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl">
                        <div className="text-2xl font-bold text-emerald-400">{stats.streak}</div>
                        <div className="text-xs text-slate-500 uppercase">أيام متتالية</div>
                    </div>
                </div>

                {/* Level Up Guide (Collapsible) */}
                {showLevels && (
                    <div className="bg-black/40 rounded-2xl p-5 border border-white/5 animate-fade-in space-y-4">
                        <h4 className="text-sm font-bold text-slate-300 mb-3">دليل كسب نقاط الخبرة (XP)</h4>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm p-2 bg-white/5 rounded-lg">
                                <span className="flex items-center gap-2 text-slate-300"><Mic className="w-4 h-4 text-blue-400" /> شرح صوتي لدرس</span>
                                <span className="text-gold-400 font-bold">+20 XP</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 bg-white/5 rounded-lg">
                                <span className="flex items-center gap-2 text-slate-300"><Zap className="w-4 h-4 text-purple-400" /> جلسة تركيز كاملة</span>
                                <span className="text-gold-400 font-bold">+15 XP</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 bg-white/5 rounded-lg">
                                <span className="flex items-center gap-2 text-slate-300"><PenTool className="w-4 h-4 text-emerald-400" /> تحليل اليوميات</span>
                                <span className="text-gold-400 font-bold">+10 XP</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 bg-white/5 rounded-lg">
                                <span className="flex items-center gap-2 text-slate-300"><CheckCircle className="w-4 h-4 text-slate-400" /> تقييم محتوى (مفيد)</span>
                                <span className="text-gold-400 font-bold">+5 XP</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 border border-gold-500/20 bg-gold-500/10 rounded-lg">
                                <span className="flex items-center gap-2 text-gold-200"><Calendar className="w-4 h-4" /> إتمام أسبوع كامل</span>
                                <span className="text-gold-400 font-bold">+100 XP</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Accessibility */}
            <div className="glass-panel p-6 rounded-[30px] border border-white/10">
                <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-400" /> إمكانية الوصول (Accessibility)
                </h3>
                
                <div className="space-y-6">
                    {/* Theme */}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-300 flex items-center gap-2"><Monitor className="w-4 h-4" /> وضع التباين العالي</span>
                        <button 
                            onClick={handleToggleTheme}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${prefs.theme === 'high-contrast' ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}
                        >
                            {prefs.theme === 'high-contrast' ? 'مفعل' : 'معطل'}
                        </button>
                    </div>

                    {/* Font Size */}
                    <div>
                        <span className="text-slate-300 flex items-center gap-2 mb-3"><Type className="w-4 h-4" /> حجم الخط</span>
                        <div className="flex bg-white/5 rounded-xl p-1">
                            {(['normal', 'large', 'xl'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleFontSize(s)}
                                    className={`flex-1 py-2 rounded-lg text-sm transition-all ${prefs.fontSize === s ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {s === 'normal' ? 'عادي' : s === 'large' ? 'كبير' : 'ضخم'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={onLogout}
                className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 font-bold py-4 rounded-xl transition-all"
            >
                تسجيل الخروج
            </button>
        </div>
    );
};

export default SettingsPanel;
