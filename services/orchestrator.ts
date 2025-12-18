
import { AnalysisResponse, GradeLevel, WeeklySchedule, UserPreferences, UserStats } from "../types.ts";
import { analyzeDayAndPlan as callGeminiPrimary } from "./geminiService.ts";
import { callOpenRouter, callDDGFallback } from "./fallbackProviders.ts";
import { saveGeneratedContent, findBestMatch } from "./resilientDB.ts";
import { generateUserContextString } from "./recommendationEngine.ts";

const ensureValidResponse = (res: any): AnalysisResponse => {
    if (!res || typeof res !== 'object') {
        throw new Error("Response is not an object");
    }
    
    if (!res.summary) {
        res.summary = {
            accomplishment: "غير محدد",
            effortType: "mental",
            stressLevel: "medium",
            analysisText: "تعذر صياغة التحليل بشكل كامل، يرجى المحاولة لاحقاً."
        };
    }

    if (!res.tomorrowPlan || !Array.isArray(res.tomorrowPlan)) {
        res.tomorrowPlan = [];
    }

    if (typeof res.balanceScore !== 'number') {
        res.balanceScore = 70;
    }

    return res as AnalysisResponse;
};

export const smartAnalyzeDay = async (
    dailyReflection: string,
    weeklySchedule: WeeklySchedule,
    nextDayName: string,
    gradeLevel: GradeLevel,
    lessonData: { subject: string; lesson: string; solved: boolean; hours: number },
    prefs: UserPreferences,
    stats: UserStats
): Promise<AnalysisResponse> => {
    
    const contextString = generateUserContextString(prefs.interestProfile, stats);
    const query = `${lessonData.subject} ${lessonData.lesson} ${dailyReflection}`.trim();
    const username = localStorage.getItem('rafeeq_current_user_name') || 'guest';

    const cached = findBestMatch(query, 0.9);
    if (cached) return cached;

    let result: AnalysisResponse | null = null;

    try {
        console.log("Rafeeq AI: Step 1 (Gemini + Search Grounding)...");
        const rawResult = await callGeminiPrimary(dailyReflection, weeklySchedule, nextDayName, gradeLevel, lessonData, contextString);
        result = ensureValidResponse(rawResult);
    } catch (e) {
        console.warn("Rafeeq AI: Gemini failed. Moving to Step 2 (OpenRouter)...");
        
        try {
            const prompt = `أنت رفيق، حلل هذا اليوم دراسياً ونفسياً: المادة: ${lessonData.subject}، الدرس: ${lessonData.lesson}، ساعات: ${lessonData.hours}، حل: ${lessonData.solved}. نص الانعكاس: "${dailyReflection}". المرحلة: ${gradeLevel}. الجدول: ${JSON.stringify(weeklySchedule)}. السياق: ${contextString}. أخرج JSON فقط.`;
            const rawResult = await callOpenRouter(prompt);
            result = ensureValidResponse(rawResult);
            result.source = 'ai';
        } catch (e2) {
            console.error("Rafeeq AI: All online models failed. Engaging Safe Mode.");
            result = await callDDGFallback(dailyReflection);
        }
    }

    if (result && result.source !== 'static') {
        saveGeneratedContent(username, query, result, ['analysis', lessonData.subject]);
    }

    return result || await callDDGFallback(dailyReflection);
};
