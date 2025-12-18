import { AnalysisResponse } from "../types.ts";

/* =========================
   1. VALIDATOR (SAFE CORE)
========================= */
const validateAndRepairResponse = (data: any): AnalysisResponse => ({
  summary: {
    accomplishment: data?.summary?.accomplishment || "تم تحليل الموقف باستخدام مصادر بديلة",
    effortType: data?.summary?.effortType || "mental",
    stressLevel: data?.summary?.stressLevel || "medium",
    analysisText:
      data?.summary?.analysisText ||
      "الخدمات الذكية غير متاحة حالياً، تم الاعتماد على تحليل معرفي عام."
  },
  webAnalysis: data?.webAnalysis || {
    rootCause: "مصادر عامة",
    suggestedRemedy: "الاستمرار في المذاكرة المنظمة",
    sources: []
  },
  motivationalMessage: data?.motivationalMessage || {
    text: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ",
    source: "القرآن الكريم",
    category: "religious"
  },
  tomorrowPlan: data?.tomorrowPlan || [
    { time: "09:00 ص", task: "مراجعة الدروس السابقة", method: "Pomodoro", type: "study" }
  ],
  quranicLink: data?.quranicLink || {
    verse: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    surah: "الشرح",
    behavioralExplanation: "الصبر مع العمل يفتح الأبواب."
  },
  balanceScore: Number(data?.balanceScore) || 65,
  researchConnections: data?.researchConnections || [],
  recommendedMethods: data?.recommendedMethods || [],
  psychologicalSupport: data?.psychologicalSupport || {
    message: "استمر، ما تفعله الآن سيؤتي ثماره.",
    technique: "تنظيم النفس"
  },
  lessonIntelligence: data?.lessonIntelligence || {
    difficulty: "medium",
    reflectionText: "الدرس يتطلب تركيزاً وفهماً تدريجياً."
  }
});

/* =========================
   2. DUCKDUCKGO PARSER
========================= */
const fetchDuckDuckGoResults = async (query: string) => {
  try {
    const url = `https://api.allorigins.win/get?url=${encodeURIComponent(
      `https://html.duckduckgo.com/html/?q=${query}`
    )}`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const { contents } = await res.json();
    if (!contents) return [];

    const results: any[] = [];

    const resultRegex =
      /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet">([\s\S]*?)<\/a>/g;

    let match;
    while ((match = resultRegex.exec(contents)) !== null && results.length < 5) {
      const clean = (str: string) =>
        str.replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, "").trim();

      results.push({
        title: clean(match[2]),
        snippet: clean(match[3]),
        url: match[1]
      });
    }

    return results;
  } catch {
    return [];
  }
};

/* =========================
   3. OPENROUTER (OPTIONAL)
========================= */
export const callOpenRouter = async (prompt: string): Promise<AnalysisResponse> => {
  const OPENROUTER_API_KEY = "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";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        messages: [
          { role: "system", content: "أخرج الرد بصيغة JSON فقط." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!res.ok) throw new Error("OR failed");

    const data = await res.json();
    return validateAndRepairResponse(JSON.parse(data.choices[0].message.content));
  } catch {
    // ❗ لا نكسر السلسلة
    return callDDGFallback(prompt);
  }
};

/* =========================
   4. SAFE MODE (FINAL)
========================= */
export const callDDGFallback = async (query: string): Promise<AnalysisResponse> => {
  const results = await fetchDuckDuckGoResults(query);

  const text =
    results.length > 0
      ? results
          .map(r => `• ${r.title}\n${r.snippet}`)
          .join("\n\n")
      : "الدرس يبدو شائعاً بين الطلاب ويتطلب فهماً تدريجياً وممارسة.";

  return validateAndRepairResponse({
    summary: {
      accomplishment: "وضع الأمان: تحليل مبني على مصادر معرفية عامة",
      analysisText: `بسبب تعذر الوصول للنماذج الذكية، تم تحليل موضوعك اعتماداً على مصادر تعليمية عامة:\n\n${text}\n\nنصيحة: الفهم أهم من السرعة.`
    },
    webAnalysis: {
      rootCause: "تعطل مؤقت في خدمات AI",
      suggestedRemedy: "الاستمرار بخطة مذاكرة ثابتة",
      sources: results
    }
  });
};
