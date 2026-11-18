import { optionLabel, requiredSelections } from "../exam";
import type { Answer, ExamItem, Option, Question } from "../types";

interface QuestionInputProps {
  question: Question;
  item: ExamItem;
  answer: Answer | undefined;
  onChange: (answer: Answer | null) => void;
}

function orderedOptions(question: Question, item: ExamItem): Option[] {
  const byId = new Map(question.options.map((o) => [o.id, o]));
  return item.optionOrder.map((id) => byId.get(id)).filter((o): o is Option => Boolean(o));
}

function ChoiceInput({ question, item, answer, onChange }: QuestionInputProps) {
  const multiple = question.type === "multiple_response";
  const required = requiredSelections(question);
  const selected = (answer as string[] | undefined) ?? [];
  const options = orderedOptions(question, item);

  const toggle = (id: string) => {
    if (!multiple) {
      onChange([id]);
      return;
    }
    if (selected.includes(id)) {
      const next = selected.filter((s) => s !== id);
      onChange(next.length ? next : null);
    } else if (selected.length < required) {
      onChange([...selected, id]);
    }
  };

  return (
    <fieldset className="choices">
      <legend className="sr-only">{multiple ? `Choose ${required} answers` : "Choose one answer"}</legend>
      {options.map((option, index) => {
        const checked = selected.includes(option.id);
        const disabled = multiple && !checked && selected.length >= required;
        return (
          <label key={option.id} className={`choice${checked ? " choice-selected" : ""}${disabled ? " choice-disabled" : ""}`}>
            <input
              type={multiple ? "checkbox" : "radio"}
              name={`q-${question.id}`}
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(option.id)}
            />
            <span className="choice-letter">{optionLabel(index)}.</span>
            <span className="choice-text">{option.text}</span>
          </label>
        );
      })}
      {multiple && (
        <p className="selection-hint" aria-live="polite">
          Selected {selected.length} of {required}
        </p>
      )}
    </fieldset>
  );
}

function OrderingInput({ question, item, answer, onChange }: QuestionInputProps) {
  const placed = (answer as string[] | undefined) ?? [];
  const options = orderedOptions(question, item);
  const byId = new Map(options.map((o) => [o.id, o]));
  const available = options.filter((o) => !placed.includes(o.id));

  const set = (next: string[]) => onChange(next.length ? next : null);
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= placed.length) return;
    const next = [...placed];
    [next[index], next[target]] = [next[target], next[index]];
    set(next);
  };

  return (
    <div className="ordering">
      <div className="ordering-column">
        <h3 className="column-title">Responses</h3>
        {available.length === 0 ? (
          <p className="column-empty">All responses placed.</p>
        ) : (
          <ul className="ordering-list">
            {available.map((option) => (
              <li key={option.id}>
                <button type="button" className="ordering-item ordering-available" onClick={() => set([...placed, option.id])}>
                  <span className="ordering-text">{option.text}</span>
                  <span className="ordering-action" aria-hidden="true">Add →</span>
                  <span className="sr-only">Add to the end of the ordered list</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="ordering-column">
        <h3 className="column-title">Ordered steps</h3>
        {placed.length === 0 ? (
          <p className="column-empty">Select responses to place them in order.</p>
        ) : (
          <ol className="ordering-list">
            {placed.map((id, index) => (
              <li key={id} className="ordering-item ordering-placed">
                <span className="ordering-index">{index + 1}</span>
                <span className="ordering-text">{byId.get(id)?.text}</span>
                <span className="ordering-controls">
                  <button type="button" className="icon-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => move(index, 1)}
                    disabled={index === placed.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button type="button" className="icon-btn" onClick={() => set(placed.filter((p) => p !== id))} aria-label="Remove">
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function MatchingInput({ question, item, answer, onChange }: QuestionInputProps) {
  const matches = (answer as Record<string, string> | undefined) ?? {};
  const options = orderedOptions(question, item);
  const promptsById = new Map((question.prompts ?? []).map((p) => [p.id, p]));
  const prompts = (item.promptOrder ?? []).map((id) => promptsById.get(id)).filter(Boolean);

  const setMatch = (promptId: string, optionId: string) => {
    const next = { ...matches };
    if (optionId) next[promptId] = optionId;
    else delete next[promptId];
    onChange(Object.keys(next).length ? next : null);
  };

  return (
    <div className="matching">
      {prompts.map((prompt) =>
        prompt ? (
          <div key={prompt.id} className="matching-row">
            <label className="matching-prompt" htmlFor={`m-${question.id}-${prompt.id}`}>
              {prompt.text}
            </label>
            <select
              id={`m-${question.id}-${prompt.id}`}
              className="matching-select"
              value={matches[prompt.id] ?? ""}
              onChange={(event) => setMatch(prompt.id, event.target.value)}
            >
              <option value="">Select a response</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.text}
                </option>
              ))}
            </select>
          </div>
        ) : null,
      )}
    </div>
  );
}

export default function QuestionInput(props: QuestionInputProps) {
  switch (props.question.type) {
    case "ordering":
      return <OrderingInput {...props} />;
    case "matching":
      return <MatchingInput {...props} />;
    default:
      return <ChoiceInput {...props} />;
  }
}
