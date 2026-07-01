import { useState, useEffect, useCallback } from "react";
import { Mail, MoreHorizontal, UserPlus, Shield, X, Search, Layers, Loader2 } from "lucide-react";
import { DISPLAY, BODY } from "../data";
import { Avatar, SectionLabel } from "../ui";
import { useSession } from "../sessionContext";
import { supabase } from "../../supabaseClient";

const ROLES = ["All", "Lead", "Owner", "Collaborator"];
const STATUS_COLOR: Record<string, string> = { online: "#10b981", away: "#f59e0b", offline: "#7a7a8c" };

export default function TeamsPage() {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState<any[]>([]);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Invite member modal states
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

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
        setBoardMembers([]);
        setColumns([]);
        setCards([]);
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
      console.error("TeamsPage loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Invite teammate submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    if (!selectedBoardId || !inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      const email = inviteEmail.trim().toLowerCase();
      const board = boards.find(b => b.id === selectedBoardId);
      
      if (board && board.created_by.toLowerCase() === email) {
        setInviteError("User is the owner of this board.");
        setInviteLoading(false);
        return;
      }
      
      const existing = boardMembers.some(
        m => m.board_id === selectedBoardId && m.user_email.toLowerCase() === email
      );
      if (existing) {
        setInviteError("User is already a collaborator on this board.");
        setInviteLoading(false);
        return;
      }

      const { error } = await supabase
        .from('board_members')
        .insert({ board_id: selectedBoardId, user_email: email });
      if (error) throw error;

      setInviteSuccess("Teammate successfully added to the board!");
      setInviteEmail("");
      loadData();
      setTimeout(() => {
        setInviteOpen(false);
        setInviteSuccess("");
      }, 1200);
    } catch (err: any) {
      setInviteError(err.message || "Failed to add collaborator.");
    } finally {
      setInviteLoading(false);
    }
  };

  const getTeammates = () => {
    if (!session?.user?.email) return [];
    const emails = new Set<string>();
    emails.add(session.user.email);
    boards.forEach(b => { if (b.created_by) emails.add(b.created_by); });
    boardMembers.forEach(m => { if (m.user_email) emails.add(m.user_email); });

    return Array.from(emails).map((email, idx) => {
      const isSelf = email.toLowerCase() === session.user.email.toLowerCase();
      const initials = email.split("@")[0].substring(0, 2).toUpperCase();
      const name = email.split("@")[0].replace(/[._]/g, " ");
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

      const userBoards = boards.filter(b => {
        const isOwner = b.created_by.toLowerCase() === email.toLowerCase();
        const isCollaborator = boardMembers.some(bm => bm.board_id === b.id && bm.user_email.toLowerCase() === email.toLowerCase());
        return isOwner || isCollaborator;
      });

      const userTasksCount = cards.filter(c => c.created_by && c.created_by.toLowerCase() === email.toLowerCase()).length;

      let role = "Collaborator";
      if (isSelf) {
        role = "Product Lead (You)";
      } else {
        const ownsAny = boards.some(b => b.created_by.toLowerCase() === email.toLowerCase());
        if (ownsAny) {
          role = "Board Owner";
        }
      }

      let status: "online" | "away" | "offline" = "online";
      if (!isSelf) {
        const hash = idx % 3;
        status = hash === 0 ? "online" : hash === 1 ? "away" : "offline";
      }

      return {
        id: email,
        initials,
        name: formattedName,
        email,
        role,
        boards: userBoards.length,
        tasksThisWeek: userTasksCount,
        status,
        color: getBoardColor(email)
      };
    });
  };

  const teammates = getTeammates();
  const filtered = teammates.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || m.role.toLowerCase().includes(roleFilter.toLowerCase());
    return matchSearch && matchRole;
  });

  const getBoardMemberInitials = (board: any) => {
    const memberEmails = boardMembers
      .filter(m => m.board_id === board.id)
      .map(m => m.user_email);
    const uniqueEmails = Array.from(new Set([board.created_by, ...memberEmails]));
    return uniqueEmails.map(email => email.split("@")[0].substring(0, 2).toUpperCase());
  };

  const getBoardCardCount = (boardId: string) => {
    const boardCols = columns.filter(c => c.board_id === boardId).map(c => c.id);
    return cards.filter(c => boardCols.includes(c.column_id)).length;
  };

  // Only boards owned by the current user can receive invitations
  const ownedBoards = boards.filter(b => b.created_by === session?.user?.email);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-xs" style={{ fontFamily: DISPLAY, letterSpacing: "0.1em" }}>LOADING TEAMS…</span>
      </div>
    );
  }

  return (
    <div className="px-6 py-6" style={{ fontFamily: BODY }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>Teams</h1>
          <p className="text-muted-foreground text-xs mt-1" style={{ fontWeight: 300 }}>
            {teammates.length} collaborators · {teammates.filter(m => m.status === "online").length} active
          </p>
        </div>
        {ownedBoards.length > 0 && (
          <button 
            onClick={() => {
              setSelectedBoardId(ownedBoards[0]?.id || "");
              setInviteOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-white hover:opacity-85 transition-opacity cursor-pointer"
            style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: "0.1em" }}
          >
            <UserPlus size={13} />Invite Member
          </button>
        )}
      </div>

      {/* Board workspaces */}
      {boards.length > 0 && (
        <div className="mb-7">
          <SectionLabel>Board Workspaces ({boards.length})</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {boards.map(board => {
              const boardColor = getBoardColor(board.id);
              const initialsList = getBoardMemberInitials(board);
              const cardCount = getBoardCardCount(board.id);
              return (
                <div key={board.id} className="p-4 border border-border hover:border-white/20 transition-all" style={{ background: "#141418" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3" style={{ background: boardColor }} />
                      <span style={{ fontFamily: DISPLAY, fontSize: "0.95rem", fontWeight: 700, color: "#f0f0f2" }}>{board.name}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3" style={{ fontWeight: 300 }}>
                    Managed by {board.created_by.split("@")[0]} ({board.visibility})
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {initialsList.map((initials, idx) => (
                        <Avatar key={idx} initials={initials} size="sm" />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1" style={{ fontFamily: DISPLAY, fontWeight: 500 }}>
                      <Layers size={10} />{cardCount} tasks
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Member search + filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search collaborators…"
            className="w-full pl-8 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 outline-none"
            style={{ fontFamily: BODY, fontWeight: 300, background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#e8002d")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
        </div>
        <div className="flex flex-wrap gap-1">
          {ROLES.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className="px-2.5 py-1 text-[10px] border border-border transition-all cursor-pointer"
              style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em",
                background: roleFilter === r ? "#e8002d" : "transparent", color: roleFilter === r ? "#fff" : "#7a7a8c" }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Members list */}
      <SectionLabel>All Collaborators ({filtered.length})</SectionLabel>
      {filtered.length === 0 ? (
        <div className="p-8 border border-border text-center text-xs text-muted-foreground" style={{ background: "#141418" }}>
          No collaborators found matching the filter.
        </div>
      ) : (
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
                    <p className="text-sm text-foreground truncate max-w-[120px]" style={{ fontWeight: 500 }} title={member.name}>{member.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1" style={{ fontFamily: BODY }}>
                <Mail size={9} />
                <span className="truncate" title={member.email}>{member.email}</span>
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border border-border text-center" style={{ background: "#111115" }}>
                  <p style={{ fontFamily: DISPLAY, fontSize: "1.1rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>{member.boards}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5" style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: "0.1em" }}>BOARDS</p>
                </div>
                <div className="p-2 border border-border text-center" style={{ background: "#111115" }}>
                  <p style={{ fontFamily: DISPLAY, fontSize: "1.1rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>{member.tasksThisWeek}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5" style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: "0.1em" }}>TASKS</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite member modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setInviteOpen(false)}>
          <div className="w-full max-w-md border border-border shadow-2xl p-6" style={{ background: "#1a1a20" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase" style={{ fontFamily: DISPLAY }}>Invite Teammate</h3>
              <button className="text-muted-foreground hover:text-foreground text-sm cursor-pointer" onClick={() => setInviteOpen(false)}><X size={16} /></button>
            </div>

            {inviteError && <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 mb-4">{inviteError}</div>}
            {inviteSuccess && <div className="text-xs text-green-500 bg-green-500/10 border border-green-500/20 p-2.5 mb-4">{inviteSuccess}</div>}

            <form className="space-y-4" onSubmit={handleInviteSubmit}>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Select Board</label>
                <select
                  value={selectedBoardId}
                  onChange={e => setSelectedBoardId(e.target.value)}
                  className="w-full text-xs text-foreground bg-[#141418] border border-border p-2.5 outline-none"
                  style={{ fontFamily: BODY }}
                  required
                >
                  {ownedBoards.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold" style={{ fontFamily: DISPLAY }}>Collaborator Email</label>
                <input
                  type="email"
                  placeholder="collaborator@team.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  disabled={inviteLoading}
                  className="w-full text-xs text-foreground bg-[#141418] border border-border px-3 py-2.5 outline-none"
                  style={{ fontFamily: BODY }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="px-4 py-2 border border-border text-xs text-muted-foreground hover:text-foreground hover:border-white/20 transition-all cursor-pointer"
                  style={{ fontFamily: DISPLAY, fontWeight: 700 }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="bg-primary text-white text-xs font-bold tracking-widest px-4 py-2 hover:opacity-85 disabled:opacity-50 cursor-pointer"
                  style={{ fontFamily: DISPLAY }}
                >
                  {inviteLoading ? "INVITING…" : "INVITE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
