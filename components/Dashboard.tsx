
import React, { useState, useEffect } from 'react';
import { AnalysisResponse, MotivationalMessage, UserStats, UserPreferences } from '../types.ts';
import { getFreshInspiration } from '../services/geminiService.ts';
import { Activity, Battery, Moon, Brain, ChevronLeft, Sparkles, Lightbulb, Quote, RefreshCw, Star, ThumbsUp, ThumbsDown } from 'lucide-react';

interface DashboardProps {
    lastAnalysis: AnalysisResponse | null;
    onNavigate: (view: string) => void;
    stats: UserStats;
    onFeedback: (contentType: any, type: 'like' | 'dislike') => void;
    preferences?: UserPreferences;
}

const Dashboard: React.FC<DashboardProps> = ({ lastAnalysis, onNavigate, stats, onFeedback, preferences }) => {
    const balance = lastAnalysis?.balanceScore ?? 75;
    const stress = lastAnalysis?.summary?.stressLevel || 'low';
    const effortType = lastAnalysis?.summary?.effortType || 'متزن';
    
    const [inspiration, setInspiration] = useState<MotivationalMessage | null>(null);
    const [loadingQuote, setLoadingQuote] = useState(true);
    const [quoteFeedback, setQuoteFeedback] = useState<'like' | 'dislike' | null>(null);

    useEffect(() => {
        const fetchQuote = async () => {
            const CACHE_KEY = 'rafeeq_quote_v3'; 
            const ONE_HOUR = 60 * 60 * 1000;

            try {
                const cachedRaw = localStorage.getItem(CACHE_KEY);
                if (cachedRaw) {
                    const cached = JSON.parse(cachedRaw);
                    const now = Date.now();
                    const age = now - cached.timestamp;
                    
                    if (age < ONE_HOUR) {
                        setInspiration(cached.data);
                        setLoadingQuote(false);
                        return; 
                    }
                }
            } catch (e) {
                console.warn("Cache read error, fetching fresh quote", e);
            }

            setLoadingQuote(true);
            try {
                const freshQuote = await getFreshInspiration(preferences?.interestProfile);
                setInspiration(freshQuote);
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: freshQuote,
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.error("Error fetching quote", error);
                const fallback: MotivationalMessage = {
                    text: "إن الله لا يضيع أجر من أحسن عملاً.",
                    source: "سورة الكهف",
                    category: "religious"
                };
                setInspiration(fallback);
            } finally {
                setLoadingQuote(false);
            }
        };

        fetchQuote();
    }, [preferences]);

    const handleQuoteFeedback = (type: 'like' | 'dislike') => {
        if (quoteFeedback || !inspiration) return; 
        setQuoteFeedback(type);
        onFeedback(inspiration.category || 'wisdom', type);
    };
    
    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 mb-2">
                        لوحة القيادة
                    </h2>
                    <p className="text-slate-500">نظرة شمولية على توازنك الحيوي والأكاديمي</p>
                </div>
                
                <div className="flex items-center gap-4">
                     <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="bg-gold-500/20 p-2 rounded-full text-gold-400">
                             <Star className="w-4 h-4" />
                        </div>
                        <div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold">المستوى {Number(stats.level)}</div>
                             <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1">
                                 <div className="h-full bg-gold-500 rounded-full" style={{ width: `${(Number(stats.xp) % 100)}%` }}></div>
                             </div>
                        </div>
                     </div>
                     {!lastAnalysis && (
                        <button 
                            onClick={() => onNavigate('daily')}
                            className="bg-gold-600 hover:bg-gold-500 text-black font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gold-500/20 transform hover:scale-105"
                        >
                            <Sparkles className="w-4 h-4" />
                            ابدأ تحليل اليوم
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-panel p-6 rounded-[24px] border border-gold-500/20 bg-gradient-to-r from-gold-900/10 to-transparent relative overflow-hidden transition-all hover:border-gold-500/40 min-h-[160px] flex items-center group">
                <div className="absolute top-0 left-0 p-4 opacity-5">
                    <Quote className="w-24 h-24 text-gold-500" />
                </div>
                
                {loadingQuote ? (
                    <div className="w-full flex justify-center items-center gap-3 text-gold-500/50 animate-pulse">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span>جاري جلب إلهام جديد من أجلك...</span>
                    </div>
                ) : inspiration ? (
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 w-full animate-fade-in">
                        <div className="p-4 bg-gold-500/10 rounded-full">
                            <Lightbulb className="w-8 h-8 text-gold-400" />
                        </div>
                        <div className="text-center md:text-right flex-1">
                            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                                <h3 className="text-gold-400 text-xs font-bold uppercase tracking-wider">
                                    قبس من النور (متجدد)
                                </h3>
                                {inspiration.category && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                                        {String(inspiration.category)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xl md:text-2xl font-serif text-slate-200 leading-relaxed">"{String(inspiration.text)}"</p>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-sm text-slate-500 font-medium">— {String(inspiration.source)}</p>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleQuoteFeedback('like')} 
                                        disabled={!!quoteFeedback}
                                        className={`p-1.5 rounded-full transition-all ${quoteFeedback === 'like' ? 'text-green-400 bg-green-400/10' : 'text-slate-600 hover:text-green-400 hover:bg-white/5'}`}
                                    >
                                        <ThumbsUp className={`w-4 h-4 ${quoteFeedback === 'like' ? 'fill-current' : ''}`} />
                                    </button>
                                    <button 
                                        onClick={() => handleQuoteFeedback('dislike')} 
                                        disabled={!!quoteFeedback}
                                        className={`p-1.5 rounded-full transition-all ${quoteFeedback === 'dislike' ? 'text-red-400 bg-red-400/10' : 'text-slate-600 hover:text-red-400 hover:bg-white/5'}`}
                                    >
                                        <ThumbsDown className={`w-4 h-4 ${quoteFeedback === 'dislike' ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="glass-panel p-6 rounded-[24px] border-t border-t-emerald-500/50 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> مؤشر التوازن
                        </div>
                        <div className="text-3xl font-bold text-white mb-4">{Number(balance)}%</div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Number(balance)}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[24px] border-t border-t-blue-500/50 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Brain className="w-4 h-4" /> الحالة الذهنية
                        </div>
                        <div className="text-2xl font-bold text-white capitalize">{String(effortType)}</div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[24px] border-t border-t-purple-500/50 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Moon className="w-4 h-4" /> النوم المثالي
                        </div>
                        <div className="text-2xl font-bold text-white">8.5 <span className="text-sm font-normal text-slate-500">ساعة</span></div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[24px] border-t border-t-gold-500/50 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="text-gold-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Battery className="w-4 h-4" /> مؤشر الضغط
                        </div>
                        <div className={`text-2xl font-bold capitalize ${stress === 'high' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {stress === 'low' ? 'منخفض' : stress === 'medium' ? 'متوسط' : 'مرتفع'}
                        </div>
                    </div>
                </div>
            </div>

            {lastAnalysis && lastAnalysis.summary && (
                 <div className="glass-panel p-8 md:p-10 rounded-[30px] border border-white/5 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></span>
                            ملخص التوجيه الأخير
                        </h3>
                        <p className="text-slate-300 leading-loose mb-8 font-serif text-lg max-w-3xl border-r-2 border-white/10 pr-6">
                            {String(lastAnalysis.summary.analysisText?.substring(0, 250) || 'لا يوجد نص متاح')}...
                        </p>
                        <button onClick={() => onNavigate('report')} className="text-gold-400 hover:text-gold-300 text-sm font-bold flex items-center gap-2 group">
                            قراءة التوجيه الكامل 
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                 </div>
            )}
            
            {!lastAnalysis && (
                <div className="text-center py-16 border border-dashed border-slate-800 rounded-[30px] opacity-60">
                    <p className="text-slate-400 font-light">لا توجد بيانات تحليل لليوم بعد</p>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
