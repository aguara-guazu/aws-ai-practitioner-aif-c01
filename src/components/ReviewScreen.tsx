import { useState } from "react";
import { getQuestion, isAnswered } from "../exam";
import type { ExamSession } from "../types";
import ExamHeader from "./ExamHeader";
import Modal from "./Modal";

type Filter = "all" | "incomplete" | "flagged";

interface ReviewScreenProps {
  session: ExamSession;
  remainingMs: number;
  onGoTo: (index: number) => void;
  onSubmit: () => void;
}

export default function ReviewScreen({ session, remainingMs, onGoTo, onSubmit }: ReviewScreenProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [confirming, setConfirming] = useState(false);

  const rows = session.items.map((item, index) => {
    const question = getQuestion(item.questionId);
    return {
      index,
      answered: isAnswered(question, session.answers[item.questionId]),
      flagged: session.flagged.includes(item.questionId),
    };
  });

  const incomplete = rows.filter((r) => !r.answered).length;
  const flagged = rows.filter((r) => r.flagged).length;
  const visible = rows.filter((r) => (filter === "incomplete" ? !r.answered : filter === "flagged" ? r.flagged : true));

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: rows.length },
    { key: "incomplete", label: "Incomplete", count: incomplete },
    { key: "flagged", label: "Flagged", count: flagged },
  ];

  return (
    <div className="exam-layout">
      <ExamHeader remainingMs={remainingMs} />

      <main className="question-area">
        <div className="question-card">
          <h1 className="review-title">Review screen</h1>
          <p className="review-intro">
            Select a question to return to it. Incomplete questions are scored as incorrect. When you are ready, end the exam to see
            your score.
          </p>

          <div className="review-filters" role="tablist" aria-label="Filter questions">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className={`filter-btn${filter === f.key ? " filter-active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label} <span className="filter-count">{f.count}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="column-empty">No questions in this view.</p>
          ) : (
            <div className="review-grid">
              {visible.map((row) => (
                <button
                  key={row.index}
                  type="button"
                  className={`review-tile${row.answered ? " tile-answered" : " tile-incomplete"}${row.flagged ? " tile-flagged" : ""}`}
                  onClick={() => onGoTo(row.index)}
                  aria-label={`Question ${row.index + 1}, ${row.answered ? "answered" : "incomplete"}${row.flagged ? ", flagged" : ""}`}
                >
                  <span className="tile-number">{row.index + 1}</span>
                  <span className="tile-status">{row.answered ? "Answered" : "Incomplete"}</span>
                  {row.flagged && (
                    <span className="tile-flag" aria-hidden="true">
                      ⚑
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="nav-bar">
        <button type="button" className="btn btn-nav" onClick={() => onGoTo(session.current)}>
          ← Return to question {session.current + 1}
        </button>
        <span className="nav-spacer" />
        <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
          End exam
        </button>
      </footer>

      {confirming && (
        <Modal
          title="End exam?"
          confirmLabel="End exam"
          cancelLabel="Keep reviewing"
          onConfirm={onSubmit}
          onCancel={() => setConfirming(false)}
        >
          {incomplete > 0 ? (
            <p>
              You have <strong>{incomplete}</strong> incomplete {incomplete === 1 ? "question" : "questions"}. They will be scored as
              incorrect.
            </p>
          ) : (
            <p>All questions are answered.</p>
          )}
          <p>You cannot return to the exam after ending it.</p>
        </Modal>
      )}
    </div>
  );
}
