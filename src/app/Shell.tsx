import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router";
import {
  LayoutDashboard, CheckSquare, Bell, Users, Settings,
  Search, Plus, ChevronDown, UserPlus, Inbox,
  Calendar, Activity, Flag, Trash2, Layers,
} from "lucide-react";
import { DISPLAY, BODY } from "./data";
import { Avatar } from "./ui";
import { useSession } from "./sessionContext";
import { supabase } from "../supabaseClient";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: CheckSquare, label: "My Tasks", to: "/tasks" },
  { icon: Inbox, label: "Inbox", to: "/inbox" },
  { icon: Calendar, label: "Timeline", to: "/timeline" },
  { icon: Users, label: "Teams", to: "/teams" },
  { icon: Activity, label: "Analytics", to: "/analytics" },
];

export default function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const [boards, setBoards] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const loadBoards = async () => {
    if (!session?.user?.email) return;
    try {
      const { data: owned } = await supabase
        .from('boards')
        .select('*')
        .eq('created_by', session.user.email);

      const { data: memberRows } = await supabase
        .from('board_members')
        .select('boards(*)')
        .eq('user_email', session.user.email);

      const shared = (memberRows || [])
        .map((row: any) => row.boards)
        .filter(Boolean);

      const allBoards = [...(owned || [])];
      shared.forEach((sb: any) => {
        if (!allBoards.some((b) => b.id === sb.id)) {
          allBoards.push(sb);
        }
      });

      allBoards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBoards(allBoards);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBoards();
    const channel = supabase
      .channel('sidebar-boards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, loadBoards)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members' }, loadBoards)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.email]);

  const getBoardColor = (id: string) => {
    const colors = ["#e8002d", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#f97316"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + "/");

  const initials = (session?.user?.user_metadata?.full_name || session?.user?.email || "U")
    .substring(0, 2)
    .toUpperCase();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0];

  return (
    <div className="min-h-screen bg-background flex" style={{ fontFamily: BODY }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-border sticky top-0 h-screen overflow-y-auto" style={{ background: "#0d0d0f" }}>
        <div className="px-5 py-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary flex items-center justify-center flex-shrink-0">
              <CheckSquare size={14} strokeWidth={2.5} className="text-white" />
            </div>
            <span style={{ fontFamily: DISPLAY, fontSize: "1.4rem", fontWeight: 900, color: "#f0f0f2" }}>
              Queue<span style={{ color: "#e8002d" }}>T</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ icon: Icon, label, to, badge }) => {
            const active = isActive(to);
            return (
              <Link key={to} to={to}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-all duration-150"
                style={{
                  background: active ? "rgba(232,0,45,0.12)" : "transparent",
                  color: active ? "#e8002d" : "#7a7a8c",
                  fontFamily: BODY, fontWeight: active ? 500 : 400,
                  borderLeft: active ? "2px solid #e8002d" : "2px solid transparent",
                  textDecoration: "none", display: "flex",
                }}>
                <Icon size={15} />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="text-white text-[10px] w-4 h-4 flex items-center justify-center"
                    style={{ background: "#e8002d", fontFamily: DISPLAY, fontWeight: 700 }}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 pb-1">
            <span className="px-3 text-[10px] text-muted-foreground"
              style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Boards
            </span>
          </div>
          {boards.map(b => (
            <Link key={b.id} to={`/board/${b.id}`}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors"
              style={{
                fontFamily: BODY, fontWeight: 400, textDecoration: "none", display: "flex",
                color: isActive(`/board/${b.id}`) ? "#f0f0f2" : "#7a7a8c",
              }}>
              <div className="w-2 h-2 flex-shrink-0" style={{ background: getBoardColor(b.id) }} />
              <span className="flex-1 truncate">{b.name}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: BODY }}>
            <Settings size={15} />Settings
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <Avatar initials={initials} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground truncate" style={{ fontWeight: 500 }}>{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-3 border-b border-border sticky top-0 z-10" style={{ background: "#0d0d0f" }}>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search boards, tasks… (⌘K)"
              className="w-full pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition-colors"
              style={{ fontFamily: BODY, fontWeight: 300, background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0 }}
              onFocus={e => (e.currentTarget.style.borderColor = "#e8002d")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
              style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em", borderRadius: 0 }}>
              <UserPlus size={13} />Invite
            </button>
            <button
              onClick={() => navigate("/dashboard?new=true")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-white hover:opacity-85 transition-opacity"
              style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "0.1em", borderRadius: 0 }}>
              <Plus size={13} strokeWidth={2.5} />New Board
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-10 w-72 border border-border shadow-xl z-30"
                  style={{ background: "#1a1a20", borderRadius: 0 }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em" }}>NOTIFICATIONS</span>
                    <button className="text-xs text-primary hover:underline" style={{ fontFamily: BODY }}>Mark all read</button>
                  </div>
                  {[
                    { user: "LH", color: "#3b82f6", text: "assigned you to Backend auth integration", time: "2m ago" },
                    { user: "MV", color: "#f59e0b", text: "commented on CI/CD pipeline", time: "14m ago" },
                    { user: "SP", color: "#10b981", text: "mentioned you in Sprint doc", time: "1h ago" },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 border-b border-border/50 transition-colors">
                      <Avatar initials={n.user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug">{n.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                  <Link to="/inbox" onClick={() => setNotifOpen(false)}
                    className="w-full py-2.5 text-xs text-primary hover:bg-secondary/50 transition-colors flex items-center justify-center"
                    style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em" }}>
                    VIEW ALL →
                  </Link>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 border border-border hover:border-white/20 transition-colors"
                style={{ borderRadius: 0 }}>
                <Avatar initials={initials} size="sm" />
                <ChevronDown size={12} className="text-muted-foreground" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-10 w-44 border border-border shadow-xl z-30 py-1"
                  style={{ background: "#1a1a20", borderRadius: 0 }}>
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{userName}</p>
                    <p className="text-[10px] text-muted-foreground">{session?.user?.email}</p>
                  </div>
                  {[
                    { icon: Settings, label: "Account settings" },
                    { icon: Flag, label: "What's new" },
                  ].map(({ icon: Icon, label }) => (
                    <button key={label} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-secondary transition-colors text-foreground" style={{ fontFamily: BODY }}>
                      <Icon size={12} />{label}
                    </button>
                  ))}
                  <button onClick={() => { setProfileOpen(false); supabase.auth.signOut(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-secondary transition-colors" style={{ fontFamily: BODY, color: "#e8002d" }}>
                    <Trash2 size={12} />Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: "#111115" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
