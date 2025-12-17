
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Brain, Coffee } from 'lucide-react';

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

interface FocusModeProps {
    onCompleteSession?: () => void;
}

const FocusMode: React.FC<FocusModeProps> = ({ onCompleteSession }) => {
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const whiteNoiseNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Audio Context (Lazy load on user interaction)
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
      audioContextRef.current = new AudioContext();
    }
  };

  const toggleWhiteNoise = () => {
    if (!audioEnabled) {
      initAudio();
      const ctx = audioContextRef.current!;
      
      // Create Brown Noise (Softer than White Noise)
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Compensate for gain
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      
      const gain = ctx.createGain();
      gain.gain.value = 0.1; // Low volume

      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      whiteNoiseNodeRef.current = noise;
      gainNodeRef.current = gain;
      setAudioEnabled(true);
    } else {
      whiteNoiseNodeRef.current?.disconnect();
      gainNodeRef.current?.disconnect();
      setAudioEnabled(false);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Switch modes
      if (mode === 'focus') {
        // Trigger completion callback ONLY when finishing a focus session
        if (onCompleteSession) onCompleteSession();
        
        setMode('break');
        setTimeLeft(BREAK_TIME);
      } else {
        setMode('focus');
        setTimeLeft(FOCUS_TIME);
      }
      setIsActive(false);
      // Optional: Play a chime sound here
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, onCompleteSession]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (whiteNoiseNodeRef.current) whiteNoiseNodeRef.current.disconnect();
      if (gainNodeRef.current) gainNodeRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'focus' 
    ? ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100 
    : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in text-center">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-purple-500 mb-2">
          التركيز العميق
        </h2>
        <p className="text-slate-500">تقنية بومودورو مع ضوضاء براونية (Brown Noise) للعزل الذهني</p>
      </div>

      <div className="glass-panel p-10 rounded-[40px] relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
        {/* Animated Background */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-20' : 'opacity-5'} pointer-events-none`}>
          <div className={`w-full h-full bg-gradient-to-br ${mode === 'focus' ? 'from-purple-900' : 'from-emerald-900'} to-transparent animate-pulse-slow`}></div>
        </div>

        {/* Mode Badge */}
        <div className={`relative z-10 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest mb-8 border transition-colors ${
            mode === 'focus' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
            {mode === 'focus' ? <span className="flex items-center gap-2"><Brain className="w-4 h-4" /> جلسة تركيز</span> : <span className="flex items-center gap-2"><Coffee className="w-4 h-4" /> وقت راحة</span>}
        </div>

        {/* Timer Display */}
        <div className="relative z-10 mb-12">
            <div className="text-[6rem] md:text-[8rem] font-mono font-bold leading-none tracking-tighter text-slate-100 tabular-nums">
                {formatTime(timeLeft)}
            </div>
            {/* Progress Bar */}
            <div className="w-64 h-2 bg-slate-800 rounded-full mx-auto mt-4 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${mode === 'focus' ? 'bg-purple-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 flex items-center gap-6">
            <button 
                onClick={() => { setIsActive(false); setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME); }}
                className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5 hover:border-white/20"
            >
                <RotateCcw className="w-6 h-6" />
            </button>

            <button 
                onClick={() => setIsActive(!isActive)}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 ${
                    isActive 
                    ? 'bg-slate-700 text-slate-200 border border-slate-600' 
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-purple-500/25'
                }`}
            >
                {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>

            <button 
                onClick={toggleWhiteNoise}
                className={`p-4 rounded-full transition-all border ${
                    audioEnabled 
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' 
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                }`}
                title="ضوضاء للعزل"
            >
                {audioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
        </div>
      </div>
      
      {mode === 'break' && (
          <div className="mt-8 p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm animate-fade-in">
              💡 نصيحة الراحة: ابتعد عن الشاشات، حرك جسمك، واشرب كوب ماء.
          </div>
      )}
    </div>
  );
};

export default FocusMode;
