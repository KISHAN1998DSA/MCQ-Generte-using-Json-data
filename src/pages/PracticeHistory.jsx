import { useEffect, useState } from "react";
import { History, Search, Calendar, ChevronRight, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { getStorageItem, STORAGE_KEYS } from "../utils/storage";

function PracticeHistory() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const list = getStorageItem(STORAGE_KEYS.history, []);
    setHistory(list);
  }, []);

  const filteredHistory = history.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.subjectTitle?.toLowerCase().includes(q) ||
      item.quizType?.toLowerCase().includes(q) ||
      item.dateLabel?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          <History className="h-3.5 w-3.5" />
          Test Logs
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl text-slate-950 dark:text-white">
          My Practice History
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Review past test attempts, scores, answer accuracy, and drill down into detailed question breakdown reports.
        </p>
      </section>

      {/* Filter Bar */}
      <section className="panel p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search test attempts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-11 py-2 text-xs"
          />
        </div>
      </section>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredHistory.map((entry) => (
          <Link
            key={entry.id}
            to={`/result/${entry.id}`}
            className="panel p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition hover:border-violet-400 dark:hover:border-slate-700"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>{entry.dateLabel}</span>
                {entry.quizType && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {entry.quizType}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base text-slate-950 dark:text-white">
                {entry.subjectTitle}
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Score: {entry.correct} / {entry.total} ({entry.score || entry.accuracy}%)
                </p>
                <p className="text-xs text-slate-500">Accuracy: {entry.accuracy}%</p>
              </div>

              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          </Link>
        ))}

        {!filteredHistory.length && (
          <div className="panel p-8 text-center text-slate-500 dark:text-slate-400">
            No completed practice sessions found in history.
          </div>
        )}
      </div>
    </div>
  );
}

export default PracticeHistory;
