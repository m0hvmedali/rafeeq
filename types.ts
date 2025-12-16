export interface WeeklySchedule {
  [key: string]: string[];
}

export interface PlanItem {
  time: string;
  task: string;
  method: string; // Specific study method
  type: 'study' | 'break' | 'sleep' | 'prayer';
}

export interface StudyMethod {
  subject: string;
  methodName: string; // e.g., Spaced Repetition
  details: string;
  tools: string[]; // e.g., Flashcards, Pomodoro
}

export interface ResearchConnection {
  point: string;
  source: string; // e.g., PISA, AAP
  evidenceStrength: 'strong' | 'medium' | 'limited';
  type: 'causal' | 'correlational';
  relevance: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebAnalysis {
  rootCause: string;
  suggestedRemedy: string;
  sources: WebSearchResult[];
}

export interface PsychSupport {
  message: string;
  technique: string; // e.g., CBT, Reframing
}

export interface QuranicLink {
  verse: string;
  surah: string;
  behavioralExplanation: string; // Not preaching, behavioral link
}

export interface MotivationalMessage {
  text: string;
  source: string;
  category: 'religious' | 'scientific' | 'philosophical';
}

export interface AnalysisResponse {
  // 1. Daily Analysis
  summary: {
    accomplishment: string;
    effortType: 'mental' | 'emotional' | 'physical';
    stressLevel: 'low' | 'medium' | 'high';
    analysisText: string;
  };

  // 2. Web Search & Root Cause Analysis
  webAnalysis: WebAnalysis;

  // 3. Academic Research Connections (Internal Knowledge)
  researchConnections: ResearchConnection[];

  // 4. Tomorrow's Plan
  tomorrowPlan: PlanItem[];

  // 5. Study Methods
  recommendedMethods: StudyMethod[];

  // 6. Psych Support
  psychologicalSupport: PsychSupport;

  // 7. Quranic Link
  quranicLink: QuranicLink;

  // 8. Dynamic Web-sourced Motivation
  motivationalMessage: MotivationalMessage;
  
  // Dashboard Stats (Calculated by AI)
  balanceScore: number; // 0-100
}

export const DAYS_OF_WEEK = [
  "السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"
];