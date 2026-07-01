import { useState, useEffect, useCallback } from "react";
import { CheckSquare, Circle, Calendar, Filter, Plus, Flag, Loader2, X } from "lucide-react";
import { DISPLAY, BODY, PRIORITY_COLORS, type Priority } from "../data";
import { AvatarStack, PriorityBadge, SectionLabel } from "../ui";
import { useSession } from "../sessionContext";
import { supabase } from "../../supabaseClient";

export default function TasksPage() {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "mine" | "overdue">("all");

  // Add task modal states
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const getBoardColor = (id: string) => {
    const colors = ["#e8002d", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#f97316"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const loadData = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      setLoading(true);
      // Fetch all boards
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
      setBoards(allBoards);

      if (allBoards.length === 0) {
        setTasks([]);
        setColumns([]);
        return;
      }

      const boardIds = allBoards.map(b => b.id);
      
      // Fetch columns
      const { data: cols } = await supabase
        .from('columns')
        .select('*')
        .in('board_id', boardIds);
      setColumns(cols || []);

      if (cols && cols.length > 0) {
        // Fetch cards created by this user
        const { data: allCards } = await supabase
          .from('cards')
          .select('*')
          .eq('created_by', session.user.email);
        
        setTasks(allCards || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("TasksPage loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggle = async (task: any) => {
    try {
      const boardCols = columns.filter(c => c.board_id === task.boardId);
      if (boardCols.length === 0) return;

      if (!task.done) {
        // Move to Done column
        const doneCol = boardCols.find(c => c.name.toLowerCase() === "done");
        if (doneCol) {
          const { error } = await supabase
            .from('cards')
            .update({ column_id: doneCol.id })
            .eq('id', task.id);
          if (error) throw error;
        }
      } else {
        // Move back to the first column that isn't Done
        const todoCol = boardCols.find(c => c.name.toLowerCase() !== "done" && c.name.toLowerCase().includes("todo")) 
          || boardCols.sort((a, b) => a.position - b.position)[0];
        if (todoCol) {
          const { error } = await supabase
            .from('cards')
            .update({ column_id: todoCol.id })
            .eq('id', task.id);
          if (error) throw error;
        }
      }
      loadData();
    } catch (err) {
      console.error("Error toggling task completion:", err);
    }
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedBoardId) return;

    setAddingTask(true);
    try {
      const boardCols = columns
        .filter(c => c.board_id === selectedBoardId)
        .sort((a, b) => a.position - b.position);

      if (boardCols.length === 0) {
        alert("This board doesn't have any columns. Please add a column on the board page first!");
        setAddingTask(false);
        return;
      }

      const firstColId = boardCols[0].id;

      const { error } = await supabase
        .from('cards')
        .insert({
          column_id: firstColId,
          title: taskTitle.trim(),
          description: taskDesc.trim() || null,
          priority: taskPriority,
          due_date: taskDueDate || null,
          created_by: session.user.email
        });

      if (error) throw error;

      setAddTaskOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskDueDate("");
      loadData();
    } catch (err) {
      console.error("Add task error:", err);
      alert("Failed to add task.");
    } finally {
      setAddingTask(false);
    }
  };

  const colToBoardMap: Record<string, any> = {};
  columns.forEach(col => {
    colToBoardMap[col.id] = boards.find(b => b.id === col.board_id);
  });

  const formattedTasks = tasks.map(t => {
    const board = colToBoardMap[t.column_id];
    const col = columns.find(cl => cl.id === t.column_id);
    const done = col ? col.name.toLowerCase() === "done" : false;
    
    let dueLabel = "No Due Date";
    if (t.due_date) {
      const d = new Date(t.due_date);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      if (d.toDateString() === today.toDateString()) {
        dueLabel = "Today";
      } else if (d.toDateString() === tomorrow.toDateString()) {
        dueLabel = "Tomorrow";
      } else {
        dueLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    }

    const initials = t.created_by 
      ? t.created_by.split("@")[0].substring(0, 2).toUpperCase()
      : "??";

    return {
      id: t.id,
      title: t.title,
      desc: t.description,
      priority: (t.priority || "medium") as Priority,
      due: dueLabel,
      dueDateRaw: t.due_date,
      board: board ? board.name : "Unknown Board",
      boardId: board ? board.id : "",
      done,
      assignees: [initials]
    };
  });

  const filteredTasks = formattedTasks.filter(t => {
    if (filter === "overdue") {
      if (!t.dueDateRaw || t.done) return false;
      const d = new Date(t.dueDateRaw);
      d.setHours(23, 59, 59, 999);
      return d.getTime() < new Date().getTime();
    }
    if (filter === "mine") {
      return !t.done;
    }
    return true;
  });

  const dueLabels = Array.from(new Set(filteredTasks.map(t => t.due)));
  dueLabels.sort((a, b) => {
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Tomorrow") return -1;
    if (b === "Tomorrow") return 1;
    if (a === "No Due Date") return 1;
    if (b === "No Due Date") return -1;
    
    const tA = filteredTasks.find(t => t.due === a)?.dueDateRaw || "";
    const tB = filteredTasks.find(t => t.due === b)?.dueDateRaw || "";
    return new Date(tA).getTime() - new Date(tB).getTime();
  });

  const grouped = dueLabels.map(label => ({
    label,
    items: filteredTasks.filter(t => t.due === label && !t.done)
  })).filter(g => g.items.length > 0);

  const doneTasks = filteredTasks.filter(t => t.done);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-xs" style={{ fontFamily: DISPLAY, letterSpacing: "0.1em" }}>LOADING TASKS…</span>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-3xl" style={{ fontFamily: BODY }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>My Tasks</h1>
          <p className="text-muted-foreground text-xs mt-1" style={{ fontWeight: 300 }}>
            {filteredTasks.filter(t => !t.done).length} remaining · {doneTasks.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border">
            {(["all","mine","overdue"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 text-[10px] transition-all cursor-pointer"
                style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  background: filter === f ? "#e8002d" : "transparent", color: filter === f ? "#fff" : "#7a7a8c" }}>
                {f === "mine" ? "ACTIVE" : f.toUpperCase()}
              </button>
            ))}
          </div>
          {boards.length > 0 && (
            <button 
              onClick={() => {
                setSelectedBoardId(boards[0]?.id || "");
                setAddTaskOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-white hover:opacity-85 transition-opacity cursor-pointer animate-fade-in"
              style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "0.1em" }}
            >
              <Plus size={13} />Add Task
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { label: "Critical", count: filteredTasks.filter(t => t.priority === "critical" && !t.done).length, color: "#e8002d" },
          { label: "High", count: filteredTasks.filter(t => t.priority === "high" && !t.done).length, color: "#f97316" },
          { label: "Medium", count: filteredTasks.filter(t => t.priority === "medium" && !t.done).length, color: "#f59e0b" },
          { label: "Low", count: filteredTasks.filter(t => t.priority === "low" && !t.done).length, color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 p-3 border border-border" style={{ background: "#141418" }}>
            <div className="w-2 h-full min-h-6 self-stretch" style={{ background: s.color }} />
            <div>
              <p style={{ fontFamily: DISPLAY, fontSize: "1.2rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</p>
              <p className="text-muted-foreground text-[10px]" style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: "0.1em" }}>{s.label.toUpperCase()}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-border" style={{ background: "#141418" }}>
          <CheckSquare size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-foreground mb-1" style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.05em" }}>NO TASKS FOUND</p>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed" style={{ fontWeight: 300 }}>
            {filter === "overdue" ? "Great job! You have no overdue tasks." : "Tasks you create or get assigned to will appear here."}
          </p>
        </div>
      ) : (
        <>
          {/* Task groups */}
          {grouped.map(group => (
            <div key={group.label} className="mb-6">
              <SectionLabel>
                <span className="flex items-center gap-2">
                  <Calendar size={11} />
                  {group.label}
                  <span className="text-[10px] px-1.5 py-0.5 border border-border" style={{ fontFamily: DISPLAY, fontWeight: 700 }}>
                    {group.items.length}
                  </span>
                </span>
              </SectionLabel>

              <div className="space-y-1.5 animate-fade-in">
                {group.items.map(task => (
                  <div key={task.id}
                    className="flex items-center gap-3 px-4 py-3 border border-border hover:border-white/20 transition-all group"
                    style={{ background: "#141418" }}>
                    <button onClick={() => toggle(task)} className="flex-shrink-0 transition-colors cursor-pointer">
                      <Circle size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate" style={{ fontWeight: 400 }}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: getBoardColor(task.boardId) }} />
                        {task.board}
                      </p>
                    </div>

                    <PriorityBadge priority={task.priority} />
                    <AvatarStack members={task.assignees} max={2} />

                    <span className="text-[10px] text-muted-foreground hidden sm:flex items-center gap-1" style={{ fontFamily: DISPLAY, fontWeight: 500 }}>
                      <Calendar size={9} />{task.due}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Completed */}
          {doneTasks.length > 0 && (
            <div className="mt-8 animate-fade-in">
              <SectionLabel>Completed ({doneTasks.length})</SectionLabel>
              <div className="space-y-1.5">
                {doneTasks.map(task => (
                  <div key={task.id}
                    className="flex items-center gap-3 px-4 py-2.5 border border-border opacity-40 hover:opacity-60 transition-opacity"
                    style={{ background: "#141418" }}>
                    <button onClick={() => toggle(task)} className="cursor-pointer">
                      <CheckSquare size={16} style={{ color: "#10b981" }} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate line-through" style={{ fontWeight: 400 }}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: getBoardColor(task.boardId) }} />
                        {task.board}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Task Modal */}
      {addTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setAddTaskOpen(false)}>
          <form className="w-full max-w-md border border-border shadow-2xl p-6" style={{ background: "#1a1a20" }} onClick={(e) => e.stopPropagation()} onSubmit={handleAddTaskSubmit}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase" style={{ fontFamily: DISPLAY }}>New Task</h3>
              <button type="button" className="text-muted-foreground hover:text-foreground text-sm cursor-pointer" onClick={() => setAddTaskOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Task Title</label>
                <input
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="Review code architecture..."
                  className="w-full text-xs text-foreground bg-[#141418] border border-border px-3 py-2.5 outline-none"
                  style={{ fontFamily: BODY }}
                  required
                  autoFocus
                  disabled={addingTask}
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Description</label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  placeholder="Detail the sprint task requirements..."
                  className="w-full text-xs text-foreground bg-[#141418] border border-border p-2.5 outline-none"
                  style={{ fontFamily: BODY, minHeight: "60px" }}
                  disabled={addingTask}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Target Board</label>
                  <select
                    value={selectedBoardId}
                    onChange={e => setSelectedBoardId(e.target.value)}
                    className="w-full text-xs text-foreground bg-[#141418] border border-border p-2.5 outline-none"
                    style={{ fontFamily: BODY }}
                    required
                    disabled={addingTask}
                  >
                    {boards.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as Priority)}
                    className="w-full text-xs text-foreground bg-[#141418] border border-border p-2.5 outline-none"
                    style={{ fontFamily: BODY }}
                    disabled={addingTask}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  className="w-full text-xs text-foreground bg-[#141418] border border-border px-3 py-2 outline-none"
                  style={{ fontFamily: BODY }}
                  disabled={addingTask}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddTaskOpen(false)}
                  className="px-4 py-2 border border-border text-xs text-muted-foreground hover:text-foreground hover:border-white/20 transition-all cursor-pointer"
                  style={{ fontFamily: DISPLAY, fontWeight: 700 }}
                  disabled={addingTask}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={addingTask}
                  className="bg-primary text-white text-xs font-bold tracking-widest px-4 py-2 hover:opacity-85 disabled:opacity-50 cursor-pointer"
                  style={{ fontFamily: DISPLAY }}
                >
                  {addingTask ? "ADDING…" : "ADD TASK"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
