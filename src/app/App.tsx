import { useEffect, useState } from "react";
import { RouterProvider, BrowserRouter } from "react-router";
import { supabase } from "../supabaseClient";
import { SessionContext } from "./sessionContext";
import AuthPage from "./pages/AuthPage";
import { router } from "./routes";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] text-[#f0f0f2] flex flex-col items-center justify-center" style={{ fontFamily: "sans-serif" }}>
        <p style={{ letterSpacing: "0.2em", fontWeight: 900, fontSize: "1.5rem", marginBottom: "1rem" }}>
          QUEUE<span style={{ color: "#e8002d" }}>T</span>
        </p>
        <div className="text-xs text-[#7a7a8c] animate-pulse">LOADING SESSION…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      <RouterProvider router={router} />
    </SessionContext.Provider>
  );
}
