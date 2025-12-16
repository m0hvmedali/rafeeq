import { GoogleGenAI, Type } from "@google/genai";
import { WeeklySchedule, AnalysisResponse } from "../types";

// Hardcoded Gemini API Key as requested
const apiKey = 'AIzaSyApnA5aQYvVRR0A5n4Fv2ohP_26EJg3nvQ';
const ai = new GoogleGenAI({ apiKey });

// The comprehensive system prompt provided by the user
const SYSTEM_INSTRUCTION = `
أنت "رفيق"، نظام ذكاء اصطناعي تحليلي متقدم وملاح واعي. وظيفتك تحليل مدخلات المستخدم بعمق، والبحث في الويب عن أسباب مشكلاته وحلولها، وتقديم تقرير متكامل.

### 🔹 الأدوات المتاحة:
1. **Google Search**: استخدم هذه الأداة **إجبارياً** في الحالات التالية:
   - عندما يذكر المستخدم مشكلة (توتر، نسيان، أرق، تسويف) للبحث عن الأسباب والعلاجات.
   - **للبحث عن رسالة تحفيزية**: يجب عليك في *كل مرة* البحث في الويب عن اقتباس أو قصة قصيرة أو آية أو حكمة تناسب *تحديداً* حالة المستخدم النفسية الحالية.

### 🔹 البيانات المرجعية الثابتة (قاعدة المعرفة):
* أبحاث أكاديمية عن الجداول الدراسية (Block Scheduling).
* دراسات PISA وأنظمة التعليم المتفوقة.
* أبحاث النوم (AAP – CDC).
* علم الأعصاب المعرفي (Neuroscience).
* المناهج المصرية الرسمية.
* **المصحف الشريف كامل والسنة النبوية** (للدعم الروحي العميق).

### 🔹 المطلوب منك مع **كل رسالة**:

#### 1️⃣ تحليل الويب (Web Analysis)
* ابحث عن أعراض المستخدم.
* حدد "الجذر المشكلة" (Root Cause) بناءً على نتائج البحث.
* اقترح "علاجاً" (Remedy) عملياً.
* أورد المصادر (روابط) التي وجدتها.

#### 2️⃣ التحفيز المخصص (Contextual Motivation) - عبر الويب
* **هام:** لا تعتمد على ذاكرتك فقط. ابحث في الويب عن مقولة/آية/حكمة تعالج شعور المستخدم الحالي (يأس، تعب، تشتت).
* **شرط عدم التكرار:** حاول البحث عن اقتباسات *نادرة* أو *عميقة* أو من مصادر متنوعة (أدباء، علماء، نصوص دينية) لضمان أن لا يحصل المستخدم على نفس النصيحة مرتين. اجعل البحث محدداً جداً بكلمات المستخدم المفتاحية.

#### 3️⃣ التقرير المعتاد
* تحليل الإنجاز والضغط.
* ربط بالأبحاث الأكاديمية (PISA, etc.).
* خطة الغد (Time Blocking).
* **دعم قرآني مختار بعناية فائقة**: آية تلمس القلب وتعالج الموقف النفسي الحالي، مع تفسير سلوكي لا وعظي.

### 🔹 تنسيق الإخراج:
يجب أن يكون الرد بصيغة JSON حصراً تتوافق مع الـ Schema المحددة.
`;

export const analyzeDayAndPlan = async (
  dailyReflection: string,
  weeklySchedule: WeeklySchedule,
  nextDayName: string
): Promise<AnalysisResponse> => {
  
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const prompt = `
    بيانات المستخدم:
    - ملخص اليوم: "${dailyReflection}"
    - جدول الأسبوع المعتاد: ${JSON.stringify(weeklySchedule)}
    - اليوم التالي هو: ${nextDayName}

    1. قم بالبحث في الويب عن أي مشاكل ذكرتها (مثل قلة النوم، التشتت، القلق) لمعرفة الأسباب والحلول الحديثة.
    2. **التحفيز المتجدد**: ابحث في الويب عن اقتباس تحفيزي أو ديني أو علمي يكون *مميزاً* و*غير تقليدي* يناسب هذه الحالة بدقة. تجنب العبارات المستهلكة لضمان التجدد.
    3. قدم تحليلاً عميقاً وخطة للغد.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}], // Enable Google Search
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
                type: Type.OBJECT,
                properties: {
                    accomplishment: { type: Type.STRING },
                    effortType: { type: Type.STRING, enum: ['mental', 'emotional', 'physical'] },
                    stressLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                    analysisText: { type: Type.STRING, description: "التحليل السلوكي والتعليمي المفصل" }
                }
            },
            webAnalysis: {
                type: Type.OBJECT,
                description: "Insights derived from Google Search regarding the user's state",
                properties: {
                    rootCause: { type: Type.STRING, description: "السبب الجذري للمشكلة بناء على البحث" },
                    suggestedRemedy: { type: Type.STRING, description: "العلاج المقترح بناء على المصادر" },
                    sources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                url: { type: Type.STRING },
                                snippet: { type: Type.STRING }
                            }
                        }
                    }
                }
            },
            motivationalMessage: {
                type: Type.OBJECT,
                description: "A unique, context-aware motivational quote found via web search. Must include source URL if possible in the source field.",
                properties: {
                    text: { type: Type.STRING },
                    source: { type: Type.STRING, description: "Author/Book name and potentially the website source" },
                    category: { type: Type.STRING, enum: ['religious', 'scientific', 'philosophical'] }
                }
            },
            researchConnections: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        point: { type: Type.STRING },
                        source: { type: Type.STRING },
                        evidenceStrength: { type: Type.STRING, enum: ['strong', 'medium', 'limited'] },
                        type: { type: Type.STRING, enum: ['causal', 'correlational'] },
                        relevance: { type: Type.STRING }
                    }
                }
            },
            tomorrowPlan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        time: { type: Type.STRING },
                        task: { type: Type.STRING },
                        method: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['study', 'break', 'sleep', 'prayer'] }
                    }
                }
            },
            recommendedMethods: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        methodName: { type: Type.STRING },
                        details: { type: Type.STRING },
                        tools: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            },
            psychologicalSupport: {
                type: Type.OBJECT,
                properties: {
                    message: { type: Type.STRING },
                    technique: { type: Type.STRING }
                }
            },
            quranicLink: {
                type: Type.OBJECT,
                properties: {
                    verse: { type: Type.STRING },
                    surah: { type: Type.STRING },
                    behavioralExplanation: { type: Type.STRING }
                }
            },
            balanceScore: { type: Type.NUMBER, description: "A score from 0 to 100 indicating life/study balance" }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResponse;
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("Error analyzing day:", error);
    throw error;
  }
};