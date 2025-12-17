
import { supabase } from '../lib/supabase';
import { WeeklySchedule, AnalysisResponse, UserProfile, UserPreferences, UserStats } from '../types';
import { DEFAULT_PREFERENCES, DEFAULT_STATS } from './recommendationEngine';

// Helper to create a user-specific key
const getUserKey = (username: string) => `user_${username.trim().toLowerCase()}`;

// --- USER PROFILE OPERATIONS ---
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
        console.error("Failed to retrieve last user", e);
        return null;
    }
};

export const logoutUser = () => {
    localStorage.removeItem('rafeeq_current_user_name');
};

// --- PREFERENCES & STATS OPERATIONS (NEW) ---

export const getUserPreferences = async (username: string): Promise<UserPreferences> => {
    const localKey = `rafeeq_prefs_${username}`;
    const local = localStorage.getItem(localKey);
    
    if (local) return JSON.parse(local);

    if (supabase) {
        const { data } = await supabase.from('user_preferences').select('theme, font_size, reduce_motion, interest_profile').eq('user_id', getUserKey(username)).single();
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
    }
    return DEFAULT_PREFERENCES;
};

export const saveUserPreferences = async (username: string, prefs: UserPreferences): Promise<void> => {
    localStorage.setItem(`rafeeq_prefs_${username}`, JSON.stringify(prefs));
    if (supabase) {
        await supabase.from('user_preferences').upsert({
            user_id: getUserKey(username),
            theme: prefs.theme,
            font_size: prefs.fontSize,
            reduce_motion: prefs.reduceMotion,
            interest_profile: prefs.interestProfile,
            updated_at: new Date().toISOString()
        });
    }
};

export const getUserStats = async (username: string): Promise<UserStats> => {
    const localKey = `rafeeq_stats_${username}`;
    const local = localStorage.getItem(localKey);
    
    if (local) return JSON.parse(local);

    if (supabase) {
        const { data } = await supabase.from('user_stats').select('*').eq('user_id', getUserKey(username)).single();
        if (data) {
            const stats = {
                xp: data.xp,
                level: data.level,
                streak: data.streak,
                lastLoginDate: data.last_login_date,
                totalEntries: data.total_entries
            };
            localStorage.setItem(localKey, JSON.stringify(stats));
            return stats;
        }
    }
    return DEFAULT_STATS;
};

export const saveUserStats = async (username: string, stats: UserStats): Promise<void> => {
    localStorage.setItem(`rafeeq_stats_${username}`, JSON.stringify(stats));
    if (supabase) {
        await supabase.from('user_stats').upsert({
            user_id: getUserKey(username),
            xp: stats.xp,
            level: stats.level,
            streak: stats.streak,
            last_login_date: stats.lastLoginDate,
            total_entries: stats.totalEntries,
            updated_at: new Date().toISOString()
        });
    }
};

// --- SCHEDULE OPERATIONS ---

export const getSchedule = async (username: string): Promise<WeeklySchedule | null> => {
  try {
      const localKey = `rafeeq_schedule_${username}`;
      const local = localStorage.getItem(localKey);
      
      if (local && local !== "undefined" && local !== "null") {
          try {
              return JSON.parse(local);
          } catch (parseError) {
              localStorage.removeItem(localKey);
          }
      }

      const userKey = getUserKey(username);
      if (supabase) {
        try {
          const { data } = await supabase.from('schedules').select('data').eq('user_id', userKey).single();
          if (data && data.data) {
            localStorage.setItem(localKey, JSON.stringify(data.data));
            return data.data as WeeklySchedule;
          }
        } catch (cloudError) {
          console.warn('Supabase fetch failed or no data found.', cloudError);
        }
      }
  } catch (e) {
      console.error("Storage: Critical error in getSchedule", e);
  }
  return null;
};

export const saveSchedule = async (username: string, schedule: WeeklySchedule): Promise<void> => {
  const userKey = getUserKey(username);
  const localKey = `rafeeq_schedule_${username}`;
  
  try {
      localStorage.setItem(localKey, JSON.stringify(schedule));
  } catch (e) {
      console.error("Storage: Failed to save to LocalStorage!", e);
  }

  if (supabase) {
    try {
      await supabase.from('schedules').upsert({ 
          user_id: userKey, 
          data: schedule,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
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
  const localRefKey = `rafeeq_reflection_${username}`;
  const localAnaKey = `rafeeq_analysis_${username}`;
  
  try {
      const reflection = localStorage.getItem(localRefKey) || '';
      const analysisRaw = localStorage.getItem(localAnaKey);
      
      let analysis: AnalysisResponse | null = null;
      if (analysisRaw) analysis = JSON.parse(analysisRaw);

      if (reflection || analysis) {
          return { reflection, analysis };
      }

      if (supabase) {
        const { data } = await supabase.from('daily_entries').select('reflection, analysis').eq('user_id', userKey).eq('date', dateKey).single();
        if (data) {
            localStorage.setItem(localRefKey, data.reflection || '');
            if (data.analysis) localStorage.setItem(localAnaKey, JSON.stringify(data.analysis));
            return { reflection: data.reflection || '', analysis: data.analysis };
        }
      }
  } catch (e) {
      console.error("Storage: Error getting daily entry", e);
  }

  return { reflection: '', analysis: null };
};

export const saveDailyEntry = async (username: string, reflection: string, analysis: AnalysisResponse | null): Promise<void> => {
  const userKey = getUserKey(username);
  const dateKey = new Date().toISOString().split('T')[0];
  
  try {
      localStorage.setItem(`rafeeq_reflection_${username}`, reflection);
      if (analysis) {
        localStorage.setItem(`rafeeq_analysis_${username}`, JSON.stringify(analysis));
      } else {
        localStorage.removeItem(`rafeeq_analysis_${username}`);
      }

      if (supabase) {
        await supabase.from('daily_entries').upsert({
            user_id: userKey,
            date: dateKey,
            reflection: reflection,
            analysis: analysis
        }, { onConflict: 'user_id, date' });
      }
  } catch (e) {
      console.error("Storage: Error saving daily entry", e);
  }
};
