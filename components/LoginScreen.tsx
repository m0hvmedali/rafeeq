
import React, { useState } from 'react';
import { GradeLevel, UserProfile } from '../types';
import { ArrowRight, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Animation */}
        <div className="bg-gradient-mesh">
             <div className="bg-orb bg-indigo-900/30 w-96 h-96 top-0 left-0 -translate-x-1/2 -translate-y-1/2"></div>
             <div className="bg-orb bg-gold-900/20 w-80 h-80 bottom-0 right-0 translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="glass-panel w-full max-w-md p-8 rounded-[30px] border border-white/10 relative z-10 shadow-2xl shadow-black/50 animate-fade-in">
            <div className="text-center mb-10">
                <div className="w-24 h-24 bg-gradient-to-br from-gold-500/20 to-gold-900/20 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-gold-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                   {/* Logo Image */}
                   <img src="https://drive.google.com/file/d/12PzJFM5bBWKDkB5OgTkw5qzfC-ZpmHUb/view?usp=sharing" alt="Rafeeq Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
                </div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-200 to-gold-600 mb-2">
                    مرحباً بك في رفيق
                </h1>
                <p className="text-slate-400 font-light">مساحتك الشخصية للنمو والإنجاز</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">الاسم</label>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="أدخل اسمك..."
                        className="glass-input w-full px-5 py-4 rounded-xl text-slate-200 outline-none text-lg placeholder-slate-600"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">المرحلة الدراسية</label>
                    <div className="relative">
                        <select 
                            value={grade}
                            onChange={(e) => setGrade(e.target.value as GradeLevel)}
                            className="glass-input w-full px-5 py-4 rounded-xl text-slate-200 outline-none text-lg appearance-none cursor-pointer"
                        >
                            {GRADE_LEVELS.map(g => (
                                <option key={g} value={g} className="bg-obsidian text-slate-200 py-2">{g}</option>
                            ))}
                        </select>
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <ArrowRight className="w-5 h-5 rotate-90" />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2 mt-4"
                >
                    <Sparkles className="w-5 h-5" />
                    ابدأ رحلتك
                </button>
            </form>
        </div>
    </div>
  );
};

export default LoginScreen;
