import { getQuestion } from "../exam";
import type { Answer, ExamSession } from "../types";
import ExamHeader from "./ExamHeader";
import QuestionInput from "./QuestionInput";

interface ExamScreenProps {
  session: ExamSession;
  remainingMs: number;
  onAnswer: (questionId: string, answer: Answer | null) => void;
  onToggleFlag: (questionId: string) => void;
  onGoTo: (index: number) => void;
  onReview: () => void;
}

export default function ExamScreen({ session, remainingMs, onAnswer, onToggleFlag, onGoTo, onReview }: ExamScreenProps) {
  const total = session.items.length;
  const index = session.current;
  const item = session.items[index];
  const question = getQuestion(item.questionId);
  const flagged = session.flagged.includes(question.id);
  const isLast = index === total - 1;

  return (
    <div className="exam-layout">
      <ExamHeader remainingMs={remainingMs} position={{ current: index + 1, total }} />

      <div className="toolbar">
        <label className={`flag-toggle${flagged ? " flag-on" : ""}`}>
          <input type="checkbox" checked={flagged} onChange={() => onToggleFlag(question.id)} />
          <span className="flag-icon" aria-hidden="true">⚑</span>
          Flag for review
        </label>
      </div>

      <main className="question-area">
        <div className="question-card">
          <p className="question-number">Question {index + 1}</p>
          <p className="question-text">{question.question}</p>
          {question.type === "ordering" && (
            <p className="question-instruction">Select each response in the correct order. Use the arrows to reorder.</p>
          )}
          {question.type === "matching" && (
            <p className="question-instruction">Select the correct response for each item.</p>
          )}
          <QuestionInput
            key={question.id}
            question={question}
            item={item}
            answer={session.answers[question.id]}
            onChange={(answer) => onAnswer(question.id, answer)}
          />
        </div>
      </main>

      <footer className="nav-bar">
        <button type="button" className="btn btn-nav" onClick={() => onGoTo(index - 1)} disabled={index === 0}>
          ← Previous
        </button>
        <button type="button" className="btn btn-nav" onClick={onReview}>
          Review
        </button>
        {isLast ? (
          <button type="button" className="btn btn-primary" onClick={onReview}>
            Finish →
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => onGoTo(index + 1)}>
            Next →
          </button>
        )}
      </footer>
    </div>
  );
}
