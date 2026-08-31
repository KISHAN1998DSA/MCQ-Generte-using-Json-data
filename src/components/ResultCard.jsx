function ResultCard({ label, value, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "bg-accent/10 text-accent"
      : tone === "danger"
        ? "bg-danger/10 text-danger"
        : tone === "warning"
          ? "bg-warning/10 text-warning"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <div className="panel p-4 sm:p-5">
      <div className={`badge ${toneClass}`}>{label}</div>
      <p className="mt-3 text-2xl font-bold sm:text-3xl">{value}</p>
    </div>
  );
}

export default ResultCard;
