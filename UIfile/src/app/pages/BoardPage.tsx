import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Plus, MoreHorizontal, UserPlus, Share2,
  Paperclip, MessageSquare, Calendar, Tag, X, ChevronDown,
} from "lucide-react";
import { DISPLAY, BODY, BOARDS, KANBAN_COLUMNS, PRIORITY_COLORS, type KanbanCard, type Priority } from "../data";
import { Avatar, AvatarStack, PriorityBadge } from "../ui";

function CardItem({ card, onOpen }: { card: KanbanCard; onOpen: (c: KanbanCard) => void }) {
  return (
    <div onClick={() => onOpen(card)}
      className="group border border-border p-3 cursor-pointer transition-all duration-150 hover:border-white/25 hover:-translate-y-px"
      style={{ background: "#1a1a20" }}>
      {/* Priority stripe */}
      <div className="w-full h-0.5 mb-2.5" style={{ background: PRIORITY_COLORS[card.priority] }} />

      <p className="text-sm text-foreground leading-snug mb-2" style={{ fontFamily: BODY, fontWeight: 400 }}>
        {card.title}
      </p>

      {card.desc && (
        <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2" style={{ fontWeight: 300 }}>
          {card.desc}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {card.tags.map(t => (
          <span key={t} className="text-[9px] px-1.5 py-0.5 border border-border text-muted-foreground"
            style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={card.priority} />
          <span className="text-[10px] text-muted-foreground flex items-center gap-1" style={{ fontFamily: BODY }}>
            <Calendar size={9} />{card.date}
          </span>
        </div>
        <AvatarStack members={card.assignees} max={2} />
      </div>

      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: BODY }}>
          <MessageSquare size={10} />2
        </button>
        <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: BODY }}>
          <Paperclip size={10} />1
        </button>
        <button className="ml-auto p-0.5 text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal size={12} />
        </button>
      </div>
    </div>
  );
}

function CardModal({ card, onClose }: { card: KanbanCard; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="w-full max-w-lg border border-border shadow-2xl" style={{ background: "#1a1a20" }} onClick={e => e.stopPropagation()}>
        <div className="h-1" style={{ background: PRIORITY_COLORS[card.priority] }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <PriorityBadge priority={card.priority} />
                {card.tags.map(t => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 border border-border text-muted-foreground"
                    style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {t}
                  </span>
                ))}
              </div>
              <h2 className="text-foreground" style={{ fontFamily: DISPLAY, fontSize: "1.3rem", fontWeight: 700 }}>
                {card.title}
              </h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          {card.desc && (
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed" style={{ fontWeight: 300 }}>
              {card.desc}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5" style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Assignees</p>
              <div className="flex items-center gap-2">
                <AvatarStack members={card.assignees} max={4} />
                <button className="w-6 h-6 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Plus size={11} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5" style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Due Date</p>
              <span className="text-sm text-foreground flex items-center gap-1.5" style={{ fontFamily: BODY }}>
                <Calendar size={13} className="text-muted-foreground" />{card.date}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-[10px] text-muted-foreground mb-3" style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Activity</p>
            <div className="flex gap-3">
              <Avatar initials="AN" size="sm" />
              <input placeholder="Leave a comment…" className="flex-1 text-sm text-foreground placeholder-muted-foreground/40 outline-none py-1.5 px-3 border border-border"
                style={{ fontFamily: BODY, fontWeight: 300, background: "#141418" }}
                onFocus={e => (e.currentTarget.style.borderColor = "#e8002d")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BoardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const board = BOARDS.find(b => b.id === id) ?? BOARDS[0];
  const [columns, setColumns] = useState(KANBAN_COLUMNS);
  const [openCard, setOpenCard] = useState<KanbanCard | null>(null);
  const [dragCard, setDragCard] = useState<{ card: KanbanCard; fromCol: string } | null>(null);

  const handleDragStart = (card: KanbanCard, fromCol: string) => setDragCard({ card, fromCol });

  const handleDrop = (toColId: string) => {
    if (!dragCard || dragCard.fromCol === toColId) { setDragCard(null); return; }
    setColumns(cols => cols.map(col => {
      if (col.id === dragCard.fromCol) return { ...col, cards: col.cards.filter(c => c.id !== dragCard.card.id) };
      if (col.id === toColId) return { ...col, cards: [...col.cards, dragCard.card] };
      return col;
    }));
    setDragCard(null);
  };

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
          <div className="w-3 h-3" style={{ background: board.color }} />
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.3rem", fontWeight: 900, color: "#f0f0f2" }}>{board.title}</h1>
          <span className="text-[10px] px-1.5 py-0.5 border border-border text-muted-foreground"
            style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {board.visibility}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <AvatarStack members={board.members} max={4} />
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
            style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em" }}>
            <UserPlus size={12} />Invite
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white hover:opacity-85 transition-opacity"
            style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "0.1em" }}>
            <Share2 size={12} />Share
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors border border-border">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border" style={{ background: "#111115" }}>
        {[
          { label: "Priority", icon: Tag },
          { label: "Assignee", icon: UserPlus },
          { label: "Due Date", icon: Calendar },
        ].map(({ label, icon: Icon }) => (
          <button key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-2.5 py-1"
            style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em" }}>
            <Icon size={11} />{label}<ChevronDown size={10} />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white hover:opacity-85 transition-opacity"
            style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "0.1em" }}>
            <Plus size={12} strokeWidth={2.5} />Add Card
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto px-6 py-5">
        <div className="flex gap-4 h-full" style={{ minWidth: "max-content" }}>
          {columns.map(col => (
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
                  <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Plus size={13} />
                  </button>
                  <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal size={13} />
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5"
                style={{ minHeight: "200px", maxHeight: "calc(100vh - 260px)" }}>
                {col.cards.map(card => (
                  <div key={card.id} draggable onDragStart={() => handleDragStart(card, col.id)}>
                    <CardItem card={card} onOpen={setOpenCard} />
                  </div>
                ))}

                {/* Add card */}
                <button className="flex items-center gap-2 py-2 px-3 text-xs text-muted-foreground border border-dashed border-border hover:border-white/25 hover:text-foreground transition-all mt-1"
                  style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em" }}>
                  <Plus size={12} />ADD CARD
                </button>
              </div>
            </div>
          ))}

          {/* Add column */}
          <div className="flex-shrink-0 w-72">
            <button className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
              style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em" }}>
              <Plus size={14} />ADD COLUMN
            </button>
          </div>
        </div>
      </div>

      {openCard && <CardModal card={openCard} onClose={() => setOpenCard(null)} />}
    </div>
  );
}
