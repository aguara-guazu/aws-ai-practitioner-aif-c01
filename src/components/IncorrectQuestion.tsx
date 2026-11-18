import { DOMAINS, isAnswered, optionLabel } from "../exam";
import type { Answer, ExamItem, Question, QuestionType } from "../types";

interface IncorrectQuestionProps {
  number: number;
  question: Question;
  item: ExamItem;
  answer: Answer | undefined;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Multiple choice",
  multiple_response: "Multiple response",
  ordering: "Ordering",
  matching: "Matching",
};

function ChoiceReview({ question, item, answer }: Omit<IncorrectQuestionProps, "number">) {
  const selected = new Set((answer as string[] | undefined) ?? []);
  const correct = new Set(question.correctAnswers);
  const byId = new Map(question.options.map((o) => [o.id, o]));

  return (
    <ul className="review-options">
      {item.optionOrder.map((id, index) => {
        const option = byId.get(id);
        if (!option) return null;
        const isCorrect = correct.has(id);
        const isSelected = selected.has(id);
        const state = isCorrect ? "opt-correct" : isSelected ? "opt-wrong" : "";
        return (
          <li key={id} className={`review-option ${state}`}>
            <span className="choice-letter">{optionLabel(index)}.</span>
            <span className="choice-text">{option.text}</span>
            <span className="opt-tags">
              {isSelected && <span className="tag tag-yours">Your answer</span>}
              {isCorrect && <span className="tag tag-correct">Correct</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function OrderingReview({ question, answer }: Omit<IncorrectQuestionProps, "number">) {
  const placed = (answer as string[] | undefined) ?? [];
  const byId = new Map(question.options.map((o) => [o.id, o]));
  return (
    <div className="compare-grid">
      <div>
        <h4>Your order</h4>
        {placed.length === 0 ? (
          <p className="column-empty">Not answered</p>
        ) : (
          <ol className="compare-list">
            {placed.map((id, i) => (
              <li key={id} className={id === question.correctAnswers[i] ? "opt-correct" : "opt-wrong"}>
                {byId.get(id)?.text}
              </li>
            ))}
          </ol>
        )}
      </div>
      <div>
        <h4>Correct order</h4>
        <ol className="compare-list">
          {question.correctAnswers.map((id) => (
            <li key={id} className="opt-correct">
              {byId.get(id)?.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function MatchingReview({ question, item, answer }: Omit<IncorrectQuestionProps, "number">) {
  const matches = (answer as Record<string, string> | undefined) ?? {};
  const expected = question.correctMatches ?? {};
  const byId = new Map(question.options.map((o) => [o.id, o]));
  const prompts = new Map((question.prompts ?? []).map((p) => [p.id, p]));

  return (
    <table className="match-table">
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col">Your response</th>
          <th scope="col">Correct response</th>
        </tr>
      </thead>
      <tbody>
        {(item.promptOrder ?? []).map((promptId) => {
          const given = matches[promptId];
          const ok = given === expected[promptId];
          return (
            <tr key={promptId}>
              <td>{prompts.get(promptId)?.text}</td>
              <td className={ok ? "opt-correct" : "opt-wrong"}>{given ? byId.get(given)?.text : "Not answered"}</td>
              <td className="opt-correct">{byId.get(expected[promptId])?.text}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function IncorrectQuestion({ number, question, item, answer }: IncorrectQuestionProps) {
  const domain = DOMAINS.find((d) => d.domain === question.domain);
  const answered = isAnswered(question, answer);

  return (
    <article className="incorrect-card">
      <header className="incorrect-header">
        <span className="incorrect-number">Question {number}</span>
        <span className="incorrect-meta">
          Domain {question.domain}: {domain?.name} · Task {question.objective} · {TYPE_LABELS[question.type]}
        </span>
        {!answered && <span className="tag tag-unanswered">Incomplete</span>}
      </header>

      <p className="question-text">{question.question}</p>

      {question.type === "ordering" ? (
        <OrderingReview question={question} item={item} answer={answer} />
      ) : question.type === "matching" ? (
        <MatchingReview question={question} item={item} answer={answer} />
      ) : (
        <ChoiceReview question={question} item={item} answer={answer} />
      )}

      <div className="explanation">
        <h4>Explanation</h4>
        <p>{question.explanation}</p>
      </div>

      {question.distractorNotes && question.distractorNotes.length > 0 && (
        <div className="distractors">
          <h4>Why the other responses are wrong</h4>
          <ul>
            {question.distractorNotes.map((note) => (
              <li key={note.optionText}>
                <strong>{note.optionText}:</strong> {note.reason}
                {note.contrastingSituation && <span className="contrast"> Fits a scenario such as: {note.contrastingSituation}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sources">
        <h4>Sources</h4>
        <ul>
          {question.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
