
export interface WeeklySchedule {
  [key: string]: string[];
}

export type GradeLevel = 'الصف الأول الثانوي' | 'الصف الثاني الثانوي' | 'الصف الثالث الثانوي';

export interface UserProfile {
  name: string;
  grade: GradeLevel;
}

export interface InterestProfile {
  religious: number;
  scientific: number;
  philosophical: number;
  practical: number;
  emotional: number;
  preferredTone: 'gentle' | 'firm' | 'analytical';
}

export interface UserPreferences {
  theme: 'dark' | 'high-contrast';
  fontSize: 'normal' | 'large' | 'xl';
  reduceMotion: boolean;
  interestProfile: InterestProfile;
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastLoginDate: string;
  totalEntries: number;
}

export interface InteractionEntry {
  id: string;
  timestamp: number;
  type: 'analysis' | 'quote' | 'voice_recap' | 'focus_session' | 'schedule_task';
  contentSummary: string;
  aiResponseId?: string;
  userFeedback?: 'like' | 'dislike' | null;
  tags: string[];
  xpGained: number;
}

export interface MemoryFile {
  version: number;
  lastUpdated: string;
  interactions: InteractionEntry[];
  learnedPatterns: {
      favoriteTopics: string[];
      recurringIssues: string[];
  };
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

export interface LessonIntelligence {
  difficulty: 'easy' | 'medium' | 'hard';
  reflectionText: string;
  researchInsights: string;
}

export interface AnalysisResponse {
  source?: 'ai' | 'memory' | 'static';
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
  lessonIntelligence?: LessonIntelligence;
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
