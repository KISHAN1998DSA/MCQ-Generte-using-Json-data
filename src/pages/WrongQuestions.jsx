import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Edit3, Filter, PlayCircle, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { storageService } from "../services/storageService";
import { saveSession } from "../utils/storage";
import WrongQuestionDetailModal from "../components/WrongQuestionDetailModal";

function WrongQuestions() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, frequently, not_learned, learned, critical
  const [sortBy, setSortBy] = useState("most_wrong"); // most_wrong, recent, priority
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [activeModalItem, setActiveModalItem] = useState(null);

  const loadWrongQuestions = async () => {
    setLoading(true);
    const list = await storageService.getWrongQuestions();
    setItems(list);
    setLoading(false);
  };

  useEffect(() => {
    loadWrongQuestions();
  }, []);

  // Filter topics list
  const availableTopics = useMemo(() => {
    const topics = new Set();
    items.forEach((item) => {
      if (item.topic) topics.add(item.topic);
    });
    return Array.from(topics);
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesQuestion = String(item.question || "").toLowerCase().includes(q);
          const matchesTopic = String(item.topic || "").toLowerCase().includes(q);
          const matchesNote = String(item.personalNote || "").toLowerCase().includes(q);
          if (!matchesQuestion && !matchesTopic && !matchesNote) return false;
        }

        // Topic filter
        if (selectedTopic !== "all" && item.topic !== selectedTopic) return false;

        // Status filter
        if (filterStatus === "frequently" && item.wrongCount < 3) return false;
        if (filterStatus === "not_learned" && item.isLearned) return false;
        if (filterStatus === "learned" && !item.isLearned) return false;
        if (filterStatus === "critical" && item.priority !== "Critical") return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "most_wrong") return b.wrongCount - a.wrongCount;
        if (sortBy === "recent") return new Date(b.lastWrongAt) - new Date(a.lastWrongAt);
        if (sortBy === "priority") {
          const priorityWeight = { Critical: 3, High: 2, Medium: 1, Low: 0 };
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        }
        return 0;
      });
  }, [items, searchQuery, filterStatus, selectedTopic, sortBy]);

  // Start Practice Session for Wrong Questions
  const handlePracticeWrongQuestions = () => {
    if (!filteredItems.length) return;

    const sessionQuestions = filteredItems.map((item, idx) => ({
      id: item.questionId || `wrong-${idx}`,
      globalId: item.questionId,
      question: item.question,
      options: item.options || ["Option A", "Option B", "Option C", "Option D"],
      answer: item.answer ?? 0,
      explanation: item.explanation || "Revision question.",
      topic: item.topic || "Wrong Questions Revision",
    }));

    const sessionId = `wrong-revision-${Date.now()}`;
    const session = {
      id: sessionId,
      subjectId: "wrong-questions-revision",
      subjectTitle: "Wrong Questions Revision",
      subjectFile: "",
      quizType: "wrong_questions",
      settings: {
        questionLimit: "all",
        order: "random",
        timer: "0",
        answerMode: "practice",
        shuffleOptions: false,
      },
      questions: sessionQuestions,
      answers: {},
      visited: { 0: true },
      startedAt: Date.now(),
      submittedAt: null,
      timeLimitSeconds: null,
      elapsedSeconds: 0,
    };

    saveSession(session);
    navigate(`/practice/${sessionId}`);
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Header Banner */}
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle className="h-3.5 w-3.5" />
              Mistake Tracking Hub
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl text-slate-950 dark:text-white">
              My Wrong Questions
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Identify repeated mistakes, write personal learning notes ("Why did I get this wrong?"), and revise until mastered.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePracticeWrongQuestions}
            disabled={!filteredItems.length}
            className="btn-primary shrink-0"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Practice These {filteredItems.length} Questions
          </button>
        </div>

        {/* Quick Filter Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Wrong" },
            { id: "critical", label: "🔴 Critical (3+ wrong)" },
            { id: "frequently", label: "🟠 Frequently Wrong" },
            { id: "not_learned", label: "⏳ Not Learned" },
            { id: "learned", label: "✅ Learned" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                filterStatus === tab.id
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Filter Controls & Search */}
      <section className="panel p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search wrong questions, topics or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-11 py-2.5 text-xs"
          />
        </label>

        <div className="flex items-center gap-3">
          {/* Topic Filter */}
          {availableTopics.length > 0 && (
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="rounded-2xl border border-[#eadffd] bg-white px-3 py-2 text-xs font-semibold outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">All Topics ({availableTopics.length})</option>
              {availableTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-2xl border border-[#eadffd] bg-white px-3 py-2 text-xs font-semibold outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="most_wrong">Sort: Most Wrong</option>
            <option value="recent">Sort: Recently Wrong</option>
            <option value="priority">Sort: Highest Priority</option>
          </select>
        </div>
      </section>

      {/* Question Cards List */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <article
            key={item.questionId}
            className="panel p-4 transition hover:border-violet-300 dark:hover:border-slate-700"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-bold ${
                      item.priority === "Critical"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                        : item.priority === "High"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {item.priority}
                  </span>

                  <span className="font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full dark:bg-rose-500/10 dark:text-rose-300">
                    Failed {item.wrongCount}x
                  </span>

                  {item.topic && (
                    <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-300">
                      {item.topic}
                    </span>
                  )}

                  {item.isLearned && (
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-500/10 dark:text-emerald-300">
                      ✓ Learned
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-base leading-6 text-slate-900 dark:text-white">
                  {item.question}
                </h3>

                {/* Personal Note Callout */}
                {item.personalNote ? (
                  <div className="rounded-2xl bg-violet-50 p-3 text-xs italic text-violet-900 dark:bg-slate-800 dark:text-violet-200">
                    <span className="font-bold uppercase tracking-wider not-italic text-violet-700 dark:text-violet-300">
                      📝 My Note:{" "}
                    </span>
                    "{item.personalNote}"
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No note added yet. Click 'Edit Note' to add why you missed this.</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModalItem(item)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                  Edit Note / View Detail
                </button>
              </div>
            </div>
          </article>
        ))}

        {!loading && !filteredItems.length && (
          <div className="panel p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Sparkles className="mx-auto h-8 w-8 text-violet-400" />
            <p className="font-bold text-slate-900 dark:text-white">No Wrong Questions Found</p>
            <p className="text-sm">Great job! As you take quizzes and answer questions incorrectly, your mistake history and personal notes will automatically appear here.</p>
          </div>
        )}
      </div>

      {/* Detail & Personal Note Modal */}
      <WrongQuestionDetailModal
        item={activeModalItem}
        onClose={() => setActiveModalItem(null)}
        onUpdate={loadWrongQuestions}
      />
    </div>
  );
}

export default WrongQuestions;
