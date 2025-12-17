
import { AnalysisResponse, GradeLevel, WeeklySchedule, MotivationalMessage } from "../types";
import { analyzeDayAndPlan as callGeminiPrimary } from "./geminiService";
import { callOpenRouter, callGoogleSearch, callSerply } from "./fallbackProviders";
import { findCachedResponse, saveToMemory } from "./memoryService";
import { INITIAL_KNOWLEDGE_BASE } from "../lib/knowledgeBase";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Backup Key for Plan B
const BACKUP_GEMINI_KEY = "AIzaSyBcJdCGYuXhqPZ_qHDjDFx1j7sXnnnRkDc";

// Helper to call Gemini with a specific key (Plan B)
const callGeminiBackup = async (prompt: string): Promise<AnalysisResponse> => {
    const ai = new GoogleGenAI({ apiKey: BACKUP_GEMINI_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            safetySettings: [
                 { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                 { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * THE ORCHESTRATOR
 * Executes the failover strategy defined in the requirements.
 */
export const smartAnalyzeDay = async (
    dailyReflection: string,
    weeklySchedule: WeeklySchedule,
    nextDayName: string,
    gradeLevel: GradeLevel
): Promise<AnalysisResponse> => {
    const querySignature = `${gradeLevel} ${dailyReflection} ${nextDayName}`;

    // 1. MEMORY LAYER (Cache)
    console.log("Orchestrator: Checking Memory...");
    const cached = findCachedResponse(querySignature, 'analysis');
    if (cached) {
        console.log("Orchestrator: Hit Memory!");
        return cached;
    }

    // Construct Prompt for AI models
    const systemPrompt = `Analyze student day: ${dailyReflection}, Grade: ${gradeLevel}. Return JSON AnalysisResponse.`;

    // 2. PRIMARY AI (Gemini Env Key)
    try {
        console.log("Orchestrator: Trying Primary Gemini...");
        const result = await callGeminiPrimary(dailyReflection, weeklySchedule, nextDayName, gradeLevel);
        saveToMemory(querySignature, result, 'gemini-primary');
        return result;
    } catch (e) {
        console.warn("Primary Gemini Failed. Moving to Plan B.");
    }

    // 3. SECONDARY AI (Gemini Backup Key)
    try {
        console.log("Orchestrator: Trying Secondary Gemini...");
        // Reconstruct simple prompt for backup to avoid complexity
        const prompt = `Act as an academic advisor. Analyze: "${dailyReflection}". Output JSON matching {summary, webAnalysis, motivationalMessage, tomorrowPlan...}`;
        const result = await callGeminiBackup(prompt);
        saveToMemory(querySignature, result, 'gemini-backup');
        return result;
    } catch (e) {
        console.warn("Secondary Gemini Failed. Moving to Plan C.");
    }

    // 4. TERTIARY AI (OpenRouter)
    try {
        console.log("Orchestrator: Trying OpenRouter...");
        const prompt = `Analyze this student reflection: "${dailyReflection}". Return a JSON object with fields: summary, webAnalysis, motivationalMessage, tomorrowPlan.`;
        const result = await callOpenRouter(prompt);
        saveToMemory(querySignature, result, 'openrouter');
        return result;
    } catch (e) {
        console.warn("OpenRouter Failed. Moving to Search Layer.");
    }

    // 5. SEARCH LAYER 1 (Google Programmable Search)
    try {
        console.log("Orchestrator: Trying Google Search...");
        const result = await callGoogleSearch(dailyReflection);
        saveToMemory(querySignature, result, 'search');
        return result;
    } catch (e) {
        console.warn("Google Search Failed. Moving to Search Layer 2.");
    }

    // 6. SEARCH LAYER 2 (Serply)
    try {
        console.log("Orchestrator: Trying Serply...");
        const result = await callSerply(dailyReflection);
        saveToMemory(querySignature, result, 'search');
        return result;
    } catch (e) {
        console.warn("Serply Failed. Using Static Fallback.");
    }

    // 7. FINAL FALLBACK (Static)
    console.log("Orchestrator: All systems down. Returning Static Fallback.");
    const staticResult = INITIAL_KNOWLEDGE_BASE[0].response as AnalysisResponse;
    // Customize static result slightly
    staticResult.summary.analysisText += " (ملاحظة: النظام يعمل في وضع الأوفلاين حالياً)";
    return staticResult;
};

/**
 * Orchestrator for Inspiration/Quotes
 */
export const smartGetInspiration = async (): Promise<MotivationalMessage> => {
    // 1. Memory check (randomize from cache if available)
    // 2. Try Primary Gemini (Already implemented in geminiService)
    // ... Simplified logic for quotes as it's less critical
    try {
        // We import the original function just to wrap it if needed, 
        // but for now, we can rely on its internal retry or create a similar chain here.
        // For brevity, let's implement a quick failover for quotes using OpenRouter.
        const prompt = "Give me a unique motivational quote JSON: {text, source, category}";
        return await callOpenRouter(prompt) as any;
    } catch {
        const fallback = INITIAL_KNOWLEDGE_BASE[0].response as AnalysisResponse;
        return fallback.motivationalMessage;
    }
};
