function QuestionNavigator({
  questions,
  currentIndex,
  answers = {},
  visited = {},
  markedForReview = {},
  onJump,
  showReviewState = false,
}) {
  const getStateClass = (question, index) => {
    const isCurrent = index === currentIndex;
    const isAnswered = answers[index] !== undefined && answers[index] !== null;
    const isMarked = markedForReview[index];
    const isVis = visited[index];

    if (showReviewState) {
      if (!isAnswered) {
        return "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900";
      }
      return answers[index] === question.answer
        ? "border-emerald-500 bg-emerald-500 text-white"
        : "border-rose-500 bg-rose-500 text-white";
    }

    if (isAnswered && isMarked) {
      return `border-indigo-600 bg-indigo-600 text-white ring-2 ring-amber-400 ${
        isCurrent ? "scale-105 shadow-md" : ""
      }`;
    }
    if (isMarked) {
      return `border-purple-600 bg-purple-600 text-white ${
        isCurrent ? "ring-2 ring-violet-400 scale-105" : ""
      }`;
    }
    if (isAnswered) {
      return `border-emerald-600 bg-emerald-600 text-white ${
        isCurrent ? "ring-2 ring-violet-400 scale-105" : ""
      }`;
    }
    if (isVis) {
      return `border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-500/20 dark:text-amber-300 ${
        isCurrent ? "ring-2 ring-violet-400 scale-105" : ""
      }`;
    }

    return `border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${
      isCurrent ? "border-violet-600 ring-2 ring-violet-400" : ""
    }`;
  };

  return (
    <div className="panel p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-slate-900 dark:text-white">Question Palette</p>
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          {questions.length} Questions
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto p-1 sm:grid-cols-6 2xl:grid-cols-5">
        {questions.map((question, index) => (
          <button
            key={question.globalId || question.id}
            type="button"
            onClick={() => onJump(index)}
            className={`rounded-xl border px-2.5 py-2 text-xs font-bold transition duration-150 ${getStateClass(
              question,
              index
            )}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {!showReviewState && (
        <div className="mt-4 border-t border-slate-200 pt-3 text-[11px] space-y-1.5 dark:border-slate-800 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-emerald-600 inline-block" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-purple-600 inline-block" />
            <span>Marked for Review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-indigo-600 ring-1 ring-amber-400 inline-block" />
            <span>Answered + Marked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-amber-100 border border-amber-400 inline-block dark:bg-amber-500/20" />
            <span>Visited / Unanswered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-white border border-slate-300 inline-block dark:bg-slate-900" />
            <span>Unvisited</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionNavigator;
