import { ArrowRight, BookOpen, Layers3, PlayCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

function SubjectCard({ subject, questionCount, matchCount }) {
  return (
    <article className="panel overflow-hidden">
      <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
        <div className={`relative min-h-[150px] overflow-hidden bg-gradient-to-br ${subject.accent} p-4 text-white md:min-h-full`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.26),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0.78))]" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10">
                <Share2 className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-lg shadow-orange-500/30">
                New
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
                MCQ Practice
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-2.5">
                  <BookOpen className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium leading-5 text-white/90">
                  Subject-wise and topic-wise practice.
                </p>
              </div>
            </div>
            <div className="relative mt-4 inline-flex w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-900 md:mt-auto">
              {String(questionCount).padStart(2, "0")}
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
                {subject.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {subject.description || "No description available for this subject yet."}
              </p>
            </div>
            <div className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              Not started
            </div>
          </div>

          <div className="soft-surface mt-4 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Progress
              </p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">0%</p>
            </div>
            <div className="mt-2.5 h-2 rounded-full bg-violet-100 dark:bg-slate-800">
              <div className="h-2 w-0 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <span>{questionCount} questions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-cyan-100 p-1.5 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
                  <Layers3 className="h-3.5 w-3.5" />
                </div>
                <span>{typeof matchCount === "number" ? `${matchCount} matches` : "0 done"}</span>
              </div>
            </div>
          </div>

          <Link to={`/setup/${subject.id}`} className="btn-primary mt-4 w-full gap-2 rounded-[18px] px-4 py-2.5 text-sm md:w-fit md:min-w-[220px]">
            <PlayCircle className="h-4 w-4" />
            Start Quiz
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default SubjectCard;
