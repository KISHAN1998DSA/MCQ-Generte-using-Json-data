function QuestionNavigator({
  questions,
  currentIndex,
  answers,
  visited,
  onJump,
  showReviewState = false,
}) {
  const getStateClass = (question, index) => {
    if (index === currentIndex) return "border-brand-600 bg-brand-600 text-white";
    if (showReviewState) {
      if (answers[index] === undefined || answers[index] === null) {
        return "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900";
      }
      return answers[index] === question.answer
        ? "border-accent bg-accent text-white"
        : "border-danger bg-danger text-white";
    }
    if (answers[index] !== undefined && answers[index] !== null) {
      return "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-500/10 dark:text-brand-100";
    }
    if (visited[index]) {
      return "border-warning/50 bg-warning/10 text-warning";
    }
    return "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
  };

  return (
    <div className="panel p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">Question Navigator</p>
        <p className="text-xs text-slate-500">{questions.length} questions</p>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 2xl:grid-cols-5">
        {questions.map((question, index) => (
          <button
            key={question.id}
            type="button"
            onClick={() => onJump(index)}
            className={`rounded-xl border px-2.5 py-2 text-sm font-semibold transition ${getStateClass(
              question,
              index
            )}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuestionNavigator;
