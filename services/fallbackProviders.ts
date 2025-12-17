
import { AnalysisResponse, GradeLevel } from "../types";

// --- KEYS CONFIGURATION ---
const KEYS = {
    GEMINI_BACKUP: "AIzaSyBcJdCGYuXhqPZ_qHDjDFx1j7sXnnnRkDc",
    OPENROUTER: "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",
    GOOGLE_SEARCH: "AIzaSyCb5TdRA2h9d3spIacp8Lo8GnQmWO9b6J8",
    SERPLY: "f11b3215a5709a3e46fd6342d3662a6738d7b135bd2217a375421baf61ce4d27"
};

const CX_ID = "017576662512468239146:omuauf_lfve"; // Generic Education Engine or you can replace if you have specific CX

// --- HELPER: CONVERT RAW TEXT TO JSON ---
// Used when backup models (Search/OpenRouter) return plain text
const textToAnalysisJson = (text: string, title: string = "تحليل احتياطي"): AnalysisResponse => {
    return {
        summary: {
            accomplishment: "تم استخدام نظام الطوارئ",
            effortType: "mental",
            stressLevel: "medium",
            analysisText: text.substring(0, 500) // Truncate to safe length
        },
        webAnalysis: {
            rootCause: "تم استنتاج الأسباب بناءً على البحث",
            suggestedRemedy: "راجع النقاط المذكورة في التحليل",
            sources: []
        },
        motivationalMessage: {
            text: "استمر في المحاولة، فالوصول يتطلب الصبر.",
            source: "النظام الذكي",
            category: "wisdom"
        },
        researchConnections: [],
        tomorrowPlan: [
            { time: "غير محدد", task: "مراجعة الخطة يدوياً", method: "Flexible", type: "study" }
        ],
        recommendedMethods: [],
        psychologicalSupport: {
            message: "أنت تقوم بعمل جيد رغم الظروف.",
            technique: "التوكيدات الإيجابية"
        },
        quranicLink: {
            verse: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ",
            surah: "النجم",
            behavioralExplanation: "النتيجة مرتبطة بالسعي."
        },
        balanceScore: 60
    };
};

// --- 3. OPENROUTER SERVICE ---
export const callOpenRouter = async (prompt: string): Promise<AnalysisResponse> => {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${KEYS.OPENROUTER}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://rafeeq.app", 
                "X-Title": "Rafeeq App"
            },
            body: JSON.stringify({
                "model": "xiaomi/mimo-v2-flash:free", // Free model as requested
                "messages": [
                    { "role": "system", "content": "You are a helpful student assistant. Output valid JSON only matching the structure requested." },
                    { "role": "user", "content": prompt }
                ]
            })
        });

        if (!response.ok) throw new Error("OpenRouter Failed");
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Try to parse JSON, if fail, wrap text
        try {
            // Find JSON in markdown blocks
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : content;
            return JSON.parse(jsonStr);
        } catch {
            return textToAnalysisJson(content, "تحليل OpenRouter");
        }
    } catch (e) {
        console.error("OpenRouter Error:", e);
        throw e;
    }
};

// --- 4. GOOGLE PROGRAMMABLE SEARCH ---
export const callGoogleSearch = async (query: string): Promise<AnalysisResponse> => {
    try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${KEYS.GOOGLE_SEARCH}&cx=${CX_ID}&q=${encodeURIComponent(query + " نصائح دراسية")}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Google Search API Failed");
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) throw new Error("No search results");

        // Rule Engine: Combine snippets
        const snippets = data.items.slice(0, 3).map((item: any) => `• ${item.title}: ${item.snippet}`).join("\n");
        const combinedText = `بناءً على نتائج البحث:\n${snippets}`;

        const analysis = textToAnalysisJson(combinedText, "نتائج بحث جوجل");
        
        // Enrich with real sources
        analysis.webAnalysis.sources = data.items.slice(0, 3).map((item: any) => ({
            title: item.title,
            url: item.link,
            snippet: item.snippet
        }));
        
        return analysis;

    } catch (e) {
        console.error("Google Search Error:", e);
        throw e;
    }
};

// --- 5. SERPLY.IO ---
export const callSerply = async (query: string): Promise<AnalysisResponse> => {
    try {
        // Serply often requires a proxy or strict header handling, simplified fetch here
        const url = `https://api.serply.io/v1/search/q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": KEYS.SERPLY,
                "User-Agent": "RafeeqApp/1.0"
            }
        });

        if (!response.ok) throw new Error("Serply API Failed");
        const data = await response.json();

        const results = data.results || [];
        if (results.length === 0) throw new Error("No Serply results");

        const snippets = results.slice(0, 3).map((item: any) => item.description).join("\n");
        return textToAnalysisJson(`نتائج بحث بديلة (Serply):\n${snippets}`);

    } catch (e) {
        console.error("Serply Error:", e);
        throw e;
    }
};
