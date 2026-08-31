import { useEffect, useMemo, useState } from "react";
import { BookmarkCheck, FolderOpen, History, Infinity, Layers3, LoaderCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import subjects from "../data/subjects";
import SubjectCard from "../components/SubjectCard";
import { extractQuestions, loadSubjectData } from "../utils/questionUtils";
import { getBookmarks, getStorageItem, STORAGE_KEYS } from "../utils/storage";

function Home() {
  const [searchParams] = useSearchParams();
  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await Promise.all(
          subjects.map(async (subject) => {
            try {
              const payload = await loadSubjectData(subject.file);
              const questions = extractQuestions(payload);
              return { ...subject, payload, questions, loadError: "" };
            } catch (subjectError) {
              return { ...subject, payload: null, questions: [], loadError: subjectError.message };
            }
          })
        );
        if (isMounted) {
          setSubjectData(data);
          setBookmarks(getBookmarks());
          setHistory(getStorageItem(STORAGE_KEYS.history, []));
        }
      } catch {
        if (isMounted) setError("Unable to load the dashboard right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDashboard();
    window.addEventListener("storage", loadDashboard);
    return () => {
      isMounted = false;
      window.removeEventListener("storage", loadDashboard);
    };
  }, []);

  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const section = searchParams.get("section");

  const enrichedSubjects = useMemo(() => {
    return subjectData
      .map((subject) => {
        const questionMatches = subject.questions.filter((question) =>
          question.question.toLowerCase().includes(query)
        ).length;
        const subjectMatches = [subject.title, subject.description, subject.payload?.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
        return {
          ...subject,
          questionCount: subject.questions.length,
          matchCount: query ? (subjectMatches ? questionMatches || 1 : questionMatches) : null,
          visible: !query || subjectMatches || questionMatches > 0,
        };
      })
      .filter((subject) => subject.visible);
  }, [query, subjectData]);

  const totalQuestions = useMemo(
    () => subjectData.reduce((sum, subject) => sum + subject.questions.length, 0),
    [subjectData]
  );

  if (loading) {
    return (
      <div className="panel flex min-h-[300px] items-center justify-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
        <span>Loading your MCQ dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="panel p-6 text-danger">{error}</div>;
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="panel overflow-hidden px-4 py-6 text-center sm:px-5 lg:px-6 lg:py-7">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
            Library
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl dark:text-white">
            Browse every subject
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-[15px]">
            Find a category, open its topic-wise question bank, and practice at your own pace with
            instant results and simple exam-friendly screens.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <HeroStat icon={FolderOpen} label="Categories" value={subjects.length} tone="violet" />
            <HeroStat icon={Layers3} label="Questions" value={totalQuestions} tone="cyan" />
            <HeroStat icon={Infinity} label="Practice attempts" value="Unlimited" tone="orange" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,2fr)_320px]">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-600">Topics</p>
            <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl">Explore sub categories</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {query ? `Search results for "${query}"` : "Choose a subject and begin practice."}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {enrichedSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                questionCount={subject.questionCount}
                matchCount={subject.matchCount}
              />
            ))}
          </div>

          {!enrichedSubjects.length && (
            <div className="panel p-6 text-sm text-slate-500">
              No matching subjects or questions were found.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <section className={`panel p-4 ${section === "bookmarks" ? "ring-2 ring-brand-500" : ""}`}>
            <div className="flex items-center gap-3">
              <BookmarkCheck className="h-5 w-5 text-brand-600" />
              <div>
                <h3 className="font-semibold">Bookmarked Questions</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{bookmarks.length} saved for revision</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {bookmarks.slice(0, 5).map((bookmark) => (
                <div
                  key={`${bookmark.subjectId}-${bookmark.questionId}`}
                  className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800/70"
                >
                  <p className="font-semibold">{bookmark.subjectTitle}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{bookmark.question}</p>
                </div>
              ))}
              {!bookmarks.length && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Bookmark questions during practice to see them here.
                </p>
              )}
            </div>
          </section>

          <section className={`panel p-4 ${section === "history" ? "ring-2 ring-brand-500" : ""}`}>
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-brand-600" />
              <div>
                <h3 className="font-semibold">Recent Attempts</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Your latest practice sessions</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {history.slice(0, 5).map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800/70">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{entry.subjectTitle}</p>
                    <span className="text-xs text-slate-500">{entry.dateLabel}</span>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    {entry.total} Questions | Score {entry.correct}/{entry.total} | Accuracy {entry.accuracy}%
                  </p>
                </div>
              ))}
              {!history.length && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your completed practice attempts will appear here.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>

      {subjectData.some((subject) => subject.loadError) && (
        <section className="panel p-5">
          <h3 className="font-semibold">Data loading notes</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {subjectData
              .filter((subject) => subject.loadError)
              .map((subject) => (
                <p key={subject.id}>
                  {subject.title}: {subject.loadError}
                </p>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HeroStat({ icon: Icon, label, value, tone }) {
  const toneClass =
    tone === "cyan"
      ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300"
      : tone === "orange"
        ? "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300"
        : "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300";

  return (
    <div className="mx-auto flex w-full max-w-xs items-center gap-3 rounded-[22px] border border-[#eadffd] bg-white px-4 py-3 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className={`rounded-2xl p-3 ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-950 dark:text-white">{value}</p>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default Home;
