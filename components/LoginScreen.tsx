
import React, { useState } from 'react';
import { GradeLevel, UserProfile } from '../types';
import { ArrowRight, Sparkles, User, BookOpen } from 'lucide-react';
import { Logo } from './Logo';

interface LoginScreenProps {
  onLogin: (profile: UserProfile) => void;
}

const GRADE_LEVELS: GradeLevel[] = [
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي'
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(GRADE_LEVELS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin({ name: name.trim(), grade });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 relative z-10">
        <div className="glass-panel w-full max-w-[440px] p-8 md:p-10 rounded-[2.5rem] animate-fade-in">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-gold-500/10 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-gold-500/20 shadow-xl">
                   <Logo className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">
                    مرحباً بك في <span className="text-gold-400">رفيق</span>
                </h1>
                <p className="text-slate-500 text-sm font-medium">مساعدك الذكي للتفوق الأكاديمي والراحة النفسية</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                        <User className="w-3 h-3 text-gold-500" /> الاسم الكامل
                    </label>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="كيف تود أن نناديك؟"
                        className="glass-input w-full text-base"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                        <BookOpen className="w-3 h-3 text-gold-500" /> السنة الدراسية
                    </label>
                    <div className="relative">
                        <select 
                            value={grade}
                            onChange={(e) => setGrade(e.target.value as GradeLevel)}
                            className="glass-input w-full text-base appearance-none cursor-pointer pr-12"
                        >
                            {GRADE_LEVELS.map(g => (
                                <option key={g} value={g} className="bg-void text-slate-200">{g}</option>
                            ))}
                        </select>
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-gold-500">
                            <ArrowRight className="w-4 h-4 rotate-90" />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    className="btn-gold w-full flex items-center justify-center gap-3 text-base mt-4"
                >
                    <Sparkles className="w-5 h-5" />
                    ابدأ الآن
                </button>
            </form>
            
            <div className="mt-10 pt-6 border-t border-white/5 text-center">
                <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em] font-bold">
                    الذكاء الاصطناعي في خدمة طموحك
                </p>
            </div>
        </div>
    </div>
  );
};

export default LoginScreen;
