import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import PracticeSetup from "./pages/PracticeSetup";
import Practice from "./pages/Practice";
import Result from "./pages/Result";
import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
  defaultStats,
} from "./utils/storage";

function App() {
  const [theme, setTheme] = useState(
    getStorageItem(STORAGE_KEYS.theme, "light") || "light"
  );
  const [stats, setStats] = useState(getStorageItem(STORAGE_KEYS.stats, defaultStats));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    setStorageItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  const sidebarItems = useMemo(
    () => [
      { label: "Dashboard", to: "/" },
      { label: "Bookmarked Questions", to: "/?section=bookmarks" },
      { label: "Recent Attempts", to: "/?section=history" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Sidebar items={sidebarItems} stats={stats} />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Header theme={theme} setTheme={setTheme} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home stats={stats} setStats={setStats} />} />
              <Route
                path="/setup/:subjectId"
                element={<PracticeSetup setStats={setStats} />}
              />
              <Route path="/practice/:sessionId" element={<Practice setStats={setStats} />} />
              <Route path="/result/:sessionId" element={<Result setStats={setStats} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
