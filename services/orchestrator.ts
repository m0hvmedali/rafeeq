
import { AnalysisResponse, GradeLevel, WeeklySchedule, MotivationalMessage, UserPreferences, UserStats } from "../types";
import { analyzeDayAndPlan as callGeminiPrimary } from "./geminiService";
import { saveGeneratedContent, findBestMatch } from "./resilientDB";
import { INITIAL_KNOWLEDGE_BASE } from "../lib/knowledgeBase";
import { generateUserContextString } from "./recommendationEngine";
import * as memoryStore from "./memoryStore";

/**
 * THE ORCHESTRATOR
 * Executes: AI -> Memory Search -> Static Fallback
 */
export const smartAnalyzeDay = async (
    dailyReflection: string,
    weeklySchedule: WeeklySchedule,
    nextDayName: string,
    gradeLevel: GradeLevel,
    prefs: UserPreferences,
    stats: UserStats
): Promise<AnalysisResponse> => {
    
    // Context String
    const contextString = generateUserContextString(prefs.interestProfile, stats);
    const username = localStorage.getItem('rafeeq_current_user_name') || 'guest';

    // 1. ATTEMPT PRIMARY AI
    try {
        const result = await callGeminiPrimary(dailyReflection, weeklySchedule, nextDayName, gradeLevel, contextString);
        
        // Success: Mark source
        result.source = 'ai';

        // SAVE to ResilientDB (The Knowledge Base)
        await saveGeneratedContent(username, dailyReflection, result, ['daily_analysis']);
        
        return result;

    } catch (e) {
        console.warn("Primary AI Failed. Searching Resilient Memory...");
    }

    // 2. SEARCH RESILIENT MEMORY (Personalized Fallback)
    // Try to find a previous day where the user felt similar or had similar keywords
    const memoryHit = findBestMatch(dailyReflection);
    if (memoryHit) {
        console.log("Found relevant memory fallback.");
        return memoryHit;
    }

    // 3. STATIC FALLBACK (Ultimate Safety Net)
    console.warn("No memory match. Using Static Fallback.");
    const staticRes = INITIAL_KNOWLEDGE_BASE[0].response as AnalysisResponse;
    return { ...staticRes, source: 'static' };
};
