import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

interface ShareModalProps {
  board: {
    id: string;
    name: string;
    created_by: string;
    visibility: string;
  };
  session: any;
  onClose: () => void;
  onUpdateBoardVisibility: (visibility: string) => void;
}

export default function ShareModal({ board, session, onClose, onUpdateBoardVisibility }: ShareModalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/board/${board.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOwner = board.created_by === session.user.email;

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('board_members')
        .select('*')
        .eq('board_id', board.id)
        .order('created_at');
      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load collaborators.');
    } finally {
      setLoading(false);
    }
  }, [board.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleVisibilityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const visibility = e.target.value;
    setError('');
    try {
      const { error } = await supabase
        .from('boards')
        .update({ visibility })
        .eq('id', board.id);
      if (error) throw error;
      onUpdateBoardVisibility(visibility);
    } catch (err: any) {
      setError(err.message || 'Failed to update visibility.');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    if (email === board.created_by.toLowerCase()) {
      setError('The creator is already the owner of the board.');
      return;
    }

    if (members.some(m => m.user_email.toLowerCase() === email)) {
      setError('This user is already a collaborator.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('board_members')
        .insert({ board_id: board.id, user_email: email });
      if (error) throw error;
      setNewEmail('');
      loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to add collaborator.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (email: string) => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('board_id', board.id)
        .eq('user_email', email);
      if (error) throw error;
      loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to remove collaborator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="w-full max-w-md border border-border shadow-2xl p-6" style={{ background: "#1a1a20" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase" style={{ fontFamily: "Barlow Condensed" }}>Share Board</h3>
          <button className="text-muted-foreground hover:text-foreground text-sm" onClick={onClose}>✕</button>
        </div>

        {error && <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 mb-4">{error}</div>}

        {/* Section 1: General Access */}
        <div className="mb-5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2" style={{ fontFamily: "Barlow Condensed" }}>General Access</div>
          <div className="flex flex-col gap-2">
            <select
              value={board.visibility || 'restricted'}
              onChange={handleVisibilityChange}
              disabled={!isOwner}
              className="w-full text-xs text-foreground bg-[#141418] border border-border p-2 outline-none"
              style={{ fontFamily: "DM Sans" }}
            >
              <option value="restricted">Restricted (Only owner and collaborators)</option>
              <option value="anyone_with_link">Anyone with the link (Public access)</option>
            </select>
            <span className="text-[11px] text-muted-foreground leading-normal" style={{ fontFamily: "DM Sans" }}>
              {board.visibility === 'anyone_with_link'
                ? 'Anyone who logs in and has this link can view and edit columns or cards.'
                : 'Only the board owner and invited teammates can view/edit this board.'}
            </span>
          </div>
        </div>

        {/* Share Link */}
        <div className="mb-5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2" style={{ fontFamily: "Barlow Condensed" }}>Share Link</div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/board/${board.id}`}
              className="flex-1 text-xs text-muted-foreground bg-[#141418] border border-border px-3 py-2 outline-none select-all"
              style={{ fontFamily: "DM Sans" }}
            />
            <button
              onClick={copyLink}
              className="bg-primary text-white text-[10px] font-bold tracking-widest px-4 py-2 hover:opacity-85 transition-opacity cursor-pointer"
              style={{ fontFamily: "Barlow Condensed" }}
            >
              {copied ? 'COPIED!' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Section 2: Invite Collaborators */}
        {isOwner && (
          <div className="mb-5">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2" style={{ fontFamily: "Barlow Condensed" }}>Invite Teammate</div>
            <form className="flex gap-2" onSubmit={handleAddMember}>
              <input
                type="email"
                placeholder="Teammate's email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                disabled={loading}
                className="flex-1 text-xs text-foreground bg-[#141418] border border-border px-3 py-2 outline-none"
                style={{ fontFamily: "DM Sans" }}
              />
              <button className="bg-primary text-white text-[10px] font-bold tracking-widest px-4 py-2 hover:opacity-85" type="submit" disabled={loading} style={{ fontFamily: "Barlow Condensed" }}>
                Add
              </button>
            </form>
          </div>
        )}

        {/* Section 3: Collaborators List */}
        <div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2" style={{ fontFamily: "Barlow Condensed" }}>Who has access</div>
          <div className="max-h-40 overflow-y-auto border border-border bg-[#141418]">
            <div className="flex justify-between items-center p-3 border-b border-border/50">
              <span className="text-xs text-foreground truncate max-w-xs">{board.created_by}</span>
              <span className="text-[10px] text-muted-foreground italic">Owner</span>
            </div>

            {members.map((m) => (
              <div className="flex justify-between items-center p-3 border-b border-border/50" key={m.id}>
                <span className="text-xs text-foreground truncate max-w-xs">{m.user_email}</span>
                {isOwner ? (
                  <button
                    className="text-xs text-[#e8002d] hover:underline"
                    onClick={() => handleRemoveMember(m.user_email)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Collaborator</span>
                )}
              </div>
            ))}

            {members.length === 0 && !loading && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No collaborators invited yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
