import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import PracticeSetup from "./pages/PracticeSetup";
import Practice from "./pages/Practice";
import Result from "./pages/Result";
import WrongQuestions from "./pages/WrongQuestions";
import RevisionCenter from "./pages/RevisionCenter";
import CustomQuiz from "./pages/CustomQuiz";
import PracticeHistory from "./pages/PracticeHistory";
import Reports from "./pages/Reports";
import ContentAdmin from "./pages/ContentAdmin";
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

  return (
    <div className="min-h-screen text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-4 px-3 py-3 sm:gap-5 sm:px-5 lg:gap-6 lg:px-6 xl:px-8">
        <Sidebar stats={stats} />
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-5">
          <Header theme={theme} setTheme={setTheme} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home stats={stats} setStats={setStats} />} />
              <Route path="/setup/:subjectId" element={<PracticeSetup setStats={setStats} />} />
              <Route path="/practice/:sessionId" element={<Practice setStats={setStats} />} />
              <Route path="/result/:sessionId" element={<Result setStats={setStats} />} />
              <Route path="/wrong-questions" element={<WrongQuestions />} />
              <Route path="/revision" element={<RevisionCenter />} />
              <Route path="/custom-quiz" element={<CustomQuiz />} />
              <Route path="/history" element={<PracticeHistory />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/admin/content" element={<ContentAdmin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
