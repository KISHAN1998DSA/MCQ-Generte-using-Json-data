import { useEffect, useMemo, useState } from "react";
import { Menu, TriangleAlert, Zap } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MCQCard from "../components/MCQCard";
import ProgressBar from "../components/ProgressBar";
import QuestionNavigator from "../components/QuestionNavigator";
import Timer from "../components/Timer";
import { calculateResult, formatTime } from "../utils/questionUtils";
import {
  appendHistory,
  getBookmarks,
  getSession,
  toggleBookmark,
  updateSession,
  updateStats,
} from "../utils/storage";

function Practice({ setStats }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession(sessionId));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(getBookmarks());

  useEffect(() => {
    if (!session) return undefined;
    const interval = window.setInterval(() => {
      setSession((current) => {
        if (!current || current.submittedAt) return current;
        const elapsedSeconds = Math.floor((Date.now() - current.startedAt) / 1000);
        const next = updateSession(current.id, (draft) => ({ ...draft, elapsedSeconds }));
        if (next?.timeLimitSeconds && elapsedSeconds >= next.timeLimitSeconds) {
          submitTest(next);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  const currentQuestion = session?.questions[currentIndex];
  const answerMode = session?.settings?.answerMode || "practice";
  const isPracticeAnswered = answerMode === "practice" && session?.answers[currentIndex] !== undefined;

  const submitTest = (sessionToSubmit = session) => {
    if (!sessionToSubmit || sessionToSubmit.submittedAt) return;
    const submittedAt = Date.now();
    const finalSession = updateSession(sessionToSubmit.id, (draft) => ({
      ...draft,
      submittedAt,
      elapsedSeconds: Math.floor((submittedAt - draft.startedAt) / 1000),
    }));
    const summary = calculateResult(finalSession);
    const stats = updateStats({
      attempted: summary.attempted,
      correct: summary.correct,
      wrong: summary.wrong,
    });
    setStats(stats);
    appendHistory({
      id: finalSession.id,
      subjectId: finalSession.subjectId,
      subjectTitle: finalSession.subjectTitle,
      total: finalSession.questions.length,
      correct: summary.correct,
      accuracy: summary.accuracy,
      dateLabel: new Date(submittedAt).toLocaleDateString(),
    });
    navigate(`/result/${finalSession.id}`);
  };

  const selectAnswer = (optionIndex) => {
    if (!session || !currentQuestion || currentQuestion.hasError) return;
    if (answerMode === "practice" && session.answers[currentIndex] !== undefined) return;
    const next = updateSession(session.id, (draft) => ({
      ...draft,
      answers: { ...draft.answers, [currentIndex]: optionIndex },
      visited: { ...draft.visited, [currentIndex]: true },
    }));
    setSession(next);
  };

  const goToQuestion = (index) => {
    if (!session) return;
    const next = updateSession(session.id, (draft) => ({
      ...draft,
      visited: { ...draft.visited, [index]: true },
    }));
    setSession(next);
    setCurrentIndex(index);
    setDrawerOpen(false);
  };

  const handleNext = () => {
    if (!session) return;
    if (answerMode === "practice" && session.answers[currentIndex] === undefined && !currentQuestion.hasError) {
      return;
    }
    if (currentIndex < session.questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) goToQuestion(currentIndex - 1);
  };

  const toggleCurrentBookmark = () => {
    if (!session || !currentQuestion) return;
    const nextBookmarks = toggleBookmark({
      subjectId: session.subjectId,
      subjectTitle: session.subjectTitle,
      questionId: currentQuestion.id,
      question: currentQuestion.question,
    });
    setBookmarks(nextBookmarks);
  };

  const isBookmarked = useMemo(() => {
    if (!session || !currentQuestion) return false;
    return bookmarks.some(
      (bookmark) =>
        bookmark.subjectId === session.subjectId && bookmark.questionId === currentQuestion.id
    );
  }, [bookmarks, currentQuestion, session]);

  if (!session) {
    return (
      <div className="panel flex items-start gap-3 p-6 text-danger">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <span>Practice session not found. Start a new session from the dashboard.</span>
      </div>
    );
  }

  const answeredCount = Object.keys(session.answers).length;
  const timeRemaining = session.timeLimitSeconds
    ? Math.max(session.timeLimitSeconds - session.elapsedSeconds, 0)
    : null;

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600">
          <Zap className="h-3.5 w-3.5" />
          Live Quiz
        </p>
        <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {session.subjectTitle}
                </p>
                <h1 className="mt-1 font-display text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">
                  Question {currentIndex + 1} of {session.questions.length}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {timeRemaining !== null ? (
                  <Timer secondsRemaining={timeRemaining} />
                ) : (
                  <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                    Time: <span className="font-semibold">{formatTime(session.elapsedSeconds)}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setDrawerOpen((open) => !open)}
                  className="btn-secondary xl:hidden"
                >
                  <Menu className="mr-2 h-4 w-4" />
                  Navigator
                </button>
              </div>
            </div>
            <div className="mt-4 border-t border-[#efe7ff] pt-3 dark:border-slate-800">
              <ProgressBar value={answeredCount} total={session.questions.length} />
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  {answerMode === "practice" ? "Practice mode" : "Exam mode"}
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Answered {answeredCount}
                </div>
              </div>
            </div>
          </div>

          <div className={`${drawerOpen ? "block" : "hidden"} xl:block`}>
            <QuestionNavigator
              questions={session.questions}
              currentIndex={currentIndex}
              answers={session.answers}
              visited={session.visited}
              onJump={goToQuestion}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <MCQCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            selectedAnswer={session.answers[currentIndex]}
            isLocked={isPracticeAnswered}
            showResult={session.answers[currentIndex] !== undefined}
            answerMode={answerMode}
            onSelect={selectAnswer}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleCurrentBookmark}
          />

          <section className="panel flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={handlePrev} disabled={currentIndex === 0} className="btn-secondary">
              {"<-"} Previous
            </button>
            {currentIndex === session.questions.length - 1 ? (
              <button type="button" onClick={() => submitTest()} className="btn-primary">
                Submit Test
              </button>
            ) : (
              <button type="button" onClick={handleNext} className="btn-primary">
                Next {"->"}
              </button>
            )}
          </section>
        </div>

        <div className="hidden xl:block">
          <div className="panel p-4 text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white">Legend</p>
            <div className="mt-3 space-y-2">
              <p>Blue: current question</p>
              <p>Soft blue: answered</p>
              <p>Amber: visited</p>
              <p>White: not visited</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Practice;
