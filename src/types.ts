export type QuestionType = "single_choice" | "multiple_response" | "ordering" | "matching";

export interface Option {
  id: string;
  text: string;
}

export interface Prompt {
  id: string;
  text: string;
}

export interface DistractorNote {
  optionText: string;
  reason: string;
  contrastingSituation?: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface Question {
  id: string;
  domain: number;
  objective: string;
  conceptId: string;
  type: QuestionType;
  question: string;
  options: Option[];
  correctAnswers: string[];
  prompts?: Prompt[];
  correctMatches?: Record<string, string>;
  explanation: string;
  distractorNotes?: DistractorNote[];
  sources: Source[];
}

/** Option ids for choice and ordering items; prompt id to option id for matching items. */
export type Answer = string[] | Record<string, string>;

export interface ExamItem {
  questionId: string;
  optionOrder: string[];
  promptOrder?: string[];
}

export type Phase = "exam" | "review" | "result";

export interface ExamSession {
  version: 1;
  items: ExamItem[];
  answers: Record<string, Answer>;
  flagged: string[];
  current: number;
  startedAt: number;
  deadline: number;
  phase: Phase;
  submittedAt?: number;
  revealed?: boolean;
}

export interface DomainResult {
  domain: number;
  name: string;
  weight: number;
  correct: number;
  total: number;
}

export interface ExamResult {
  correct: number;
  total: number;
  scaledScore: number;
  passed: boolean;
  domains: DomainResult[];
  incorrectIndexes: number[];
  elapsedMs: number;
}
