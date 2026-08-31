import { Bookmark, BookmarkCheck, CircleCheck, CircleX, Info } from "lucide-react";

function MCQCard({
  question,
  questionNumber,
  selectedAnswer,
  isLocked,
  showResult,
  answerMode,
  onSelect,
  isBookmarked,
  onToggleBookmark,
}) {
  const correctAnswerLabel =
    question.answer !== null ? `Option ${String.fromCharCode(65 + question.answer)}` : "Invalid";

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            Question {questionNumber}
          </div>
          <h2 className="mt-4 text-lg font-semibold leading-8">{question.question}</h2>
        </div>
        <button
          type="button"
          onClick={onToggleBookmark}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          aria-label="Toggle bookmark"
        >
          {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-brand-600" /> : <Bookmark className="h-5 w-5" />}
        </button>
      </div>

      {question.hasError && (
        <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {question.errorMessage}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = question.answer === index;
          const showPracticeFeedback = showResult && answerMode === "practice";

          let stateClass =
            "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-900";
          if (isSelected) {
            stateClass = "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10";
          }
          if (showPracticeFeedback && isCorrect) {
            stateClass = "border-accent bg-accent/10 dark:border-accent dark:bg-accent/10";
          }
          if (showPracticeFeedback && isSelected && !isCorrect) {
            stateClass = "border-danger bg-danger/10 dark:border-danger dark:bg-danger/10";
          }

          return (
            <button
              key={`${question.id}-${index}`}
              type="button"
              disabled={isLocked || question.hasError}
              onClick={() => onSelect(index)}
              className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${stateClass} ${
                isLocked ? "cursor-not-allowed opacity-90" : ""
              }`}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                {String.fromCharCode(65 + index)}
              </div>
              <p className="text-sm leading-7">{option}</p>
            </button>
          );
        })}
      </div>

      {showResult && answerMode === "practice" && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {selectedAnswer === question.answer ? (
              <>
                <CircleCheck className="h-5 w-5 text-accent" />
                <span className="text-accent">Correct Answer</span>
              </>
            ) : (
              <>
                <CircleX className="h-5 w-5 text-danger" />
                <span className="text-danger">Incorrect Answer</span>
              </>
            )}
          </div>
          <p className="mt-3 text-sm">
            <span className="font-semibold">Correct Answer:</span> {correctAnswerLabel}
          </p>
          <div className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p>{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MCQCard;
