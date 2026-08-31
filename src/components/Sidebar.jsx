import { LayoutDashboard, AlertCircle, RefreshCw, SlidersHorizontal, History, BarChart3, Database } from "lucide-react";
import { NavLink } from "react-router-dom";

function Sidebar({ stats }) {
  const items = [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Wrong Questions", to: "/wrong-questions", icon: AlertCircle, badge: "Core" },
    { label: "Revision Center", to: "/revision", icon: RefreshCw },
    { label: "Custom Quiz", to: "/custom-quiz", icon: SlidersHorizontal },
    { label: "Practice History", to: "/history", icon: History },
    { label: "Exam Reports", to: "/reports", icon: BarChart3 },
    { label: "Question Registry", to: "/admin/content", icon: Database },
  ];

  return (
    <aside className="hidden w-64 shrink-0 xl:block xl:w-72">
      <div className="sticky top-4 flex flex-col gap-4">
        <div className="panel p-4 xl:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-600">
            Navigation
          </p>
          <nav className="mt-4 space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold transition ${
                      isActive
                        ? "bg-violet-600 text-white shadow-soft"
                        : "text-slate-600 hover:bg-slate-100 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="panel p-4 xl:p-5">
          <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Overall Accuracy
          </p>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/70">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 font-extrabold text-sm dark:bg-emerald-500/10 dark:text-emerald-300">
              {stats.accuracy || 0}%
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Answered</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{stats.attemptedQuestions || 0} Qs</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
