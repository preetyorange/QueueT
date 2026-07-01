import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Star, MoreHorizontal, Plus, Filter, Grid3X3, List,
  ExternalLink, UserPlus, Copy, Archive, Trash2, Clock,
  CheckSquare, Layers, Users, TrendingUp, ChevronRight, Lock, Globe,
} from "lucide-react";
import { DISPLAY, BODY, BOARDS, AVATAR_COLORS, PRIORITY_COLORS } from "../data";
import { Avatar, AvatarStack, ProgressBar, SectionLabel } from "../ui";

const STATS = [
  { label: "Tasks Done", value: "71", sub: "this week", icon: CheckSquare, color: "#10b981" },
  { label: "Active Boards", value: "6", sub: "across 2 teams", icon: Layers, color: "#3b82f6" },
  { label: "Team Members", value: "9", sub: "collaborating", icon: Users, color: "#8b5cf6" },
  { label: "On Track", value: "83%", sub: "avg completion", icon: TrendingUp, color: "#e8002d" },
];

const ACTIVITY = [
  { user: "LH", color: "#3b82f6", action: "moved 3 cards to Done", board: "F1 Campaign", time: "2m ago" },
  { user: "MV", color: "#f59e0b", action: "commented on CI/CD pipeline", board: "Pit Stop", time: "14m ago" },
  { user: "SP", color: "#10b981", action: "joined Sprint Planning board", board: "Sprint Q3", time: "1h ago" },
  { user: "CR", color: "#8b5cf6", action: "created 2 new tasks", board: "F1 Campaign", time: "2h ago" },
  { user: "LN", color: "#ec4899", action: "completed Design System v2", board: "Design System", time: "3h ago" },
];

function VisIcon({ vis }: { vis: string }) {
  if (vis === "private") return <Lock size={10} className="text-muted-foreground" />;
  if (vis === "team") return <Users size={10} className="text-muted-foreground" />;
  return <Globe size={10} className="text-muted-foreground" />;
}

function ActivityDot({ level }: { level: string }) {
  const c = level === "high" ? "#10b981" : level === "medium" ? "#f59e0b" : "#7a7a8c";
  return <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: c }} />;
}

function BoardCard({ board, onClick }: { board: typeof BOARDS[0]; onClick: () => void }) {
  const [starred, setStarred] = useState(board.starred);
  const [menuOpen, setMenuOpen] = useState(false);
  const pct = Math.round((board.tasks.done / board.tasks.total) * 100);

  return (
    <div onClick={onClick}
      className="relative group flex flex-col border border-border overflow-hidden cursor-pointer transition-all duration-200 hover:border-white/20 hover:-translate-y-px"
      style={{ background: "#141418", borderRadius: 0 }}>
      <div className="h-1.5 w-full" style={{ background: board.color }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] tracking-widest uppercase px-1.5 py-0.5 mb-1.5 inline-block"
              style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em", background: `${board.color}22`, color: board.color }}>
              {board.tag}
            </span>
            <h3 className="text-foreground leading-tight truncate"
              style={{ fontFamily: DISPLAY, fontSize: "1.05rem", fontWeight: 700 }}>
              {board.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); setStarred(v => !v); }} className="p-1 hover:text-primary transition-colors" aria-label="Star board">
              <Star size={13} fill={starred ? "#e8002d" : "none"} stroke={starred ? "#e8002d" : "currentColor"} className="text-muted-foreground" />
            </button>
            <button onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal size={13} />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground" style={{ fontFamily: DISPLAY, fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.1em" }}>TASKS</span>
            <span style={{ fontFamily: DISPLAY, fontSize: "0.7rem", fontWeight: 700, color: pct === 100 ? "#10b981" : undefined }}>{board.tasks.done}/{board.tasks.total}</span>
          </div>
          <ProgressBar done={board.tasks.done} total={board.tasks.total} />
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          <AvatarStack members={board.members} />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <ActivityDot level={board.activity} />
              <span className="text-muted-foreground" style={{ fontFamily: BODY, fontSize: "0.65rem" }}>
                {board.daysAgo === 0 ? "Today" : `${board.daysAgo}d ago`}
              </span>
            </div>
            <VisIcon vis={board.visibility} />
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute right-2 top-10 z-20 w-44 border border-border py-1 shadow-xl"
          style={{ background: "#1e1e24", borderRadius: 0 }}
          onMouseLeave={() => setMenuOpen(false)}>
          {[
            { icon: ExternalLink, label: "Open board" },
            { icon: Star, label: "Star board" },
            { icon: UserPlus, label: "Invite members" },
            { icon: Copy, label: "Duplicate" },
            { icon: Archive, label: "Archive" },
            { icon: Trash2, label: "Delete", danger: true },
          ].map(({ icon: Icon, label, danger }) => (
            <button key={label} onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-secondary transition-colors"
              style={{ fontFamily: BODY, color: danger ? "#e8002d" : "#f0f0f2" }}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListRow({ board, onClick }: { board: typeof BOARDS[0]; onClick: () => void }) {
  const pct = Math.round((board.tasks.done / board.tasks.total) * 100);
  return (
    <div onClick={onClick}
      className="flex items-center gap-4 px-4 py-3 border border-border hover:border-white/20 cursor-pointer transition-all group"
      style={{ background: "#141418" }}>
      <div className="w-1 h-8 flex-shrink-0" style={{ background: board.color }} />
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: DISPLAY, fontSize: "0.95rem", fontWeight: 700, color: "#f0f0f2" }}>{board.title}</p>
        <p className="text-muted-foreground" style={{ fontFamily: BODY, fontSize: "0.65rem" }}>{board.tag}</p>
      </div>
      <div className="w-24 hidden sm:block">
        <ProgressBar done={board.tasks.done} total={board.tasks.total} />
        <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{pct}%</p>
      </div>
      <AvatarStack members={board.members} max={3} />
      <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "starred" | "recent" | "shared">("all");

  const filtered = BOARDS.filter(b => {
    if (filter === "starred") return b.starred;
    if (filter === "recent") return b.daysAgo <= 1;
    if (filter === "shared") return b.members.length > 1;
    return true;
  });

  return (
    <div className="px-6 py-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {STATS.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 p-4 border border-border" style={{ background: "#141418" }}>
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p style={{ fontFamily: DISPLAY, fontSize: "1.4rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>{value}</p>
              <p className="text-muted-foreground" style={{ fontFamily: BODY, fontSize: "0.65rem", fontWeight: 300 }}>{label}</p>
              <p style={{ fontFamily: BODY, fontSize: "0.6rem", color, fontWeight: 400 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Boards header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.6rem", fontWeight: 900, color: "#f0f0f2", letterSpacing: "-0.01em", lineHeight: 1 }}>Your Boards</h1>
          <p className="text-muted-foreground text-xs mt-0.5" style={{ fontWeight: 300 }}>Create private boards or share access with specific teammates.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border">
            {(["all","starred","recent","shared"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 text-[10px] transition-all"
                style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  background: filter === f ? "#e8002d" : "transparent", color: filter === f ? "#fff" : "#7a7a8c" }}>
                {f}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-border text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em" }}>
            <Filter size={11} />Sort
          </button>
          <div className="flex border border-border">
            {([["grid", Grid3X3], ["list", List]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)}
                className="p-1.5 transition-colors"
                style={{ background: view === v ? "#e8002d" : "transparent", color: view === v ? "#fff" : "#7a7a8c" }}>
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-8" : "flex flex-col gap-2 mb-8"}>
        {filtered.map(b => view === "grid"
          ? <BoardCard key={b.id} board={b} onClick={() => navigate(`/board/${b.id}`)} />
          : <ListRow key={b.id} board={b} onClick={() => navigate(`/board/${b.id}`)} />
        )}
        <button onClick={() => {}}
          className="flex items-center justify-center gap-2 border border-dashed border-border text-muted-foreground hover:border-primary/60 hover:text-primary transition-all group"
          style={{ minHeight: view === "grid" ? "160px" : "48px" }}>
          <Plus size={16} className="group-hover:scale-110 transition-transform" />
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em" }}>NEW BOARD</span>
        </button>
      </div>

      {/* Activity */}
      <SectionLabel>Recent Activity</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="flex items-start gap-2.5 p-3 border border-border" style={{ background: "#141418" }}>
            <Avatar initials={a.user} size="sm" />
            <div className="min-w-0">
              <p className="text-xs text-foreground leading-snug">{a.action}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{a.board}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock size={9} />{a.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
