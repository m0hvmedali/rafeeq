import React, { useState } from 'react';
import { DAYS_OF_WEEK, WeeklySchedule } from '../types';
import { Plus, X, Calendar, Info, Clock } from 'lucide-react';

interface ScheduleManagerProps {
  schedule: WeeklySchedule;
  setSchedule: (schedule: WeeklySchedule) => void;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ schedule, setSchedule }) => {
  const [selectedDay, setSelectedDay] = useState<string>(DAYS_OF_WEEK[0]);
  const [newSubject, setNewSubject] = useState('');
  const [showTips, setShowTips] = useState(false);

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    const currentSubjects = schedule[selectedDay] || [];
    setSchedule({
      ...schedule,
      [selectedDay]: [...currentSubjects, newSubject.trim()]
    });
    setNewSubject('');
  };

  const handleRemoveSubject = (index: number) => {
    const currentSubjects = schedule[selectedDay] || [];
    const updatedSubjects = currentSubjects.filter((_, i) => i !== index);
    setSchedule({
      ...schedule,
      [selectedDay]: updatedSubjects
    });
  };

  return (
    <div className="glass-panel rounded-[30px] p-6 md:p-8 shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 text-gold-400">
          <div className="p-2 bg-gold-500/10 rounded-xl">
             <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-wide text-slate-200">الجدول الأسبوعي</h2>
        </div>
        <button 
          onClick={() => setShowTips(!showTips)}
          className="text-slate-500 hover:text-gold-400 transition-colors"
          title="نصائح الجدول الذكي"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
      
      {showTips && (
        <div className="mb-8 bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-5 text-sm leading-relaxed text-slate-300 animate-fade-in">
          <strong className="text-indigo-400 block mb-2 font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" /> علم جدولة الوقت:
          </strong>
          <ul className="list-disc list-inside space-y-2 opacity-80">
            <li>الجودة أهم من الكم: ساعات طويلة لا تعني درجات أعلى.</li>
            <li>اترك وقتاً للنوم (8-10 ساعات) فهو أولوية قصوى.</li>
            <li>وزع المواد الصعبة (فيزياء، رياضيات) في أوقات نشاطك الذهني.</li>
          </ul>
        </div>
      )}

      {/* Day Selector */}
      <div className="flex overflow-x-auto pb-6 gap-3 no-scrollbar mb-2 mask-fade-right">
        {DAYS_OF_WEEK.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
              selectedDay === day
                ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-black shadow-lg shadow-gold-500/20 transform scale-105'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-transparent'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Editor Area */}
      <div className="bg-void/50 rounded-[24px] p-6 border border-white/5 backdrop-blur-sm min-h-[200px]">
        <h3 className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-2 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-gold-500"></span>
          مهام {selectedDay}
        </h3>
        
        <div className="flex gap-3 mb-6 relative">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
            placeholder="أضف مادة أو نشاط..."
            className="glass-input flex-1 px-5 py-3.5 rounded-xl outline-none text-slate-200 placeholder-slate-600 transition-all"
          />
          <button
            onClick={handleAddSubject}
            className="bg-gold-600 hover:bg-gold-500 text-black p-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-gold-900/20"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {(!schedule[selectedDay] || schedule[selectedDay].length === 0) && (
            <div className="w-full flex flex-col items-center justify-center py-10 text-slate-600 border-2 border-dashed border-white/5 rounded-2xl">
              <span className="text-sm">يوم فارغ.. هل هو يوم راحة؟</span>
            </div>
          )}
          
          {schedule[selectedDay]?.map((subject, index) => (
            <div
              key={index}
              className="group animate-fade-in inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2.5 rounded-xl text-slate-300 transition-all hover:border-gold-500/30"
            >
              <span className="font-medium">{subject}</span>
              <button
                onClick={() => handleRemoveSubject(index)}
                className="text-slate-600 hover:text-red-400 transition-colors opacity-60 group-hover:opacity-100 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;