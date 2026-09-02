import { useEffect, useMemo, useState, useCallback } from "react";
import { Menu, TriangleAlert, Zap, Keyboard, Flag, CheckCircle, ArrowLeft, ArrowRight, Edit3, Save, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MCQCard from "../components/MCQCard";
import ProgressBar from "../components/ProgressBar";
import QuestionNavigator from "../components/QuestionNavigator";
import Timer from "../components/Timer";
import SubmitModal from "../components/SubmitModal";
import { calculateResult, formatTime } from "../utils/questionUtils";
import {
  getBookmarks,
  getSession,
  toggleBookmark,
  updateSession,
  updateStats,
} from "../utils/storage";
import { storageService } from "../services/storageService";

function Practice({ setStats }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession(sessionId));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(getBookmarks());
  const [markedForReview, setMarkedForReview] = useState({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);

  // Personal note state — keyed by question index
  const [notes, setNotes] = useState({});
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Reset note editing UI whenever the question changes
  useEffect(() => {
    setIsEditingNote(false);
    setSavedSuccess(false);
  }, [currentIndex]);

  // Auto timer ticker
  useEffect(() => {
    if (!session || session.submittedAt) return undefined;
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

  const submitTest = useCallback(async (sessionToSubmit = session) => {
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
    if (setStats) setStats(stats);

    // Save complete session data & wrong questions to storageService / Supabase
    await storageService.saveCompletedSession({
      session: finalSession,
      summary,
    });

    navigate(`/result/${finalSession.id}`);
  }, [session, setStats, navigate]);

  const noteText = notes[currentIndex] ?? "";

  const handleSaveNote = async () => {
    if (!currentQuestion) return;
    setIsSavingNote(true);
    const qId = currentQuestion.globalId || currentQuestion.id;
    await storageService.saveQuestionNote(qId, noteText);
    setIsSavingNote(false);
    setSavedSuccess(true);
    setIsEditingNote(false);
    setTimeout(() => setSavedSuccess(false), 2500);
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

  const clearAnswer = () => {
    if (!session) return;
    const next = updateSession(session.id, (draft) => {
      const nextAnswers = { ...draft.answers };
      delete nextAnswers[currentIndex];
      return { ...draft, answers: nextAnswers };
    });
    setSession(next);
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const goToQuestion = (index) => {
    if (!session || index < 0 || index >= session.questions.length) return;
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
    if (currentIndex < session.questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) goToQuestion(currentIndex - 1);
  };

  // Keyboard Shortcuts Listener for CBT Exam Mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger if user is typing inside textarea/input
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

      const key = event.key.toUpperCase();
      if (["1", "A"].includes(key)) {
        event.preventDefault();
        selectAnswer(0);
      } else if (["2", "B"].includes(key)) {
        event.preventDefault();
        selectAnswer(1);
      } else if (["3", "C"].includes(key)) {
        event.preventDefault();
        selectAnswer(2);
      } else if (["4", "D"].includes(key)) {
        event.preventDefault();
        selectAnswer(3);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrev();
      } else if (key === "M") {
        event.preventDefault();
        toggleMarkForReview();
      } else if (key === "C" && !event.ctrlKey) {
        event.preventDefault();
        clearAnswer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, session]);

  const toggleCurrentBookmark = () => {
    if (!session || !currentQuestion) return;
    const nextBookmarks = toggleBookmark({
      subjectId: session.subjectId,
      subjectTitle: session.subjectTitle,
      questionId: currentQuestion.globalId || currentQuestion.id,
      question: currentQuestion.question,
    });
    setBookmarks(nextBookmarks);
  };

  const isBookmarked = useMemo(() => {
    if (!session || !currentQuestion) return false;
    const qId = currentQuestion.globalId || currentQuestion.id;
    return bookmarks.some((bm) => bm.questionId === qId);
  }, [bookmarks, currentQuestion, session]);

  if (!session) {
    return (
      <div className="panel flex items-start gap-3 p-6 text-rose-600">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <span>Practice session not found. Start a new session from the dashboard.</span>
      </div>
    );
  }

  const totalQuestions = session.questions.length;
  const answeredCount = Object.keys(session.answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const markedCount = Object.keys(markedForReview).filter((k) => markedForReview[k]).length;
  const answeredAndMarkedCount = Object.keys(session.answers).filter(
    (k) => markedForReview[k] && session.answers[k] !== undefined
  ).length;

  const timeRemaining = session.timeLimitSeconds
    ? Math.max(session.timeLimitSeconds - session.elapsedSeconds, 0)
    : null;

  return (
    <div className="space-y-4">
      {/* Session Top Bar */}
      <section className="panel p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600">
            <Zap className="h-3.5 w-3.5" />
            {answerMode === "exam" ? "CBT Exam Engine" : "Interactive Practice Session"}
          </p>
          <button
            type="button"
            onClick={() => setKeyboardHelpOpen(!keyboardHelpOpen)}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-violet-100 hover:text-violet-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Shortcuts</span>
          </button>
        </div>

        {keyboardHelpOpen && (
          <div className="mt-3 rounded-2xl bg-violet-50 p-3 text-xs text-violet-800 dark:bg-slate-800 dark:text-violet-300 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div><strong>1 / A</strong>: Option A</div>
            <div><strong>2 / B</strong>: Option B</div>
            <div><strong>3 / C</strong>: Option C</div>
            <div><strong>4 / D</strong>: Option D</div>
            <div><strong>→</strong>: Next</div>
            <div><strong>←</strong>: Prev</div>
            <div><strong>M</strong>: Mark Review</div>
            <div><strong>C</strong>: Clear Answer</div>
          </div>
        )}

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {session.subjectTitle}
                </p>
                <h1 className="mt-1 font-display text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">
                  Question {currentIndex + 1} of {totalQuestions}
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
                  Palette
                </button>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 pb-2 dark:border-slate-800">
              <ProgressBar value={answeredCount} total={totalQuestions} />
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-violet-100 px-3 py-1 font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  {answerMode === "practice" ? "Practice Mode" : "Real Exam Mode"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Answered: {answeredCount}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  Unanswered: {unansweredCount}
                </span>
                {markedCount > 0 && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                    Marked: {markedCount}
                  </span>
                )}
              </div>
            </div>
            <MCQCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              selectedAnswer={session.answers[currentIndex]}
              isLocked={isPracticeAnswered}
              showResult={session.answers[currentIndex] !== undefined}
              answerMode={answerMode}
              onSelect={selectAnswer}
              onClearAnswer={clearAnswer}
              isMarkedForReview={markedForReview[currentIndex]}
              onToggleMarkForReview={toggleMarkForReview}
              isBookmarked={isBookmarked}
              onToggleBookmark={toggleCurrentBookmark}
            />

            <section className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="btn-secondary"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="btn-secondary border-violet-300 text-violet-700 hover:bg-violet-50"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Submit Exam
                </button>

                {currentIndex === totalQuestions - 1 ? (
                  <button type="button" onClick={() => setIsSubmitModalOpen(true)} className="btn-primary">
                    Finish Test
                  </button>
                ) : (
                  <button type="button" onClick={handleNext} className="btn-primary">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}
              </div>
            </section>
          </div>

          <div className={`${drawerOpen ? "block" : "hidden"} xl:block`}>
            <QuestionNavigator
              questions={session.questions}
              currentIndex={currentIndex}
              answers={session.answers}
              visited={session.visited}
              markedForReview={markedForReview}
              onJump={goToQuestion}
            />
          </div>
        </div>
      </section>

      {/* Main MCQ Question Card & Nav Footer */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">




          {/* Practice Mode Feedback & Explanation — below nav buttons */}
          {answerMode === "practice" && session.answers[currentIndex] !== undefined && (
            <section
              className="panel overflow-hidden"
              style={{ animation: "feedbackIn 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <style>{`
                @keyframes feedbackIn {
                  from { opacity: 0; transform: translateY(16px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              {/* Verdict banner */}
              {session.answers[currentIndex] === currentQuestion?.answer ? (
                <div className="flex items-center gap-3 bg-emerald-500 px-5 py-3.5">
                  <CheckCircle className="h-5 w-5 shrink-0 text-white" />
                  <span className="text-sm font-bold text-white">Correct Answer!</span>
                  <span className="ml-auto rounded-full bg-white/25 px-3 py-0.5 text-xs font-semibold text-white">
                    Correct: Option {String.fromCharCode(65 + (currentQuestion?.answer ?? 0))}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-rose-500 px-5 py-3.5">
                  <CheckCircle className="h-5 w-5 shrink-0 text-white opacity-0 pointer-events-none" />
                  <span className="text-sm font-bold text-white">Incorrect — </span>
                  <span className="text-sm text-white/90">
                    Correct answer is&nbsp;
                    <strong>Option {String.fromCharCode(65 + (currentQuestion?.answer ?? 0))}</strong>
                  </span>
                </div>
              )}

              {/* Explanation */}
              {currentQuestion?.explanation && (
                <div className="flex items-start gap-3 p-5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                    <CheckCircle className="h-4 w-4 text-violet-600 opacity-0 hidden" />
                    {/* inline Info icon via SVG to avoid extra import */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  </span>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Explanation</p>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Personal Learning Note — shown below feedback after answering */}
          {answerMode === "practice" && session.answers[currentIndex] !== undefined && (
            <div className="panel p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Personal Learning Note ("Why did I get this wrong?")</span>
                </div>
                {!isEditingNote && (
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(true)}
                    className="text-xs font-semibold text-violet-600 hover:underline"
                  >
                    {noteText ? "Edit Note" : "+ Add Note"}
                  </button>
                )}
              </div>

              {isEditingNote ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [currentIndex]: e.target.value }))}
                    placeholder="Example: I confused Supreme Court writ jurisdiction (Art 32) with High Court (Art 226)..."
                    rows={3}
                    className="w-full rounded-xl border border-violet-200 bg-white p-3 text-sm outline-none ring-2 ring-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(false)}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      disabled={isSavingNote}
                      className="btn-primary py-1.5 px-3 text-xs"
                    >
                      <Save className="mr-1 h-3.5 w-3.5" />
                      {isSavingNote ? "Saving..." : "Save Note"}
                    </button>
                  </div>
                </div>
              ) : noteText ? (
                <p className="mt-2 text-sm italic text-slate-800 dark:text-slate-200">"{noteText}"</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  No personal note added yet. Click "+ Add Note" to record your reason for future revision.
                </p>
              )}

              {savedSuccess && (
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <Check className="h-3.5 w-3.5" /> Note saved permanently!
                </p>
              )}
            </div>
          )}
        </div>

        <div className="hidden xl:block">
          <div className="panel p-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p className="font-bold text-slate-900 dark:text-white">Exam Control Hints</p>
            <p>• Use 1-4 keys to select options quickly.</p>
            <p>• Press 'M' to mark question for later review.</p>
            <p>• Answers are auto-saved to local state automatically.</p>
          </div>
        </div>
      </div>

      {/* Pre-submit Modal */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={() => submitTest()}
        sessionStats={{
          total: totalQuestions,
          answered: answeredCount,
          unanswered: unansweredCount,
          marked: markedCount,
          answeredAndMarked: answeredAndMarkedCount,
        }}
      />
    </div>
  );
}

export default Practice;
