
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality, Type } from "@google/genai";
import { WeeklySchedule, AnalysisResponse, GradeLevel, MotivationalMessage, VoiceTutorResponse, InterestProfile } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let geminiCooldownUntil = 0;
const COOLDOWN_PERIOD = 30000; 

async function callWithRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  if (Date.now() < geminiCooldownUntil) throw new Error("Gemini Cooling Down");
  try {
    return await fn();
  } catch (error: any) {
    if (error?.status === 429) {
      geminiCooldownUntil = Date.now() + COOLDOWN_PERIOD;
    }
    if (retries > 0 && error?.status !== 429) {
      await new Promise(r => setTimeout(r, 1000));
      return callWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

// Define the response schema for AnalysisResponse
const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.OBJECT,
      properties: {
        accomplishment: { type: Type.STRING },
        effortType: { type: Type.STRING },
        stressLevel: { type: Type.STRING },
        analysisText: { type: Type.STRING },
      },
      required: ["accomplishment", "effortType", "stressLevel", "analysisText"],
    },
    webAnalysis: {
      type: Type.OBJECT,
      properties: {
        rootCause: { type: Type.STRING },
        suggestedRemedy: { type: Type.STRING },
        sources: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              url: { type: Type.STRING },
              snippet: { type: Type.STRING },
            },
          },
        },
      },
    },
    motivationalMessage: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        source: { type: Type.STRING },
        category: { type: Type.STRING },
      },
    },
    researchConnections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING },
          source: { type: Type.STRING },
          evidenceStrength: { type: Type.STRING },
          type: { type: Type.STRING },
          relevance: { type: Type.STRING },
        },
      },
    },
    tomorrowPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.STRING },
          task: { type: Type.STRING },
          method: { type: Type.STRING },
          type: { type: Type.STRING },
        },
      },
    },
    recommendedMethods: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          methodName: { type: Type.STRING },
          details: { type: Type.STRING },
          tools: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    psychologicalSupport: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING },
        technique: { type: Type.STRING },
      },
    },
    quranicLink: {
      type: Type.OBJECT,
      properties: {
        verse: { type: Type.STRING },
        surah: { type: Type.STRING },
        behavioralExplanation: { type: Type.STRING },
      },
    },
    balanceScore: { type: Type.NUMBER },
  },
  required: ["summary", "tomorrowPlan", "balanceScore", "quranicLink"],
};

export const analyzeDayAndPlan = async (
  dailyReflection: string,
  weeklySchedule: WeeklySchedule,
  nextDayName: string,
  gradeLevel: GradeLevel,
  userContextString: string = "" 
): Promise<AnalysisResponse> => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `المرحلة: ${gradeLevel}. الانعكاس: "${dailyReflection}". الجدول: ${JSON.stringify(weeklySchedule)}. السياق: ${userContextString}`,
      config: {
        systemInstruction: "أنت 'رفيق'، مساعد ذكاء اصطناعي يحلل يوم الطالب بدقة بناءً على حالته النفسية وجدوله الدراسي. ادمج المواد المذكورة في الجدول في خطة غدك (${nextDayName}). قدم تحليلاً عميقاً يتضمن الدعم النفسي والربط القرآني المناسب. أخرج النتيجة بصيغة JSON حصراً.",
        responseMimeType: "application/json",
        responseSchema: analysisResponseSchema
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text);
  });
};

export const getFreshInspiration = async (profile?: InterestProfile): Promise<MotivationalMessage> => {
    const randomSeed = Math.random().toString(36).substring(7);
    const timestamp = Date.now();
    
    const prompt = `هات اقتباساً ملهماً فريداً للطالب. الاهتمامات: ${JSON.stringify(profile)}. البذرة: ${randomSeed}_${timestamp}.`;

    try {
        return await callWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            source: { type: Type.STRING },
                            category: { type: Type.STRING }
                        },
                        required: ["text", "source", "category"]
                    }
                }
            });
            return JSON.parse(response.text || "{}");
        }, 0);
    } catch (e) {
        return { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "سورة الشرح", category: "religious" };
    }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ inlineData: { data: base64Audio, mimeType } }, { text: "Transcribe to Arabic." }] }]
    });
    return response.text || "";
};

export const generateSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { 
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const evaluateRecap = async (transcript: string, subject: string, gradeLevel: GradeLevel): Promise<VoiceTutorResponse> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `قيم شرح الطالب لمادة ${subject}: "${transcript}". المرحلة: ${gradeLevel}`,
    config: { 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER },
                feedback: { type: Type.STRING },
                missingConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                correction: { type: Type.STRING }
            },
            required: ["score", "feedback", "missingConcepts", "correction"]
        }
    }
  });
  return JSON.parse(response.text || "{}");
};
