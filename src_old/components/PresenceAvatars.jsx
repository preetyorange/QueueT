function initials(email) {
  return (email || '?').slice(0, 2).toUpperCase();
}

export default function PresenceAvatars({ users }) {
  if (!users.length) return null;
  return (
    <div className="presence-stack" title={users.join(', ')}>
      {users.slice(0, 5).map((email) => (
        <div key={email} className="presence-avatar">
          {initials(email)}
        </div>
      ))}
    </div>
  );
}
