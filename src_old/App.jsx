import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';
import AuthPage from './pages/AuthPage';
import BoardsPage from './pages/BoardsPage';
import BoardPage from './pages/BoardPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="centered">Loading…</div>;
  if (!session) return <AuthPage />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoardsPage session={session} />} />
        <Route path="/board/:boardId" element={<BoardPage session={session} />} />
      </Routes>
    </BrowserRouter>
  );
}
