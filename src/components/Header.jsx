import { useState } from "react";
import { Moon, Search, Sun, Menu, X, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

function Header({ theme, setTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSearch = (event) => {
    const nextValue = event.target.value;
    if (location.pathname !== "/wrong-questions" && location.pathname !== "/") {
      navigate(`/?q=${encodeURIComponent(nextValue)}`);
      return;
    }
    const nextQuery = nextValue ? `?q=${encodeURIComponent(nextValue)}` : "";
    navigate(`${location.pathname}${nextQuery}`, { replace: true });
  };

  const navLinks = [
    { label: "Dashboard", to: "/" },
    { label: "Wrong Questions", to: "/wrong-questions" },
    { label: "Revision Hub", to: "/revision" },
    { label: "Custom Quiz", to: "/custom-quiz" },
    { label: "History", to: "/history" },
    { label: "Reports", to: "/reports" },
  ];

  return (
    <header className="panel sticky top-3 z-30 bg-white/80 dark:bg-slate-900/85 backdrop-blur-md">
      <div className="flex items-center justify-between p-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="btn-secondary p-2 xl:hidden"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white font-extrabold text-base shadow-sm">
              EX
            </span>
            <div>
              <span className="font-display text-lg font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-xl">
                MCQ Exam System
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Personal Prep & Mistake Tracker
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Input */}
          <label className="relative hidden md:block w-60 lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-xs text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Search questions or topics..."
              value={query}
              onChange={handleSearch}
            />
          </label>

          {/* Personal Mode Pill (No login/sign up required) */}
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 dark:border-slate-700 dark:bg-violet-500/10 dark:text-violet-300">
            <ShieldCheck className="h-4 w-4 text-violet-600" />
            <span>Personal Workspace</span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="border-t border-slate-200 p-3 xl:hidden dark:border-slate-800 grid grid-cols-2 gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileNavOpen(false)}
              className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-violet-100 hover:text-violet-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

export default Header;
