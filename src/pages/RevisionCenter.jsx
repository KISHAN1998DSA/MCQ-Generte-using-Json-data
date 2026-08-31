import { useEffect, useState } from "react";
import { AlertOctagon, BookmarkCheck, CheckCircle2, Edit3, Flame, PlayCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { storageService } from "../services/storageService";
import { getBookmarks, saveSession } from "../utils/storage";

function RevisionCenter() {
  const navigate = useNavigate();
  const [wrongItems, setWrongItems] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    storageService.getWrongQuestions().then(setWrongItems);
    setBookmarks(getBookmarks());
  }, []);

  const criticalItems = wrongItems.filter((i) => i.wrongCount >= 3);
  const needsPracticeItems = wrongItems.filter((i) => i.wrongCount >= 2 && i.wrongCount < 3 && !i.isLearned);
  const improvingItems = wrongItems.filter((i) => i.correctCountAfterWrong >= 1);
  const notesItems = wrongItems.filter((i) => i.personalNote && i.personalNote.trim());

  const startRevisionQuiz = (title, itemsToQuiz) => {
    if (!itemsToQuiz.length) return;

    const questions = itemsToQuiz.map((item, idx) => ({
      id: item.questionId || item.id || `rev-${idx}`,
      globalId: item.questionId || item.id,
      question: item.question,
      options: item.options || ["Option A", "Option B", "Option C", "Option D"],
      answer: item.answer ?? 0,
      explanation: item.explanation || "Revision item.",
      topic: item.topic || title,
    }));

    const sessionId = `revision-${Date.now()}`;
    saveSession({
      id: sessionId,
      subjectId: "revision-hub",
      subjectTitle: title,
      subjectFile: "",
      quizType: "revision",
      settings: {
        questionLimit: "all",
        order: "random",
        timer: "0",
        answerMode: "practice",
        shuffleOptions: false,
      },
      questions,
      answers: {},
      visited: { 0: true },
      startedAt: Date.now(),
      submittedAt: null,
      timeLimitSeconds: null,
      elapsedSeconds: 0,
    });

    navigate(`/practice/${sessionId}`);
  };

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          <RefreshCw className="h-3.5 w-3.5" />
          Personal Mastery Engine
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl text-slate-950 dark:text-white">
          Revision Center
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Revise targeted weak areas, bookmarked questions, and notes to systematically close learning gaps before exam day.
        </p>
      </section>

      {/* 5 Dedicated Revision Hub Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RevisionHubCard
          icon={AlertOctagon}
          title="🔴 Critical Revision"
          subtitle="Questions failed 3 or more times"
          count={criticalItems.length}
          tone="rose"
          onClick={() => startRevisionQuiz("Critical Revision", criticalItems)}
        />

        <RevisionHubCard
          icon={Flame}
          title="🟠 Needs Practice"
          subtitle="Questions answered incorrectly repeatedly"
          count={needsPracticeItems.length}
          tone="orange"
          onClick={() => startRevisionQuiz("Needs Practice", needsPracticeItems)}
        />

        <RevisionHubCard
          icon={CheckCircle2}
          title="🟢 Improving Questions"
          subtitle="Previously wrong questions you are now getting right"
          count={improvingItems.length}
          tone="emerald"
          onClick={() => startRevisionQuiz("Improving Questions", improvingItems)}
        />

        <RevisionHubCard
          icon={BookmarkCheck}
          title="⭐ Bookmarked Questions"
          subtitle="Questions you explicitly saved during practice"
          count={bookmarks.length}
          tone="purple"
          onClick={() =>
            startRevisionQuiz(
              "Bookmarked Questions",
              bookmarks.map((b) => ({
                questionId: b.questionId,
                question: b.question,
                options: b.options || ["Option A", "Option B", "Option C", "Option D"],
                answer: b.answer ?? 0,
                explanation: b.explanation || "Bookmarked question.",
              }))
            )
          }
        />

        <RevisionHubCard
          icon={Edit3}
          title="📝 My Personal Notes"
          subtitle="Questions with custom learning notes written by you"
          count={notesItems.length}
          tone="violet"
          onClick={() => startRevisionQuiz("My Personal Notes", notesItems)}
        />
      </div>
    </div>
  );
}

function RevisionHubCard({ icon: Icon, title, subtitle, count, tone, onClick }) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
      : tone === "orange"
      ? "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300"
      : tone === "emerald"
      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
      : tone === "purple"
      ? "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300"
      : "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300";

  return (
    <div className="panel p-5 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <div className={`rounded-2xl p-3 ${toneClass}`}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {count} Items
          </span>
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={count === 0}
        className="btn-primary w-full py-2.5 text-xs"
      >
        <PlayCircle className="mr-2 h-4 w-4" /> Start Revision Test ({count})
      </button>
    </div>
  );
}

export default RevisionCenter;
