import { useState } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { DISPLAY, BODY, TIMELINE_ITEMS, PRIORITY_COLORS } from "../data";
import { Avatar, PriorityBadge, SectionLabel } from "../ui";

const DAYS = Array.from({ length: 15 }, (_, i) => i + 1);
const MONTH = "July 2025";
const TODAY = 1;

export default function TimelinePage() {
  const [offset, setOffset] = useState(0);
  const visibleDays = DAYS.slice(offset, offset + 12);

  return (
    <div className="px-6 py-6" style={{ fontFamily: BODY }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>Timeline</h1>
          <p className="text-muted-foreground text-xs mt-1" style={{ fontWeight: 300 }}>Visualise your team's workload and deadlines</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border">
            {["Week", "Month", "Quarter"].map((v, i) => (
              <button key={v} className="px-3 py-1.5 text-[10px] transition-all"
                style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em",
                  background: i === 0 ? "#e8002d" : "transparent", color: i === 0 ? "#fff" : "#7a7a8c" }}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="border border-border overflow-hidden" style={{ background: "#141418" }}>
        {/* Header — month + navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ background: "#0d0d0f" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em", color: "#f0f0f2" }}>{MONTH}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setOffset(o => Math.max(0, o - 1))}
              className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={13} />
            </button>
            <button onClick={() => setOffset(o => Math.min(3, o + 1))}
              className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

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
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][(d - 1) % 7]}
              </p>
              {d === TODAY && <div className="w-1 h-1 rounded-full bg-primary mx-auto mt-0.5" />}
            </div>
          ))}
        </div>

        {/* Rows */}
        {TIMELINE_ITEMS.map((item, rowIdx) => {
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
                      <div className="absolute inset-y-2 left-0 right-0"
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
      </div>

      {/* Legend */}
      <div className="mt-6">
        <SectionLabel>Board Milestones</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {[
            { label: "Sprint Q3 Kickoff", date: "Jul 2", color: "#3b82f6", done: true },
            { label: "Design Handoff", date: "Jul 5", color: "#8b5cf6", done: true },
            { label: "Auth Go-live", date: "Jul 8", color: "#e8002d", done: false },
            { label: "Infra Migration", date: "Jul 12", color: "#f59e0b", done: false },
            { label: "Beta Release", date: "Jul 18", color: "#10b981", done: false },
            { label: "Q3 Retrospective", date: "Jul 25", color: "#ec4899", done: false },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-3 p-3 border border-border" style={{ background: "#141418" }}>
              <div className="w-1 h-8 flex-shrink-0" style={{ background: m.color, opacity: m.done ? 0.4 : 1 }} />
              <div>
                <p className="text-xs text-foreground" style={{ fontWeight: 400, opacity: m.done ? 0.5 : 1 }}>{m.label}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5" style={{ fontFamily: DISPLAY, fontWeight: 500 }}>
                  {m.done ? <Zap size={9} style={{ color: "#10b981" }} /> : null}
                  {m.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
