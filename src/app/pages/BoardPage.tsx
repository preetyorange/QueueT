import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Plus, MoreHorizontal, UserPlus, Share2,
  Calendar, Tag, X, ChevronDown, Lock, Globe,
} from "lucide-react";
import { DISPLAY, BODY, PRIORITY_COLORS, type Priority } from "../data";
import { Avatar, AvatarStack, PriorityBadge } from "../ui";
import { useSession } from "../sessionContext";
import { supabase } from "../../supabaseClient";
import ShareModal from "../components/ShareModal";

interface SupabaseCard {
  id: string;
  column_id: string;
  title: string;
  description: string;
  priority: string;
  due_date: string;
  position: number;
  created_by: string;
}

interface SupabaseColumn {
  id: string;
  board_id: string;
  name: string;
  position: number;
}

interface SupabaseBoard {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  visibility: string;
}

function CardItem({ card, onOpen }: { card: any; onOpen: (c: any) => void }) {
  return (
    <div onClick={() => onOpen(card)}
      className="group border border-border p-3 cursor-pointer transition-all duration-150 hover:border-white/25 hover:-translate-y-px text-left"
      style={{ background: "#1a1a20" }}>
      <div className="w-full h-0.5 mb-2.5" style={{ background: PRIORITY_COLORS[card.priority] }} />

      <p className="text-sm text-foreground leading-snug mb-2" style={{ fontFamily: BODY, fontWeight: 400 }}>
        {card.title}
      </p>

      {card.desc && (
        <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2" style={{ fontWeight: 300 }}>
          {card.desc}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={card.priority} />
          {card.date && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1" style={{ fontFamily: BODY }}>
              <Calendar size={9} />{card.date}
            </span>
          )}
        </div>
        <AvatarStack members={card.assignees} max={2} />
      </div>
    </div>
  );
}

function CardModal({ card, onSave, onDelete, onClose }: {
  card: any;
  onSave: (updates: any) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(card.title || "");
  const [desc, setDesc] = useState(card.desc || "");
  const [priority, setPriority] = useState<Priority>(card.priority || "medium");
  const [date, setDate] = useState(card.date || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      desc,
      priority,
      date: date || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <form className="w-full max-w-lg border border-border shadow-2xl" style={{ background: "#1a1a20" }} onClick={e => e.stopPropagation()} onSubmit={handleSave}>
        <div className="h-1" style={{ background: PRIORITY_COLORS[priority] }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Card Title"
                className="text-foreground w-full font-bold bg-[#141418] border border-border px-3 py-2 outline-none"
                style={{ fontFamily: DISPLAY, fontSize: "1.3rem" }}
                required
                autoFocus
              />
            </div>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          <div className="mb-4">
            <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Leave a description…"
              className="w-full text-sm text-foreground bg-[#141418] border border-border p-3 outline-none"
              style={{ fontFamily: BODY, fontWeight: 300, minHeight: "80px" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full text-sm text-foreground bg-[#141418] border border-border px-2 py-1.5 outline-none"
                style={{ fontFamily: BODY }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Due Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full text-sm text-foreground bg-[#141418] border border-border px-2 py-1.5 outline-none"
                style={{ fontFamily: BODY }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-border pt-4">
            <div>
              {card.id && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="bg-transparent hover:bg-red-500/10 text-[#e8002d] text-xs font-bold tracking-widest px-4 py-2"
                  style={{ fontFamily: DISPLAY }}
                >
                  DELETE
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-transparent hover:bg-white/5 border border-border text-muted-foreground text-xs font-bold tracking-widest px-4 py-2"
                style={{ fontFamily: DISPLAY }}
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="bg-primary text-white text-xs font-bold tracking-widest px-4 py-2 hover:opacity-85"
                style={{ fontFamily: DISPLAY }}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function BoardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = useSession();

  const [board, setBoard] = useState<SupabaseBoard | null>(null);
  const [columns, setColumns] = useState<SupabaseColumn[]>([]);
  const [cards, setCards] = useState<SupabaseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [modalCard, setModalCard] = useState<any>(null);
  const [dragCard, setDragCard] = useState<{ id: string; fromCol: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!id || !session?.user?.email) return;
    try {
      // 1. Fetch board metadata
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (boardError || !boardData) {
        setBoard(null);
        setLoading(false);
        return;
      }
      setBoard(boardData);

      // 2. Fetch columns
      const { data: colData } = await supabase
        .from("columns")
        .select("*")
        .eq("board_id", id)
        .order("position");
      const currentCols = colData || [];
      setColumns(currentCols);

      // 3. Fetch cards
      if (currentCols.length > 0) {
        const colIds = currentCols.map(c => c.id);
        const { data: cardData } = await supabase
          .from("cards")
          .select("*")
          .in("column_id", colIds)
          .order("position");
        setCards(cardData || []);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error("BoardPage loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, [id, session?.user?.email]);

  // Real-time synchronization
  useEffect(() => {
    loadData();

    const dataChannel = supabase
      .channel(`board-detail-sync-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards', filter: `id=eq.${id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(dataChannel);
    };
  }, [id, loadData]);

  // Presence state tracking
  useEffect(() => {
    if (!id || !session?.user?.email) return;

    const presenceChannel = supabase.channel(`presence-board-${id}`, {
      config: { presence: { key: session.user.email } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [id, session?.user?.email]);

  const handleDragStart = (cardId: string, fromCol: string) => {
    setDragCard({ id: cardId, fromCol });
  };

  const handleDrop = async (toColId: string) => {
    if (!dragCard || dragCard.fromCol === toColId) {
      setDragCard(null);
      return;
    }

    try {
      const destCards = cards.filter(c => c.column_id === toColId);
      // Update destination column card positioning and database values
      await supabase
        .from("cards")
        .update({ column_id: toColId, position: destCards.length })
        .eq("id", dragCard.id);

      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDragCard(null);
    }
  };

  const addColumn = async () => {
    const name = window.prompt("Enter column name:");
    if (!name) return;
    try {
      await supabase
        .from("columns")
        .insert({ board_id: id, name, position: columns.length });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteColumn = async (columnId: string) => {
    if (!window.confirm("Are you sure you want to delete this column? All tasks inside will be deleted.")) return;
    try {
      await supabase.from("columns").delete().eq("id", columnId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const addCardTrigger = (columnId: string) => {
    setModalCard({ column_id: columnId });
  };

  const saveCard = async (updates: any) => {
    try {
      if (modalCard.id) {
        await supabase
          .from("cards")
          .update({
            title: updates.title,
            description: updates.desc,
            priority: updates.priority,
            due_date: updates.date
          })
          .eq("id", modalCard.id);
      } else {
        const colId = modalCard.column_id;
        const colCards = cards.filter(c => c.column_id === colId);
        await supabase
          .from("cards")
          .insert({
            column_id: colId,
            title: updates.title,
            description: updates.desc,
            priority: updates.priority,
            due_date: updates.date,
            position: colCards.length,
            created_by: session.user.email
          });
      }
      setModalCard(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCard = async () => {
    if (!modalCard?.id) return;
    try {
      await supabase.from("cards").delete().eq("id", modalCard.id);
      setModalCard(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getBoardColor = (boardId: string) => {
    const colors = ["#e8002d", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#f97316"];
    let hash = 0;
    for (let i = 0; i < boardId.length; i++) {
      hash = boardId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getCombinedColumns = () => {
    return columns.map(col => {
      const colCards = cards
        .filter(c => c.column_id === col.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(c => ({
          id: c.id,
          title: c.title,
          desc: c.description,
          priority: (c.priority || "medium") as Priority,
          date: c.due_date || "",
          assignees: c.created_by ? [c.created_by.split("@")[0].substring(0, 2).toUpperCase()] : [],
          tags: []
        }));
      return {
        id: col.id,
        label: col.name,
        color: col.name.toLowerCase() === "done" ? "#10b981" : col.name.toLowerCase() === "in progress" ? "#3b82f6" : "#7a7a8c",
        cards: colCards
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <span className="text-xs text-[#7a7a8c] animate-pulse">LOADING BOARD DETAILS…</span>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="border border-border p-6 text-center max-w-sm" style={{ background: "#141418" }}>
          <Lock className="mx-auto text-primary mb-3" size={28} />
          <h3 style={{ fontFamily: DISPLAY, fontSize: "1.2rem", fontWeight: 700, color: "#f0f0f2" }}>ACCESS RESTRICTED</h3>
          <p className="text-muted-foreground text-xs mt-2 leading-relaxed" style={{ fontFamily: BODY }}>
            You do not have access to this board, or it does not exist. Please ask the owner to add you as a collaborator.
          </p>
          <button onClick={() => navigate("/dashboard")} className="mt-4 bg-primary text-white text-xs font-bold tracking-widest px-4 py-2 hover:opacity-85" style={{ fontFamily: DISPLAY }}>
            BACK TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  const combinedColumns = getCombinedColumns();
  const onlineInitials = onlineUsers.map(email => email.split("@")[0].substring(0, 2).toUpperCase());
  const boardColor = getBoardColor(board.id);

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: BODY }}>
      {/* Board header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border flex-shrink-0" style={{ background: "#0d0d0f" }}>
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
          style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em" }}>
          <ArrowLeft size={14} />BOARDS
        </button>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ background: boardColor }} />
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.3rem", fontWeight: 900, color: "#f0f0f2" }}>{board.name}</h1>
          <span className="text-[10px] px-1.5 py-0.5 border border-border text-muted-foreground"
            style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {board.visibility === 'anyone_with_link' ? 'public link' : 'restricted'}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase mr-1" style={{ fontFamily: DISPLAY }}>Active:</span>
            <AvatarStack members={onlineInitials} max={4} />
          </div>
          <button onClick={() => setShareOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white hover:opacity-85 transition-opacity"
            style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "0.1em" }}>
            <Share2 size={12} />Share
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border" style={{ background: "#111115" }}>
        {[
          { label: "Priority", icon: Tag },
          { label: "Due Date", icon: Calendar },
        ].map(({ label, icon: Icon }) => (
          <button key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-2.5 py-1"
            style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em" }}>
            <Icon size={11} />{label}<ChevronDown size={10} />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {columns.length > 0 && (
            <button onClick={() => addCardTrigger(columns[0].id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white hover:opacity-85 transition-opacity"
              style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "0.1em" }}>
              <Plus size={12} strokeWidth={2.5} />Add Card
            </button>
          )}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto px-6 py-5">
        <div className="flex gap-4 h-full" style={{ minWidth: "max-content" }}>
          {combinedColumns.map(col => (
            <div key={col.id} className="flex flex-col w-72 flex-shrink-0"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ background: col.color }} />
                  <span style={{ fontFamily: DISPLAY, fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f0f0f2" }}>
                    {col.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 border border-border"
                    style={{ fontFamily: DISPLAY, fontWeight: 700 }}>
                    {col.cards.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => addCardTrigger(col.id)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Plus size={13} />
                  </button>
                  <button onClick={() => deleteColumn(col.id)} className="p-1 text-muted-foreground hover:text-[#e8002d] transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Cards list */}
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5"
                style={{ minHeight: "200px", maxHeight: "calc(100vh - 260px)" }}>
                {col.cards.map(card => (
                  <div key={card.id} draggable onDragStart={() => handleDragStart(card.id, col.id)}>
                    <CardItem card={card} onOpen={setModalCard} />
                  </div>
                ))}

                {/* Add card button */}
                <button onClick={() => addCardTrigger(col.id)} className="flex items-center justify-center gap-2 py-2 px-3 text-xs text-muted-foreground border border-dashed border-border hover:border-white/25 hover:text-foreground transition-all mt-1"
                  style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em" }}>
                  <Plus size={12} />ADD CARD
                </button>
              </div>
            </div>
          ))}

          {/* Add column */}
          <div className="flex-shrink-0 w-72">
            <button onClick={addColumn} className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
              style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em" }}>
              <Plus size={14} />ADD COLUMN
            </button>
          </div>
        </div>
      </div>

      {modalCard && (
        <CardModal
          card={modalCard}
          onSave={saveCard}
          onDelete={modalCard.id ? deleteCard : undefined}
          onClose={() => setModalCard(null)}
        />
      )}

      {shareOpen && (
        <ShareModal
          board={board}
          session={session}
          onClose={() => setShareOpen(false)}
          onUpdateBoardVisibility={(visibility) => setBoard(prev => prev ? { ...prev, visibility } : null)}
        />
      )}
    </div>
  );
}
