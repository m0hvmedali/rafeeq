
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import { WeeklySchedule, AnalysisResponse, GradeLevel, MotivationalMessage, VoiceTutorResponse, InterestProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Global cooldown state
let geminiCooldownUntil = 0;
const COOLDOWN_PERIOD = 60000; // 1 Minute Cooldown on 429

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  // 1. Check Cooldown FIRST
  if (Date.now() < geminiCooldownUntil) {
    const remaining = Math.ceil((geminiCooldownUntil - Date.now()) / 1000);
    throw new Error(`Gemini Cooldown Active (429). Skipping for ${remaining}s.`);
  }

  try {
    return await fn();
  } catch (error: any) {
    const message = error?.message || '';
    const status = error?.status;
    const errorBody = JSON.stringify(error);
    
    // 2. Identify Critical Errors (NO RETRY)
    // Check for 429, Quota, or Resource Exhausted in various formats
    const isRateLimited = 
        status === 429 || 
        message.includes('429') || 
        message.includes('quota') || 
        message.includes('RESOURCE_EXHAUSTED') ||
        errorBody.includes('RESOURCE_EXHAUSTED');

    // 3. Handle 429 (STOP RETRY + ACTIVATE COOLDOWN)
    if (isRateLimited) {
      console.warn(`⛔ Gemini 429/Quota detected. Activating cooldown. Error: ${message.substring(0, 100)}...`);
      geminiCooldownUntil = Date.now() + COOLDOWN_PERIOD;
      throw new Error("Gemini Rate Limit Hit - Switching to Fallback"); // Throw new simple error to avoid complex retry logic upstream
    }

    // 4. Handle Overload (503) -> Retry is OK
    const isOverloaded = status === 503 || message.includes('503') || message.includes('overloaded');
    if (retries > 0 && isOverloaded) {
      console.warn(`Gemini Overloaded (503). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2); 
    }
    
    // Other errors -> Throw immediately
    throw error;
  }
}

const SYSTEM_INSTRUCTION = `
أنت "رفيق"، نظام ذكاء اصطناعي تحليلي متكيف.
وظيفتك:
1. تحليل مدخلات الطالب بعمق.
2. استخدام "سياق المستخدم" (User Context) لتخصيص الرد (نبرة الصوت، نوع المحتوى المفضل).
3. البحث في الويب عن أسباب المشاكل.

### أدوات:
- Google Search: إجباري للبحث عن الحلول والاقتباسات.

### مدخلات السياق (Context):
ستتلقى ملف تعريف لاهتمامات المستخدم (ديني، علمي، فلسفي).
- إذا كان الوزن "الديني" عالياً: استخدم لغة إيمانية، آيات قرآنية أكثر، وربط المشاكل بالروحانيات.
- إذا كان الوزن "العلمي" عالياً: استخدم لغة تحليلية، إحصائيات، ودراسات (Neuroscience).
- إذا كان الوزن "العملي" عالياً: اعطِ خطوات تنفيذية مباشرة (To-Do lists).

### تنسيق الإخراج JSON حصراً:
{
  "summary": { "accomplishment": "", "effortType": "mental"|"emotional"|"physical", "stressLevel": "low"|"medium"|"high", "analysisText": "" },
  "webAnalysis": { "rootCause": "", "suggestedRemedy": "", "sources": [] },
  "motivationalMessage": { "text": "", "source": "", "category": "religious"|"scientific"|"philosophical" },
  "researchConnections": [],
  "tomorrowPlan": [],
  "recommendedMethods": [],
  "psychologicalSupport": { "message": "", "technique": "" },
  "quranicLink": { "verse": "", "surah": "", "behavioralExplanation": "" },
  "balanceScore": 0
}
`;

export const analyzeDayAndPlan = async (
  dailyReflection: string,
  weeklySchedule: WeeklySchedule,
  nextDayName: string,
  gradeLevel: GradeLevel,
  userContextString: string = "" 
): Promise<AnalysisResponse> => {
  
  const prompt = `
    بيانات المستخدم:
    - المرحلة: ${gradeLevel}
    - ملخص اليوم: "${dailyReflection}"
    - جدول الأسبوع: ${JSON.stringify(weeklySchedule)}
    - الغد: ${nextDayName}
    
    === ملف تفضيلات المستخدم (الخوارزمية) ===
    ${userContextString}
    ========================================
    
    بناءً على الملف أعلاه، خصص الرد ليتناسب مع اهتمامات المستخدم ونبرته المفضلة.
    أخرج JSON صالح فقط.
  `;

  return callWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
          systemInstruction: SYSTEM_INSTRUCTION,
          safetySettings: SAFETY_SETTINGS,
        }
      });

      let text = response.text;
      if (!text) throw new Error("Empty response from AI");

      text = text.trim();
      if (text.startsWith("```")) {
          text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
      }

      return JSON.parse(text) as AnalysisResponse;
    } catch (error) {
      throw error;
    }
  });
};

export const getFreshInspiration = async (profile?: InterestProfile): Promise<MotivationalMessage> => {
    const seeds: string[] = ['Perseverance', 'Hope'];
    let bias = "General Wisdom";

    if (profile) {
        if (profile.religious > 6) {
             seeds.push('Islamic patience', 'Quranic wisdom', 'Prophetic hadith about knowledge');
             bias = "Islamic & Religious";
        }
        if (profile.scientific > 6) {
             seeds.push('Scientific focus', 'Neuroscience of learning', 'Stoicism', 'Physics analogies');
             bias = "Scientific & Analytical";
        }
        if (profile.philosophical > 6) {
             seeds.push('Philosophy', 'Deep wisdom', 'Poetry');
             bias = "Philosophical";
        }
    }

    const randomTopic = seeds[Math.floor(Math.random() * seeds.length)];
    const timeSeed = new Date().toISOString();

    const prompt = `
    ابحث عن اقتباس ملهم قصير أو حكمة عميقة.
    الموضوع المفضل للمستخدم: ${bias}.
    موضوع البحث المقترح: ${randomTopic} - ${timeSeed}.
    
    أخرج JSON فقط:
    { "text": "...", "source": "...", "category": "religious" | "scientific" | "wisdom" | "philosophical" }
    `;

    try {
        return await callWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{googleSearch: {}}],
                    safetySettings: SAFETY_SETTINGS,
                }
            });
            let text = response.text || "{}";
            text = text.trim().replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
            return JSON.parse(text) as MotivationalMessage;
        }, 0); // No retries for quotes to be fast
    } catch (e) {
        return { text: "إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ", source: "سورة التوبة", category: "religious" };
    }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string = 'audio/webm'): Promise<string> => {
    return callWithRetry(async () => {
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: { parts: [ { inlineData: { mimeType: mimeType, data: base64Audio } }, { text: "Transcribe to Arabic." } ] },
              config: { safetySettings: SAFETY_SETTINGS }
          });
          return response.text || "";
    });
};

export const generateSpeech = async (text: string): Promise<string> => {
    return callWithRetry(async () => {
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash-preview-tts",
              contents: { parts: [{ text: text }] },
              config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                  safetySettings: SAFETY_SETTINGS,
              }
          });
          return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    });
};

export const evaluateRecap = async (transcript: string, subject: string, gradeLevel: GradeLevel): Promise<VoiceTutorResponse> => {
  const prompt = `Evaluate student recap. Subject: ${subject}, Grade: ${gradeLevel}. Text: "${transcript}". Return JSON {score, feedback, missingConcepts, correction}`;
  return callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { tools: [{googleSearch: {}}], safetySettings: SAFETY_SETTINGS }
      });
      let text = response.text || "{}";
      text = text.trim().replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
      return JSON.parse(text);
  });
};
