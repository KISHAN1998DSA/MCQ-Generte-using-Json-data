function ProgressBar({ value, total }) {
  const percentage = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600 dark:text-slate-300">Progress</span>
        <span className="font-semibold">
          {value} / {total}
        </span>
      </div>
      <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-accent transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
