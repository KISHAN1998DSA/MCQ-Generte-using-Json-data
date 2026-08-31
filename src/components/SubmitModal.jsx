import { AlertCircle, CheckCircle2, HelpCircle, ShieldAlert } from "lucide-react";

function SubmitModal({ isOpen, onClose, onSubmit, sessionStats }) {
  if (!isOpen) return null;

  const { total, answered, unanswered, marked, answeredAndMarked } = sessionStats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-[28px] border border-[#eadffd] bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
              Confirm Test Submission
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to finish and submit your exam?
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="Total" value={total} color="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" />
          <StatBox label="Answered" value={answered} color="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300" />
          <StatBox label="Unanswered" value={unanswered} color="bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" />
          <StatBox label="Marked" value={marked} color="bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-300" />
        </div>

        {unanswered > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>You still have {unanswered} unanswered question{unanswered > 1 ? "s" : ""}.</span>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full sm:w-auto"
          >
            Return to Test
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="btn-primary w-full sm:w-auto"
          >
            Submit Test Now
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className={`rounded-2xl p-3 text-center ${color}`}>
      <p className="text-xs font-medium">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

export default SubmitModal;
