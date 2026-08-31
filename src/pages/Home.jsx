import { useEffect, useMemo, useState } from "react";
import { BookmarkCheck, History, LoaderCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import subjects from "../data/subjects";
import SubjectCard from "../components/SubjectCard";
import { extractQuestions, loadSubjectData } from "../utils/questionUtils";
import { getBookmarks, getStorageItem, STORAGE_KEYS } from "../utils/storage";

function Home({ stats }) {
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
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Subjects" value={subjects.length} />
        <StatCard label="Total Questions" value={totalQuestions} />
        <StatCard label="Questions Attempted" value={stats.attemptedQuestions} />
        <StatCard label="Overall Accuracy" value={`${stats.accuracy}%`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">Subjects</h2>
              <p className="text-sm text-slate-500">
                {query ? `Search results for "${query}"` : "Choose a subject and begin practice."}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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

        <div className="space-y-6">
          <section className={`panel p-5 ${section === "bookmarks" ? "ring-2 ring-brand-500" : ""}`}>
            <div className="flex items-center gap-3">
              <BookmarkCheck className="h-5 w-5 text-brand-600" />
              <div>
                <h3 className="font-semibold">Bookmarked Questions</h3>
                <p className="text-sm text-slate-500">{bookmarks.length} saved for revision</p>
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
                <p className="text-sm text-slate-500">Bookmark questions during practice to see them here.</p>
              )}
            </div>
          </section>

          <section className={`panel p-5 ${section === "history" ? "ring-2 ring-brand-500" : ""}`}>
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-brand-600" />
              <div>
                <h3 className="font-semibold">Recent Attempts</h3>
                <p className="text-sm text-slate-500">Your latest practice sessions</p>
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
                <p className="text-sm text-slate-500">Your completed practice attempts will appear here.</p>
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

function StatCard({ label, value }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

export default Home;
