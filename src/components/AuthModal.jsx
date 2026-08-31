import { useState, useEffect } from "react";
import { LogIn, LogOut, UserCheck, X, Mail, Lock } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase/client";

function AuthModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setMessage("Supabase credentials not configured in environment variables yet.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created! Check your email for confirmation, or log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("Signed in successfully!");
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      setUser(null);
      setMessage("Signed out.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[28px] border border-[#eadffd] bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
            <LogIn className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
              {user ? "Personal Account" : isSignUp ? "Create Account" : "Sign In"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sync notes, wrong questions & reports across devices
            </p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <strong>Supabase Setup Note:</strong> Env variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set yet. The app will save all your data safely in local storage in the meantime.
          </div>
        )}

        {user ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="font-semibold">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="btn-secondary w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11"
                />
              </div>
            </div>

            {message && <p className="text-xs font-semibold text-violet-600">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
