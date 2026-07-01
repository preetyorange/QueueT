import { useState } from "react";
import { CheckSquare, Circle, Calendar, ChevronDown, Filter, Plus, Flag } from "lucide-react";
import { DISPLAY, BODY, MY_TASKS, PRIORITY_COLORS, type Priority } from "../data";
import { Avatar, AvatarStack, PriorityBadge, SectionLabel } from "../ui";

const GROUPS = ["Today", "Tomorrow", "Jul 5", "Jul 6", "Jul 8", "Jul 10"] as const;

export default function TasksPage() {
  const [tasks, setTasks] = useState(MY_TASKS);
  const [filter, setFilter] = useState<"all" | "mine" | "overdue">("all");

  const toggle = (id: string) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const grouped = GROUPS.map(g => ({
    label: g,
    items: tasks.filter(t => t.due === g && (filter === "all" || !t.done)),
  })).filter(g => g.items.length > 0);

  const done = tasks.filter(t => t.done);

  return (
    <div className="px-6 py-6 max-w-3xl" style={{ fontFamily: BODY }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>My Tasks</h1>
          <p className="text-muted-foreground text-xs mt-1" style={{ fontWeight: 300 }}>
            {tasks.filter(t => !t.done).length} remaining · {done.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border">
            {(["all","mine","overdue"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 text-[10px] transition-all"
                style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  background: filter === f ? "#e8002d" : "transparent", color: filter === f ? "#fff" : "#7a7a8c" }}>
                {f}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-border text-muted-foreground hover:text-foreground"
            style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em" }}>
            <Filter size={11} />Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white hover:opacity-85"
            style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "0.1em" }}>
            <Plus size={13} />Add Task
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { label: "Critical", count: tasks.filter(t => t.priority === "critical" && !t.done).length, color: "#e8002d" },
          { label: "High", count: tasks.filter(t => t.priority === "high" && !t.done).length, color: "#f97316" },
          { label: "Medium", count: tasks.filter(t => t.priority === "medium" && !t.done).length, color: "#f59e0b" },
          { label: "Low", count: tasks.filter(t => t.priority === "low" && !t.done).length, color: "#10b981" },
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

          <div className="space-y-1.5">
            {group.items.map(task => (
              <div key={task.id}
                className="flex items-center gap-3 px-4 py-3 border border-border hover:border-white/20 transition-all group"
                style={{ background: "#141418", opacity: task.done ? 0.5 : 1 }}>
                <button onClick={() => toggle(task.id)} className="flex-shrink-0 transition-colors">
                  {task.done
                    ? <CheckSquare size={16} style={{ color: "#10b981" }} />
                    : <Circle size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate" style={{ fontWeight: 400, textDecoration: task.done ? "line-through" : "none" }}>
                    {task.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{task.board}</p>
                </div>

                <PriorityBadge priority={task.priority} />
                <AvatarStack members={task.assignees} max={2} />

                <span className="text-[10px] text-muted-foreground hidden sm:flex items-center gap-1" style={{ fontFamily: DISPLAY, fontWeight: 500 }}>
                  <Calendar size={9} />{task.due}
                </span>

                <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                  style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em" }}>
                  <Flag size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Completed */}
      {done.length > 0 && (
        <div>
          <SectionLabel>Completed ({done.length})</SectionLabel>
          <div className="space-y-1.5">
            {done.map(task => (
              <div key={task.id}
                className="flex items-center gap-3 px-4 py-2.5 border border-border opacity-40 hover:opacity-60 transition-opacity"
                style={{ background: "#141418" }}>
                <button onClick={() => toggle(task.id)}>
                  <CheckSquare size={16} style={{ color: "#10b981" }} />
                </button>
                <p className="text-sm text-foreground flex-1 truncate" style={{ fontWeight: 400, textDecoration: "line-through" }}>
                  {task.title}
                </p>
                <p className="text-[10px] text-muted-foreground">{task.board}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
