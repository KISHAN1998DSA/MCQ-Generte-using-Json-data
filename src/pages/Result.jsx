import { useMemo, useState } from "react";
import { CircleCheckBig, CircleX, RotateCcw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import QuestionNavigator from "../components/QuestionNavigator";
import ResultCard from "../components/ResultCard";
import subjects from "../data/subjects";
import { calculateResult, formatTime } from "../utils/questionUtils";
import { getSession, saveSession } from "../utils/storage";

function Result() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const session = getSession(sessionId);
  const summary = session ? calculateResult(session) : null;

  const reviewQuestions = useMemo(() => {
    if (!session || !summary) return [];
    return session.questions.filter((question, index) => {
      const selected = session.answers[index];
      if (filter === "correct") return selected === question.answer;
      if (filter === "wrong") {
        return selected !== undefined && selected !== null && selected !== question.answer;
      }
      if (filter === "unanswered") return selected === undefined || selected === null;
      return true;
    });
  }, [filter, session, summary]);

  if (!session || !summary) {
    return <div className="panel p-6 text-danger">Result not found. Please start a new practice test.</div>;
  }

  const handleRetryWrong = () => {
    const wrongQuestions = session.questions.filter((question, index) => {
      const selected = session.answers[index];
      return selected !== undefined && selected !== null && selected !== question.answer;
    });
    const retrySessionId = `${session.subjectId}-retry-${Date.now()}`;
    saveSession({
      ...session,
      id: retrySessionId,
      questions: wrongQuestions,
      answers: {},
      visited: wrongQuestions.length ? { 0: true } : {},
      startedAt: Date.now(),
      submittedAt: null,
      elapsedSeconds: 0,
      retrySource: session.id,
    });
    navigate(`/practice/${retrySessionId}`);
  };

  const handlePracticeAgain = () => {
    navigate(`/setup/${session.subjectId}`);
  };

  const percentageStyle = { background: `conic-gradient(#1f7ae0 ${summary.percentage * 3.6}deg, #e2e8f0 0deg)` };
  const averageTime = session.questions.length
    ? Math.round(session.elapsedSeconds / session.questions.length)
    : 0;
  const activeSubject = subjects.find((subject) => subject.id === session.subjectId);

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center">
            <div style={percentageStyle} className="flex h-48 w-48 items-center justify-center rounded-full p-4">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-center dark:bg-slate-900">
                <div>
                  <p className="text-sm text-slate-500">Score</p>
                  <p className="text-4xl font-bold">{summary.percentage}%</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-slate-500">
              {session.subjectTitle} | {activeSubject?.description}
            </p>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-3xl font-bold">Result Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-3">
              <ResultCard label="Score" value={`${summary.correct} / ${session.questions.length}`} />
              <ResultCard label="Accuracy" value={`${summary.accuracy}%`} />
              <ResultCard label="Percentage" value={`${summary.percentage}%`} />
              <ResultCard label="Correct" value={summary.correct} tone="success" />
              <ResultCard label="Wrong" value={summary.wrong} tone="danger" />
              <ResultCard label="Unanswered" value={summary.unanswered} tone="warning" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/70">
                <p className="text-slate-500">Time taken</p>
                <p className="mt-2 text-xl font-semibold">{formatTime(session.elapsedSeconds)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/70">
                <p className="text-slate-500">Average time/question</p>
                <p className="mt-2 text-xl font-semibold">{formatTime(averageTime)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleRetryWrong}
                disabled={!summary.wrong}
                className="btn-primary"
              >
                Retry Wrong Questions
              </button>
              <button type="button" onClick={handlePracticeAgain} className="btn-secondary">
                <RotateCcw className="mr-2 h-4 w-4" />
                Practice Again
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <QuestionNavigator
          questions={session.questions}
          currentIndex={-1}
          answers={session.answers}
          visited={session.visited}
          onJump={() => {}}
          showReviewState
        />

        <div className="panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">Review Questions</h2>
              <p className="text-sm text-slate-500">Review every answer with explanations.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", "correct", "wrong", "unanswered"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    filter === value
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {reviewQuestions.map((question) => {
              const index = session.questions.findIndex((item) => item.id === question.id);
              const selected = session.answers[index];
              const status =
                selected === undefined || selected === null
                  ? "unanswered"
                  : selected === question.answer
                    ? "correct"
                    : "wrong";
              return (
                <article key={question.id} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    {status === "correct" ? (
                      <CircleCheckBig className="mt-1 h-5 w-5 shrink-0 text-accent" />
                    ) : status === "wrong" ? (
                      <CircleX className="mt-1 h-5 w-5 shrink-0 text-danger" />
                    ) : (
                      <span className="mt-1 inline-block h-5 w-5 shrink-0 rounded-full border border-slate-300" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Question {index + 1}</p>
                      <p className="mt-1 text-sm leading-7">{question.question}</p>
                      <p className="mt-3 text-sm">
                        <span className="font-semibold">User Answer:</span>{" "}
                        {selected === undefined || selected === null
                          ? "Unanswered"
                          : question.options[selected] || "Invalid option"}
                      </p>
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">Correct Answer:</span>{" "}
                        {question.answer === null ? "Invalid answer index" : question.options[question.answer]}
                      </p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
            {!reviewQuestions.length && (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70">
                No questions match this filter.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Result;
