import { GoogleGenAI } from "@google/genai";
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
* أورد المصادر (روابط) التي وجدتها في قسم المصادر.

#### 2️⃣ التحفيز المخصص (Contextual Motivation) - عبر الويب
* **هام:** لا تعتمد على ذاكرتك فقط. ابحث في الويب عن مقولة/آية/حكمة تعالج شعور المستخدم الحالي (يأس، تعب، تشتت).
* **شرط عدم التكرار:** حاول البحث عن اقتباسات *نادرة* أو *عميقة* أو من مصادر متنوعة (أدباء، علماء، نصوص دينية) لضمان أن لا يحصل المستخدم على نفس النصيحة مرتين. اجعل البحث محدداً جداً بكلمات المستخدم المفتاحية.

#### 3️⃣ التقرير المعتاد
* تحليل الإنجاز والضغط.
* ربط بالأبحاث الأكاديمية (PISA, etc.).
* خطة الغد (Time Blocking).
* **دعم قرآني مختار بعناية فائقة**: آية تلمس القلب وتعالج الموقف النفسي الحالي، مع تفسير سلوكي لا وعظي.

### 🔹 تنسيق الإخراج:
يجب أن يكون الرد بصيغة JSON حصراً. لا تضع أي مقدمات أو خاتمة نصية.
الهيكل المطلوب:
{
  "summary": {
    "accomplishment": "string",
    "effortType": "mental" | "emotional" | "physical",
    "stressLevel": "low" | "medium" | "high",
    "analysisText": "string (التحليل السلوكي والتعليمي المفصل)"
  },
  "webAnalysis": {
    "rootCause": "string (السبب الجذري للمشكلة بناء على البحث)",
    "suggestedRemedy": "string (العلاج المقترح بناء على المصادر)",
    "sources": [ { "title": "string", "url": "string", "snippet": "string" } ]
  },
  "motivationalMessage": {
    "text": "string",
    "source": "string (Author/Book name and potentially the website source)",
    "category": "religious" | "scientific" | "philosophical"
  },
  "researchConnections": [ { "point": "string", "source": "string", "evidenceStrength": "strong" | "medium" | "limited", "type": "causal" | "correlational", "relevance": "string" } ],
  "tomorrowPlan": [ { "time": "string", "task": "string", "method": "string", "type": "study" | "break" | "sleep" | "prayer" } ],
  "recommendedMethods": [ { "subject": "string", "methodName": "string", "details": "string", "tools": ["string"] } ],
  "psychologicalSupport": { "message": "string", "technique": "string" },
  "quranicLink": { "verse": "string", "surah": "string", "behavioralExplanation": "string" },
  "balanceScore": number (0-100)
}
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
    
    **تذكير**: أخرج فقط JSON صالح.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}], // Enable Google Search
        systemInstruction: SYSTEM_INSTRUCTION,
        // responseMimeType and responseSchema removed as they are incompatible with tools
      }
    });

    let text = response.text;
    if (!text) {
        throw new Error("Empty response from AI");
    }

    // Clean up potential markdown code blocks
    text = text.trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
    }

    return JSON.parse(text) as AnalysisResponse;
  } catch (error) {
    console.error("Error analyzing day:", error);
    throw error;
  }
};