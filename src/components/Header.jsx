import { Moon, Search, Sun } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

function Header({ theme, setTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const handleSearch = (event) => {
    const nextValue = event.target.value;
    if (location.pathname !== "/") {
      navigate(`/?q=${encodeURIComponent(nextValue)}`);
      return;
    }
    const nextQuery = nextValue ? `/?q=${encodeURIComponent(nextValue)}` : "/";
    navigate(nextQuery, { replace: true });
  };

  return (
    <header className="panel sticky top-4 z-20 overflow-hidden bg-white/80 dark:bg-slate-900/85">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Link to="/" className="font-display text-xl font-bold tracking-tight text-slate-950 sm:text-2xl dark:text-white">
              MCQ Practice
            </Link>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Practice smarter. Improve your score.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <label className="relative min-w-0 flex-1 xl:w-72 2xl:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-[#eadffd] bg-[#fcfbff] py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Search subjects or question text..."
                value={query}
                onChange={handleSearch}
              />
            </label>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#eadffd] bg-[#fcfbff] text-slate-700 transition hover:border-violet-300 hover:text-violet-700 sm:h-11 sm:w-11 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
