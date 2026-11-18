import { BANK } from "./exam";
import type { ExamSession } from "./types";

const SESSION_KEY = "aif-c01-simulator:session:v1";
const KNOWN_IDS = new Set(BANK.map((q) => q.id));

export function loadSession(): ExamSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ExamSession;
    if (session.version !== 1 || !Array.isArray(session.items)) return null;
    if (!session.items.every((item) => KNOWN_IDS.has(item.questionId))) return null;
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: ExamSession | null): void {
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    return;
  }
}
