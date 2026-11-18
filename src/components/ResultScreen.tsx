import { useMemo, useRef } from "react";
import { MAX_SCORE, MIN_SCORE, PASSING_SCORE, formatDuration, getQuestion, scoreSession } from "../exam";
import type { ExamSession } from "../types";
import { Disclaimer } from "./StartScreen";
import IncorrectQuestion from "./IncorrectQuestion";

interface ResultScreenProps {
  session: ExamSession;
  onReveal: () => void;
  onNewExam: () => void;
}

export default function ResultScreen({ session, onReveal, onNewExam }: ResultScreenProps) {
  const result = useMemo(() => scoreSession(session), [session]);
  const revealRef = useRef<HTMLElement>(null);
  const percent = Math.round((result.correct / result.total) * 100);
  const timedOut = (session.submittedAt ?? 0) >= session.deadline;
  const scorePosition = ((result.scaledScore - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100;
  const passPosition = ((PASSING_SCORE - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100;

  const reveal = () => {
    onReveal();
    window.requestAnimationFrame(() => revealRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="page">
      <header className="page-header">
        <span className="exam-code">AIF-C01</span>
        <span className="exam-name">AI Practitioner Practice Exam</span>
      </header>

      <main className="page-main">
        <section className={`panel result-panel ${result.passed ? "result-pass" : "result-fail"}`}>
          <p className="result-kicker">{timedOut ? "Time expired — exam submitted automatically" : "Exam complete"}</p>
          <div className="result-headline">
            <span className="result-badge">{result.passed ? "PASS" : "FAIL"}</span>
            <div className="result-score">
              <span className="score-value">{result.scaledScore}</span>
              <span className="score-scale">/ {MAX_SCORE}</span>
            </div>
          </div>

          <div className="score-bar" aria-hidden="true">
            <div className="score-fill" style={{ width: `${scorePosition}%` }} />
            <div className="score-pass-mark" style={{ left: `${passPosition}%` }}>
              <span>{PASSING_SCORE}</span>
            </div>
          </div>

          <dl className="result-stats">
            <div>
              <dt>Correct answers</dt>
              <dd>
                {result.correct} of {result.total} ({percent}%)
              </dd>
            </div>
            <div>
              <dt>Minimum passing score</dt>
              <dd>{PASSING_SCORE}</dd>
            </div>
            <div>
              <dt>Time used</dt>
              <dd>{formatDuration(result.elapsedMs)}</dd>
            </div>
          </dl>

          <p className="score-note">
            The scaled score is an approximation: AWS does not publish how it converts correct answers to its 100–1000 scale, so this
            simulator maps your share of correct answers linearly onto it.
          </p>

          <h2>Performance by domain</h2>
          <table className="domain-table result-domains">
            <thead>
              <tr>
                <th scope="col">Domain</th>
                <th scope="col" className="num">
                  Correct
                </th>
                <th scope="col" className="bar-col">
                  Score
                </th>
                <th scope="col">Classification</th>
              </tr>
            </thead>
            <tbody>
              {result.domains.map((d) => {
                const share = d.total ? (d.correct / d.total) * 100 : 0;
                const meets = share >= passPosition;
                return (
                  <tr key={d.domain}>
                    <td>
                      {d.domain}. {d.name}
                      <span className="domain-weight">{d.weight}% of scored content</span>
                    </td>
                    <td className="num">
                      {d.correct}/{d.total}
                    </td>
                    <td className="bar-col">
                      <div className="mini-bar">
                        <div className={`mini-fill${meets ? " fill-ok" : " fill-low"}`} style={{ width: `${share}%` }} />
                      </div>
                    </td>
                    <td className={meets ? "class-ok" : "class-low"}>{meets ? "Meets competencies" : "Needs improvement"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="start-actions">
            {result.incorrectIndexes.length > 0 && !session.revealed && (
              <button type="button" className="btn btn-primary btn-lg" onClick={reveal}>
                Reveal incorrect answers ({result.incorrectIndexes.length})
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-lg" onClick={onNewExam}>
              Start a new exam
            </button>
          </div>
        </section>

        {session.revealed && (
          <section className="incorrect-section" ref={revealRef} aria-labelledby="incorrect-title">
            <h2 id="incorrect-title">Incorrect and unanswered questions ({result.incorrectIndexes.length})</h2>
            {result.incorrectIndexes.map((index) => {
              const item = session.items[index];
              return (
                <IncorrectQuestion
                  key={item.questionId}
                  number={index + 1}
                  question={getQuestion(item.questionId)}
                  item={item}
                  answer={session.answers[item.questionId]}
                />
              );
            })}
          </section>
        )}
      </main>

      <Disclaimer />
    </div>
  );
}
