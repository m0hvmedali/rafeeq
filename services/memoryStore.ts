
import { supabase } from '../lib/supabase';
import { InteractionEntry, MemoryFile, UserStats, InterestProfile } from '../types';
import { updateStatsOnEntry, calculateLevel, XP_REWARDS } from './recommendationEngine';

const MEMORY_KEY = 'rafeeq_memory_json_v1';

// Initialize the structure of our "memory.json"
const INITIAL_MEMORY: MemoryFile = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    interactions: [],
    learnedPatterns: {
        favoriteTopics: [],
        recurringIssues: []
    }
};

/**
 * Loads the Memory JSON file from storage
 */
export const loadMemoryFile = (): MemoryFile => {
    try {
        const stored = localStorage.getItem(MEMORY_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to load memory file", e);
    }
    return INITIAL_MEMORY;
};

/**
 * Saves the Memory JSON file
 */
const saveMemoryFile = async (username: string, memory: MemoryFile) => {
    // 1. Local Save
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));

    // 2. Cloud Save (Debounced conceptually, but direct here for simplicity)
    if (supabase) {
        /* 
        await supabase.from('user_memory_files').upsert({ 
            user_id: username, 
            file_content: memory 
        }); 
        */
    }
};

/**
 * CORE AGENT FUNCTION:
 * Records an interaction, awards XP, and updates the Recommendation Engine.
 */
export const recordInteraction = async (
    username: string,
    type: 'analysis' | 'quote' | 'voice_recap' | 'focus_session' | 'schedule_task',
    contentSummary: string,
    tags: string[],
    feedback: 'like' | 'dislike' | null,
    currentStats: UserStats,
    currentProfile: InterestProfile
): Promise<{ newStats: UserStats, newProfile: InterestProfile, xpGained: number }> => {
    
    const memory = loadMemoryFile();
    
    // 1. Calculate XP Gained based on Action Type
    let xpGained = 0;
    if (type === 'analysis') xpGained = XP_REWARDS.DAILY_ENTRY; // Assuming daily entry + analysis trigger
    if (type === 'voice_recap') xpGained = XP_REWARDS.VOICE_RECAP;
    if (type === 'focus_session') xpGained = XP_REWARDS.FOCUS_SESSION;
    if (type === 'schedule_task') xpGained = XP_REWARDS.SCHEDULE_TASK;
    if (feedback !== null) xpGained = XP_REWARDS.FEEDBACK;

    // 2. Create Entry
    const newEntry: InteractionEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: type === 'focus_session' ? 'analysis' : type, // Fallback type mapping for safety
        contentSummary,
        tags,
        userFeedback: feedback,
        xpGained
    };

    // 3. Update Memory File
    memory.interactions.unshift(newEntry); 
    if (memory.interactions.length > 1000) memory.interactions = memory.interactions.slice(0, 1000);
    
    // 4. Update Learned Patterns
    if (feedback === 'like') {
        memory.learnedPatterns.favoriteTopics.push(...tags);
        memory.learnedPatterns.favoriteTopics = [...new Set(memory.learnedPatterns.favoriteTopics)].slice(-20);
    }

    memory.lastUpdated = new Date().toISOString();
    await saveMemoryFile(username, memory);

    // 5. Update User Stats (Gamification)
    let newStats = { ...currentStats };
    newStats.xp += xpGained;
    if (type === 'analysis') newStats.totalEntries += 1;
    newStats.level = calculateLevel(newStats.xp);
    
    // 6. Update Interest Profile
    const newProfile = { ...currentProfile };
    if (feedback) {
        const weightChange = feedback === 'like' ? 0.2 : -0.2;
        tags.forEach(tag => {
            if (tag === 'religious' || tag === 'quran') newProfile.religious = Math.min(10, Math.max(0, newProfile.religious + weightChange));
            if (tag === 'scientific' || tag === 'psych') newProfile.scientific = Math.min(10, Math.max(0, newProfile.scientific + weightChange));
            if (tag === 'philosophical') newProfile.philosophical = Math.min(10, Math.max(0, newProfile.philosophical + weightChange));
        });
    }

    return { newStats, newProfile, xpGained };
};

export const getInteractions = () => {
    return loadMemoryFile().interactions;
};
