import { useMemo, useState } from "react";
import { CircleCheckBig, CircleX, Edit3, RotateCcw, Trophy, Zap, Save, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import QuestionNavigator from "../components/QuestionNavigator";
import ResultCard from "../components/ResultCard";
import { calculateResult, formatTime } from "../utils/questionUtils";
import { getSession, saveSession } from "../utils/storage";
import { storageService } from "../services/storageService";

function Result() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [editingNotes, setEditingNotes] = useState({});
  const [savedNotes, setSavedNotes] = useState({});
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

  // Topic performance calculation for this session
  const topicBreakdown = useMemo(() => {
    if (!session) return [];
    const topics = {};
    session.questions.forEach((q, idx) => {
      const t = q.topic || session.subjectTitle || "General";
      if (!topics[t]) topics[t] = { topic: t, attempted: 0, correct: 0, wrong: 0 };
      const sel = session.answers[idx];
      if (sel !== undefined && sel !== null) {
        topics[t].attempted += 1;
        if (sel === q.answer) topics[t].correct += 1;
        else topics[t].wrong += 1;
      }
    });

    return Object.values(topics).map((t) => ({
      ...t,
      accuracy: t.attempted ? Math.round((t.correct / t.attempted) * 100) : 0,
    }));
  }, [session]);

  if (!session || !summary) {
    return <div className="panel p-6 text-rose-600">Result not found. Please start a new practice test.</div>;
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

  const handleSaveResultNote = async (questionId) => {
    const noteText = editingNotes[questionId];
    if (!noteText) return;
    await storageService.saveQuestionNote(questionId, noteText);
    setSavedNotes((prev) => ({ ...prev, [questionId]: true }));
    setTimeout(() => {
      setSavedNotes((prev) => ({ ...prev, [questionId]: false }));
    }, 2000);
  };

  const percentageStyle = {
    background: `conic-gradient(#7c3aed ${summary.percentage * 3.6}deg, rgba(226,232,240,0.9) 0deg)`,
  };
  const averageTime = session.questions.length
    ? Math.round(session.elapsedSeconds / session.questions.length)
    : 0;

  return (
    <div className="space-y-5">
      <section className="panel p-4 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          <Trophy className="h-4 w-4" />
          Detailed Exam Report
        </div>

        <div className="mt-4 grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
          {/* Score Circle */}
          <div className="flex flex-col items-center justify-center rounded-[24px] bg-slate-50 p-5 dark:bg-slate-900/70">
            <div style={percentageStyle} className="flex h-32 w-32 items-center justify-center rounded-full p-2.5 sm:h-36 sm:w-36">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-center dark:bg-slate-950">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Score</p>
                  <p className="text-3xl font-extrabold text-slate-950 dark:text-white">{summary.percentage}%</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
              {session.subjectTitle}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="font-display text-xl font-bold sm:text-2xl text-slate-950 dark:text-white">
                  Performance Analysis
                </h1>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Review your total score, speed, answer accuracy, and individual question notes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRetryWrong}
                  disabled={!summary.wrong}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  Retry Wrong ({summary.wrong})
                </button>
                <button type="button" onClick={handlePracticeAgain} className="btn-secondary py-2 px-4 text-xs">
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
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
              <MiniStat label="Avg Time / Question" value={`${averageTime} sec`} />
            </div>
          </div>
        </div>
      </section>

      {/* Topic Performance Breakdown */}
      {topicBreakdown.length > 0 && (
        <section className="panel p-5 space-y-3">
          <h2 className="font-bold text-base text-slate-950 dark:text-white">Topic Wise Performance</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topicBreakdown.map((t) => (
              <div key={t.topic} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                <p className="font-bold text-slate-900 dark:text-white">{t.topic}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-500">{t.correct} / {t.attempted} Correct</span>
                  <span className={`font-extrabold ${t.accuracy >= 70 ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Questions Review with Inline Notes */}
      <section className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <QuestionNavigator
            questions={session.questions}
            currentIndex={-1}
            answers={session.answers}
            visited={session.visited}
            onJump={() => {}}
            showReviewState
          />

          <div className="panel p-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Zap className="h-4 w-4 text-violet-600" />
              Filter Review List
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["all", "correct", "wrong", "unanswered"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition capitalize ${
                    filter === value
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold sm:text-xl text-slate-950 dark:text-white">Question Review</h2>
              <p className="text-xs text-slate-500">{reviewQuestions.length} questions in this view</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {reviewQuestions.map((question) => {
              const index = session.questions.findIndex((item) => item.id === question.id);
              const selected = session.answers[index];
              const isCorrect = selected === question.answer;
              const qId = question.globalId || question.id;

              return (
                <article key={qId} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : selected !== undefined ? (
                      <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    ) : (
                      <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded-full border border-slate-300 dark:border-slate-600" />
                    )}

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">Question {index + 1}</span>
                        {question.topic && (
                          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                            {question.topic}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold leading-6 text-slate-950 dark:text-white">{question.question}</p>

                      <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                        <p>
                          <span className="font-bold text-slate-900 dark:text-white">Your Answer:</span>{" "}
                          {selected === undefined || selected === null
                            ? "Unanswered"
                            : question.options[selected] || "Invalid option"}
                        </p>
                        <p>
                          <span className="font-bold text-slate-900 dark:text-white">Correct Answer:</span>{" "}
                          {question.options[question.answer]}
                        </p>
                      </div>

                      {question.explanation && (
                        <p className="text-xs leading-5 text-slate-500 bg-slate-50 p-2.5 rounded-xl dark:bg-slate-800/70">
                          <strong>Explanation: </strong> {question.explanation}
                        </p>
                      )}

                      {/* Inline Mistake Note Form */}
                      {!isCorrect && (
                        <div className="mt-3 space-y-2 rounded-xl bg-violet-50/60 p-3 dark:bg-slate-900/60">
                          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                            <Edit3 className="h-3.5 w-3.5" /> Why did I get this wrong?
                          </label>
                          <textarea
                            value={editingNotes[qId] || ""}
                            onChange={(e) => setEditingNotes({ ...editingNotes, [qId]: e.target.value })}
                            placeholder="Type your reason (e.g. confused Supreme Court vs High Court jurisdiction)..."
                            rows={2}
                            className="w-full rounded-xl border border-violet-200 bg-white p-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                          <div className="flex justify-end gap-2 items-center">
                            {savedNotes[qId] && <span className="text-[11px] font-bold text-emerald-600">Saved!</span>}
                            <button
                              type="button"
                              onClick={() => handleSaveResultNote(qId)}
                              className="btn-primary py-1 px-3 text-xs"
                            >
                              <Save className="mr-1 h-3 w-3" /> Save Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3.5 text-xs dark:bg-slate-900/70">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default Result;
