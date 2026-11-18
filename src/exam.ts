import bankData from "./data/bank.json";
import type { Answer, DomainResult, ExamItem, ExamResult, ExamSession, Question } from "./types";

export const EXAM_QUESTION_COUNT = 65;
export const EXAM_DURATION_MS = 90 * 60 * 1000;
export const PASSING_SCORE = 700;
export const MIN_SCORE = 100;
export const MAX_SCORE = 1000;

export const DOMAINS: { domain: number; name: string; weight: number; count: number }[] = [
  { domain: 1, name: "Fundamentals of AI and ML", weight: 20, count: 13 },
  { domain: 2, name: "Fundamentals of GenAI", weight: 24, count: 16 },
  { domain: 3, name: "Applications of Foundation Models", weight: 28, count: 18 },
  { domain: 4, name: "Guidelines for Responsible AI", weight: 14, count: 9 },
  { domain: 5, name: "Security, Compliance, and Governance for AI Solutions", weight: 14, count: 9 },
];

export const BANK = bankData as Question[];
const BY_ID = new Map(BANK.map((q) => [q.id, q]));

export function getQuestion(id: string): Question {
  const question = BY_ID.get(id);
  if (!question) throw new Error(`Unknown question ${id}`);
  return question;
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Draw `count` questions from one domain, cycling through concepts in random order
 * so that a concept repeats only after every other concept in the domain was used.
 */
function drawFromDomain(domain: number, count: number): Question[] {
  const byConcept = new Map<string, Question[]>();
  for (const q of BANK) {
    if (q.domain !== domain) continue;
    const list = byConcept.get(q.conceptId) ?? [];
    list.push(q);
    byConcept.set(q.conceptId, list);
  }
  const queues = shuffle([...byConcept.values()].map((list) => shuffle(list)));
  const picked: Question[] = [];
  while (picked.length < count && queues.some((q) => q.length > 0)) {
    for (const queue of queues) {
      if (picked.length === count) break;
      const next = queue.pop();
      if (next) picked.push(next);
    }
  }
  return picked;
}

function buildItem(question: Question): ExamItem {
  const optionIds = question.options.map((o) => o.id);
  let optionOrder = shuffle(optionIds);
  if (question.type === "ordering") {
    while (optionOrder.every((id, i) => id === question.correctAnswers[i])) {
      optionOrder = shuffle(optionIds);
    }
  }
  const item: ExamItem = { questionId: question.id, optionOrder };
  if (question.type === "matching" && question.prompts) {
    item.promptOrder = shuffle(question.prompts.map((p) => p.id));
  }
  return item;
}

export function createSession(now: number = Date.now()): ExamSession {
  const questions = shuffle(DOMAINS.flatMap((d) => drawFromDomain(d.domain, d.count)));
  return {
    version: 1,
    items: questions.map(buildItem),
    answers: {},
    flagged: [],
    current: 0,
    startedAt: now,
    deadline: now + EXAM_DURATION_MS,
    phase: "exam",
  };
}

export function requiredSelections(question: Question): number {
  return question.correctAnswers.length;
}

export function isAnswered(question: Question, answer: Answer | undefined): boolean {
  if (!answer) return false;
  if (question.type === "matching") {
    const matches = answer as Record<string, string>;
    return (question.prompts ?? []).every((p) => Boolean(matches[p.id]));
  }
  const selected = answer as string[];
  if (question.type === "ordering") return selected.length === question.options.length;
  return selected.length === requiredSelections(question);
}

export function isCorrect(question: Question, answer: Answer | undefined): boolean {
  if (!isAnswered(question, answer)) return false;
  if (question.type === "matching") {
    const matches = answer as Record<string, string>;
    const expected = question.correctMatches ?? {};
    return Object.keys(expected).every((promptId) => matches[promptId] === expected[promptId]);
  }
  const selected = answer as string[];
  if (question.type === "ordering") {
    return selected.every((id, i) => id === question.correctAnswers[i]);
  }
  const expected = new Set(question.correctAnswers);
  return selected.length === expected.size && selected.every((id) => expected.has(id));
}

/**
 * AWS does not publish its raw-to-scaled conversion; this maps the share of correct
 * answers linearly onto the 100-1000 scale, so 700 corresponds to about 66.7%.
 */
export function toScaledScore(correct: number, total: number): number {
  if (total === 0) return MIN_SCORE;
  return Math.round(MIN_SCORE + ((MAX_SCORE - MIN_SCORE) * correct) / total);
}

export function scoreSession(session: ExamSession): ExamResult {
  const domains: DomainResult[] = DOMAINS.map((d) => ({
    domain: d.domain,
    name: d.name,
    weight: d.weight,
    correct: 0,
    total: 0,
  }));
  const incorrectIndexes: number[] = [];
  let correct = 0;

  session.items.forEach((item, index) => {
    const question = getQuestion(item.questionId);
    const domain = domains.find((d) => d.domain === question.domain);
    const ok = isCorrect(question, session.answers[item.questionId]);
    if (domain) {
      domain.total += 1;
      if (ok) domain.correct += 1;
    }
    if (ok) correct += 1;
    else incorrectIndexes.push(index);
  });

  const total = session.items.length;
  const scaledScore = toScaledScore(correct, total);
  const end = session.submittedAt ?? Date.now();
  return {
    correct,
    total,
    scaledScore,
    passed: scaledScore >= PASSING_SCORE,
    domains,
    incorrectIndexes,
    elapsedMs: Math.min(end, session.deadline) - session.startedAt,
  };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function optionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}
