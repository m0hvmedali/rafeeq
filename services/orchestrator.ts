
import { AnalysisResponse, GradeLevel, WeeklySchedule, UserPreferences, UserStats } from "../types.ts";
import { analyzeDayAndPlan as callGeminiPrimary } from "./geminiService.ts";
import { callOpenRouter, callDDGFallback } from "./fallbackProviders.ts";
import { saveGeneratedContent, findBestMatch } from "./resilientDB.ts";
import { generateUserContextString } from "./recommendationEngine.ts";

export const smartAnalyzeDay = async (
    dailyReflection: string,
    weeklySchedule: WeeklySchedule,
    nextDayName: string,
    gradeLevel: GradeLevel,
    prefs: UserPreferences,
    stats: UserStats
): Promise<AnalysisResponse> => {
    
    const contextString = generateUserContextString(prefs.interestProfile, stats);
    const query = dailyReflection.trim();
    const username = localStorage.getItem('rafeeq_current_user_name') || 'guest';

    const cached = findBestMatch(query, 0.9);
    if (cached) return cached;

    let result: AnalysisResponse | null = null;

    try {
        console.log("Rafeeq AI: Step 1 (Gemini)...");
        result = await callGeminiPrimary(dailyReflection, weeklySchedule, nextDayName, gradeLevel, contextString);
    } catch (e) {
        console.warn("Rafeeq AI: Gemini failed. Moving to Step 2 (OpenRouter)...");
        try {
            const prompt = `أنت رفيق، حلل هذا اليوم دراسياً ونفسياً: "${dailyReflection}". المرحلة: ${gradeLevel}. الجدول: ${JSON.stringify(weeklySchedule)}. السياق: ${contextString}. أخرج JSON فقط.`;
            result = await callOpenRouter(prompt);
            result.source = 'ai';
        } catch (e2) {
            console.error("Rafeeq AI: All online models failed. Engaging Safe Mode.");
            result = await callDDGFallback(dailyReflection);
        }
    }

    if (result && result.source !== 'static') {
        saveGeneratedContent(username, dailyReflection, result, ['analysis']);
    }

    return result || await callDDGFallback(dailyReflection);
};
