import { useState } from "react";
import { Mail, MoreHorizontal, UserPlus, Shield, ChevronDown, Search, Layers, CheckSquare } from "lucide-react";
import { DISPLAY, BODY, TEAM_MEMBERS, BOARDS } from "../data";
import { Avatar, ProgressBar, SectionLabel } from "../ui";

const ROLES = ["All", "Product", "Engineering", "Design", "Research", "DevOps", "Data", "QA"];

const STATUS_COLOR: Record<string, string> = { online: "#10b981", away: "#f59e0b", offline: "#7a7a8c" };

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = TEAM_MEMBERS.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || m.role.includes(roleFilter);
    return matchSearch && matchRole;
  });

  return (
    <div className="px-6 py-6" style={{ fontFamily: BODY }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>Teams</h1>
          <p className="text-muted-foreground text-xs mt-1" style={{ fontWeight: 300 }}>
            {TEAM_MEMBERS.length} members · {TEAM_MEMBERS.filter(m => m.status === "online").length} online now
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-white hover:opacity-85 transition-opacity"
          style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "0.1em" }}>
          <UserPlus size={13} />Invite Member
        </button>
      </div>

      {/* Team workspaces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
        {[
          { name: "Race Team Alpha", color: "#e8002d", members: ["AN","LH","CR","LN"], boards: 4, desc: "Campaign, design, and research" },
          { name: "Engineering Pit", color: "#3b82f6", members: ["MV","SP","RU","JB"], boards: 3, desc: "Infrastructure, sprint, and DevOps" },
        ].map(team => (
          <div key={team.name} className="p-4 border border-border hover:border-white/20 transition-all cursor-pointer" style={{ background: "#141418" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3" style={{ background: team.color }} />
                <span style={{ fontFamily: DISPLAY, fontSize: "0.95rem", fontWeight: 700, color: "#f0f0f2" }}>{team.name}</span>
              </div>
              <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3" style={{ fontWeight: 300 }}>{team.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {team.members.map(m => <Avatar key={m} initials={m} size="sm" />)}
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1" style={{ fontFamily: DISPLAY, fontWeight: 500 }}>
                <Layers size={10} />{team.boards} boards
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Member search + filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
            className="w-full pl-8 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 outline-none"
            style={{ fontFamily: BODY, fontWeight: 300, background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#e8002d")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
        </div>
        <div className="flex flex-wrap gap-1">
          {ROLES.slice(0, 5).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className="px-2.5 py-1 text-[10px] border border-border transition-all"
              style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em",
                background: roleFilter === r ? "#e8002d" : "transparent", color: roleFilter === r ? "#fff" : "#7a7a8c" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Members grid */}
      <SectionLabel>All Members ({filtered.length})</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(member => (
          <div key={member.id} className="group p-4 border border-border hover:border-white/20 transition-all" style={{ background: "#141418" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar initials={member.initials} size="md" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                    style={{ background: STATUS_COLOR[member.status] }} />
                </div>
                <div>
                  <p className="text-sm text-foreground" style={{ fontWeight: 500 }}>{member.name}</p>
                  <p className="text-[10px] text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <button className="p-1 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal size={13} />
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1" style={{ fontFamily: BODY }}>
              <Mail size={9} />{member.email}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 border border-border text-center" style={{ background: "#111115" }}>
                <p style={{ fontFamily: DISPLAY, fontSize: "1.1rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>{member.boards}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5" style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: "0.1em" }}>BOARDS</p>
              </div>
              <div className="p-2 border border-border text-center" style={{ background: "#111115" }}>
                <p style={{ fontFamily: DISPLAY, fontSize: "1.1rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>{member.tasksThisWeek}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5" style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: "0.1em" }}>TASKS WK</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex-1 py-1 text-[10px] border border-border text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
                style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em" }}>
                MESSAGE
              </button>
              <button className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors">
                <Shield size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
