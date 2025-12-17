
import { InterestProfile, UserStats, UserPreferences, AnalysisResponse } from "../types";

export const DEFAULT_INTEREST_PROFILE: InterestProfile = {
    religious: 1.0,
    scientific: 1.0,
    philosophical: 0.5,
    practical: 1.0,
    emotional: 1.0,
    preferredTone: 'gentle'
};

export const DEFAULT_STATS: UserStats = {
    xp: 0,
    level: 1,
    streak: 0,
    lastLoginDate: new Date().toISOString().split('T')[0],
    totalEntries: 0
};

export const DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'dark',
    fontSize: 'normal',
    reduceMotion: false,
    interestProfile: DEFAULT_INTEREST_PROFILE
};

// --- GAMIFICATION RULES ---
export const XP_REWARDS = {
    DAILY_ENTRY: 10,        // إدخال اليوميات
    VOICE_RECAP: 20,        // تسجيل صوتي/شرح
    ANALYSIS_GENERATION: 10,// طلب تحليل
    FEEDBACK: 5,            // زر مفيد/غير مفيد
    FOCUS_SESSION: 15,      // إتمام جلسة تركيز
    SHARE_PLAN: 5,          // مشاركة الخطة (مستقبلاً)
    SCHEDULE_TASK: 15,      // إتمام مهمة جدول
    WEEKLY_STREAK_BONUS: 100 // إتمام أسبوع كامل
};

export const calculateLevel = (xp: number): number => {
    // Level = sqrt(XP / 100) -> Level 2 needs 400 XP, Level 3 needs 900 XP
    return Math.max(1, Math.floor(Math.sqrt(xp / 100)));
};

export const updateStatsOnEntry = (
    currentStats: UserStats, 
    actionType: keyof typeof XP_REWARDS = 'DAILY_ENTRY'
): { stats: UserStats, leveledUp: boolean, xpGained: number } => {
    
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = currentStats.lastLoginDate !== today;
    
    let newStreak = currentStats.streak;
    let bonusXP = 0;

    // Handle Streak Logic only on primary daily actions
    if (isNewDay && (actionType === 'DAILY_ENTRY' || actionType === 'ANALYSIS_GENERATION')) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (currentStats.lastLoginDate === yesterdayStr) {
            newStreak += 1;
            // Weekly Bonus
            if (newStreak % 7 === 0) {
                bonusXP += XP_REWARDS.WEEKLY_STREAK_BONUS;
            }
        } else {
            newStreak = 1; // Reset streak
        }
    } else if (!isNewDay && actionType === 'DAILY_ENTRY') {
        // If same day entry, keep streak but don't increment
        newStreak = currentStats.streak; 
    }

    // Calculate Base XP
    const baseXP = XP_REWARDS[actionType] || 0;
    const totalXPGain = baseXP + bonusXP;
    
    const newXP = currentStats.xp + totalXPGain;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > currentStats.level;

    return {
        stats: {
            xp: newXP,
            level: newLevel,
            streak: newStreak,
            lastLoginDate: today,
            totalEntries: actionType === 'DAILY_ENTRY' ? currentStats.totalEntries + 1 : currentStats.totalEntries
        },
        leveledUp,
        xpGained: totalXPGain
    };
};

// --- FEEDBACK LOOP & ALGORITHM LOGIC ---

export const updateInterestProfile = (
    currentProfile: InterestProfile, 
    contentType: 'religious' | 'scientific' | 'philosophical' | 'wisdom', 
    feedback: 'like' | 'dislike'
): InterestProfile => {
    const newProfile = { ...currentProfile };
    const weightChange = feedback === 'like' ? 0.5 : -0.3;

    // Map content type to profile keys
    if (contentType === 'religious') newProfile.religious = Math.max(0.1, newProfile.religious + weightChange);
    if (contentType === 'scientific') newProfile.scientific = Math.max(0.1, newProfile.scientific + weightChange);
    if (contentType === 'philosophical' || contentType === 'wisdom') newProfile.philosophical = Math.max(0.1, newProfile.philosophical + weightChange);

    return newProfile;
};

// --- CONTEXT GENERATOR ---
export const generateUserContextString = (profile: InterestProfile, stats: UserStats): string => {
    const interests = [
        { name: 'religious', val: profile.religious },
        { name: 'scientific', val: profile.scientific },
        { name: 'philosophical', val: profile.philosophical },
        { name: 'practical', val: profile.practical }
    ].sort((a, b) => b.val - a.val);

    const topInterest = interests[0].name;
    const tone = profile.preferredTone;

    return `
    User Profile Context:
    - Top Interest: ${topInterest} (Focus heavily on this).
    - Preferred Tone: ${tone}.
    - Current Level: ${stats.level} (Treat as ${stats.level > 5 ? 'advanced/committed' : 'beginner'}).
    - Streak: ${stats.streak} days.
    
    Weights for Content Generation:
    - Religious: ${profile.religious.toFixed(1)}
    - Scientific: ${profile.scientific.toFixed(1)}
    - Practical: ${profile.practical.toFixed(1)}
    `;
};
