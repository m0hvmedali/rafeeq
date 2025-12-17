
import { AnalysisResponse, GradeLevel, WeeklySchedule, UserPreferences, UserStats } from "../types";
import { analyzeDayAndPlan as callGeminiPrimary } from "./geminiService";
import { callGeminiBackup, callOpenRouter, callGoogleSearch, callSerply } from "./fallbackProviders";
import { saveGeneratedContent, findBestMatch } from "./resilientDB";
import { INITIAL_KNOWLEDGE_BASE } from "../lib/knowledgeBase";
import { generateUserContextString } from "./recommendationEngine";

/**
 * THE ORCHESTRATOR - DECISION LAYER
 * Follows the strict algorithm:
 * Cache ? -> Yes -> Return
 * No -> AI Primary -> Fail -> AI Secondary -> Fail -> OpenRouter -> Fail -> Search -> Fail -> Serply -> Fail -> Memory Fallback -> Fail -> Static
 */
export const smartAnalyzeDay = async (
    dailyReflection: string,
    weeklySchedule: WeeklySchedule,
    nextDayName: string,
    gradeLevel: GradeLevel,
    prefs: UserPreferences,
    stats: UserStats
): Promise<AnalysisResponse> => {
    
    const contextString = generateUserContextString(prefs.interestProfile, stats);
    const username = localStorage.getItem('rafeeq_current_user_name') || 'guest';
    const query = dailyReflection.trim();

    // --- STEP 1: CACHE LAYER (Strict Match) ---
    // Threshold 0.6 means high similarity required to trust the cache immediately
    const cachedResult = findBestMatch(query, 0.6);
    if (cachedResult) {
        return cachedResult;
    }

    let result: AnalysisResponse | null = null;
    
    // Construct the prompt for AIs
    const prompt = `
    بيانات الطالب: ${gradeLevel}. اليوم: ${dailyReflection}. الجدول: ${JSON.stringify(weeklySchedule)}. السياق: ${contextString}.
    المطلوب: تحليل نفسي ودراسي، خطة للغد، واقتباس.
    Output: Valid JSON only as per Rafeeq Schema.
    `;

    // --- STEP 2: AI PRIMARY (Gemini Main) ---
    if (!result) {
        try {
            console.log("Orchestrator: Calling Primary AI...");
            result = await callGeminiPrimary(dailyReflection, weeklySchedule, nextDayName, gradeLevel, contextString);
            result.source = 'ai';
        } catch (e) { console.warn("Primary AI Failed"); }
    }

    // --- STEP 3: AI SECONDARY (Gemini Backup) ---
    if (!result) {
        try {
            console.log("Orchestrator: Calling Backup AI...");
            result = await callGeminiBackup(prompt);
            // source is set inside the provider
        } catch (e) { console.warn("Backup AI Failed"); }
    }

    // --- STEP 4: AI TERTIARY (OpenRouter / Xiaomi) ---
    if (!result) {
        try {
            console.log("Orchestrator: Calling OpenRouter...");
            result = await callOpenRouter(prompt);
            // source is set inside the provider
        } catch (e) { console.warn("OpenRouter Failed"); }
    }

    // --- STEP 5: SEARCH PRIMARY (Google Search + Rule Engine) ---
    if (!result) {
        try {
            console.log("Orchestrator: Calling Google Search...");
            result = await callGoogleSearch(dailyReflection);
            // source is set inside the provider
        } catch (e) { console.warn("Google Search Failed"); }
    }

    // --- STEP 6: SEARCH SECONDARY (Serply + Rule Engine) ---
    if (!result) {
        try {
            console.log("Orchestrator: Calling Serply...");
            result = await callSerply(dailyReflection);
            // source is set inside the provider
        } catch (e) { console.warn("Serply Failed"); }
    }

    // --- STEP 7: MEMORY AS FINAL FALLBACK (Relaxed Match) ---
    // If all live services fail, we check memory again with a much lower threshold (e.g., 0.25)
    // This allows finding "somewhat related" past advice instead of generic static text.
    if (!result) {
        console.log("Orchestrator: All Live Services Failed. Checking Memory for loosely related fallback...");
        const memoryFallback = findBestMatch(query, 0.25);
        if (memoryFallback) {
            result = memoryFallback;
            result.source = 'memory'; // Should ideally indicate 'memory-fallback'
        }
    }

    // --- STEP 8: STATIC FALLBACK (Ultimate Safety Net) ---
    if (!result) {
        console.error("Orchestrator: TOTAL SYSTEM FAILURE. Engaging Static Protocol.");
        result = { 
            ...(INITIAL_KNOWLEDGE_BASE[0].response as AnalysisResponse), 
            source: 'static' 
        };
    }

    // --- SELF-LEARNING: SAVE SUCCESSFUL RESULT ---
    // Only save if it's not static and not from cache/memory
    if (result.source !== 'static' && result.source !== 'memory') {
        saveGeneratedContent(username, dailyReflection, result, ['analysis']);
    }

    return result;
};
