import { useState } from 'react';

export default function CardModal({ card, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(card.title || '');
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority || 'medium');
  const [dueDate, setDueDate] = useState(card.due_date || '');

  const save = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description, priority, due_date: dueDate || null });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-panel" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h3>{card.id ? 'Edit card' : 'New card'}</h3>

        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details…" />
        </div>

        <div className="modal-row">
          <div className="field">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="field">
            <label>Due date</label>
            <input type="date" value={dueDate || ''} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          <div>
            {card.id && (
              <button type="button" className="btn btn-danger" onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
          <div className="modal-actions-right">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
