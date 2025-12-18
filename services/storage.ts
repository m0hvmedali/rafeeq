
import { supabase } from '../lib/supabase';
import { WeeklySchedule, AnalysisResponse, UserProfile, UserPreferences, UserStats } from '../types';
import { DEFAULT_PREFERENCES, DEFAULT_STATS } from './recommendationEngine';

/**
 * تحويل الاسم إلى معرف آمن تماماً للروابط
 * تم تعديل الترميز ليكون متوافقاً مع Supabase وتجنب خطأ 406
 */
const getUserKey = (username: string) => {
    if (!username) return 'guest_user';
    try {
        const cleanName = username.trim().toLowerCase();
        // استخدام ترميز بسيط يعتمد على الأحرف اللاتينية فقط
        const safeEncoded = btoa(unescape(encodeURIComponent(cleanName)))
            .replace(/[+/=]/g, '') // إزالة الرموز التي قد تسبب مشاكل في الروابط
            .substring(0, 30);
        return `u_${safeEncoded}`;
    } catch (e) {
        return `u_fixed_${username.length}`;
    }
};

export const saveUserProfile = (profile: UserProfile): void => {
    try {
        localStorage.setItem(`rafeeq_user_${profile.name}`, JSON.stringify(profile));
        localStorage.setItem('rafeeq_current_user_name', profile.name);
    } catch (e) {
        console.error("Failed to save user profile locally", e);
    }
};

export const getLastUser = (): UserProfile | null => {
    try {
        const name = localStorage.getItem('rafeeq_current_user_name');
        if (!name) return null;
        const profile = localStorage.getItem(`rafeeq_user_${name}`);
        return profile ? JSON.parse(profile) : null;
    } catch (e) {
        return null;
    }
};

export const logoutUser = () => {
    localStorage.removeItem('rafeeq_current_user_name');
};

export const getUserPreferences = async (username: string): Promise<UserPreferences> => {
    const localKey = `rafeeq_prefs_${username}`;
    const local = localStorage.getItem(localKey);
    if (local) return JSON.parse(local);

    if (supabase) {
        try {
            const { data } = await supabase.from('user_preferences').select('theme, font_size, reduce_motion, interest_profile').eq('user_id', getUserKey(username)).maybeSingle();
            if (data) {
                const prefs = {
                    theme: data.theme,
                    fontSize: data.font_size,
                    reduceMotion: data.reduce_motion,
                    interestProfile: data.interest_profile
                } as UserPreferences;
                localStorage.setItem(localKey, JSON.stringify(prefs));
                return prefs;
            }
        } catch (e) { console.error("Supabase prefs fetch error", e); }
    }
    return DEFAULT_PREFERENCES;
};

export const saveUserPreferences = async (username: string, prefs: UserPreferences): Promise<void> => {
    localStorage.setItem(`rafeeq_prefs_${username}`, JSON.stringify(prefs));
    if (supabase) {
        try {
            await supabase.from('user_preferences').upsert({
                user_id: getUserKey(username),
                theme: prefs.theme,
                font_size: prefs.fontSize,
                reduce_motion: prefs.reduceMotion,
                interest_profile: prefs.interestProfile,
                updated_at: new Date().toISOString()
            });
        } catch (e) { console.error("Supabase prefs save error", e); }
    }
};

export const getUserStats = async (username: string): Promise<UserStats> => {
    const localKey = `rafeeq_stats_${username}`;
    const local = localStorage.getItem(localKey);
    if (local) return JSON.parse(local);

    if (supabase) {
        try {
            const { data } = await supabase.from('user_stats').select('*').eq('user_id', getUserKey(username)).maybeSingle();
            if (data) {
                const stats = {
                    xp: Number(data.xp) || 0,
                    level: Number(data.level) || 1,
                    streak: Number(data.streak) || 0,
                    lastLoginDate: data.last_login_date,
                    totalEntries: Number(data.total_entries) || 0
                };
                localStorage.setItem(localKey, JSON.stringify(stats));
                return stats;
            }
        } catch (e) { console.error("Supabase stats fetch error", e); }
    }
    return DEFAULT_STATS;
};

export const saveUserStats = async (username: string, stats: UserStats): Promise<void> => {
    const safeStats = {
        xp: Number(stats.xp) || 0,
        level: Number(stats.level) || 1,
        streak: Number(stats.streak) || 0,
        lastLoginDate: stats.lastLoginDate,
        totalEntries: Number(stats.totalEntries) || 0
    };
    localStorage.setItem(`rafeeq_stats_${username}`, JSON.stringify(safeStats));
    if (supabase) {
        try {
            await supabase.from('user_stats').upsert({
                user_id: getUserKey(username),
                xp: safeStats.xp,
                level: safeStats.level,
                streak: safeStats.streak,
                last_login_date: safeStats.lastLoginDate,
                total_entries: safeStats.totalEntries,
                updated_at: new Date().toISOString()
            });
        } catch (e) { console.error("Supabase stats save error", e); }
    }
};

export const getSchedule = async (username: string): Promise<WeeklySchedule | null> => {
  try {
      const localKey = `rafeeq_schedule_${username}`;
      const local = localStorage.getItem(localKey);
      if (local && local !== "undefined") return JSON.parse(local);

      if (supabase) {
          const { data } = await supabase.from('schedules').select('data').eq('user_id', getUserKey(username)).maybeSingle();
          if (data && data.data) {
            localStorage.setItem(localKey, JSON.stringify(data.data));
            return data.data as WeeklySchedule;
          }
      }
  } catch (e) {
      console.error("Storage error", e);
  }
  return null;
};

export const saveSchedule = async (username: string, schedule: WeeklySchedule): Promise<void> => {
  const localKey = `rafeeq_schedule_${username}`;
  localStorage.setItem(localKey, JSON.stringify(schedule));
  if (supabase) {
      try {
          await supabase.from('schedules').upsert({ 
              user_id: getUserKey(username), 
              data: schedule,
              updated_at: new Date().toISOString()
          });
      } catch (e) { console.error("Supabase schedule save error", e); }
  }
};

export interface DailyEntry {
  reflection: string;
  analysis: AnalysisResponse | null;
}

export const getDailyEntry = async (username: string, dateKey: string = new Date().toISOString().split('T')[0]): Promise<DailyEntry | null> => {
  const localRefKey = `rafeeq_reflection_${username}`;
  const localAnaKey = `rafeeq_analysis_${username}`;
  
  const reflection = localStorage.getItem(localRefKey) || '';
  const analysisRaw = localStorage.getItem(localAnaKey);
  let analysis = null;
  try {
      analysis = analysisRaw ? JSON.parse(analysisRaw) : null;
  } catch(e) {}

  if (supabase) {
    try {
        const { data } = await supabase.from('daily_entries').select('reflection, analysis').eq('user_id', getUserKey(username)).eq('date', dateKey).maybeSingle();
        if (data) {
            localStorage.setItem(localRefKey, data.reflection || '');
            if (data.analysis) localStorage.setItem(localAnaKey, JSON.stringify(data.analysis));
            return { reflection: data.reflection || '', analysis: data.analysis };
        }
    } catch(e) {}
  }
  return { reflection, analysis };
};

export const saveDailyEntry = async (username: string, reflection: string, analysis: AnalysisResponse | null): Promise<void> => {
  localStorage.setItem(`rafeeq_reflection_${username}`, reflection);
  if (analysis) localStorage.setItem(`rafeeq_analysis_${username}`, JSON.stringify(analysis));

  if (supabase) {
    try {
        await supabase.from('daily_entries').upsert({
            user_id: getUserKey(username),
            date: new Date().toISOString().split('T')[0],
            reflection: reflection,
            analysis: analysis
        });
    } catch (e) { console.error("Supabase daily entry save error", e); }
  }
};
