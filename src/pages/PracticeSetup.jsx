import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import subjects from "../data/subjects";
import {
  buildQuestionSet,
  extractQuestions,
  loadSubjectData,
} from "../utils/questionUtils";
import { saveSession, setStorageItem, STORAGE_KEYS, getStorageItem } from "../utils/storage";

const defaultSettings = {
  questionLimit: "25",
  order: "random",
  timer: "0",
  answerMode: "practice",
  shuffleOptions: true,
};

function PracticeSetup() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const subject = subjects.find((item) => item.id === subjectId);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(() => {
    const saved = getStorageItem(STORAGE_KEYS.lastSettings, defaultSettings);
    return { ...defaultSettings, ...saved };
  });

  useEffect(() => {
    if (!subject) {
      setError("This subject could not be found.");
      setLoading(false);
      return;
    }
    let isMounted = true;
    const loadSubject = async () => {
      try {
        const payload = await loadSubjectData(subject.file);
        if (isMounted) setQuestions(extractQuestions(payload));
      } catch (loadError) {
        if (isMounted) setError(loadError.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadSubject();
    return () => {
      isMounted = false;
    };
  }, [subject]);

  const validQuestionCount = useMemo(
    () => questions.filter((question) => !question.hasError).length,
    [questions]
  );

  if (loading) {
    return (
      <div className="panel flex min-h-[300px] items-center justify-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
        <span>Loading subject configuration...</span>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="panel flex items-start gap-3 p-6 text-danger">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <span>{error || "Subject not found."}</span>
      </div>
    );
  }

  const startPractice = () => {
    const selectedQuestions = buildQuestionSet(questions, settings);
    const sessionId = `${subject.id}-${Date.now()}`;
    const startedAt = Date.now();
    const timerMinutes = Number(settings.timer);
    const session = {
      id: sessionId,
      subjectId: subject.id,
      subjectTitle: subject.title,
      subjectFile: subject.file,
      settings,
      questions: selectedQuestions,
      answers: {},
      visited: { 0: true },
      startedAt,
      submittedAt: null,
      timeLimitSeconds: timerMinutes ? timerMinutes * 60 : null,
      elapsedSeconds: 0,
      retrySource: null,
    };
    saveSession(session);
    setStorageItem(STORAGE_KEYS.lastSubject, subject.id);
    setStorageItem(STORAGE_KEYS.lastSettings, settings);
    navigate(`/practice/${sessionId}`);
  };

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <h1 className="font-display text-3xl font-bold">{subject.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          {subject.description}
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <InfoCard label="Available Questions" value={validQuestionCount} />
          <InfoCard label="Invalid Questions" value={questions.length - validQuestionCount} />
          <InfoCard
            label="Answer Mode"
            value={settings.answerMode === "practice" ? "Practice" : "Exam"}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <OptionPanel title="Number of Questions">
          {["10", "25", "50", "100", "all"].map((value) => (
            <ChoiceButton
              key={value}
              active={settings.questionLimit === value}
              onClick={() => setSettings((current) => ({ ...current, questionLimit: value }))}
            >
              {value === "all" ? "All Questions" : value}
            </ChoiceButton>
          ))}
        </OptionPanel>

        <OptionPanel title="Question Order">
          {["sequential", "random"].map((value) => (
            <ChoiceButton
              key={value}
              active={settings.order === value}
              onClick={() => setSettings((current) => ({ ...current, order: value }))}
            >
              {value === "sequential" ? "Sequential" : "Random"}
            </ChoiceButton>
          ))}
        </OptionPanel>

        <OptionPanel title="Timer">
          {[
            { label: "No Timer", value: "0" },
            { label: "15 Minutes", value: "15" },
            { label: "30 Minutes", value: "30" },
            { label: "60 Minutes", value: "60" },
          ].map((item) => (
            <ChoiceButton
              key={item.value}
              active={settings.timer === item.value}
              onClick={() => setSettings((current) => ({ ...current, timer: item.value }))}
            >
              {item.label}
            </ChoiceButton>
          ))}
        </OptionPanel>

        <OptionPanel title="Answer Mode">
          {[
            { label: "Practice Mode", value: "practice" },
            { label: "Exam Mode", value: "exam" },
          ].map((item) => (
            <ChoiceButton
              key={item.value}
              active={settings.answerMode === item.value}
              onClick={() => setSettings((current) => ({ ...current, answerMode: item.value }))}
            >
              {item.label}
            </ChoiceButton>
          ))}
          <label className="mt-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/70">
            <input
              type="checkbox"
              checked={settings.shuffleOptions}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  shuffleOptions: event.target.checked,
                }))
              }
            />
            Shuffle answer choices
          </label>
        </OptionPanel>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={startPractice}
          disabled={!validQuestionCount}
          className="btn-primary min-w-52"
        >
          Start Practice
        </button>
      </div>
    </div>
  );
}

function OptionPanel({ title, children }) {
  return (
    <section className="panel p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ChoiceButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default PracticeSetup;
