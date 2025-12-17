
import { supabase } from '../lib/supabase';
import { WeeklySchedule, AnalysisResponse, UserProfile } from '../types';

// Helper to create a user-specific key
const getUserKey = (username: string) => `user_${username.trim().toLowerCase()}`;

// --- USER PROFILE OPERATIONS ---
export const saveUserProfile = (profile: UserProfile): void => {
    localStorage.setItem(`rafeeq_user_${profile.name}`, JSON.stringify(profile));
    localStorage.setItem('rafeeq_current_user_name', profile.name);
};

export const getLastUser = (): UserProfile | null => {
    const name = localStorage.getItem('rafeeq_current_user_name');
    if (!name) return null;
    const profile = localStorage.getItem(`rafeeq_user_${name}`);
    return profile ? JSON.parse(profile) : null;
};

export const logoutUser = () => {
    localStorage.removeItem('rafeeq_current_user_name');
};

// --- SCHEDULE OPERATIONS ---

export const getSchedule = async (username: string): Promise<WeeklySchedule | null> => {
  // استراتيجية "المحلي أولاً" (Local-First Strategy)
  // نبحث في جهاز المستخدم أولاً. إذا وجدنا بيانات، نعتمدها فوراً لأنها الأحدث والأصح.
  // هذا يمنع مشكلة "عودة الجدول الافتراضي" الناتجة عن تأخر السحابة أو وجود بيانات قديمة بها.
  
  const local = localStorage.getItem(`rafeeq_schedule_${username}`);
  
  if (local) {
      console.log("Storage: Loaded schedule from LocalStorage (Primary)");
      return JSON.parse(local);
  }

  // إذا لم نجد بيانات محلياً (جهاز جديد مثلاً)، نحاول جلبها من السحابة
  const userKey = getUserKey(username);
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('data')
        .eq('user_id', userKey)
        .single();
      
      if (data) {
        // وجدنا بيانات في السحابة، نحفظها محلياً فوراً للمستقبل
        console.log("Storage: Loaded schedule from Cloud (Fallback)");
        localStorage.setItem(`rafeeq_schedule_${username}`, JSON.stringify(data.data));
        return data.data as WeeklySchedule;
      }
    } catch (e) {
      console.warn('Supabase fetch failed or no data found.', e);
    }
  }

  return null;
};

export const saveSchedule = async (username: string, schedule: WeeklySchedule): Promise<void> => {
  const userKey = getUserKey(username);
  
  // 1. الحفظ المحلي (فوري ومضمون)
  // هذا يضمن أن المستخدم يرى ما كتبه حتى لو انقطع الإنترنت
  localStorage.setItem(`rafeeq_schedule_${username}`, JSON.stringify(schedule));

  // 2. الحفظ السحابي (استبدال كامل)
  // نقوم بمسح النسخة القديمة في السحابة واستبدالها بالنسخة الجديدة (Upsert)
  if (supabase) {
    try {
      await supabase
        .from('schedules')
        .upsert({ 
          user_id: userKey, 
          data: schedule,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }); // onConflict يضمن استبدال الصف القديم بالجديد
        
      console.log("Storage: Synced schedule to Cloud (Overwrite)");
    } catch (e) {
      console.error('Failed to sync schedule to Supabase', e);
    }
  }
};

// --- DAILY ENTRY OPERATIONS ---

export interface DailyEntry {
  reflection: string;
  analysis: AnalysisResponse | null;
}

export const getDailyEntry = async (username: string, dateKey: string = new Date().toISOString().split('T')[0]): Promise<DailyEntry | null> => {
  const userKey = getUserKey(username);
  
  // نفس الاستراتيجية: المحلي هو الأساس
  const reflection = localStorage.getItem(`rafeeq_reflection_${username}`) || '';
  const analysisRaw = localStorage.getItem(`rafeeq_analysis_${username}`);
  
  if (reflection || analysisRaw) {
      return {
          reflection: reflection,
          analysis: analysisRaw ? JSON.parse(analysisRaw) : null
      };
  }

  // محاولة السحابة كبديل فقط
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('reflection, analysis')
        .eq('user_id', userKey)
        .eq('date', dateKey)
        .single();
      
      if (data) {
        localStorage.setItem(`rafeeq_reflection_${username}`, data.reflection || '');
        if (data.analysis) {
             localStorage.setItem(`rafeeq_analysis_${username}`, JSON.stringify(data.analysis));
        }
        return {
            reflection: data.reflection || '',
            analysis: data.analysis
        };
      }
    } catch (e) {
      console.warn('Supabase entry fetch failed', e);
    }
  }

  return { reflection: '', analysis: null };
};

export const saveDailyEntry = async (username: string, reflection: string, analysis: AnalysisResponse | null): Promise<void> => {
  const userKey = getUserKey(username);
  const dateKey = new Date().toISOString().split('T')[0];
  
  // 1. حفظ محلي
  localStorage.setItem(`rafeeq_reflection_${username}`, reflection);
  if (analysis) {
    localStorage.setItem(`rafeeq_analysis_${username}`, JSON.stringify(analysis));
  } else {
    localStorage.removeItem(`rafeeq_analysis_${username}`);
  }

  // 2. حفظ سحابي (استبدال)
  if (supabase) {
    try {
      await supabase
        .from('daily_entries')
        .upsert({
          user_id: userKey,
          date: dateKey,
          reflection: reflection,
          analysis: analysis
        }, { onConflict: 'user_id, date' });
    } catch (e) {
      console.error('Failed to sync entry to Supabase', e);
    }
  }
};
