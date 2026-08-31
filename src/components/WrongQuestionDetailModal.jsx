import { useState } from "react";
import { X, Check, Edit3, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { storageService } from "../services/storageService";

function WrongQuestionDetailModal({ item, onClose, onUpdate }) {
  if (!item) return null;

  const [note, setNote] = useState(item.personalNote || "");
  const [isLearned, setIsLearned] = useState(item.isLearned || false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    await storageService.saveQuestionNote(item.questionId, note);
    await storageService.setQuestionLearned(item.questionId, isLearned);
    setSaving(false);
    setMessage("Saved successfully!");
    if (onUpdate) onUpdate();
    setTimeout(() => setMessage(""), 2000);
  };

  const correctAnswerLabel =
    item.answer !== null && item.options
      ? item.options[item.answer]
      : "Not provided";

  const userAnswerLabel =
    item.lastSelectedAnswer !== undefined && item.options
      ? item.options[item.lastSelectedAnswer]
      : "Incorrect";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-[#eadffd] bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              item.priority === "Critical"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                : item.priority === "High"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {item.priority} Priority
          </span>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            Wrong {item.wrongCount}x
          </span>
          {item.topic && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {item.topic}
            </span>
          )}
        </div>

        {/* Question Text */}
        <h3 className="mt-4 font-display text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
          {item.question}
        </h3>

        {/* Answer Breakdown */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-900 dark:bg-rose-500/10">
            <p className="text-xs font-semibold text-rose-600">Your Last Answer</p>
            <p className="mt-1 font-semibold text-rose-950 dark:text-rose-200">{userAnswerLabel}</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-900 dark:bg-emerald-500/10">
            <p className="text-xs font-semibold text-emerald-600">Correct Answer</p>
            <p className="mt-1 font-semibold text-emerald-950 dark:text-emerald-200">{correctAnswerLabel}</p>
          </div>
        </div>

        {/* Options List */}
        {Array.isArray(item.options) && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500">All Options:</p>
            {item.options.map((opt, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-3 text-sm flex items-center justify-between ${
                  idx === item.answer
                    ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : idx === item.lastSelectedAnswer
                    ? "border-rose-500 bg-rose-50 text-rose-950 dark:border-rose-500 dark:bg-rose-500/10 dark:text-rose-200"
                    : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                }`}
              >
                <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                {idx === item.answer && <span className="text-xs text-emerald-600 font-bold">✓ Correct</span>}
                {idx === item.lastSelectedAnswer && idx !== item.answer && (
                  <span className="text-xs text-rose-600 font-bold">✗ Selected</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Explanation */}
        {item.explanation && (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">Explanation: </span>
            {item.explanation}
          </div>
        )}

        {/* Personal Note Editor */}
        <div className="mt-5 space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            <Edit3 className="h-3.5 w-3.5" />
            Why did I get this question wrong?
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Write your personal reason (e.g. confused formula, misread options, concept gap)..."
            className="w-full rounded-2xl border border-violet-200 bg-white p-3 text-sm outline-none ring-2 ring-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {/* Learned Status & Controls */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isLearned}
              onChange={(e) => setIsLearned(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-400"
            />
            <span>Mark as "Learned"</span>
          </label>

          <div className="flex items-center gap-2">
            {message && <span className="text-xs font-semibold text-emerald-600">{message}</span>}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Saving..." : "Save Note & Status"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WrongQuestionDetailModal;
