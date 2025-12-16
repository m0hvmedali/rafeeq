
import React, { useState, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, Award, AlertCircle, BookOpen, Volume2, Square } from 'lucide-react';
import { GradeLevel, VoiceTutorResponse } from '../types';
import { evaluateRecap, transcribeAudio, generateSpeech } from '../services/geminiService';

interface VoiceRecapProps {
  gradeLevel: GradeLevel;
}

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const VoiceRecap: React.FC<VoiceRecapProps> = ({ gradeLevel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VoiceTutorResponse | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        await handleTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("يرجى السماح باستخدام الميكروفون.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      // Ensure we send the correct MIME type. Chrome usually records webm.
      const text = await transcribeAudio(base64Audio, 'audio/webm');
      setTranscript(prev => (prev ? prev + ' ' + text : text));
    } catch (error) {
      console.error("Transcription failed", error);
      alert("فشل تحويل الصوت إلى نص. حاول مرة أخرى.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleEvaluate = async () => {
    if (!transcript || !subject) return;
    setLoading(true);
    setAudioUrl(null); // Reset audio when new eval starts
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

  const handlePlayFeedback = async () => {
    if (!result?.feedback) return;
    if (audioUrl) {
        // If already generated, play it
        const audio = new Audio(audioUrl);
        audio.play();
        return;
    }

    setIsGeneratingSpeech(true);
    try {
        const base64Audio = await generateSpeech(result.feedback);
        // Convert base64 back to blob url for playback
        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mp3' }); // Gemini returns PCM/WAV usually but browser handles it
        // Actually Gemini Live API returns PCM, but generateContent with AUDIO modality returns encoded audio depending on config.
        // The default raw data works best if we assume raw PCM or just create a generic blob if header is present.
        // Wait, standard generateContent audio output usually includes headers if we don't specify raw PCM.
        // Let's assume standard playback compatible format.
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const audio = new Audio(url);
        audio.play();
    } catch (e) {
        console.error("TTS Failed", e);
        alert("فشل توليد الصوت.");
    } finally {
        setIsGeneratingSpeech(false);
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
                    placeholder={isTranscribing ? "جاري تحويل صوتك لنص..." : "اضغط على الميكروفون وابدأ الشرح كأنك المدرس..."}
                    className="glass-input w-full h-64 p-4 rounded-xl resize-none leading-loose text-lg pb-16"
                    disabled={isTranscribing}
                 />
                 
                 <div className="absolute bottom-4 left-4 flex gap-2">
                     {isTranscribing && (
                         <div className="flex items-center gap-2 text-gold-500 text-xs bg-black/40 px-3 py-1 rounded-full border border-gold-500/20">
                             <Loader2 className="w-3 h-3 animate-spin" />
                             جاري المعالجة...
                         </div>
                     )}
                     
                     <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isTranscribing}
                        className={`p-4 rounded-full transition-all shadow-lg border ${
                            isRecording 
                            ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-red-500/50' 
                            : 'bg-slate-700/50 border-white/10 text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-500'
                        }`}
                        title={isRecording ? "إيقاف التسجيل" : "بدء التسجيل"}
                     >
                        {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
                     </button>
                 </div>
            </div>

            <button 
                onClick={handleEvaluate}
                disabled={loading || isRecording || isTranscribing || !transcript.trim() || !subject.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
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
                            
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-blue-200 text-lg font-serif">"{result.feedback}"</p>
                                <button 
                                    onClick={handlePlayFeedback}
                                    disabled={isGeneratingSpeech}
                                    className="flex items-center gap-2 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-full transition-colors border border-blue-500/20"
                                >
                                    {isGeneratingSpeech ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                                    {isGeneratingSpeech ? "جاري التوليد..." : "استمع للتقييم"}
                                </button>
                            </div>
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
