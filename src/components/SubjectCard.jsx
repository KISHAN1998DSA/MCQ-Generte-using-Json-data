import { BookOpen, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";

function SubjectCard({ subject, questionCount, matchCount }) {
  return (
    <article className="panel overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${subject.accent}`} />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-100">
              Subject
            </div>
            <h3 className="mt-3 font-display text-xl font-bold">{subject.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {subject.description || "No description available for this subject yet."}
            </p>
          </div>
          <BookOpen className="h-8 w-8 text-brand-600" />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
          <div>
            <p className="text-xs text-slate-500">Questions</p>
            <p className="text-lg font-semibold">{questionCount}</p>
          </div>
          {typeof matchCount === "number" && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Matches</p>
              <p className="text-lg font-semibold">{matchCount}</p>
            </div>
          )}
        </div>

        <Link to={`/setup/${subject.id}`} className="btn-primary mt-6 w-full gap-2">
          <PlayCircle className="h-4 w-4" />
          Start Practice
        </Link>
      </div>
    </article>
  );
}

export default SubjectCard;
