import { useEffect, useState, useMemo } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Award, Zap } from "lucide-react";
import { storageService } from "../services/storageService";
import { getStorageItem, STORAGE_KEYS } from "../utils/storage";

function Reports() {
  const [stats, setStats] = useState({
    attemptedQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    accuracy: 0,
  });
  const [history, setHistory] = useState([]);
  const [topicAnalytics, setTopicAnalytics] = useState({ topicList: [], weakTopics: [], strongTopics: [] });

  useEffect(() => {
    const localStats = getStorageItem(STORAGE_KEYS.stats, stats);
    const localHistory = getStorageItem(STORAGE_KEYS.history, []);
    setStats(localStats);
    setHistory(localHistory);

    const analytics = storageService.getTopicPerformance();
    setTopicAnalytics(analytics);
  }, []);

  const totalTests = history.length;
  const bestScore = useMemo(() => {
    if (!history.length) return 0;
    return Math.max(...history.map((h) => h.accuracy || 0));
  }, [history]);

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          <BarChart3 className="h-3.5 w-3.5" />
          Analytics Dashboard
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl text-slate-950 dark:text-white">
          Exam Reports & Topic Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Comprehensive performance evaluation tracking accuracy trends, strong modules, and top weak topics needing review.
        </p>
      </section>

      {/* Hero Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReportMetricCard label="Total Tests Completed" value={totalTests} icon={Award} tone="violet" />
        <ReportMetricCard label="Questions Attempted" value={stats.attemptedQuestions} icon={Zap} tone="cyan" />
        <ReportMetricCard label="Overall Accuracy" value={`${stats.accuracy}%`} icon={TrendingUp} tone="emerald" />
        <ReportMetricCard label="Best Test Accuracy" value={`${bestScore}%`} icon={CheckCircle2} tone="orange" />
      </div>

      {/* Weak & Strong Topics Section */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Top 5 Weak Topics */}
        <section className="panel p-5 space-y-4 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
            <AlertTriangle className="h-5 w-5" />
            <h2>Top Weak Topics (Needs Revision)</h2>
          </div>
          <div className="space-y-3">
            {topicAnalytics.weakTopics.map((topic, idx) => (
              <div
                key={topic.topic}
                className="flex items-center justify-between rounded-2xl bg-rose-50 p-3.5 text-xs dark:bg-rose-500/10"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {idx + 1}. {topic.topic}
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    {topic.correct} / {topic.attempted} Correct
                  </p>
                </div>
                <span className="font-extrabold text-sm text-rose-600">{topic.accuracy}%</span>
              </div>
            ))}

            {!topicAnalytics.weakTopics.length && (
              <p className="text-xs text-slate-500 italic">No weak topics identified yet. Keep practicing!</p>
            )}
          </div>
        </section>

        {/* Top 5 Strong Topics */}
        <section className="panel p-5 space-y-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
            <CheckCircle2 className="h-5 w-5" />
            <h2>Top Strong Topics</h2>
          </div>
          <div className="space-y-3">
            {topicAnalytics.strongTopics.map((topic, idx) => (
              <div
                key={topic.topic}
                className="flex items-center justify-between rounded-2xl bg-emerald-50 p-3.5 text-xs dark:bg-emerald-500/10"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {idx + 1}. {topic.topic}
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    {topic.correct} / {topic.attempted} Correct
                  </p>
                </div>
                <span className="font-extrabold text-sm text-emerald-600">{topic.accuracy}%</span>
              </div>
            ))}

            {!topicAnalytics.strongTopics.length && (
              <p className="text-xs text-slate-500 italic">No topic statistics collected yet.</p>
            )}
          </div>
        </section>
      </div>

      {/* All Topics Breakdown Table */}
      {topicAnalytics.topicList.length > 0 && (
        <section className="panel p-5 space-y-4">
          <h3 className="font-bold text-lg text-slate-950 dark:text-white">Module Topic Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Topic</th>
                  <th className="p-3">Attempted</th>
                  <th className="p-3">Correct</th>
                  <th className="p-3">Wrong</th>
                  <th className="p-3 rounded-r-xl">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topicAnalytics.topicList.map((t) => (
                  <tr key={t.topic} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-slate-950 dark:text-white">{t.topic}</td>
                    <td className="p-3">{t.attempted}</td>
                    <td className="p-3 text-emerald-600 font-semibold">{t.correct}</td>
                    <td className="p-3 text-rose-600 font-semibold">{t.wrong}</td>
                    <td className="p-3 font-bold">{t.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ReportMetricCard({ label, value, icon: Icon, tone }) {
  const toneClass =
    tone === "cyan"
      ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300"
      : tone === "emerald"
      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
      : tone === "orange"
      ? "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300"
      : "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300";

  return (
    <div className="panel p-4 flex items-center gap-3">
      <div className={`rounded-2xl p-3 ${toneClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default Reports;
