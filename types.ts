
export interface WeeklySchedule {
  [key: string]: string[];
}

export type GradeLevel = 'الصف الأول الثانوي' | 'الصف الثاني الثانوي' | 'الصف الثالث الثانوي';

export interface UserProfile {
  name: string;
  grade: GradeLevel;
}

export interface PlanItem {
  time: string;
  task: string;
  method: string; 
  type: 'study' | 'break' | 'sleep' | 'prayer';
}

export interface StudyMethod {
  subject: string;
  methodName: string; 
  details: string;
  tools: string[]; 
}

export interface ResearchConnection {
  point: string;
  source: string; 
  evidenceStrength: 'strong' | 'medium' | 'limited';
  type: 'causal' | 'correlational';
  relevance: string;
}

export interface MotivationalMessage {
  text: string;
  source: string;
  category: 'religious' | 'scientific' | 'philosophical' | 'wisdom';
}

export interface AnalysisResponse {
  summary: {
    accomplishment: string;
    effortType: 'mental' | 'emotional' | 'physical';
    stressLevel: 'low' | 'medium' | 'high';
    analysisText: string;
  };
  webAnalysis: {
    rootCause: string;
    suggestedRemedy: string;
    sources: { title: string; url: string; snippet: string }[];
  };
  motivationalMessage: MotivationalMessage;
  researchConnections: ResearchConnection[];
  tomorrowPlan: PlanItem[];
  recommendedMethods: StudyMethod[];
  psychologicalSupport: {
    message: string;
    technique: string;
  };
  quranicLink: {
    verse: string;
    surah: string;
    behavioralExplanation: string;
  };
  balanceScore: number;
}

export interface VoiceTutorResponse {
  score: number;
  feedback: string;
  missingConcepts: string[];
  correction: string;
}

export const DAYS_OF_WEEK = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة"
];
