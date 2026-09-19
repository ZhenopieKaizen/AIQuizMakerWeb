export type QuestionType = 'mcq' | 'true_false' | 'identification';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'mixed';
export type QuizLanguage = 'english' | 'tagalog' | 'taglish';
export type StudyMode = 'quiz' | 'flashcards';

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[]; // Required for mcq and true_false
  correctAnswer: string;
  explanation: string;
  teacherComment?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  userFlagged?: boolean;
}

export interface QuizConfig {
  questionCount: number; // 5, 10, 15, 20
  questionTypes: QuestionType[];
  difficulty: DifficultyLevel;
  language: QuizLanguage;
  studyMode: StudyMode;
  instantFeedback: boolean;
  timeLimitMinutes: number;
  topicTitle: string;
}

export interface DocumentSource {
  fileName: string;
  fileSize: number;
  fileType: 'docx';
  extractedText: string;
  itemCount: number; // extracted paragraph/section count
  characterCount: number;
  uploadDate: string;
}

export interface QuizResult {
  id: string;
  title: string;
  date: string;
  sourceFileName: string;
  totalQuestions: number;
  score: number;
  percentage: number;
  timeSpentSeconds: number;
  config: QuizConfig;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: number;
  front: string; // Question or Concept
  back: string; // Answer or Definition
  explanation: string;
  mastery?: 'easy' | 'medium' | 'hard';
}
