import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { supabase } from '../supabaseClient';
import TopBar from '../components/TopBar';
import Column from '../components/Column';
import CardItem from '../components/CardItem';
import CardModal from '../components/CardModal';
import PresenceAvatars from '../components/PresenceAvatars';
import ShareModal from '../components/ShareModal';

export default function BoardPage({ session }) {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [modalCard, setModalCard] = useState(null); // { id?, column_id, ...fields } or null
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadBoard = useCallback(async () => {
    try {
      const { data: boardRow, error } = await supabase.from('boards').select('*').eq('id', boardId).single();
      if (error || !boardRow) {
        setBoard(null);
      } else {
        setBoard(boardRow);

        const { data: cols } = await supabase
          .from('columns')
          .select('*')
          .eq('board_id', boardId)
          .order('position');
        setColumns(cols || []);

        const { data: allCards } = await supabase
          .from('cards')
          .select('*')
          .in('column_id', (cols || []).map((c) => c.id))
          .order('position');
        setCards(allCards || []);
      }
    } catch (err) {
      console.error(err);
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  // Data changes (cards/columns/boards) via Postgres changefeed
  useEffect(() => {
    loadBoard();
    const channel = supabase
      .channel(`board-${boardId}-data`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, loadBoard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, loadBoard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns' }, loadBoard)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [boardId, loadBoard]);

  // Presence: who else is viewing this board right now
  useEffect(() => {
    if (!board) return;
    const presenceChannel = supabase.channel(`board-${boardId}-presence`, {
      config: { presence: { key: session.user.email } },
    });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ email: session.user.email, online_at: Date.now() });
        }
      });
    return () => supabase.removeChannel(presenceChannel);
  }, [boardId, session.user.email, board]);

  const cardsForColumn = (columnId) =>
    cards.filter((c) => c.column_id === columnId).sort((a, b) => a.position - b.position);

  const openNewCard = (columnId) => setModalCard({ column_id: columnId, priority: 'medium' });
  const openEditCard = (card) => setModalCard(card);
  const closeModal = () => setModalCard(null);

  const saveCard = async (fields) => {
    if (modalCard.id) {
      await supabase.from('cards').update(fields).eq('id', modalCard.id);
    } else {
      const colCards = cardsForColumn(modalCard.column_id);
      const position = colCards.length ? colCards[colCards.length - 1].position + 1 : 0;
      await supabase.from('cards').insert({
        ...fields,
        column_id: modalCard.column_id,
        position,
        created_by: session.user.email,
      });
    }
    closeModal();
  };

  const deleteCard = async () => {
    if (modalCard.id) await supabase.from('cards').delete().eq('id', modalCard.id);
    closeModal();
  };

  const addColumn = async () => {
    const name = window.prompt('Column name');
    if (!name) return;
    const position = columns.length ? columns[columns.length - 1].position + 1 : 0;
    await supabase.from('columns').insert({ board_id: boardId, name, position });
  };

  const removeColumn = async (columnId) => {
    if (!window.confirm('Delete this column and all its cards?')) return;
    await supabase.from('columns').delete().eq('id', columnId);
  };

  const handleDragStart = (event) => {
    setActiveCard(cards.find((c) => c.id === event.active.id) || null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const activeCardData = cards.find((c) => c.id === active.id);
    if (!activeCardData) return;

    const overColumn = columns.find((c) => c.id === over.id);
    const overCard = cards.find((c) => c.id === over.id);
    const targetColumnId = overColumn ? overColumn.id : overCard ? overCard.column_id : null;
    if (!targetColumnId) return;

    const destCards = cardsForColumn(targetColumnId).filter((c) => c.id !== active.id);
    let insertIndex = destCards.length;
    if (overCard) {
      const idx = destCards.findIndex((c) => c.id === overCard.id);
      if (idx !== -1) insertIndex = idx;
    }
    destCards.splice(insertIndex, 0, { ...activeCardData, column_id: targetColumnId });

    setCards((prev) => {
      const others = prev.filter((c) => c.column_id !== targetColumnId && c.id !== active.id);
      return [...others, ...destCards.map((c, i) => ({ ...c, position: i }))];
    });

    await Promise.all(
      destCards.map((c, i) =>
        supabase.from('cards').update({ column_id: targetColumnId, position: i }).eq('id', c.id)
      )
    );
  };

  if (loading) {
    return (
      <div className="app-shell">
        <TopBar session={session} backTo="/" backLabel="Boards" />
        <div className="centered" style={{ marginTop: 100 }}>Loading board…</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="app-shell">
        <TopBar session={session} backTo="/" backLabel="Boards" />
        <div className="access-restricted-card">
          <h2>Access Restricted</h2>
          <p>This board is private, or you do not have permission to view it. Ask the owner to share access with your email address.</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
            Go back to My Boards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopBar
        session={session}
        backTo="/"
        backLabel="Boards"
        right={<PresenceAvatars users={onlineUsers.filter((e) => e !== session.user.email)} />}
      />
      <div className="board-page">
        <div className="board-header">
          <h2>{board.name}</h2>
          <div className="board-header-actions">
            <button className="btn btn-primary" onClick={() => setShareModalOpen(true)}>
              Share
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="board-canvas">
            {columns.map((col) => (
              <Column
                key={col.id}
                column={col}
                cards={cardsForColumn(col.id)}
                onAddCard={() => openNewCard(col.id)}
                onEditCard={openEditCard}
                onRemoveColumn={() => removeColumn(col.id)}
              />
            ))}
            <div className="add-column">
              <button className="add-column-btn" onClick={addColumn}>
                + Add column
              </button>
            </div>
          </div>
          <DragOverlay>{activeCard ? <CardItem card={activeCard} overlay /> : null}</DragOverlay>
        </DndContext>
      </div>

      {modalCard && (
        <CardModal card={modalCard} onSave={saveCard} onDelete={deleteCard} onClose={closeModal} />
      )}

      {shareModalOpen && (
        <ShareModal
          board={board}
          session={session}
          onClose={() => setShareModalOpen(false)}
          onUpdateBoardVisibility={(visibility) => setBoard(prev => ({ ...prev, visibility }))}
        />
      )}
    </div>
  );
}
