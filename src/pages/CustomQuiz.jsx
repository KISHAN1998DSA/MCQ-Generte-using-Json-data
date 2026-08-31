import { useEffect, useState, useMemo } from "react";
import { SlidersHorizontal, PlayCircle, LoaderCircle, CheckSquare, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { contentRegistry } from "../services/contentRegistry";
import { buildQuestionSet } from "../utils/questionUtils";
import { saveSession } from "../utils/storage";

function CustomQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allSets, setAllSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [questionLimit, setQuestionLimit] = useState("25");
  const [timer, setTimer] = useState("30");
  const [order, setOrder] = useState("random");
  const [answerMode, setAnswerMode] = useState("exam");
  const [shuffleOptions, setShuffleOptions] = useState(true);

  useEffect(() => {
    contentRegistry.getCategorizedContent().then(({ loadedSets }) => {
      setAllSets(loadedSets);
      if (loadedSets.length) {
        setSelectedSetId(loadedSets[0].id);
      }
      setLoading(false);
    });
  }, []);

  const activeSet = useMemo(() => {
    return allSets.find((s) => s.id === selectedSetId) || null;
  }, [allSets, selectedSetId]);

  const availableTopics = useMemo(() => {
    if (!activeSet || !Array.isArray(activeSet.questions)) return [];
    const set = new Set();
    activeSet.questions.forEach((q) => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set);
  }, [activeSet]);

  const filteredPool = useMemo(() => {
    if (!activeSet || !Array.isArray(activeSet.questions)) return [];
    if (!selectedTopics.length) return activeSet.questions;
    return activeSet.questions.filter((q) => selectedTopics.includes(q.topic));
  }, [activeSet, selectedTopics]);

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleStartCustomQuiz = () => {
    if (!filteredPool.length) return;

    const settings = {
      questionLimit,
      order,
      timer,
      answerMode,
      shuffleOptions,
      quizType: "custom_quiz",
    };

    const selectedQuestions = buildQuestionSet(filteredPool, settings);
    const sessionId = `custom-${Date.now()}`;
    const timerMinutes = Number(timer);

    const session = {
      id: sessionId,
      subjectId: activeSet?.id || "custom",
      subjectTitle: `Custom Quiz — ${activeSet?.title || "Mixed Topics"}`,
      subjectFile: activeSet?.file || "",
      quizType: "custom_quiz",
      settings,
      questions: selectedQuestions,
      answers: {},
      visited: { 0: true },
      startedAt: Date.now(),
      submittedAt: null,
      timeLimitSeconds: timerMinutes ? timerMinutes * 60 : null,
      elapsedSeconds: 0,
    };

    saveSession(session);
    navigate(`/practice/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="panel flex min-h-[300px] items-center justify-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-violet-600" />
        <span>Loading Question Bank...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Custom Exam Generator
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl text-slate-950 dark:text-white">
          Create Custom Quiz
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Build a personalized test session by picking specific subjects, topics, question counts, order, and exam mode.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* 1. Choose Subject */}
          <section className="panel p-5 space-y-3">
            <h2 className="font-semibold text-slate-900 dark:text-white">1. Select Question Bank / Subject</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {allSets.map((set) => (
                <button
                  key={set.id}
                  type="button"
                  onClick={() => {
                    setSelectedSetId(set.id);
                    setSelectedTopics([]);
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedSetId === set.id
                      ? "border-violet-600 bg-violet-50/70 ring-1 ring-violet-500 dark:border-violet-500 dark:bg-violet-500/10"
                      : "border-slate-200 bg-white hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <p className="font-bold text-sm text-slate-950 dark:text-white">{set.title}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {set.questions?.length || 0} Questions
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* 2. Select Topics */}
          {availableTopics.length > 0 && (
            <section className="panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 dark:text-white">2. Filter by Topics (Optional)</h2>
                <button
                  type="button"
                  onClick={() => setSelectedTopics([])}
                  className="text-xs text-violet-600 hover:underline"
                >
                  Clear Selection (Select All)
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableTopics.map((topic) => {
                  const isChecked = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold text-left transition ${
                        isChecked
                          ? "border-violet-600 bg-violet-100/60 text-violet-900 dark:bg-violet-500/20 dark:text-violet-200"
                          : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      }`}
                    >
                      {isChecked ? <CheckSquare className="h-4 w-4 text-violet-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                      <span>{topic}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. Configure Parameters */}
          <section className="panel p-5 space-y-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">3. Configure Session Parameters</h2>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Question Count</label>
                <select
                  value={questionLimit}
                  onChange={(e) => setQuestionLimit(e.target.value)}
                  className="input mt-1 text-xs py-2"
                >
                  <option value="10">10 Questions</option>
                  <option value="25">25 Questions</option>
                  <option value="50">50 Questions</option>
                  <option value="100">100 Questions</option>
                  <option value="all">All Available</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Timer Limit</label>
                <select
                  value={timer}
                  onChange={(e) => setTimer(e.target.value)}
                  className="input mt-1 text-xs py-2"
                >
                  <option value="0">No Timer</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Order</label>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="input mt-1 text-xs py-2"
                >
                  <option value="random">Random Order</option>
                  <option value="sequential">Sequential Order</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Mode</label>
                <select
                  value={answerMode}
                  onChange={(e) => setAnswerMode(e.target.value)}
                  className="input mt-1 text-xs py-2"
                >
                  <option value="exam">Real Exam Mode</option>
                  <option value="practice">Practice Mode</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-400"
              />
              Shuffle option order (A, B, C, D)
            </label>
          </section>
        </div>

        {/* Action Panel */}
        <div>
          <div className="panel p-5 sticky top-4 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Custom Session Summary</h3>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Subject:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeSet?.title || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span>Matching Questions:</span>
                <span className="font-bold text-violet-600">{filteredPool.length} Qs</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Count:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {questionLimit === "all" ? filteredPool.length : Math.min(Number(questionLimit), filteredPool.length)} Qs
                </span>
              </div>
              <div className="flex justify-between">
                <span>Timer:</span>
                <span className="font-bold text-slate-900 dark:text-white">{timer === "0" ? "None" : `${timer} min`}</span>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="font-bold uppercase text-slate-900 dark:text-white">{answerMode}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartCustomQuiz}
              disabled={!filteredPool.length}
              className="btn-primary w-full py-3"
            >
              <PlayCircle className="mr-2 h-5 w-5" /> Start Custom Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomQuiz;
