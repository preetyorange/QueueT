import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function TopBar({ session, backTo, backLabel, right }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        {backTo && (
          <Link className="back-link" to={backTo}>
            ← {backLabel || 'Back'}
          </Link>
        )}
        <div className="wordmark">QueueT</div>
      </div>
      <div className="topbar-right">
        {right}
        <span className="user-email">{session.user.email}</span>
        <button className="btn-text" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
    </div>
  );
}
