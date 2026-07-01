import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import TopBar from '../components/TopBar';

const DEFAULT_COLUMNS = ['To do', 'In progress', 'Done'];

export default function BoardsPage({ session }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBoards = async () => {
    try {
      const { data: owned } = await supabase
        .from('boards')
        .select('*')
        .eq('created_by', session.user.email);

      const { data: memberRows } = await supabase
        .from('board_members')
        .select('boards(*)')
        .eq('user_email', session.user.email);

      const shared = (memberRows || [])
        .map((row) => row.boards)
        .filter(Boolean);

      const allBoards = [...(owned || [])];
      shared.forEach((sb) => {
        if (!allBoards.some((b) => b.id === sb.id)) {
          allBoards.push(sb);
        }
      });

      allBoards.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setBoards(allBoards);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
    const channel = supabase
      .channel('boards-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, loadBoards)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members' }, loadBoards)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const createBoard = async () => {
    const name = window.prompt('Board name');
    if (!name) return;
    const { data: board, error } = await supabase
      .from('boards')
      .insert({ name, created_by: session.user.email })
      .select()
      .single();
    if (error || !board) return;

    const columnRows = DEFAULT_COLUMNS.map((colName, i) => ({
      board_id: board.id,
      name: colName,
      position: i,
    }));
    await supabase.from('columns').insert(columnRows);
    loadBoards();
  };

  return (
    <div className="app-shell">
      <TopBar session={session} />
      <div className="boards-page">
        <h2>Your boards</h2>
        <p className="page-subtitle">Create private boards or share access with specific teammates.</p>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : (
          <div className="boards-grid">
            {boards.map((b) => {
              const isOwner = b.created_by === session.user.email;
              const isPublic = b.visibility === 'anyone_with_link';
              return (
                <Link key={b.id} to={`/board/${b.id}`} className="board-card">
                  <div className="board-card-header">
                    <div className="board-card-title" style={{ fontWeight: 600 }}>{b.name}</div>
                  </div>
                  <div className="board-card-meta">Created by {b.created_by}</div>
                  <div className="board-badge-container">
                    <span className={`badge ${isOwner ? 'badge-owner' : 'badge-shared'}`}>
                      {isOwner ? 'Owner' : 'Shared'}
                    </span>
                    <span className={`badge ${isPublic ? 'badge-public' : 'badge-restricted'}`}>
                      {isPublic ? 'Anyone with link' : 'Restricted'}
                    </span>
                  </div>
                </Link>
              );
            })}
            <button className="new-board-card" onClick={createBoard}>
              + New board
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
