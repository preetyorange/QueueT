import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Zap, Clock, Users, Loader2 } from "lucide-react";
import { DISPLAY, BODY } from "../data";
import { Avatar, ProgressBar, SectionLabel } from "../ui";
import { useSession } from "../sessionContext";
import { supabase } from "../../supabaseClient";

function StatCard({ label, value, delta, icon: Icon, color }: {
  label: string; value: string; delta?: string; icon: React.ElementType; color: string;
}) {
  const positive = delta?.startsWith("+") || delta?.includes("d"); // heuristics for styling delta color
  const neutral = !delta;
  return (
    <div className="p-4 border border-border" style={{ background: "#141418" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={15} style={{ color }} />
        </div>
        {delta && (
          <span className="flex items-center gap-0.5 text-[10px]" style={{ fontFamily: DISPLAY, fontWeight: 700, color: positive ? "#10b981" : "#e8002d" }}>
            {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {delta}
          </span>
        )}
      </div>
      <p style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>{value}</p>
      <p className="text-muted-foreground text-xs mt-1" style={{ fontWeight: 300 }}>{label}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border px-3 py-2" style={{ background: "#1e1e24", fontFamily: BODY }}>
      <p className="text-[10px] text-muted-foreground mb-1" style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      setLoading(true);
      // 1. Fetch owned boards
      const { data: owned } = await supabase
        .from('boards')
        .select('*')
        .eq('created_by', session.user.email);

      // 2. Fetch shared boards
      const { data: memberRows } = await supabase
        .from('board_members')
        .select('boards(*)')
        .eq('user_email', session.user.email);

      const sharedBoards = (memberRows || [])
        .map((row: any) => row.boards)
        .filter(Boolean);

      const allBoards = [...(owned || [])];
      sharedBoards.forEach((sb: any) => {
        if (!allBoards.some((b) => b.id === sb.id)) {
          allBoards.push(sb);
        }
      });
      setBoards(allBoards);

      if (allBoards.length === 0) {
        setColumns([]);
        setCards([]);
        setBoardMembers([]);
        return;
      }

      const boardIds = allBoards.map(b => b.id);

      // 3. Fetch board members
      const { data: members } = await supabase
        .from('board_members')
        .select('*')
        .in('board_id', boardIds);
      setBoardMembers(members || []);

      // 4. Fetch columns
      const { data: cols } = await supabase
        .from('columns')
        .select('*')
        .in('board_id', boardIds);
      setColumns(cols || []);

      // 5. Fetch cards
      if (cols && cols.length > 0) {
        const { data: allCards } = await supabase
          .from('cards')
          .select('*')
          .in('column_id', cols.map(c => c.id));
        setCards(allCards || []);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error("AnalyticsPage loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getBoardColor = (id: string) => {
    const colors = ["#e8002d", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#f97316"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Perform Calculations
  const now = new Date();

  // Completed cards (where column is named "Done")
  const doneColIds = columns
    .filter(c => c.name.toLowerCase() === "done")
    .map(c => c.id);
  const completedCards = cards.filter(c => doneColIds.includes(c.column_id));
  const tasksCompletedCount = completedCards.length;

  // Active contributors (teammate emails)
  const contributors = new Set<string>();
  if (session?.user?.email) contributors.add(session.user.email);
  boardMembers.forEach(bm => contributors.add(bm.user_email));
  boards.forEach(b => contributors.add(b.created_by));
  cards.forEach(c => { if (c.created_by) contributors.add(c.created_by); });
  const activeContributorsCount = contributors.size;

  // Average Cycle Time: Heuristic of completed cards (due_date or today - created_at)
  let avgCycleTimeText = "0.0d";
  if (completedCards.length > 0) {
    let totalDays = 0;
    let count = 0;
    completedCards.forEach(c => {
      const created = new Date(c.created_at);
      const completed = c.due_date ? new Date(c.due_date) : new Date();
      const diffMs = completed.getTime() - created.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays >= 0) {
        totalDays += diffDays;
        count++;
      }
    });
    if (count > 0) {
      avgCycleTimeText = `${(totalDays / count).toFixed(1)}d`;
    }
  }

  // Board Velocity: completed in the last 7 days
  const completedLastWeek = completedCards.filter(c => {
    const dateStr = c.due_date || c.created_at;
    if (!dateStr) return false;
    const compDate = new Date(dateStr);
    const diffMs = now.getTime() - compDate.getTime();
    return diffMs <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const boardVelocityText = `${completedLastWeek}/wk`;

  // Weekly velocity data: aggregate cards added vs completed for last 5 weeks
  const getWeeklyVelocityData = () => {
    const weeksList = [];
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(weekStart.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const nextMonday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);

      const label = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      // Count added (created_at in range)
      const addedCount = cards.filter(c => {
        const cDate = new Date(c.created_at);
        return cDate >= monday && cDate < nextMonday;
      }).length;

      // Count completed (done column and due_date/created_at in range)
      const doneCount = completedCards.filter(c => {
        const dateStr = c.due_date || c.created_at;
        const dDate = new Date(dateStr);
        return dDate >= monday && dDate < nextMonday;
      }).length;

      weeksList.push({
        week: label,
        done: doneCount,
        added: addedCount
      });
    }
    return weeksList;
  };
  const weeklyVelocityData = getWeeklyVelocityData();

  // Priority Pie Chart: Distribution of open (non-done) tasks
  const openCards = cards.filter(c => !doneColIds.includes(c.column_id));
  const getPriorityData = () => {
    const priorities: Record<string, { value: number; color: string }> = {
      critical: { value: 0, color: "#e8002d" },
      high: { value: 0, color: "#f97316" },
      medium: { value: 0, color: "#f59e0b" },
      low: { value: 0, color: "#10b981" }
    };
    
    openCards.forEach(c => {
      const pri = (c.priority || "medium").toLowerCase();
      if (priorities[pri]) {
        priorities[pri].value++;
      } else {
        priorities.medium.value++;
      }
    });

    return Object.entries(priorities).map(([name, item]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: item.value,
      color: item.color
    }));
  };
  const priorityData = getPriorityData();

  // Board Completion Rates
  const getBoardCompletionList = () => {
    return boards.map(b => {
      const boardCols = columns.filter(c => c.board_id === b.id).map(c => c.id);
      const boardCards = cards.filter(c => boardCols.includes(c.column_id));
      const doneCols = columns.filter(c => c.board_id === b.id && c.name.toLowerCase() === "done").map(c => c.id);
      
      const total = boardCards.length;
      const done = boardCards.filter(c => doneCols.includes(c.column_id)).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        board: b.name,
        pct
      };
    });
  };
  const boardCompletionList = getBoardCompletionList();

  // Leaderboard of Contributors: rank creators by total tasks created/assigned
  const getLeaderboard = () => {
    const emailsList = Array.from(contributors);
    const boardCreatorTasks: Record<string, number> = {};
    emailsList.forEach(e => {
      boardCreatorTasks[e] = 0;
    });

    cards.forEach(c => {
      if (c.created_by && boardCreatorTasks[c.created_by] !== undefined) {
        boardCreatorTasks[c.created_by]++;
      }
    });

    return emailsList
      .map(email => {
        const initials = email.split("@")[0].substring(0, 2).toUpperCase();
        const name = email.split("@")[0].replace(/[._]/g, " ");
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        const taskCount = boardCreatorTasks[email] || 0;
        
        let role = "Collaborator";
        if (email.toLowerCase() === session?.user?.email?.toLowerCase()) {
          role = "Product Lead";
        }

        return {
          email,
          initials,
          name: formattedName,
          role,
          tasksCount: taskCount
        };
      })
      .sort((a, b) => b.tasksCount - a.tasksCount);
  };
  const leaderboard = getLeaderboard();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-xs" style={{ fontFamily: DISPLAY, letterSpacing: "0.1em" }}>LOADING ANALYTICS…</span>
      </div>
    );
  }

  // Handle empty state beautifully
  if (boards.length === 0) {
    return (
      <div className="px-6 py-6" style={{ fontFamily: BODY }}>
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>Analytics</h1>
        </div>
        <div className="flex flex-col items-center justify-center border border-border p-16 text-center" style={{ background: "#141418" }}>
          <Clock size={36} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-foreground mb-1" style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.05em" }}>NO DATA AVAILABLE</p>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-4" style={{ fontWeight: 300 }}>
            Create boards, add columns, and populate tasks to view real-time performance analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6" style={{ fontFamily: BODY }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>Analytics</h1>
          <p className="text-muted-foreground text-xs mt-1" style={{ fontWeight: 300 }}>Real-time workload and board activity metrics</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <StatCard label="Tasks completed" value={String(tasksCompletedCount)} icon={Zap} color="#10b981" />
        <StatCard label="Avg cycle time" value={avgCycleTimeText} icon={Clock} color="#3b82f6" />
        <StatCard label="Recent Velocity" value={boardVelocityText} icon={TrendingUp} color="#e8002d" />
        <StatCard label="Active contributors" value={String(activeContributorsCount)} icon={Users} color="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-7">
        {/* Velocity area chart */}
        <div className="lg:col-span-2 p-4 border border-border" style={{ background: "#141418" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em", color: "#f0f0f2", textTransform: "uppercase" }}>Team Velocity</p>
              <p className="text-muted-foreground text-xs" style={{ fontWeight: 300 }}>Tasks done vs added per week</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground" style={{ fontFamily: DISPLAY, fontWeight: 500 }}>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 inline-block" style={{ background: "#10b981" }} />Done</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 inline-block" style={{ background: "#e8002d" }} />Added</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyVelocityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAdded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8002d" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#e8002d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fill: "#7a7a8c", fontSize: 10, fontFamily: DISPLAY }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7a7a8c", fontSize: 10, fontFamily: DISPLAY }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="done" name="Done" stroke="#10b981" strokeWidth={2} fill="url(#gDone)" dot={false} />
              <Area type="monotone" dataKey="added" name="Added" stroke="#e8002d" strokeWidth={2} fill="url(#gAdded)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priority pie */}
        <div className="p-4 border border-border flex flex-col justify-between animate-fade-in" style={{ background: "#141418" }}>
          <div>
            <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em", color: "#f0f0f2", textTransform: "uppercase" }}>By Priority</p>
            <p className="text-muted-foreground text-xs mb-3" style={{ fontWeight: 300 }}>Open tasks distribution</p>
          </div>
          {openCards.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-muted-foreground">
              No open tasks.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={priorityData} dataKey="value" innerRadius={35} outerRadius={50} paddingAngle={3} strokeWidth={0}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {priorityData.map(p => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2" style={{ background: p.color }} />
                      <span className="text-[10px] text-muted-foreground" style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: "0.08em" }}>{p.name.toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-foreground" style={{ fontFamily: DISPLAY, fontWeight: 700 }}>{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Board completion + leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Board completion */}
        <div className="p-4 border border-border" style={{ background: "#141418" }}>
          <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em", color: "#f0f0f2", textTransform: "uppercase", marginBottom: "1rem" }}>
            Board Completion
          </p>
          {boardCompletionList.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">No boards created yet.</div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {boardCompletionList.map((b, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-foreground truncate max-w-[200px]" style={{ fontFamily: BODY, fontWeight: 400 }} title={b.board}>{b.board}</span>
                    <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.75rem", color: b.pct === 100 ? "#10b981" : "#f0f0f2" }}>{b.pct}%</span>
                  </div>
                  <ProgressBar done={b.pct} total={100} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="p-4 border border-border" style={{ background: "#141418" }}>
          <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em", color: "#f0f0f2", textTransform: "uppercase", marginBottom: "1rem" }}>
            Top Contributors
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {leaderboard.map((m, i) => (
              <div key={m.email} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-b-0">
                <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "0.9rem", color: i < 3 ? "#e8002d" : "#7a7a8c", width: "1.5rem", textAlign: "center" }}>
                  {i + 1}
                </span>
                <Avatar initials={m.initials} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate" style={{ fontWeight: 400 }} title={m.name}>{m.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.role}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f2" }}>{m.tasksCount}</p>
                  <p className="text-[9px] text-muted-foreground" style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: "0.08em" }}>TASKS</p>
                </div>
                <div className="w-16 flex-shrink-0">
                  <ProgressBar done={m.tasksCount} total={Math.max(...leaderboard.map(l => l.tasksCount), 1)} color="#e8002d" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
