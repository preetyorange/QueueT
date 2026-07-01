import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Zap, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { DISPLAY, BODY, PRIORITY_COLORS } from "../data";
import { PriorityBadge, SectionLabel } from "../ui";
import { useSession } from "../sessionContext";
import { supabase } from "../../supabaseClient";

export default function TimelinePage() {
  const session = useSession();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // start on July 2026 as per workspace current time
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);

  const getBoardColor = (boardId: string) => {
    const colors = ["#e8002d", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#f97316"];
    let hash = 0;
    for (let i = 0; i < boardId.length; i++) {
      hash = boardId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    if (!session?.user?.email) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all user's boards (owned + member)
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

        const allBoards = [...(owned || [])];
        sharedBoards.forEach((sb: any) => {
          if (!allBoards.some((b) => b.id === sb.id)) {
            allBoards.push(sb);
          }
        });

        if (allBoards.length === 0) {
          setCards([]);
          setColumns([]);
          return;
        }

        const boardIds = allBoards.map(b => b.id);
        const { data: cols } = await supabase
          .from('columns')
          .select('*')
          .in('board_id', boardIds);
        
        setColumns(cols || []);

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
      } catch (err) {
        console.error("Timeline data loading error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session?.user?.email]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const MONTH = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Align TODAY indicator if current calendar month matches system date's month and year
  const actualNow = new Date();
  const TODAY = (actualNow.getFullYear() === currentYear && actualNow.getMonth() === currentMonth) 
    ? actualNow.getDate() 
    : -1;

  const colToBoardMap: Record<string, string> = {};
  columns.forEach(col => {
    colToBoardMap[col.id] = col.board_id;
  });

  const timelineItems = cards
    .map(c => {
      const boardId = colToBoardMap[c.column_id];
      const color = boardId ? getBoardColor(boardId) : "#7a7a8c";
      
      const dateStr = c.due_date || c.created_at;
      if (!dateStr) return null;
      const d = new Date(dateStr);
      
      if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) {
        return null;
      }
      
      const day = d.getDate();
      const start = Math.max(1, day - 2);
      const span = day - start + 1;
      
      const initials = c.created_by 
        ? c.created_by.split("@")[0].substring(0, 2).toUpperCase()
        : "??";

      return {
        id: c.id,
        title: c.title,
        priority: c.priority || "medium",
        color,
        start,
        span,
        assignees: [initials]
      };
    })
    .filter(Boolean) as any[];

  // Compute milestones: next 6 cards with due dates across the workspace
  const milestones = cards
    .filter(c => c.due_date)
    .map(c => {
      const boardId = colToBoardMap[c.column_id];
      const color = boardId ? getBoardColor(boardId) : "#7a7a8c";
      const col = columns.find(cl => cl.id === c.column_id);
      const done = col ? col.name.toLowerCase() === "done" : false;
      const d = new Date(c.due_date);
      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        label: c.title,
        date: dateLabel,
        color,
        done,
        rawDate: d
      };
    })
    .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
    .slice(0, 6);

  const handlePrev = () => {
    if (offset > 0) {
      setOffset(o => Math.max(0, o - 4));
    } else {
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const prevDays = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate();
      setCurrentDate(prevDate);
      setOffset(Math.max(0, prevDays - 12));
    }
  };

  const handleNext = () => {
    const maxOffset = Math.max(0, daysInMonth - 12);
    if (offset < maxOffset) {
      setOffset(o => Math.min(maxOffset, o + 4));
    } else {
      const nextDate = new Date(currentYear, currentMonth + 1, 1);
      setCurrentDate(nextDate);
      setOffset(0);
    }
  };

  const visibleDays = DAYS.slice(offset, offset + 12);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-xs" style={{ fontFamily: DISPLAY, letterSpacing: "0.1em" }}>LOADING TIMELINE…</span>
      </div>
    );
  }

  return (
    <div className="px-6 py-6" style={{ fontFamily: BODY }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>Timeline</h1>
          <p className="text-muted-foreground text-xs mt-1" style={{ fontWeight: 300 }}>Visualise your workload and board deadlines</p>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="border border-border overflow-hidden mb-8" style={{ background: "#141418" }}>
        {/* Header — month + navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ background: "#0d0d0f" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em", color: "#f0f0f2" }}>{MONTH}</span>
          <div className="flex items-center gap-1">
            <button onClick={handlePrev}
              className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={13} />
            </button>
            <button onClick={handleNext}
              className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {timelineItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <CalendarIcon size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-foreground mb-1" style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.05em" }}>NO SCHEDULED TASKS</p>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed" style={{ fontWeight: 300 }}>
              Tasks with due dates in {MONTH} will appear on this timeline.
            </p>
          </div>
        ) : (
          <>
            {/* Day headers */}
            <div className="grid border-b border-border" style={{ gridTemplateColumns: "200px repeat(12, 1fr)" }}>
              <div className="px-4 py-2 border-r border-border">
                <span className="text-[10px] text-muted-foreground" style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em" }}>TASK</span>
              </div>
              {visibleDays.map(d => (
                <div key={d} className="px-1 py-2 text-center border-r border-border last:border-r-0"
                  style={{ background: d === TODAY ? "rgba(232,0,45,0.08)" : "transparent" }}>
                  <p className="text-[10px]" style={{
                    fontFamily: DISPLAY, fontWeight: d === TODAY ? 900 : 500,
                    color: d === TODAY ? "#e8002d" : "#7a7a8c", letterSpacing: "0.1em"
                  }}>
                    {d}
                  </p>
                  <p className="text-[9px] text-muted-foreground" style={{ fontFamily: DISPLAY }}>
                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(currentYear, currentMonth, d).getDay()]}
                  </p>
                  {d === TODAY && <div className="w-1 h-1 rounded-full bg-primary mx-auto mt-0.5" />}
                </div>
              ))}
            </div>

            {/* Rows */}
            {timelineItems.map((item) => {
              const s = Math.max(0, item.start - 1 - offset);
              const e = Math.min(12, item.start - 1 - offset + item.span);
              const visible = e > s && s < 12;

              return (
                <div key={item.id} className="grid border-b border-border last:border-b-0 group hover:bg-white/[0.02] transition-colors"
                  style={{ gridTemplateColumns: "200px repeat(12, 1fr)" }}>
                  {/* Label */}
                  <div className="px-3 py-3 border-r border-border flex items-center gap-2">
                    <div className="w-1.5 h-full min-h-4 self-stretch flex-shrink-0" style={{ background: item.color }} />
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate" style={{ fontWeight: 400 }}>{item.title}</p>
                      <PriorityBadge priority={item.priority} />
                    </div>
                  </div>

                  {/* Cells */}
                  {Array.from({ length: 12 }, (_, ci) => {
                    const isStart = ci === s && visible;
                    const isMiddle = ci > s && ci < e && visible;
                    const isEnd = ci === e - 1 && visible && ci !== s;
                    const isActive = (ci >= s && ci < e) && visible;

                    return (
                      <div key={ci} className="relative py-2.5 border-r border-border last:border-r-0"
                        style={{ background: ci + offset + 1 === TODAY ? "rgba(232,0,45,0.04)" : "transparent" }}>
                        {isActive && (
                          <div className="absolute inset-y-2 left-0 right-0 animate-fade-in"
                            style={{
                              background: isStart ? `linear-gradient(90deg, transparent 0%, ${item.color}40 10%, ${item.color}40 100%)` : isEnd ? `${item.color}40` : `${item.color}40`,
                              borderLeft: isStart ? `2px solid ${item.color}` : "none",
                              borderRight: isEnd ? `2px solid ${item.color}` : "none",
                            }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Legend / Milestones */}
      <div>
        <SectionLabel>Board Milestones</SectionLabel>
        {milestones.length === 0 ? (
          <div className="p-4 border border-border text-center text-xs text-muted-foreground" style={{ background: "#141418" }}>
            No board milestones set. Create tasks with due dates to track milestones.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {milestones.map((m, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border border-border" style={{ background: "#141418" }}>
                <div className="w-1 h-8 flex-shrink-0" style={{ background: m.color, opacity: m.done ? 0.4 : 1 }} />
                <div className="min-w-0">
                  <p className="text-xs text-foreground truncate" style={{ fontWeight: 400, opacity: m.done ? 0.5 : 1 }}>{m.label}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5" style={{ fontFamily: DISPLAY, fontWeight: 500 }}>
                    {m.done ? <Zap size={9} style={{ color: "#10b981" }} /> : null}
                    {m.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
