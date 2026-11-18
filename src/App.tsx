import { useCallback, useEffect, useState } from "react";
import { createSession } from "./exam";
import { loadSession, saveSession } from "./storage";
import type { Answer, ExamSession } from "./types";
import StartScreen from "./components/StartScreen";
import ExamScreen from "./components/ExamScreen";
import ReviewScreen from "./components/ReviewScreen";
import ResultScreen from "./components/ResultScreen";

export default function App() {
  const [session, setSession] = useState<ExamSession | null>(() => loadSession());
  const [now, setNow] = useState(() => Date.now());
  const [started, setStarted] = useState(false);

  const update = useCallback((next: ExamSession | null) => {
    setSession(next);
    saveSession(next);
  }, []);

  const running = session !== null && session.phase !== "result";

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (session && session.phase !== "result" && now >= session.deadline) {
      update({ ...session, phase: "result", submittedAt: session.deadline });
    }
  }, [now, session, update]);

  useEffect(() => {
    if (!running) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [session?.phase, session?.current]);

  if (!session || (!started && session.phase !== "result")) {
    return (
      <StartScreen
        inProgress={session !== null && session.phase !== "result" && session.deadline > Date.now()}
        onStart={() => {
          const fresh = createSession();
          setNow(fresh.startedAt);
          update(fresh);
          setStarted(true);
        }}
        onResume={() => {
          setNow(Date.now());
          setStarted(true);
        }}
      />
    );
  }

  const remainingMs = session.deadline - now;

  const setAnswer = (questionId: string, answer: Answer | null) => {
    const answers = { ...session.answers };
    if (answer === null) delete answers[questionId];
    else answers[questionId] = answer;
    update({ ...session, answers });
  };

  const toggleFlag = (questionId: string) => {
    const flagged = session.flagged.includes(questionId)
      ? session.flagged.filter((id) => id !== questionId)
      : [...session.flagged, questionId];
    update({ ...session, flagged });
  };

  const goTo = (index: number) => update({ ...session, phase: "exam", current: index });

  const submit = () => update({ ...session, phase: "result", submittedAt: Math.min(Date.now(), session.deadline) });

  const startNew = () => {
    update(null);
    setStarted(false);
  };

  if (session.phase === "result") {
    return (
      <ResultScreen
        session={session}
        onReveal={() => update({ ...session, revealed: true })}
        onNewExam={startNew}
      />
    );
  }

  if (session.phase === "review") {
    return (
      <ReviewScreen
        session={session}
        remainingMs={remainingMs}
        onGoTo={goTo}
        onSubmit={submit}
      />
    );
  }

  return (
    <ExamScreen
      session={session}
      remainingMs={remainingMs}
      onAnswer={setAnswer}
      onToggleFlag={toggleFlag}
      onGoTo={goTo}
      onReview={() => update({ ...session, phase: "review" })}
    />
  );
}
