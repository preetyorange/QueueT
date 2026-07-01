import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export default function ShareModal({ board, session, onClose, onUpdateBoardVisibility }) {
  const [members, setMembers] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    } catch (err) {
      setError(err.message || 'Failed to load collaborators.');
    } finally {
      setLoading(false);
    }
  }, [board.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleVisibilityChange = async (e) => {
    const visibility = e.target.value;
    setError('');
    try {
      const { error } = await supabase
        .from('boards')
        .update({ visibility })
        .eq('id', board.id);
      if (error) throw error;
      onUpdateBoardVisibility(visibility);
    } catch (err) {
      setError(err.message || 'Failed to update visibility.');
    }
  };

  const handleAddMember = async (e) => {
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
    } catch (err) {
      setError(err.message || 'Failed to add collaborator.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (email) => {
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
    } catch (err) {
      setError(err.message || 'Failed to remove collaborator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3>Share Board</h3>
          <button className="btn-text" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 15 }}>{error}</div>}

        {/* Section 1: General Access (Visibility) */}
        <div className="share-section">
          <div className="share-section-title">General Access</div>
          <div className="visibility-selector">
            <select
              value={board.visibility || 'restricted'}
              onChange={handleVisibilityChange}
              disabled={!isOwner}
            >
              <option value="restricted">Restricted (Only owner and collaborators)</option>
              <option value="anyone_with_link">Anyone with the link (Public access)</option>
            </select>
            <span className="visibility-desc">
              {board.visibility === 'anyone_with_link'
                ? 'Anyone who logs in and has this link can view and edit columns or cards.'
                : 'Only the board owner and explicitly invited collaborators can open this board.'}
            </span>
          </div>
        </div>

        {/* Section 2: Invite Collaborators (Owner only) */}
        {isOwner && (
          <div className="share-section">
            <div className="share-section-title">Invite Teammate</div>
            <form className="invite-form" onSubmit={handleAddMember}>
              <input
                type="email"
                placeholder="Teammate's email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                disabled={loading}
              />
              <button className="btn btn-primary" type="submit" disabled={loading}>
                Add
              </button>
            </form>
          </div>
        )}

        {/* Section 3: Collaborators List */}
        <div className="share-section" style={{ marginBottom: 0 }}>
          <div className="share-section-title">Who has access</div>
          <div className="members-list">
            {/* Board Owner */}
            <div className="member-item">
              <span className="member-email">{board.created_by}</span>
              <span className="member-role">Owner</span>
            </div>

            {/* Invited Members */}
            {members.map((m) => (
              <div className="member-item" key={m.id}>
                <span className="member-email">{m.user_email}</span>
                {isOwner ? (
                  <button
                    className="member-remove-btn"
                    onClick={() => handleRemoveMember(m.user_email)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                ) : (
                  <span className="member-role">Collaborator</span>
                )}
              </div>
            ))}

            {members.length === 0 && !loading && (
              <div className="member-item" style={{ justifyContent: 'center' }}>
                <span className="member-role">No external collaborators invited yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
