
import { GoogleGenAI } from "@google/genai";
import { WeeklySchedule, AnalysisResponse, GradeLevel, MotivationalMessage, VoiceTutorResponse } from "../types";

// Hardcoded API Key as requested
const apiKey = 'AIzaSyApnA5aQYvVRR0A5n4Fv2ohP_26EJg3nvQ';
const ai = new GoogleGenAI({ apiKey });

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

/**
 * Fetches a brand new, unique inspiration every time it's called.
 * Uses Google Search Grounding to ensure freshness and variety.
 */
export const getFreshInspiration = async (): Promise<MotivationalMessage> => {
    // Generate a random seed based on time to ensure prompt variation
    const seeds = ['Islamic patience', 'Scientific focus', 'Stoic wisdom', 'Academic perseverance', 'Prophetic habits'];
    const randomTopic = seeds[Math.floor(Math.random() * seeds.length)];
    const timeSeed = new Date().toISOString();

    const prompt = `
    مهمتك: البحث في الويب عن اقتباس ديني (آية أو حديث) أو حكمة عميقة **غير مكررة ونادرة**.
    الموضوع العشوائي للبحث: ${randomTopic} - ${timeSeed}.
    
    الشروط:
    1. استخدم Google Search للعثور على شيء جديد. لا تستخدم المقولات المحفوظة الشائعة.
    2. التنسيق المطلوب JSON فقط بدون أي علامات markdown: { "text": "...", "source": "...", "category": "religious" | "scientific" | "wisdom" }
    3. يجب أن يكون النص باللغة العربية الفصحى المؤثرة.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}]
                // responseMimeType: "application/json" cannot be used with tools
            }
        });

        let text = response.text;
        if (!text) throw new Error("No inspiration generated");
        
        text = text.trim();
        if (text.startsWith("```")) {
             text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
        }
        
        return JSON.parse(text) as MotivationalMessage;
    } catch (e) {
        console.error("Failed to fetch fresh inspiration", e);
        // Fallback if AI/Net fails
        return {
            text: "استعن بالله ولا تعجز، فإن في الحركة بركة وفي السعي وصول.",
            source: "حكمة",
            category: "religious"
        };
    }
};

/**
 * Voice Tutor: Evaluates a student's spoken explanation of a subject.
 */
export const evaluateRecap = async (
  transcript: string,
  subject: string,
  gradeLevel: GradeLevel
): Promise<VoiceTutorResponse> => {
  const prompt = `
    أنت معلم مصري خبير وحازم ولكن مشجع.
    الطالب في المرحلة: ${gradeLevel}.
    المادة: ${subject}.
    قام الطالب بشرح ما فهمه في التسجيل التالي: "${transcript}"

    المطلوب:
    1. قيم فهم الطالب من 100.
    2. استخدم Google Search للتأكد من دقة المعلومات في المنهج المصري.
    3. حدد المفاهيم الناقصة التي كان يجب ذكرها.
    4. صحح أي معلومة خاطئة ذكرها الطالب.
    
    Output JSON format only (no markdown):
    {
      "score": number,
      "feedback": "string (encouraging comment in Arabic)",
      "missingConcepts": ["string", "string"],
      "correction": "string (detailed correction if needed)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}]
        // responseMimeType: "application/json" cannot be used with tools
      }
    });

    let text = response.text;
    if (!text) throw new Error("No evaluation generated");
    
    text = text.trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
    }
    
    return JSON.parse(text) as VoiceTutorResponse;
  } catch (e) {
    console.error("Voice Tutor Error", e);
    throw new Error("تعذر تقييم الشرح الصوتي حالياً.");
  }
};
