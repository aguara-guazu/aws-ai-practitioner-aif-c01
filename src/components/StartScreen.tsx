import { useState } from "react";
import { BANK, DOMAINS, EXAM_DURATION_MS, EXAM_QUESTION_COUNT, PASSING_SCORE } from "../exam";
import Modal from "./Modal";

interface StartScreenProps {
  inProgress: boolean;
  onStart: () => void;
  onResume: () => void;
}

export default function StartScreen({ inProgress, onStart, onResume }: StartScreenProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  return (
    <div className="page">
      <header className="page-header">
        <span className="exam-code">AIF-C01</span>
        <span className="exam-name">AI Practitioner Practice Exam</span>
      </header>

      <main className="page-main">
        <section className="panel">
          <h1>AWS Certified AI Practitioner practice exam</h1>
          <p className="lead">
            A timed simulation with the same length, time limit, domain weighting and question formats as the AIF-C01 exam. Your score
            is shown only after you end the exam.
          </p>

          <ul className="facts">
            <li>
              <span className="fact-value">{EXAM_QUESTION_COUNT}</span>
              <span className="fact-label">questions</span>
            </li>
            <li>
              <span className="fact-value">{EXAM_DURATION_MS / 60000}</span>
              <span className="fact-label">minutes</span>
            </li>
            <li>
              <span className="fact-value">{PASSING_SCORE}</span>
              <span className="fact-label">to pass (100–1000)</span>
            </li>
          </ul>

          <h2>Rules</h2>
          <ul className="rules">
            <li>Questions are drawn at random from a pool of {BANK.length}, weighted by exam domain.</li>
            <li>Formats: multiple choice, multiple response, ordering and matching.</li>
            <li>There is no partial credit. Unanswered questions are scored as incorrect.</li>
            <li>You can flag questions and revisit them from the review screen before ending the exam.</li>
            <li>The exam ends automatically when time runs out.</li>
            <li>Progress is saved in this browser, so reloading the page does not lose your answers.</li>
          </ul>

          <h2>Domains</h2>
          <table className="domain-table">
            <thead>
              <tr>
                <th scope="col">Domain</th>
                <th scope="col" className="num">
                  Weight
                </th>
                <th scope="col" className="num">
                  Questions
                </th>
              </tr>
            </thead>
            <tbody>
              {DOMAINS.map((d) => (
                <tr key={d.domain}>
                  <td>
                    {d.domain}. {d.name}
                  </td>
                  <td className="num">{d.weight}%</td>
                  <td className="num">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="start-actions">
            {inProgress ? (
              <>
                <button type="button" className="btn btn-primary btn-lg" onClick={onResume}>
                  Resume exam
                </button>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setConfirmDiscard(true)}>
                  Start a new exam
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
                Start exam
              </button>
            )}
          </div>
        </section>
      </main>

      <Disclaimer />

      {confirmDiscard && (
        <Modal
          title="Discard the exam in progress?"
          confirmLabel="Start a new exam"
          onConfirm={onStart}
          onCancel={() => setConfirmDiscard(false)}
        >
          <p>Your current answers will be lost.</p>
        </Modal>
      )}
    </div>
  );
}

export function Disclaimer() {
  return (
    <footer className="disclaimer">
      Unofficial practice simulator. Not affiliated with, endorsed by, or sponsored by Amazon Web Services. Exam format based on the{" "}
      <a href="https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html" target="_blank" rel="noopener noreferrer">
        AIF-C01 exam guide
      </a>
      .
    </footer>
  );
}
