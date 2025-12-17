
import { AnalysisResponse, MotivationalMessage } from "../types";

// الهيكل الخاص بالذاكرة
export interface MemoryEntry {
    queryHash: string; // بصمة السؤال أو الكلمات المفتاحية
    originalQuery: string;
    response: AnalysisResponse | MotivationalMessage;
    timestamp: number;
    source: 'gemini-primary' | 'gemini-backup' | 'openrouter' | 'search' | 'static';
}

// بيانات ثابتة (بذور) للبدء في حالة فشل كل شيء من اللحظة الأولى
export const INITIAL_KNOWLEDGE_BASE: MemoryEntry[] = [
    {
        queryHash: "static_fallback_general",
        originalQuery: "general fallback",
        timestamp: Date.now(),
        source: 'static',
        response: {
            summary: {
                accomplishment: "تم تفعيل وضع الطوارئ",
                effortType: "mental",
                stressLevel: "medium",
                analysisText: "نواجه صعوبة في الاتصال بخوادم الذكاء الاصطناعي حالياً. لكن لا تقلق، بناءً على القواعد العامة: تنظيم الوقت وتقسيم المهام هو الحل الأمثل لأغلب المشاكل الدراسية."
            },
            webAnalysis: {
                rootCause: "انقطاع الاتصال أو ضغط على الخوادم",
                suggestedRemedy: "حاول التركيز على مهمة واحدة صغيرة الآن لمدة 25 دقيقة.",
                sources: []
            },
            motivationalMessage: {
                text: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ",
                source: "سورة هود",
                category: "religious"
            },
            researchConnections: [],
            tomorrowPlan: [
                { time: "08:00 AM", task: "مراجعة سريعة", method: "Pomodoro", type: "study" }
            ],
            recommendedMethods: [],
            psychologicalSupport: {
                message: "الهدوء هو نصف المعركة. خذ نفساً عميقاً.",
                technique: "التنفس الصندوقي"
            },
            quranicLink: {
                verse: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
                surah: "الشرح",
                behavioralExplanation: "كل ضيق يتبعه فرج، استمر في السعي."
            },
            balanceScore: 50
        } as AnalysisResponse
    }
];
