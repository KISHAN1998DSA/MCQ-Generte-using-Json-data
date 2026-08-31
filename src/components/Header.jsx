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
    <header className="panel sticky top-4 z-20 overflow-hidden">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-900 via-brand-700 to-sky-500 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link to="/" className="font-display text-2xl font-bold tracking-tight">
              MCQ Practice
            </Link>
            <p className="mt-1 text-sm text-white/80">
              Practice smarter. Improve your score.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative min-w-0 flex-1 lg:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-white/20 bg-white/95 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Search subjects or question text..."
                value={query}
                onChange={handleSearch}
              />
            </label>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
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
