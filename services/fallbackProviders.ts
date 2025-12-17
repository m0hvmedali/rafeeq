
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AnalysisResponse, GradeLevel } from "../types";

// --- KEYS CONFIGURATION ---
const KEYS = {
    GEMINI_BACKUP: "AIzaSyBcJdCGYuXhqPZ_qHDjDFx1j7sXnnnRkDc",
    OPENROUTER: "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",
    GOOGLE_SEARCH: "AIzaSyCb5TdRA2h9d3spIacp8Lo8GnQmWO9b6J8",
    SERPLY: "f11b3215a5709a3e46fd6342d3662a6738d7b135bd2217a375421baf61ce4d27"
};

const CX_ID = "017576662512468239146:omuauf_lfve";

// --- UTILS ---

const smartTruncate = (text: string, limit: number): string => {
    if (text.length <= limit) return text;
    const sub = text.substring(0, limit);
    const lastDot = sub.lastIndexOf('.');
    
    if (lastDot > limit * 0.8) {
        return sub.substring(0, lastDot + 1);
    }
    return sub.trim() + "...";
};

/**
 * Enhanced Retry Mechanism: Fails fast on auth/rate errors.
 */
async function callProviderWithRetry<T>(
    fn: () => Promise<T>, 
    providerName: string, 
    retries = 1, 
    delay = 1000
): Promise<T> {
    try {
        return await fn();
    } catch (e: any) {
        const status = e?.status || e?.response?.status;
        const message = e?.message || '';
        
        // CRITICAL: DO NOT RETRY THESE ERRORS
        const isFatal = 
            status === 401 || // Unauthorized (Bad Key)
            status === 403 || // Forbidden
            status === 429 || // Too Many Requests
            message.includes('429') || 
            message.includes('quota') ||
            message.includes('Unauthorized') ||
            message.includes('RESOURCE_EXHAUSTED');
        
        if (isFatal) {
             console.warn(`⛔ ${providerName} Fatal Error (${status || 'Quota/Auth'}). Skipping retries.`);
             throw e;
        }

        if (retries > 0) {
            console.warn(`${providerName} failed. Retrying in ${delay}ms...`, message);
            await new Promise(r => setTimeout(r, delay));
            return callProviderWithRetry(fn, providerName, retries - 1, delay * 2);
        }
        throw e;
    }
}

// --- RULE ENGINE: TEXT TO JSON CONVERTER ---
const textToAnalysisJson = (text: string, sourceName: string, sourceType: 'ai' | 'search' | 'static' = 'ai'): AnalysisResponse => {
    const safeText = smartTruncate(text, 800);
    
    return {
        source: sourceType as any,
        summary: {
            accomplishment: `تم تحليل البيانات عبر ${sourceName}`,
            effortType: "mental",
            stressLevel: "medium",
            analysisText: safeText
        },
        webAnalysis: {
            rootCause: "تم استنتاج الأسباب بناءً على المعلومات المتاحة",
            suggestedRemedy: "راجع النقاط المذكورة أعلاه",
            sources: []
        },
        motivationalMessage: {
            text: "الوصول إلى الهدف يتطلب المرونة في التعامل مع العقبات.",
            source: "رفيق",
            category: "wisdom"
        },
        researchConnections: [],
        tomorrowPlan: [
            { time: "08:00 ص", task: "مراجعة المهام الحالية", method: "To-Do List", type: "study" },
            { time: "10:00 ص", task: "جلسة عمل عميق", method: "Pomodoro", type: "study" }
        ],
        recommendedMethods: [],
        psychologicalSupport: {
            message: "أنت تقوم بعمل جيد، استمر في التقدم.",
            technique: "التنفس العميق"
        },
        quranicLink: {
            verse: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
            surah: "الشرح",
            behavioralExplanation: "كل عقبة هي فرصة للتعلم والنمو."
        },
        balanceScore: 70
    };
};

// --- 2. GEMINI BACKUP PROVIDER ---
export const callGeminiBackup = async (prompt: string): Promise<AnalysisResponse> => {
    return callProviderWithRetry(async () => {
        console.log("Attempting Gemini Backup...");
        const ai = new GoogleGenAI({ apiKey: KEYS.GEMINI_BACKUP });
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt + "\n Return strictly JSON.",
            config: {
                responseMimeType: "application/json",
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                ],
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty backup response");
        const json = JSON.parse(text) as AnalysisResponse;
        json.source = 'ai'; 
        return json;
    }, "Gemini Backup");
};

// --- 3. OPENROUTER PROVIDER ---
export const callOpenRouter = async (prompt: string): Promise<AnalysisResponse> => {
    return callProviderWithRetry(async () => {
        console.log("Attempting OpenRouter...");
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${KEYS.OPENROUTER}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://rafeeq.app", 
                "X-Title": "Rafeeq App"
            },
            body: JSON.stringify({
                "model": "xiaomi/mimo-v2-flash:free",
                "messages": [
                    { "role": "system", "content": "You are Rafeeq. Analyze the user's day. Output strictly valid JSON." },
                    { "role": "user", "content": prompt }
                ]
            })
        });

        // Fail fast on Auth errors
        if (response.status === 401 || response.status === 403) {
            throw new Error(`OpenRouter Auth Failed: ${response.status}`);
        }

        if (!response.ok) throw new Error(`OpenRouter Failed: ${response.status}`);
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const jsonStr = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        
        try {
            const json = JSON.parse(jsonStr) as AnalysisResponse;
            json.source = 'ai';
            return json;
        } catch {
            return textToAnalysisJson(content, "OpenRouter AI (Mimo)", 'ai');
        }
    }, "OpenRouter");
};

// --- 4. GOOGLE PROGRAMMABLE SEARCH PROVIDER ---
export const callGoogleSearch = async (query: string): Promise<AnalysisResponse> => {
    return callProviderWithRetry(async () => {
        console.log("Attempting Google Search...");
        const enhancedQuery = `${query} مشكلة دراسية نصائح حلول`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${KEYS.GOOGLE_SEARCH}&cx=${CX_ID}&q=${encodeURIComponent(enhancedQuery)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Google Search Failed: ${response.status}`);
        
        const data = await response.json();
        if (!data.items || data.items.length === 0) throw new Error("No Google Search results");

        const snippets = data.items.slice(0, 4).map((item: any) => `📌 ${item.title}: ${item.snippet}`).join("\n\n");
        const combinedText = `بناءً على نتائج البحث:\n\n${snippets}`;

        const analysis = textToAnalysisJson(combinedText, "بحث جوجل", 'ai');
        analysis.webAnalysis.sources = data.items.slice(0, 3).map((item: any) => ({
            title: item.title,
            url: item.link,
            snippet: item.snippet
        }));
        
        return analysis;
    }, "Google Search");
};

// --- 5. SERPLY PROVIDER ---
export const callSerply = async (query: string): Promise<AnalysisResponse> => {
    return callProviderWithRetry(async () => {
        console.log("Attempting Serply...");
        const q = `${query} education help`;
        const url = `https://api.serply.io/v1/search/q=${encodeURIComponent(q)}`;
        
        const response = await fetch(url, {
            headers: { "X-Api-Key": KEYS.SERPLY }
        });

        // Fail fast on CORS/Auth/Network errors (fetch throws on network error, but returns response on 4xx/5xx)
        if (!response.ok) {
             throw new Error(`Serply Failed: ${response.status}`);
        }

        const data = await response.json();
        const results = data.results || [];
        if (results.length === 0) throw new Error("No Serply results");

        const snippets = results.slice(0, 3).map((item: any) => `🔹 ${item.title || 'Result'}: ${item.description || ''}`).join("\n\n");
        const analysis = textToAnalysisJson(`نتائج بديلة:\n\n${snippets}`, "Serply Search", 'ai');

        if (results.length > 0) {
            analysis.webAnalysis.sources = results.slice(0, 3).map((item: any) => ({
                title: item.title || "Link",
                url: item.link || item.url || "#",
                snippet: item.description || ""
            }));
        }

        return analysis;
    }, "Serply Search");
};
