import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardItem from './CardItem';

function SortableCard({ card, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardItem card={card} onClick={onEdit} />
    </div>
  );
}

export default function Column({ column, cards, onAddCard, onEditCard, onRemoveColumn }) {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'column' } });

  return (
    <div className="column">
      <div className="column-header">
        <span className="column-title">{column.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="column-count">{cards.length}</span>
          <button className="column-remove" title="Delete column" onClick={onRemoveColumn}>
            ✕
          </button>
        </div>
      </div>
      <div ref={setNodeRef} className="column-body">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} onEdit={() => onEditCard(card)} />
          ))}
        </SortableContext>
      </div>
      <button className="add-card-btn" onClick={onAddCard}>
        + Add card
      </button>
    </div>
  );
}
