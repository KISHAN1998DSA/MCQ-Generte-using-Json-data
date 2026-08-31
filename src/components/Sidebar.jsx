import { BookOpenCheck, ChartNoAxesCombined, Clock3 } from "lucide-react";
import { NavLink } from "react-router-dom";

function Sidebar({ items, stats }) {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-4 flex flex-col gap-4">
        <div className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">
            Quick Access
          </p>
          <nav className="mt-4 space-y-2">
            {items.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className="flex items-center rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="panel p-5">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Progress Snapshot</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
              <BookOpenCheck className="h-5 w-5 text-brand-600" />
              <div>
                <p className="text-xs text-slate-500">Attempted</p>
                <p className="font-semibold">{stats.attemptedQuestions}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
              <ChartNoAxesCombined className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-slate-500">Accuracy</p>
                <p className="font-semibold">{stats.accuracy}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
              <Clock3 className="h-5 w-5 text-warning" />
              <div>
                <p className="text-xs text-slate-500">Correct / Wrong</p>
                <p className="font-semibold">
                  {stats.correctAnswers} / {stats.wrongAnswers}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
