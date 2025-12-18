
import { AnalysisResponse } from "../types.ts";

/**
 * دالة التحقق والإصلاح لضمان عدم تعطل الواجهة عند استلام بيانات ناقصة
 */
const validateAndRepairResponse = (data: any): AnalysisResponse => {
    return {
        summary: {
            accomplishment: data?.summary?.accomplishment || "تم استرجاع معلومات من مصادر خارجية",
            effortType: data?.summary?.effortType || "mental",
            stressLevel: data?.summary?.stressLevel || "medium",
            analysisText: data?.summary?.analysisText || "نواجه حالياً ضغطاً في خدمات الذكاء الاصطناعي، إليك نتائج البحث المتاحة لمساعدتك."
        },
        webAnalysis: data?.webAnalysis || { rootCause: "بحث خارجي", suggestedRemedy: "مراجعة المصادر أدناه", sources: [] },
        motivationalMessage: data?.motivationalMessage || { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "سورة الشرح", category: "religious" },
        tomorrowPlan: data?.tomorrowPlan || [{ time: "09:00 ص", task: "متابعة المهام الأساسية", method: "Pomodoro", type: "study" }],
        quranicLink: data?.quranicLink || { verse: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", surah: "الشرح", behavioralExplanation: "كل ضيق يتبعه فرج." },
        balanceScore: Number(data?.balanceScore) || 70,
        researchConnections: data?.researchConnections || [],
        recommendedMethods: data?.recommendedMethods || [],
        psychologicalSupport: data?.psychologicalSupport || { message: "أنت تقوم بعمل رائع، استمر في السعي.", technique: "التنفس" },
        lessonIntelligence: data?.lessonIntelligence || { difficulty: 'medium', reflectionText: "بناءً على نتائج البحث، الدرس يتطلب تركيزاً متوسطاً." }
    };
};

/**
 * دالة لجلب نتائج البحث من DuckDuckGo HTML كحل أخير بدون ذكاء اصطناعي
 */
const fetchDuckDuckGoResults = async (query: string) => {
    try {
        // نستخدم DuckDuckGo HTML كحل أخير (قد يتأثر بـ CORS في بعض البيئات)
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://html.duckduckgo.com/html/?q=${query}`)}`);
        if (!response.ok) return [];
        
        const json = await response.json();
        const html = json.contents;
        
        // فلترة النتائج باستخدام Regex بسيط لاستخراج العناوين والروابط
        const results: any[] = [];
        const regex = /<a class="result__a" rel="noopener" href="([^"]+)">([^<]+)<\/a>.*?<a class="result__snippet" href="[^"]+">([^<]+)<\/a>/gs;
        let match;
        let count = 0;
        
        while ((match = regex.exec(html)) !== null && count < 5) {
            results.push({
                url: match[1],
                title: match[2].trim(),
                snippet: match[3].trim()
            });
            count++;
        }
        return results;
    } catch (e) {
        console.error("DDG Fetch failed", e);
        return [];
    }
};

/**
 * استدعاء OpenRouter باستخدام النموذج المطلوب
 */
export const callOpenRouter = async (prompt: string): Promise<AnalysisResponse> => {
    const OPENROUTER_API_KEY = process.env.API_KEY || "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"; // مفتاح احتياطي مدمج
    
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin,
                "X-Title": "Rafeeq AI"
            },
            body: JSON.stringify({
                "model": "qwen/qwen3-235b-a22b:free",
                "messages": [
                    { "role": "system", "content": "أنت رفيق، مساعد ذكاء اصطناعي تعليمي. أخرج الرد دائماً بصيغة JSON مطابقة للمخطط المطلوب دون أي نص إضافي." },
                    { "role": "user", "content": prompt }
                ],
                "response_format": { "type": "json_object" }
            })
        });

        if (!response.ok) throw new Error(`OpenRouter Error: ${response.status}`);

        const data = await response.json();
        const content = data.choices[0].message.content;
        return validateAndRepairResponse(JSON.parse(content));
    } catch (error) {
        console.error("OpenRouter failed, falling back to DDG Search...");
        throw error;
    }
};

/**
 * وضع الطوارئ الأخير (Safe Mode) باستخدام DuckDuckGo
 */
export const callDDGFallback = async (query: string): Promise<AnalysisResponse> => {
    console.log("Rafeeq AI: Engaging DuckDuckGo Search Fallback...");
    
    const searchResults = await fetchDuckDuckGoResults(query);
    const topResults = searchResults.slice(0, 3).map(r => `• ${r.title}: ${r.snippet}`).join('\n');

    return validateAndRepairResponse({
        source: 'static',
        summary: {
            accomplishment: "وضع الأمان: تم جلب معلومات من محرك البحث مباشرة",
            effortType: "mental",
            stressLevel: "medium",
            analysisText: searchResults.length > 0 
                ? `لم نتمكن من الوصول للذكاء الاصطناعي، ولكن إليك ما وجدناه في الويب حول "${query}":\n\n${topResults}`
                : "نعتذر، كافة قنوات الاتصال بالذكاء الاصطناعي والبحث معطلة حالياً. يرجى المحاولة لاحقاً."
        },
        webAnalysis: {
            rootCause: "انقطاع خدمات AI",
            suggestedRemedy: "الاعتماد على المصادر اليدوية المرفقة",
            sources: searchResults.map(r => ({ title: r.title, url: r.url, snippet: r.snippet }))
        },
        motivationalMessage: {
            text: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ",
            source: "القرآن الكريم",
            category: "religious"
        },
        balanceScore: 65
    });
};
