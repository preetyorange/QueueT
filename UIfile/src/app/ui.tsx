import { Lock, Globe, Users } from "lucide-react";
import { AVATAR_COLORS, BODY, DISPLAY, PRIORITY_COLORS, type Priority } from "./data";

export function Avatar({ initials, size = "sm" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const color = AVATAR_COLORS[initials] ?? "#555";
  const cls = size === "sm" ? "w-6 h-6 text-[9px]" : size === "md" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${cls} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: color, fontFamily: DISPLAY }}>
      {initials}
    </div>
  );
}

export function AvatarStack({ members, max = 3 }: { members: string[]; max?: number }) {
  return (
    <div className="flex -space-x-1.5">
      {members.slice(0, max).map(m => <Avatar key={m} initials={m} size="sm" />)}
      {members.length > max && (
        <div className="w-6 h-6 rounded-full bg-secondary border border-background flex items-center justify-center text-[9px] text-muted-foreground font-bold">
          +{members.length - max}
        </div>
      )}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = PRIORITY_COLORS[priority];
  return (
    <span className="px-1.5 py-0.5 text-[9px] tracking-widest uppercase"
      style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em", background: `${c}22`, color: c }}>
      {priority}
    </span>
  );
}

export function ProgressBar({ done, total, color }: { done: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const c = color ?? (pct === 100 ? "#10b981" : pct > 60 ? "#3b82f6" : pct > 30 ? "#f59e0b" : "#e8002d");
  return (
    <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: c }} />
    </div>
  );
}

export function VisIcon({ vis }: { vis: string }) {
  if (vis === "private") return <Lock size={10} className="text-muted-foreground" />;
  if (vis === "team") return <Users size={10} className="text-muted-foreground" />;
  return <Globe size={10} className="text-muted-foreground" />;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-muted-foreground" style={{ fontFamily: DISPLAY, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-border ${className}`} style={{ background: "#141418", borderRadius: 0 }}>
      {children}
    </div>
  );
}

export function Pill({ label, color }: { label: string; color?: string }) {
  return (
    <span className="px-2 py-0.5 text-[10px] border border-border text-muted-foreground"
      style={{ fontFamily: BODY, fontWeight: 300, color: color ?? undefined }}>
      {label}
    </span>
  );
}
