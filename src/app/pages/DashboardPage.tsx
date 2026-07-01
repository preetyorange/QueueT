import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Star, MoreHorizontal, Plus, Filter, Grid3X3, List,
  ExternalLink, UserPlus, Copy, Archive, Trash2, Clock,
  CheckSquare, Layers, Users, TrendingUp, ChevronRight, Lock, Globe, X,
} from "lucide-react";
import { DISPLAY, BODY, AVATAR_COLORS } from "../data";
import { Avatar, AvatarStack, ProgressBar, SectionLabel } from "../ui";
import { useSession } from "../sessionContext";
import { supabase } from "../../supabaseClient";

interface SupabaseBoard {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  visibility: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSession();

  const [boards, setBoards] = useState<SupabaseBoard[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "starred" | "recent" | "shared">("all");
  const [starredBoards, setStarredBoards] = useState<string[]>([]);

  // Modal states for creating a new board
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardVisibility, setNewBoardVisibility] = useState("restricted");
  const [creating, setCreating] = useState(false);

  // Load starred board IDs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("queuet-starred-boards");
    if (saved) {
      try {
        setStarredBoards(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Handle URL redirect query param for creating a new board
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("new") === "true") {
      setCreateModalOpen(true);
      navigate("/dashboard", { replace: true });
    }
  }, [location.search, navigate]);

  const toggleStar = (boardId: string) => {
    let next;
    if (starredBoards.includes(boardId)) {
      next = starredBoards.filter(id => id !== boardId);
    } else {
      next = [...starredBoards, boardId];
    }
    setStarredBoards(next);
    localStorage.setItem("queuet-starred-boards", JSON.stringify(next));
  };

  const loadData = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      // 1. Fetch boards
      const { data: owned } = await supabase
        .from('boards')
        .select('*')
        .eq('created_by', session.user.email);

      const { data: memberRows } = await supabase
        .from('board_members')
        .select('boards(*)')
        .eq('user_email', session.user.email);

      const sharedBoards = (memberRows || [])
        .map((row: any) => row.boards)
        .filter(Boolean);

      const allBoards: SupabaseBoard[] = [...(owned || [])];
      sharedBoards.forEach((sb: any) => {
        if (!allBoards.some((b) => b.id === sb.id)) {
          allBoards.push(sb);
        }
      });
      allBoards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBoards(allBoards);

      if (allBoards.length === 0) {
        setColumns([]);
        setCards([]);
        setBoardMembers([]);
        return;
      }

      const boardIds = allBoards.map(b => b.id);

      // 2. Fetch columns
      const { data: cols } = await supabase
        .from('columns')
        .select('*')
        .in('board_id', boardIds);
      setColumns(cols || []);

      // 3. Fetch cards
      if (cols && cols.length > 0) {
        const colIds = cols.map(c => c.id);
        const { data: allCards } = await supabase
          .from('cards')
          .select('*')
          .in('column_id', colIds);
        setCards(allCards || []);
      } else {
        setCards([]);
      }

      // 4. Fetch board members
      const { data: members } = await supabase
        .from('board_members')
        .select('*')
        .in('board_id', boardIds);
      setBoardMembers(members || []);

    } catch (err) {
      console.error("Dashboard loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    loadData();
    const boardsChannel = supabase
      .channel('dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(boardsChannel);
    };
  }, [loadData]);

  const createBoard = () => {
    setNewBoardName("");
    setNewBoardVisibility("restricted");
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBoardName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const { data: board, error } = await supabase
        .from('boards')
        .insert({ 
          name, 
          created_by: session.user.email,
          visibility: newBoardVisibility 
        })
        .select()
        .single();
      if (error || !board) throw error || new Error("Failed to create board");

      const defaultCols = ['To do', 'In progress', 'Done'].map((colName, i) => ({
        board_id: board.id,
        name: colName,
        position: i,
      }));
      await supabase.from('columns').insert(defaultCols);
      
      setCreateModalOpen(false);
      setNewBoardName("");
      loadData();
      navigate(`/board/${board.id}`);
    } catch (err) {
      console.error("Create board error:", err);
      alert("Failed to create board.");
    } finally {
      setCreating(false);
    }
  };

  const getBoardColor = (id: string) => {
    const colors = ["#e8002d", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#f97316"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getBoardStats = (boardId: string) => {
    const boardCols = columns.filter(c => c.board_id === boardId);
    const boardColIds = boardCols.map(c => c.id);
    const boardCards = cards.filter(c => boardColIds.includes(c.column_id));
    
    const doneCol = boardCols.find(c => c.name.toLowerCase() === 'done');
    const doneCount = doneCol ? boardCards.filter(c => c.column_id === doneCol.id).length : 0;
    
    return {
      done: doneCount,
      total: boardCards.length
    };
  };

  const getBoardMembers = (boardId: string, createdBy: string) => {
    const members = boardMembers
      .filter(m => m.board_id === boardId)
      .map(m => m.user_email);
    
    // Add owner as first member
    const unique = Array.from(new Set([createdBy, ...members]));
    return unique.map(email => {
      const parts = email.split('@')[0];
      return parts.substring(0, 2).toUpperCase();
    });
  };

  const getDaysAgo = (dateStr: string) => {
    const diffTime = Math.abs(Date.now() - new Date(dateStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
    return diffDays;
  };

  // Filter logic
  const filtered = boards.filter(b => {
    if (filter === "starred") return starredBoards.includes(b.id);
    if (filter === "recent") return getDaysAgo(b.created_at) <= 2;
    if (filter === "shared") return b.created_by !== session.user.email;
    return true;
  });

  // Stats Calculations
  const activeBoardsCount = boards.length;
  const totalTasks = cards.length;
  
  // Tasks done: cards in columns with name 'Done'
  const doneColIds = columns.filter(c => c.name.toLowerCase() === 'done').map(c => c.id);
  const tasksDoneCount = cards.filter(c => doneColIds.includes(c.column_id)).length;
  
  const allTeammates = Array.from(new Set(boardMembers.map(m => m.user_email)));
  const teamMembersCount = allTeammates.length + 1; // Include current user
  
  const completionPercentage = totalTasks > 0 ? Math.round((tasksDoneCount / totalTasks) * 100) : 0;

  const STATS = [
    { label: "Tasks Done", value: String(tasksDoneCount), sub: "across all boards", icon: CheckSquare, color: "#10b981" },
    { label: "Active Boards", value: String(activeBoardsCount), sub: `${filter} filter view`, icon: Layers, color: "#3b82f6" },
    { label: "Team Members", value: String(teamMembersCount), sub: "collaborators total", icon: Users, color: "#8b5cf6" },
    { label: "On Track", value: `${completionPercentage}%`, sub: "avg completion rate", icon: TrendingUp, color: "#e8002d" },
  ];

  const ACTIVITY = [
    { user: "AN", color: "#e8002d", action: "signed on to the grid", board: "System Startup", time: "Just now" },
    { user: "LH", color: "#3b82f6", action: "ready for collaboration", board: "Presence Stack", time: "5m ago" }
  ];

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <span className="text-xs text-[#7a7a8c] animate-pulse">LOADING DASHBOARD DATA…</span>
      </div>
    );
  }

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

      {/* Boards Grid/List */}
      <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-8" : "flex flex-col gap-2 mb-8"}>
        {filtered.map(b => {
          const stats = getBoardStats(b.id);
          const members = getBoardMembers(b.id, b.created_by);
          const starred = starredBoards.includes(b.id);
          const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
          const boardColor = getBoardColor(b.id);
          const daysAgo = getDaysAgo(b.created_at);

          if (view === "grid") {
            return (
              <div key={b.id} onClick={() => navigate(`/board/${b.id}`)}
                className="relative group flex flex-col border border-border overflow-hidden cursor-pointer transition-all duration-200 hover:border-white/20 hover:-translate-y-px"
                style={{ background: "#141418", borderRadius: 0 }}>
                <div className="h-1.5 w-full" style={{ background: boardColor }} />

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] tracking-widest uppercase px-1.5 py-0.5 mb-1.5 inline-block"
                        style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em", background: `${boardColor}22`, color: boardColor }}>
                        {b.created_by === session.user.email ? "Owner" : "Shared"}
                      </span>
                      <h3 className="text-foreground leading-tight truncate"
                        style={{ fontFamily: DISPLAY, fontSize: "1.05rem", fontWeight: 700 }}>
                        {b.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); toggleStar(b.id); }} className="p-1 hover:text-primary transition-colors" aria-label="Star board">
                        <Star size={13} fill={starred ? "#e8002d" : "none"} stroke={starred ? "#e8002d" : "currentColor"} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground" style={{ fontFamily: DISPLAY, fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.1em" }}>TASKS</span>
                      <span style={{ fontFamily: DISPLAY, fontSize: "0.7rem", fontWeight: 700, color: pct === 100 ? "#10b981" : undefined }}>{stats.done}/{stats.total}</span>
                    </div>
                    <ProgressBar done={stats.done} total={stats.total} />
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <AvatarStack members={members} />
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] flex-shrink-0" />
                        <span className="text-muted-foreground" style={{ fontFamily: BODY, fontSize: "0.65rem" }}>
                          {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                        </span>
                      </div>
                      {b.visibility === 'anyone_with_link' ? <Globe size={10} className="text-muted-foreground" /> : <Lock size={10} className="text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div key={b.id} onClick={() => navigate(`/board/${b.id}`)}
                className="flex items-center gap-4 px-4 py-3 border border-border hover:border-white/20 cursor-pointer transition-all group"
                style={{ background: "#141418" }}>
                <div className="w-1 h-8 flex-shrink-0" style={{ background: boardColor }} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: DISPLAY, fontSize: "0.95rem", fontWeight: 700, color: "#f0f0f2" }}>{b.name}</p>
                  <p className="text-muted-foreground" style={{ fontFamily: BODY, fontSize: "0.65rem" }}>
                    {b.created_by === session.user.email ? "Owner" : `Shared by ${b.created_by}`}
                  </p>
                </div>
                <div className="w-24 hidden sm:block">
                  <ProgressBar done={stats.done} total={stats.total} />
                  <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{pct}%</p>
                </div>
                <AvatarStack members={members} max={3} />
                <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          }
        })}

        <button onClick={createBoard}
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

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setCreateModalOpen(false)}>
          <form className="w-full max-w-md border border-border shadow-2xl p-6" style={{ background: "#1a1a20" }} onClick={(e) => e.stopPropagation()} onSubmit={handleCreateSubmit}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase" style={{ fontFamily: DISPLAY }}>New Board</h3>
              <button type="button" className="text-muted-foreground hover:text-foreground text-sm cursor-pointer" onClick={() => setCreateModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Board Name</label>
                <input
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  placeholder="e.g. Campaign Launch"
                  className="w-full text-xs text-foreground bg-[#141418] border border-border px-3 py-2.5 outline-none"
                  style={{ fontFamily: BODY }}
                  required
                  autoFocus
                  disabled={creating}
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Visibility</label>
                <select
                  value={newBoardVisibility}
                  onChange={e => setNewBoardVisibility(e.target.value)}
                  className="w-full text-xs text-foreground bg-[#141418] border border-border p-2.5 outline-none"
                  style={{ fontFamily: BODY }}
                  disabled={creating}
                >
                  <option value="restricted">Restricted (Teammates only)</option>
                  <option value="anyone_with_link">Public (Anyone with link)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-border text-xs text-muted-foreground hover:text-foreground hover:border-white/20 transition-all cursor-pointer"
                  style={{ fontFamily: DISPLAY, fontWeight: 700 }}
                  disabled={creating}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-primary text-white text-xs font-bold tracking-widest px-4 py-2 hover:opacity-85 disabled:opacity-50 cursor-pointer"
                  style={{ fontFamily: DISPLAY }}
                >
                  {creating ? "CREATING…" : "CREATE BOARD"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
