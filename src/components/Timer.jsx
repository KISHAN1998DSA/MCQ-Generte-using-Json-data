import { Clock3 } from "lucide-react";
import { formatTime } from "../utils/questionUtils";

function Timer({ secondsRemaining, label = "Time Left" }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
      <Clock3 className="h-5 w-5 text-warning" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-semibold">{formatTime(secondsRemaining)}</p>
      </div>
    </div>
  );
}

export default Timer;
