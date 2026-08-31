import { useEffect, useState } from "react";
import { Database, AlertTriangle, CheckCircle2, FileCode, RefreshCw } from "lucide-react";
import { contentRegistry } from "../services/contentRegistry";
import { validateQuestionPayload } from "../utils/jsonValidator";

function ContentAdmin() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validations, setValidations] = useState({});

  const loadContent = async () => {
    setLoading(true);
    const { loadedSets } = await contentRegistry.getCategorizedContent();
    setSets(loadedSets);

    const valResults = {};
    loadedSets.forEach((item) => {
      if (item.payload) {
        valResults[item.id] = validateQuestionPayload(item.payload, item.file);
      }
    });
    setValidations(valResults);
    setLoading(false);
  };

  useEffect(() => {
    loadContent();
  }, []);

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          <Database className="h-3.5 w-3.5" />
          Content Architecture Utility
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl text-slate-950 dark:text-white">
          JSON Question Bank Registry
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Automatic discovery, metadata inspection, JSON structural validation, and duplicate question detection for registered question files.
        </p>
      </section>

      {/* Control Bar */}
      <section className="panel p-4 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Total Registered JSON Files: {sets.length}
        </span>
        <button
          type="button"
          onClick={loadContent}
          className="btn-secondary py-2 text-xs"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Re-scan Registry
        </button>
      </section>

      {/* List of JSON Sets */}
      <div className="space-y-4">
        {sets.map((item) => {
          const val = validations[item.id];
          return (
            <article key={item.id} className="panel p-5 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-950 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-500">{item.file}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {item.questions?.length || 0} Questions
                  </span>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 uppercase">
                    {item.type || "topic_wise"}
                  </span>
                </div>
              </div>

              {/* Validation Feedback */}
              {val && (
                <div className="mt-3 space-y-2 text-xs border-t border-slate-100 pt-3 dark:border-slate-800">
                  {val.isValid ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Valid JSON structure. All answer indices within range.</span>
                    </div>
                  ) : (
                    <div className="space-y-1 text-rose-600 font-semibold">
                      {val.errors.map((err, i) => (
                        <p key={i} className="flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
                        </p>
                      ))}
                    </div>
                  )}

                  {val.warnings.length > 0 && (
                    <div className="rounded-2xl bg-amber-50 p-3 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 space-y-1">
                      <p className="font-bold">Warnings ({val.warnings.length}):</p>
                      {val.warnings.map((warn, i) => (
                        <p key={i}>• {warn}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ContentAdmin;
