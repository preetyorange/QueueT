function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function CardItem({ card, onClick, overlay }) {
  return (
    <div className={`card ${overlay ? 'card-overlay' : ''}`} onClick={onClick}>
      <p className="card-title">{card.title}</p>
      <div className="card-meta">
        {card.priority && <span className={`badge badge-${card.priority}`}>{card.priority}</span>}
        {card.due_date && (
          <span className={`due-date ${isOverdue(card.due_date) ? 'overdue' : ''}`}>
            {new Date(card.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
      {card.created_by && <div className="card-author">{card.created_by}</div>}
    </div>
  );
}
