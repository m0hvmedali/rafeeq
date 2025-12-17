
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AnalysisResponse, GradeLevel } from "../types";

// --- KEYS CONFIGURATION ---
const KEYS = {
    GEMINI_BACKUP: "AIzaSyBcJdCGYuXhqPZ_qHDjDFx1j7sXnnnRkDc",
    OPENROUTER: "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",
    GOOGLE_SEARCH: "AIzaSyCb5TdRA2h9d3spIacp8Lo8GnQmWO9b6J8",
    SERPLY: "f11b3215a5709a3e46fd6342d3662a6738d7b135bd2217a375421baf61ce4d27"
};

const CX_ID = "017576662512468239146:omuauf_lfve"; // Programmable Search Engine ID

// --- UTILS ---

/**
 * Smartly truncates text to a limit, attempting to cut at the last sentence end.
 */
const smartTruncate = (text: string, limit: number): string => {
    if (text.length <= limit) return text;
    const sub = text.substring(0, limit);
    const lastDot = sub.lastIndexOf('.');
    const lastQuestion = sub.lastIndexOf('?');
    const lastExclamation = sub.lastIndexOf('!');
    
    const cutIndex = Math.max(lastDot, lastQuestion, lastExclamation);

    // If a sentence ending is found in the last 20% of the limit, cut there.
    // Otherwise, just cut and add ellipses.
    if (cutIndex > limit * 0.8) {
        return sub.substring(0, cutIndex + 1);
    }
    return sub.trim() + "...";
};

/**
 * Generic Retry Mechanism
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
        if (retries > 0) {
            console.warn(`${providerName} failed. Retrying in ${delay}ms...`, e.message);
            await new Promise(r => setTimeout(r, delay));
            return callProviderWithRetry(fn, providerName, retries - 1, delay * 2);
        }
        throw e;
    }
}

// --- RULE ENGINE: TEXT TO JSON CONVERTER ---
// This acts as the "Decision Layer" when we only have raw text/search results
const textToAnalysisJson = (text: string, sourceName: string, sourceType: 'ai' | 'search' | 'static' = 'ai'): AnalysisResponse => {
    const safeText = smartTruncate(text, 800);
    
    return {
        source: sourceType as any, // Cast to any to accept 'search' if typings aren't updated yet, or strictly match types
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
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ],
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty backup response");
        const json = JSON.parse(text) as AnalysisResponse;
        json.source = 'ai'; // Explicitly set
        return json;
    }, "Gemini Backup");
};

// --- 3. OPENROUTER PROVIDER (Xiaomi Model) ---
export const callOpenRouter = async (prompt: string): Promise<AnalysisResponse> => {
    return callProviderWithRetry(async () => {
        console.log("Attempting OpenRouter (Xiaomi)...");
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
                    { "role": "system", "content": "You are Rafeeq. Analyze the user's day. Output strictly valid JSON matching the schema." },
                    { "role": "user", "content": prompt }
                ]
            })
        });

        if (!response.ok) throw new Error(`OpenRouter Failed: ${response.status}`);
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        
        // Clean markdown code blocks if present
        const jsonStr = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        
        try {
            const json = JSON.parse(jsonStr) as AnalysisResponse;
            json.source = 'ai';
            return json;
        } catch {
            // If model returns text instead of JSON, use Rule Engine
            return textToAnalysisJson(content, "OpenRouter AI (Mimo)", 'ai');
        }
    }, "OpenRouter");
};

// --- 4. GOOGLE PROGRAMMABLE SEARCH PROVIDER ---
export const callGoogleSearch = async (query: string): Promise<AnalysisResponse> => {
    return callProviderWithRetry(async () => {
        console.log("Attempting Google Search...");
        // Enhance query with educational context to get better results
        const enhancedQuery = `${query} مشكلة دراسية نصائح حلول`;
        
        const url = `https://www.googleapis.com/customsearch/v1?key=${KEYS.GOOGLE_SEARCH}&cx=${CX_ID}&q=${encodeURIComponent(enhancedQuery)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Google Search Failed: ${response.status}`);
        
        const data = await response.json();
        if (!data.items || data.items.length === 0) throw new Error("No Google Search results");

        // Rule Engine: Aggregation
        const snippets = data.items.slice(0, 4).map((item: any) => `📌 ${item.title}: ${item.snippet}`).join("\n\n");
        const combinedText = `بناءً على نتائج البحث في الويب (Google) حول مشكلتك:\n\n${snippets}\n\nنصيحة: حاول تطبيق الحلول المذكورة أعلاه تدريجياً.`;

        const analysis = textToAnalysisJson(combinedText, "بحث جوجل (Rule Engine)", 'ai'); // Using 'ai' type for UI compatibility
        
        // Enhance with source links
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
        // Enhance query slightly
        const q = `${query} education help`;
        const url = `https://api.serply.io/v1/search/q=${encodeURIComponent(q)}`;
        
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": KEYS.SERPLY,
                "User-Agent": "RafeeqApp/1.0"
            }
        });

        if (!response.ok) throw new Error(`Serply Failed: ${response.status}`);
        const data = await response.json();
        
        const results = data.results || [];
        if (results.length === 0) throw new Error("No Serply results");

        // Enhance extraction: Include title and description
        const snippets = results.slice(0, 3).map((item: any) => {
            const title = item.title || "نتيجة";
            const desc = item.description || "لا يوجد وصف";
            return `🔹 ${title}: ${desc}`;
        }).join("\n\n");

        const combinedText = `نتائج بحث بديلة (Serply):\n\n${snippets}`;
        const analysis = textToAnalysisJson(combinedText, "Serply Search", 'ai');

        // Map sources if available in Serply format
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
