import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Zap, Target, Clock, Users } from "lucide-react";
import { DISPLAY, BODY, ANALYTICS_VELOCITY, ANALYTICS_PRIORITY, ANALYTICS_BOARDS, TEAM_MEMBERS } from "../data";
import { Avatar, ProgressBar, SectionLabel } from "../ui";

function StatCard({ label, value, delta, icon: Icon, color }: {
  label: string; value: string; delta?: string; icon: React.ElementType; color: string;
}) {
  const positive = delta?.startsWith("+");
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
  return (
    <div className="px-6 py-6" style={{ fontFamily: BODY }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>Analytics</h1>
          <p className="text-muted-foreground text-xs mt-1" style={{ fontWeight: 300 }}>Team performance · W22 – W27 · 2025</p>
        </div>
        <div className="flex border border-border">
          {["7D","30D","90D"].map((v, i) => (
            <button key={v} className="px-3 py-1.5 text-[10px] transition-all"
              style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em",
                background: i === 1 ? "#e8002d" : "transparent", color: i === 1 ? "#fff" : "#7a7a8c" }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <StatCard label="Tasks completed" value="103" delta="+18%" icon={Zap} color="#10b981" />
        <StatCard label="Avg cycle time" value="3.2d" delta="-0.5d" icon={Clock} color="#3b82f6" />
        <StatCard label="Board velocity" value="17/wk" delta="+4" icon={TrendingUp} color="#e8002d" />
        <StatCard label="Active contributors" value="8" icon={Users} color="#8b5cf6" />
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
            <AreaChart data={ANALYTICS_VELOCITY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
        <div className="p-4 border border-border" style={{ background: "#141418" }}>
          <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em", color: "#f0f0f2", textTransform: "uppercase" }}>By Priority</p>
          <p className="text-muted-foreground text-xs mb-3" style={{ fontWeight: 300 }}>Open tasks distribution</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={ANALYTICS_PRIORITY} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={3} strokeWidth={0}>
                {ANALYTICS_PRIORITY.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {ANALYTICS_PRIORITY.map(p => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ background: p.color }} />
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: "0.08em" }}>{p.name}</span>
                </div>
                <span className="text-xs text-foreground" style={{ fontFamily: DISPLAY, fontWeight: 700 }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board completion + leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Board completion */}
        <div className="p-4 border border-border" style={{ background: "#141418" }}>
          <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em", color: "#f0f0f2", textTransform: "uppercase", marginBottom: "1rem" }}>
            Board Completion
          </p>
          <div className="space-y-3">
            {ANALYTICS_BOARDS.map(b => (
              <div key={b.board}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-foreground" style={{ fontFamily: BODY, fontWeight: 400 }}>{b.board}</span>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.75rem", color: b.pct === 100 ? "#10b981" : "#f0f0f2" }}>{b.pct}%</span>
                </div>
                <ProgressBar done={b.pct} total={100} />
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="p-4 border border-border" style={{ background: "#141418" }}>
          <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em", color: "#f0f0f2", textTransform: "uppercase", marginBottom: "1rem" }}>
            Top Contributors
          </p>
          <div className="space-y-2">
            {[...TEAM_MEMBERS].sort((a, b) => b.tasksThisWeek - a.tasksThisWeek).map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-b-0">
                <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "0.9rem", color: i < 3 ? "#e8002d" : "#7a7a8c", width: "1.5rem", textAlign: "center" }}>
                  {i + 1}
                </span>
                <Avatar initials={m.initials} size="sm" />
                <div className="flex-1">
                  <p className="text-xs text-foreground" style={{ fontWeight: 400 }}>{m.name}</p>
                  <p className="text-[10px] text-muted-foreground">{m.role}</p>
                </div>
                <div className="text-right">
                  <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f2" }}>{m.tasksThisWeek}</p>
                  <p className="text-[9px] text-muted-foreground" style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: "0.08em" }}>TASKS</p>
                </div>
                <div className="w-16">
                  <ProgressBar done={m.tasksThisWeek} total={15} color="#e8002d" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
