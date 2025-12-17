
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import { WeeklySchedule, AnalysisResponse, GradeLevel, MotivationalMessage, VoiceTutorResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const message = error?.message || '';
    const status = error?.status;
    const isOverloaded = status === 503 || message.includes('503') || message.includes('overloaded');
    const isRateLimited = status === 429 || message.includes('429') || message.includes('quota');

    if (retries > 0 && (isOverloaded || isRateLimited)) {
      let waitTime = delay;
      if (isRateLimited) {
         const match = message.match(/retry in (\d+(\.\d+)?)s/);
         if (match && match[1]) {
             waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
         } else {
             waitTime = delay * 2; 
         }
      }
      console.warn(`Gemini API Error (${status}). Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return callWithRetry(fn, retries - 1, isRateLimited ? waitTime : delay * 1.5); 
    }
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
  userContextString: string = "" // NEW: Accepts context
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
      console.error("Error analyzing day:", error);
      throw error;
    }
  });
};

export const getFreshInspiration = async (): Promise<MotivationalMessage> => {
    const seeds = ['Islamic patience', 'Scientific focus', 'Stoic wisdom', 'Academic perseverance'];
    const randomTopic = seeds[Math.floor(Math.random() * seeds.length)];
    const timeSeed = new Date().toISOString();

    const prompt = `
    ابحث عن اقتباس ديني أو حكمة نادرة.
    الموضوع: ${randomTopic} - ${timeSeed}.
    JSON format: { "text": "...", "source": "...", "category": "religious" | "scientific" | "wisdom" }
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
        }, 1, 1000);
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
