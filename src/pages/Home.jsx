import { useEffect, useState, useMemo } from "react";
import { AlertCircle, Award, BookOpen, BookmarkCheck, CheckCircle2, FileText, Flame, Layers, LoaderCircle, PlayCircle, RefreshCw, RotateCcw, Search, Sparkles, Trophy, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { contentRegistry, CATEGORY_META, CATEGORY_TYPES } from "../services/contentRegistry";
import { storageService } from "../services/storageService";
import { getStorageItem, clearActiveSession, STORAGE_KEYS } from "../utils/storage";

function Home({ stats }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categorized, setCategorized] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [topicAnalytics, setTopicAnalytics] = useState({ weakTopics: [] });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      const catData = await contentRegistry.getCategorizedContent();

      // Check active interrupted session
      const activeSessionId = getStorageItem(STORAGE_KEYS.session, null);
      let sessionData = null;
      if (activeSessionId) {
        const sessions = getStorageItem(STORAGE_KEYS.sessions, {});
        sessionData = sessions[activeSessionId] || null;
        if (sessionData?.submittedAt) {
          sessionData = null;
        }
      }

      // Wrong questions count
      const wrongList = await storageService.getWrongQuestions();
      const bookmarks = getStorageItem(STORAGE_KEYS.bookmarks, []);
      const analytics = storageService.getTopicPerformance();

      if (isMounted) {
        setCategorized(catData);
        setActiveSession(sessionData);
        setWrongCount(wrongList.length);
        setBookmarkCount(bookmarks.length);
        setTopicAnalytics(analytics);
        setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAbandonSession = () => {
    clearActiveSession();
    setActiveSession(null);
  };

  const handleQuickPractice = (questionCount) => {
    if (!categorized?.loadedSets?.length) return;
    const defaultSet = categorized.loadedSets[0];
    navigate(`/setup/${defaultSet.id}?limit=${questionCount}`);
  };

  const filteredSets = useMemo(() => {
    if (!categorized?.loadedSets) return [];
    return categorized.loadedSets.filter((set) => {
      if (selectedCategory !== "all" && set.type !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = set.title.toLowerCase().includes(q);
        const matchDesc = set.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [categorized, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="panel flex min-h-[300px] items-center justify-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-violet-600" />
        <span>Loading Preparation Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* 1. Unfinished / Interrupted Test Banner (Resume System) */}
      {activeSession && (
        <section className="rounded-[28px] border-2 border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white shadow-xl animate-fadeIn">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                <Flame className="h-3.5 w-3.5 text-amber-300" />
                Unfinished Test Session
              </div>
              <h2 className="font-display text-xl font-bold">
                {activeSession.subjectTitle}
              </h2>
              <p className="text-xs text-violet-100">
                You were on Question {Object.keys(activeSession.answers || {}).length + 1} of{" "}
                {activeSession.questions?.length || 0}. Continue where you left off.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAbandonSession}
                className="rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Abandon
              </button>
              <button
                type="button"
                onClick={() => navigate(`/practice/${activeSession.id}`)}
                className="rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-violet-900 shadow-md hover:bg-violet-50"
              >
                Resume Test Now →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. Hero Dashboard Welcome Banner */}
      <section className="panel overflow-hidden px-5 py-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              Personal Preparation System
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl dark:text-white">
              Exam Dashboard
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400 max-w-2xl">
              Practice JSON question banks, track mistakes, write personal learning notes, and monitor your accuracy trends.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/custom-quiz" className="btn-primary">
              <Zap className="mr-2 h-4 w-4" /> Create Custom Quiz
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Quick Practice Buttons */}
      <section className="panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
            ⚡ Quick Drill Practice
          </h2>
          <span className="text-xs text-slate-400">Launch rapid practice drill</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[10, 25, 50, 100].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => handleQuickPractice(count)}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center font-bold text-slate-900 transition hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              {count} Questions
            </button>
          ))}
        </div>
      </section>

      {/* 4. Performance Snapshot & Top Weak Topics Grid */}
      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Performance Snapshot */}
          <div className="panel p-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              Performance Snapshot
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SnapshotBox label="Attempted" value={stats.attemptedQuestions} tone="violet" />
              <SnapshotBox label="Accuracy" value={`${stats.accuracy}%`} tone="emerald" />
              <SnapshotBox label="Correct" value={stats.correctAnswers} tone="cyan" />
              <SnapshotBox label="Wrong Answers" value={stats.wrongAnswers} tone="rose" />
            </div>
          </div>

          {/* Practice Categories Tabs */}
          <div className="panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Question Banks & Categories
              </h2>
              <Link to="/admin/content" className="text-xs font-semibold text-violet-600 hover:underline">
                Registry Admin →
              </Link>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedCategory === "all"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                All Banks
              </button>
              {CATEGORY_META.map((meta) => (
                <button
                  key={meta.type}
                  type="button"
                  onClick={() => setSelectedCategory(meta.type)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    selectedCategory === meta.type
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {meta.title}
                </button>
              ))}
            </div>

            {/* Category Cards Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredSets.map((set) => (
                <Link
                  key={set.id}
                  to={`/setup/${set.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-400 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      {set.questions?.length || 0} Questions
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase">
                      {set.type || "topic_wise"}
                    </span>
                  </div>
                  <h3 className="mt-3 font-bold text-base text-slate-950 dark:text-white">
                    {set.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {set.description || "Topic-wise exam preparation question bank."}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Cards: Revision & Weak Topics */}
        <div className="space-y-5">
          {/* Revision Shortcuts */}
          <section className="panel p-5 space-y-3">
            <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Revision Hub
            </h3>
            <div className="space-y-2">
              <Link
                to="/wrong-questions"
                className="flex items-center justify-between rounded-2xl bg-rose-50 p-3.5 text-xs font-bold text-rose-950 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-200"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <span>My Wrong Questions</span>
                </div>
                <span className="rounded-full bg-rose-200 px-2 py-0.5 text-rose-800 dark:bg-rose-800 dark:text-rose-100">
                  {wrongCount}
                </span>
              </Link>

              <Link
                to="/revision"
                className="flex items-center justify-between rounded-2xl bg-purple-50 p-3.5 text-xs font-bold text-purple-950 transition hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-200"
              >
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="h-4 w-4 text-purple-600" />
                  <span>Bookmarked Questions</span>
                </div>
                <span className="rounded-full bg-purple-200 px-2 py-0.5 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                  {bookmarkCount}
                </span>
              </Link>

              <Link
                to="/revision"
                className="flex items-center justify-between rounded-2xl bg-violet-50 p-3.5 text-xs font-bold text-violet-950 transition hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-200"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-600" />
                  <span>Revision Center</span>
                </div>
                <span>→</span>
              </Link>
            </div>
          </section>

          {/* Top 5 Weak Topics */}
          <section className="panel p-5 space-y-3 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
                Top Weak Topics
              </h3>
              <Link to="/reports" className="text-xs text-violet-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {topicAnalytics.weakTopics.slice(0, 5).map((topic, i) => (
                <div
                  key={topic.topic}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/70"
                >
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                    {i + 1}. {topic.topic}
                  </span>
                  <span className="font-bold text-rose-600">{topic.accuracy}%</span>
                </div>
              ))}

              {!topicAnalytics.weakTopics.length && (
                <p className="text-xs text-slate-400 italic">No weak topics identified yet.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function SnapshotBox({ label, value, tone }) {
  const color =
    tone === "rose"
      ? "text-rose-600"
      : tone === "emerald"
      ? "text-emerald-600"
      : tone === "cyan"
      ? "text-cyan-600"
      : "text-violet-600";

  return (
    <div className="rounded-2xl bg-slate-50 p-3.5 text-center dark:bg-slate-800/70">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}

export default Home;
