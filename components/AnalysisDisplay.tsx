
import React, { useState } from 'react';
import { AnalysisResponse } from '../types.ts';
import { Quote, Activity, BookOpen, Clock, Zap, ShieldCheck, CheckCircle2, Globe, ExternalLink, Search, Sparkles, ThumbsUp, ThumbsDown, AlertTriangle, TrendingUp } from 'lucide-react';

interface AnalysisDisplayProps {
  data: AnalysisResponse;
  onFeedback: (contentType: 'religious' | 'scientific' | 'philosophical', type: 'like' | 'dislike') => void;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data, onFeedback }) => {
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  const handleFeedback = (id: string, contentType: any, type: 'like' | 'dislike') => {
      if (feedbackGiven[id]) return;
      onFeedback(contentType, type);
      setFeedbackGiven(prev => ({ ...prev, [id]: true }));
  };

  if (!data || !data.summary) {
      return <div className="p-12 text-center text-slate-500">بيانات التحليل غير مكتملة.</div>;
  }

  return (
    <div className="animate-fade-in pb-12">
        <header className="text-center py-6 mb-8">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-gold-200 to-gold-600">
                إرشادات الملاح الواعي
            </h1>
            <p className="text-slate-500 text-sm md:text-base mt-2 font-light tracking-widest uppercase opacity-80">
                Mindful Navigator Guidance
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <main className="lg:col-span-8 order-2 lg:order-1 space-y-8">
                <article className="glass-panel rounded-[30px] p-1 overflow-hidden">
                    <div className="rounded-[28px] bg-gradient-to-br from-white/5 to-transparent p-6 md:p-10 h-full relative">
                        <div className="absolute top-8 left-8 text-gold-500/5 rotate-12 pointer-events-none">
                            <Quote size={120} />
                        </div>

                        <h2 className="text-xl font-semibold text-gold-400 mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
                            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
                            الرؤية والتوجيه
                        </h2>

                        <div className="font-serif text-xl md:text-2xl leading-[2.2] text-slate-200/90 text-justify">
                            {String(data.summary.analysisText || '').split('\n').map((paragraph, idx) => (
                                String(paragraph).trim() && <p key={idx} className="mb-6 last:mb-0">{String(paragraph)}</p>
                            )) || <p>جاري تحميل التحليل...</p>}
                        </div>

                        {data.quranicLink && (
                          <div className="my-10 relative z-10 group">
                              <div className="bg-gradient-to-r from-gold-900/20 to-transparent border-r-4 border-gold-500 p-8 rounded-l-2xl">
                                  <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2 text-gold-500/80 text-xs font-bold uppercase tracking-wider">
                                          <Sparkles className="w-4 h-4" /> قبس من النور
                                      </div>
                                  </div>
                                  <p className="font-serif text-3xl text-gold-100 mb-4 leading-relaxed">
                                      "{String(data.quranicLink.verse)}"
                                  </p>
                                  <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm text-gold-500/70">
                                      <span className="font-bold border border-gold-500/30 px-3 py-1 rounded-full">{String(data.quranicLink.surah)}</span>
                                      <span className="italic opacity-80">{String(data.quranicLink.behavioralExplanation)}</span>
                                  </div>
                              </div>
                          </div>
                        )}

                        {data.psychologicalSupport && (
                          <div className="bg-indigo-900/10 border border-indigo-500/10 p-6 rounded-2xl flex items-start gap-4">
                              <ShieldCheck className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                              <div className="flex-1">
                                  <h4 className="text-indigo-300 font-bold mb-1 text-sm uppercase tracking-wide">همسة نفسية ({String(data.psychologicalSupport.technique)})</h4>
                                  <p className="text-slate-300 italic font-serif text-lg">"{String(data.psychologicalSupport.message)}"</p>
                              </div>
                          </div>
                        )}
                    </div>
                </article>

                {/* Lesson Intelligence Summary Section */}
                {data.lessonIntelligence && (
                  <div className="glass-panel rounded-[30px] p-8 border border-gold-500/30 bg-gradient-to-br from-gold-900/10 to-transparent relative overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold-500/5 rounded-full blur-3xl"></div>
                    <h3 className="text-xl font-bold text-gold-400 mb-6 flex items-center gap-3">
                        <TrendingUp className="w-6 h-6" />
                        📌 ملخص تأمل الدرس (Lesson Reflection)
                    </h3>
                    <div className="flex items-center gap-4 mb-6">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border ${
                            data.lessonIntelligence.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            data.lessonIntelligence.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                            مستوى الصعوبة: {data.lessonIntelligence.difficulty === 'hard' ? 'صعب' : data.lessonIntelligence.difficulty === 'medium' ? 'متوسط' : 'سهل'}
                        </span>
                    </div>
                    <p className="text-slate-200 text-lg leading-relaxed font-serif bg-white/5 p-6 rounded-2xl border border-white/5 italic">
                        {data.lessonIntelligence.reflectionText}
                    </p>
                    {data.lessonIntelligence.researchInsights && (
                        <div className="mt-6 flex items-start gap-3 text-sm text-slate-500">
                            <Search className="w-5 h-5 text-gold-500/50 mt-1 flex-shrink-0" />
                            <p className="leading-relaxed">{data.lessonIntelligence.researchInsights}</p>
                        </div>
                    )}
                  </div>
                )}

                {data.webAnalysis && (
                    <div className="glass-panel rounded-[30px] p-8 border border-blue-500/20 relative overflow-hidden">
                        <h3 className="text-lg font-bold text-blue-400 mb-6 flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            رؤى الويب
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-blue-900/10 p-5 rounded-2xl border border-blue-500/10">
                                <h4 className="text-blue-300 font-bold text-sm mb-2"><Search className="w-4 h-4 inline ml-2" /> السبب الجذري</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">{String(data.webAnalysis.rootCause)}</p>
                            </div>
                            <div className="bg-emerald-900/10 p-5 rounded-2xl border border-emerald-500/10">
                                <h4 className="text-emerald-300 font-bold text-sm mb-2"><CheckCircle2 className="w-4 h-4 inline ml-2" /> علاج مقترح</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">{String(data.webAnalysis.suggestedRemedy)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <aside className="lg:col-span-4 order-1 lg:order-2 space-y-6">
                <div className="glass-panel rounded-3xl overflow-hidden p-6 space-y-6">
                    <div className="flex items-center gap-2 text-slate-200">
                        <Activity className="w-5 h-5 text-gold-400" />
                        <span className="font-bold">سياق الحالة</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">الضغط</label>
                            <div className="glass-input py-2 rounded-xl font-bold">{String(data.summary.stressLevel)}</div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">الجهد</label>
                            <div className="glass-input py-2 rounded-xl text-blue-400 font-bold">{String(data.summary.effortType)}</div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-slate-400">نقاط التوازن</span>
                            <span className="text-2xl font-black text-gold-400">{data.balanceScore}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400" style={{ width: `${data.balanceScore}%` }}></div>
                        </div>
                    </div>
                </div>

                {data.tomorrowPlan && data.tomorrowPlan.length > 0 && (
                    <div className="glass-panel rounded-3xl p-6">
                        <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-400" /> مقترح لغدٍ أفضل
                        </h4>
                        <div className="space-y-3">
                            {data.tomorrowPlan.slice(0, 3).map((item, i) => (
                                <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-slate-500 font-bold mb-1">{item.time}</div>
                                    <div className="text-sm font-bold text-slate-200">{item.task}</div>
                                    <div className="text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-tighter">{item.method}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </aside>
        </div>
    </div>
  );
};

export default AnalysisDisplay;
