
import { AnalysisResponse } from "../types";

const OPENROUTER_KEY = "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";

export const callOpenRouter = async (prompt: string): Promise<AnalysisResponse> => {
    console.log("Rafeeq: Transitioning to OpenRouter (Xiaomi Mimo)...");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://rafeeq.app",
            "X-Title": "Rafeeq Personal AI"
        },
        body: JSON.stringify({
            "model": "xiaomi/mimo-v2-flash:free",
            "messages": [
                { 
                    "role": "system", 
                    "content": "أنت 'رفيق'، مساعد ذكي للطالب العربي. حلل النص بدقة، ادمج الجدول الدراسي، والحالة النفسية، وقدم نصيحة من القرآن. أخرج النتيجة بصيغة JSON فقط كما هو مطلوب." 
                },
                { "role": "user", "content": prompt }
            ],
            "response_format": { "type": "json_object" }
        })
    });

    if (!response.ok) throw new Error(`OpenRouter Error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
};

export const callDDGFallback = async (query: string): Promise<AnalysisResponse> => {
    console.log("Rafeeq: Engaging Static Rule Engine (DDG Strategy)...");
    
    // محاكاة محرك القواعد في حالة الفشل التام
    const isSad = query.includes("مخنوق") || query.includes("تعبان") || query.includes("حزين");
    const isBusy = query.includes("مذاكرة") || query.includes("ضغط") || query.includes("امتحان");

    return {
        source: 'static',
        summary: {
            accomplishment: "تم تفعيل نظام الدعم الطارئ المستقر",
            effortType: isBusy ? "mental" : "emotional",
            stressLevel: isSad ? "high" : "medium",
            analysisText: `بناءً على كلماتك، نلاحظ أنك تمر بفترة ${isSad ? 'تحتاج فيها للدعم النفسي' : 'تحتاج فيها للتنظيم'}. بما أننا في وضع "الأمان"، نوصيك بالتركيز على التنفس بعمق والبدء بمهمة واحدة فقط من جدولك لمدة 15 دقيقة.`
        },
        webAnalysis: {
            rootCause: "تم تحليل النص محلياً لضمان استمرارية الخدمة",
            suggestedRemedy: "ابتعد عن المشتتات لمدة ساعة كاملة.",
            sources: []
        },
        motivationalMessage: {
            text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
            source: "سورة البقرة",
            category: "religious"
        },
        researchConnections: [],
        tomorrowPlan: [
            { time: "08:00 ص", task: "مراجعة أولية", method: "Deep Work", type: "study" },
            { time: "10:00 ص", task: "استراحة ذكية", method: "Pomodoro", type: "break" }
        ],
        recommendedMethods: [],
        psychologicalSupport: {
            message: "أنت تقوم بعمل رائع بمجرد المحاولة. استمر.",
            technique: "التنفس البطني"
        },
        quranicLink: {
            verse: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
            surah: "الشرح",
            behavioralExplanation: "كل ضيق هو بداية لفرج قريب، ثق بنفسك."
        },
        balanceScore: 55
    };
};
