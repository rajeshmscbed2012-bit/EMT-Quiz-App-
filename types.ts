
export type QuestionType = 'Knowledge-Based' | 'Scenario-Based';

// FIX: Removed circular self-import of 'Question' type which caused a name conflict.
export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  questionText: string;
  options: QuestionOption[];
  difficulty: 'Easy' | 'Hard';
}

export interface QuizResult {
  id: number;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  questions: Question[];
  userAnswers: (string | null)[];
  difficulty: 'Easy' | 'Hard';
  questionType: QuestionType;
  topics: string[];
}