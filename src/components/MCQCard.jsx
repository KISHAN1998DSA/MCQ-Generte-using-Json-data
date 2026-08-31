import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck, CircleCheck, CircleX, Info, Flag, Eraser, Edit3, Save, Check } from "lucide-react";
import { storageService } from "../services/storageService";

function MCQCard({
  question,
  questionNumber,
  selectedAnswer,
  isLocked,
  showResult,
  answerMode,
  onSelect,
  onClearAnswer,
  isMarkedForReview,
  onToggleMarkForReview,
  isBookmarked,
  onToggleBookmark,
  personalNote: initialNote = "",
  onNoteSaved,
}) {
  const [noteText, setNoteText] = useState(initialNote);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setNoteText(initialNote);
  }, [initialNote, question.id]);

  const correctAnswerLabel =
    question.answer !== null ? `Option ${String.fromCharCode(65 + question.answer)}` : "Invalid";

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    const qId = question.globalId || question.id;
    await storageService.saveQuestionNote(qId, noteText);
    setIsSavingNote(false);
    setSavedSuccess(true);
    setIsEditingNote(false);
    if (onNoteSaved) onNoteSaved(qId, noteText);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="panel p-4 sm:p-5">
      {/* Question Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge bg-violet-100 text-violet-700 dark:bg-slate-800 dark:text-slate-100 font-bold">
            Q{questionNumber}
          </span>
          {question.topic && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {question.topic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mark for Review */}
          <button
            type="button"
            onClick={onToggleMarkForReview}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isMarkedForReview
                ? "border-purple-500 bg-purple-500 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            {isMarkedForReview ? "Marked" : "Mark Review"}
          </button>

          {/* Clear Answer */}
          {selectedAnswer !== undefined && selectedAnswer !== null && !isLocked && (
            <button
              type="button"
              onClick={onClearAnswer}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </button>
          )}

          {/* Bookmark */}
          <button
            type="button"
            onClick={onToggleBookmark}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            title="Bookmark Question"
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-violet-600" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Question Text */}
      <h2 className="mt-4 text-base font-semibold leading-7 text-slate-950 sm:text-lg dark:text-white">
        {question.question}
      </h2>

      {question.hasError && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
          {question.errorMessage}
        </div>
      )}

      {/* Options List */}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = question.answer === index;
          const showPracticeFeedback = showResult && answerMode === "practice";

          let stateClass =
            "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40 dark:border-slate-700 dark:bg-slate-900";
          if (isSelected) {
            stateClass = "border-violet-600 bg-violet-50 ring-1 ring-violet-500 dark:border-violet-500 dark:bg-violet-500/10";
          }
          if (showPracticeFeedback && isCorrect) {
            stateClass = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 dark:border-emerald-500 dark:bg-emerald-500/10";
          }
          if (showPracticeFeedback && isSelected && !isCorrect) {
            stateClass = "border-rose-500 bg-rose-50 ring-1 ring-rose-500 dark:border-rose-500 dark:bg-rose-500/10";
          }

          return (
            <button
              key={`${question.globalId || question.id}-${index}`}
              type="button"
              disabled={isLocked || question.hasError}
              onClick={() => onSelect(index)}
              className={`flex min-h-14 w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${stateClass} ${
                isLocked ? "cursor-not-allowed opacity-90" : ""
              }`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isSelected
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </div>
              <p className="text-sm font-medium leading-6 text-slate-900 dark:text-slate-100">{option}</p>
            </button>
          );
        })}
      </div>

      {/* Practice Mode Feedback & Explanation */}
      {showResult && answerMode === "practice" && (
        <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-sm font-bold">
            {selectedAnswer === question.answer ? (
              <>
                <CircleCheck className="h-5 w-5 text-emerald-600" />
                <span className="text-emerald-600">Correct Answer!</span>
              </>
            ) : (
              <>
                <CircleX className="h-5 w-5 text-rose-600" />
                <span className="text-rose-600">Incorrect Answer</span>
              </>
            )}
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">Correct Option:</span> {correctAnswerLabel}
          </p>
          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <p>{question.explanation}</p>
          </div>
        </div>
      )}

      {/* Personal Learning Note ("Why did I get this wrong?") Section */}
      {(showResult || isEditingNote || noteText) && (
        <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              <Edit3 className="h-3.5 w-3.5" />
              <span>Personal Learning Note ("Why did I get this wrong?")</span>
            </div>
            {!isEditingNote && (
              <button
                type="button"
                onClick={() => setIsEditingNote(true)}
                className="text-xs font-semibold text-violet-600 hover:underline"
              >
                {noteText ? "Edit Note" : "+ Add Note"}
              </button>
            )}
          </div>

          {isEditingNote ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Example: I confused Supreme Court writ jurisdiction (Art 32) with High Court (Art 226)..."
                rows={3}
                className="w-full rounded-xl border border-violet-200 bg-white p-3 text-sm outline-none ring-2 ring-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingNote(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="btn-primary py-1.5 px-3 text-xs"
                >
                  <Save className="mr-1 h-3.5 w-3.5" />
                  {isSavingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>
          ) : noteText ? (
            <p className="mt-2 text-sm italic text-slate-800 dark:text-slate-200">
              "{noteText}"
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              No personal note added yet. Click "+ Add Note" to record your reason for future revision.
            </p>
          )}

          {savedSuccess && (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Check className="h-3.5 w-3.5" /> Note saved permanently!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default MCQCard;
