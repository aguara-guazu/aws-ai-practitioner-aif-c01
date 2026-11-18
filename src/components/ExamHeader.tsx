import { formatDuration } from "../exam";

interface ExamHeaderProps {
  remainingMs: number;
  position?: { current: number; total: number };
}

export default function ExamHeader({ remainingMs, position }: ExamHeaderProps) {
  const warning = remainingMs <= 5 * 60 * 1000;
  return (
    <header className="exam-header">
      <div className="exam-title">
        <span className="exam-code">AIF-C01</span>
        <span className="exam-name">AI Practitioner Practice Exam</span>
      </div>
      <div className="exam-meta">
        <div className={`timer${warning ? " timer-warning" : ""}`} role="timer" aria-live="off">
          <span className="meta-label">Time remaining</span>
          <span className="meta-value">{formatDuration(remainingMs)}</span>
        </div>
        {position && (
          <div className="position">
            <span className="meta-label">Question</span>
            <span className="meta-value">
              {position.current} of {position.total}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
