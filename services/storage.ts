import { supabase } from '../lib/supabase';
import { WeeklySchedule, AnalysisResponse } from '../types';

// Helper to generate a consistent ID for this device if no Auth is present
const getDeviceId = () => {
  let id = localStorage.getItem('rafeeq_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('rafeeq_device_id', id);
  }
  return id;
};

const USER_ID = getDeviceId();

// --- SCHEDULE OPERATIONS ---

export const getSchedule = async (): Promise<WeeklySchedule | null> => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('schedules')
        .select('data')
        .eq('user_id', USER_ID)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.warn('Supabase fetch error:', error);
        return null; // Fallback to local
      }
      
      if (data) return data.data as WeeklySchedule;
    }
  } catch (e) {
    console.warn('Supabase connection failed, using local storage.');
  }

  // Fallback to LocalStorage
  const local = localStorage.getItem('rafeeq_schedule');
  return local ? JSON.parse(local) : null;
};

export const saveSchedule = async (schedule: WeeklySchedule): Promise<void> => {
  // Always save to local as backup/cache
  localStorage.setItem('rafeeq_schedule', JSON.stringify(schedule));

  if (supabase) {
    try {
      await supabase
        .from('schedules')
        .upsert({ 
          user_id: USER_ID, 
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

export const getDailyEntry = async (dateKey: string = new Date().toISOString().split('T')[0]): Promise<DailyEntry | null> => {
  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('reflection, analysis')
        .eq('user_id', USER_ID)
        .eq('date', dateKey)
        .single();
      
      if (data) {
        return {
            reflection: data.reflection || '',
            analysis: data.analysis
        };
      }
    } catch (e) {
      console.warn('Supabase entry fetch failed');
    }
  }

  // Fallback to LocalStorage
  // We check if the locally stored analysis matches today's date context?
  // Since the original app used simple keys, we'll try to migrate or just read them.
  // For robustness, let's read the specific keys the app uses:
  const reflection = localStorage.getItem('rafeeq_reflection') || '';
  const analysisRaw = localStorage.getItem('rafeeq_analysis');
  const analysis = analysisRaw ? JSON.parse(analysisRaw) : null;
  
  return { reflection, analysis };
};

export const saveDailyEntry = async (reflection: string, analysis: AnalysisResponse | null): Promise<void> => {
  const dateKey = new Date().toISOString().split('T')[0];
  
  // Local Save
  localStorage.setItem('rafeeq_reflection', reflection);
  if (analysis) {
    localStorage.setItem('rafeeq_analysis', JSON.stringify(analysis));
  } else {
    localStorage.removeItem('rafeeq_analysis');
  }

  // Supabase Save
  if (supabase) {
    try {
      await supabase
        .from('daily_entries')
        .upsert({
          user_id: USER_ID,
          date: dateKey,
          reflection: reflection,
          analysis: analysis
        }, { onConflict: 'user_id, date' });
    } catch (e) {
      console.error('Failed to sync entry to Supabase', e);
    }
  }
};

export const clearDailyEntry = async (): Promise<void> => {
    const dateKey = new Date().toISOString().split('T')[0];
    
    localStorage.removeItem('rafeeq_reflection');
    localStorage.removeItem('rafeeq_analysis');

    if (supabase) {
        // We might not delete the row, just clear the content, or delete it.
        // Let's delete for cleanliness
        await supabase
            .from('daily_entries')
            .delete()
            .eq('user_id', USER_ID)
            .eq('date', dateKey);
    }
}
