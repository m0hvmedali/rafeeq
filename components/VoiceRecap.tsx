
import React, { useState, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, Award, AlertCircle, BookOpen } from 'lucide-react';
import { GradeLevel, VoiceTutorResponse } from '../types';
import { evaluateRecap } from '../services/geminiService';

interface VoiceRecapProps {
  gradeLevel: GradeLevel;
}

const VoiceRecap: React.FC<VoiceRecapProps> = ({ gradeLevel }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VoiceTutorResponse | null>(null);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      // Check browser support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("عذراً، متصفحك لا يدعم تحويل الصوت لنص. يرجى استخدام Google Chrome أو Edge.");
        return;
      }

      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'ar-EG';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            }
          }
          if (final) {
            setTranscript(prev => {
                const newText = prev + ' ' + final;
                return newText.trim();
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            alert("يرجى السماح للموقع باستخدام الميكروفون من إعدادات المتصفح (أيقونة القفل بجوار الرابط).");
          } else if (event.error === 'no-speech') {
            // Ignore no-speech errors usually, just stop listening if needed or keep open
          } else {
            alert("حدث خطأ في التعرف على الصوت: " + event.error);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (error) {
        console.error("Failed to start recognition", error);
        setIsListening(false);
        alert("تعذر بدء الميكروفون.");
      }
    }
  };

  const handleEvaluate = async () => {
    if (!transcript || !subject) return;
    setLoading(true);
    try {
      const evaluation = await evaluateRecap(transcript, subject, gradeLevel);
      setResult(evaluation);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء التصحيح. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-500 mb-2">
          المعلم الصوتي
        </h2>
        <p className="text-slate-500">اشرح الدرس بصوتك، وسيقوم المعلم الرقمي بتقييم فهمك</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="glass-panel p-6 rounded-[30px] border border-white/5">
            <div className="mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">المادة التي تذاكرها</label>
                <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: التاريخ - الحملة الفرنسية"
                    className="glass-input w-full p-4 rounded-xl text-slate-200"
                />
            </div>
            
            <div className="relative mb-6">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">شرحك الصوتي</label>
                 <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="اضغط على الميكروفون وابدأ الشرح كأنك المدرس..."
                    className="glass-input w-full h-64 p-4 rounded-xl resize-none leading-loose text-lg pb-16"
                 />
                 <button 
                    onClick={toggleVoiceInput}
                    className={`absolute bottom-4 left-4 p-4 rounded-full transition-all shadow-lg border ${isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-slate-700/50 border-white/10 text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-500'}`}
                    title={isListening ? "إيقاف التسجيل" : "بدء التسجيل"}
                 >
                    {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                 </button>
            </div>

            <button 
                onClick={handleEvaluate}
                disabled={loading || !transcript.trim() || !subject.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {loading ? 'جاري التصحيح...' : 'قيم شرحي الآن'}
            </button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
            {result ? (
                <>
                    <div className="glass-panel p-8 rounded-[30px] border border-blue-500/30 bg-blue-900/10 text-center relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Award className="w-32 h-32" /></div>
                        <div className="relative z-10">
                            <span className="text-blue-400 font-bold text-sm uppercase">درجة الاستيعاب</span>
                            <div className="text-6xl font-extrabold text-white my-4">{result.score}%</div>
                            <p className="text-blue-200 text-lg font-serif">"{result.feedback}"</p>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-[24px] border border-white/5 animate-fade-in" style={{animationDelay: '0.1s'}}>
                        <h4 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> مفاهيم ناقصة
                        </h4>
                        <ul className="space-y-2">
                            {result.missingConcepts.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm bg-white/5 p-3 rounded-lg">
                                    <span className="text-amber-500 mt-1">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                     <div className="glass-panel p-6 rounded-[24px] border border-white/5 animate-fade-in" style={{animationDelay: '0.2s'}}>
                        <h4 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" /> التصحيح النموذجي
                        </h4>
                        <p className="text-slate-300 leading-relaxed text-sm">
                            {result.correction}
                        </p>
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center glass-panel rounded-[30px] border-dashed border-2 border-slate-700 p-10 opacity-50">
                    <Mic className="w-16 h-16 text-slate-600 mb-4" />
                    <p className="text-slate-500 text-center">بانتظار شرحك لتقييمه... <br/>تذكر: أفضل طريقة للتعلم هي الشرح.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecap;
