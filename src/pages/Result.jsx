import { useMemo, useState } from "react";
import { CircleCheckBig, CircleX, RotateCcw, Trophy, Zap } from "lucide-react";
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

  const percentageStyle = {
    background: `conic-gradient(#7c3aed ${summary.percentage * 3.6}deg, rgba(226,232,240,0.9) 0deg)`,
  };
  const averageTime = session.questions.length
    ? Math.round(session.elapsedSeconds / session.questions.length)
    : 0;
  const activeSubject = subjects.find((subject) => subject.id === session.subjectId);

  return (
    <div className="space-y-4">
      <section className="panel p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600">
          <Trophy className="h-3.5 w-3.5" />
          Result Summary
        </div>

        <div className="mt-3 grid gap-4 xl:grid-cols-[190px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center rounded-[24px] bg-slate-50 p-4 dark:bg-slate-900/70">
            <div style={percentageStyle} className="flex h-28 w-28 items-center justify-center rounded-full p-2.5 sm:h-32 sm:w-32">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-center dark:bg-slate-950">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Score</p>
                  <p className="text-2xl font-bold sm:text-3xl">{summary.percentage}%</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
              {session.subjectTitle}
              <br />
              {activeSubject?.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="font-display text-xl font-bold sm:text-2xl">Result Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Review your score, timing, and answer accuracy.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRetryWrong}
                  disabled={!summary.wrong}
                  className="btn-primary"
                >
                  Retry Wrong
                </button>
                <button type="button" onClick={handlePracticeAgain} className="btn-secondary">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Practice Again
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ResultCard label="Score" value={`${summary.correct} / ${session.questions.length}`} />
              <ResultCard label="Accuracy" value={`${summary.accuracy}%`} />
              <ResultCard label="Correct" value={summary.correct} tone="success" />
              <ResultCard label="Wrong" value={summary.wrong} tone="danger" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Unanswered" value={summary.unanswered} />
              <MiniStat label="Time Taken" value={formatTime(session.elapsedSeconds)} />
              <MiniStat label="Avg / Question" value={formatTime(averageTime)} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-4">
          <QuestionNavigator
            questions={session.questions}
            currentIndex={-1}
            answers={session.answers}
            visited={session.visited}
            onJump={() => {}}
            showReviewState
          />

          <div className="panel p-4 text-sm text-slate-600 dark:text-slate-300">
            <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Zap className="h-4 w-4 text-violet-600" />
              Quick Filters
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["all", "correct", "wrong", "unanswered"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    filter === value
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold sm:text-xl">Review Questions</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {reviewQuestions.length} questions in this view
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
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
                <article key={question.id} className="rounded-[22px] border border-slate-200 p-3.5 dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    {status === "correct" ? (
                      <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    ) : status === "wrong" ? (
                      <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                    ) : (
                      <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded-full border border-slate-300 dark:border-slate-600" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">Question {index + 1}</p>
                        {question.topic && (
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                            {question.topic}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-900 dark:text-slate-100">{question.question}</p>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">Your Answer:</span>{" "}
                        {selected === undefined || selected === null
                          ? "Unanswered"
                          : question.options[selected] || "Invalid option"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">Correct Answer:</span>{" "}
                        {question.answer === null ? "Invalid answer index" : question.options[question.answer]}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}

            {!reviewQuestions.length && (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                No questions match this filter.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3.5 text-sm dark:bg-slate-900/70">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default Result;
