
import { GoogleGenAI } from "@google/genai";
import { WeeklySchedule, AnalysisResponse, GradeLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// The comprehensive system prompt provided by the user
const SYSTEM_INSTRUCTION = `
أنت "رفيق"، نظام ذكاء اصطناعي تحليلي متقدم وملاح واعي لطلاب المرحلة الثانوية في مصر. وظيفتك تحليل مدخلات المستخدم بعمق، والبحث في الويب عن أسباب مشكلاته وحلولها، وتقديم تقرير متكامل.

### 🔹 الأدوات المتاحة:
1. **Google Search**: استخدم هذه الأداة **إجبارياً** في الحالات التالية:
   - عندما يذكر المستخدم مشكلة (توتر، نسيان، أرق، تسويف) للبحث عن الأسباب والعلاجات.
   - **للبحث عن رسالة تحفيزية**: يجب عليك في *كل مرة* البحث في الويب عن اقتباس أو قصة قصيرة أو آية أو حكمة تناسب *تحديداً* حالة المستخدم النفسية الحالية.
   - **الروابط والمصادر**: عند تقديم روابط (URLs)، يجب أن تكون روابط حقيقية وصالحة تم العثور عليها عبر أداة البحث. يمنع منعاً باتاً تأليف روابط وهمية.

### 🔹 البيانات المرجعية الثابتة (قاعدة المعرفة):
* أبحاث أكاديمية عن الجداول الدراسية (Block Scheduling).
* دراسات PISA وأنظمة التعليم المتفوقة.
* أبحاث النوم (AAP – CDC).
* علم الأعصاب المعرفي (Neuroscience).
* المناهج المصرية الرسمية (مهم جداً: راعِ المرحلة الدراسية للطالب).
* **المصحف الشريف كامل والسنة النبوية** (للدعم الروحي العميق).

### 🔹 المطلوب منك مع **كل رسالة**:

#### 1️⃣ تحليل الويب (Web Analysis)
* ابحث عن أعراض المستخدم.
* حدد "الجذر المشكلة" (Root Cause) بناءً على نتائج البحث.
* اقترح "علاجاً" (Remedy) عملياً.
* أورد المصادر (روابط) التي وجدتها. **تنبيه:** تأكد من صحة الروابط.

#### 2️⃣ التحفيز المخصص (Contextual Motivation)
* ابحث في الويب عن مقولة/آية/حكمة تعالج شعور المستخدم الحالي.
* حاول البحث عن اقتباسات *نادرة* أو *عميقة*.

#### 3️⃣ التقرير المعتاد
* تحليل الإنجاز والضغط.
* خطة الغد (Time Blocking) - خذ في الاعتبار المواد الدراسية الخاصة بمرحلة الطالب.
* **دعم قرآني مختار بعناية فائقة**.

### 🔹 تنسيق الإخراج:
يجب أن يكون الرد بصيغة JSON حصراً.
الهيكل المطلوب:
{
  "summary": {
    "accomplishment": "string",
    "effortType": "mental" | "emotional" | "physical",
    "stressLevel": "low" | "medium" | "high",
    "analysisText": "string (التحليل السلوكي والتعليمي المفصل)"
  },
  "webAnalysis": {
    "rootCause": "string",
    "suggestedRemedy": "string",
    "sources": [ { "title": "string", "url": "string (MUST BE VALID)", "snippet": "string" } ]
  },
  "motivationalMessage": {
    "text": "string",
    "source": "string",
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
  nextDayName: string,
  gradeLevel: GradeLevel
): Promise<AnalysisResponse> => {
  
  const prompt = `
    بيانات المستخدم:
    - المرحلة الدراسية: ${gradeLevel} (المنهج المصري)
    - ملخص اليوم: "${dailyReflection}"
    - جدول الأسبوع المعتاد: ${JSON.stringify(weeklySchedule)}
    - اليوم التالي هو: ${nextDayName}

    1. قم بالبحث في الويب عن مشاكل المستخدم وحلولها. تأكد من أن الروابط المقدمة في JSON صحيحة وتعمل.
    2. ابحث عن اقتباس تحفيزي مميز.
    3. قدم خطة للغد تراعي مواد ${gradeLevel} في مصر (مثل الفيزياء، الكيمياء، الأحياء، التاريخ، الخ حسب الشعبة إن وجدت أو المواد العامة).
    
    **تذكير**: أخرج فقط JSON صالح.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        systemInstruction: SYSTEM_INSTRUCTION,
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
