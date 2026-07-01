import { useState } from "react";
import { Check, CheckCheck, Bell, MessageSquare, UserPlus, AlertCircle, Archive, Trash2, ExternalLink } from "lucide-react";
import { DISPLAY, BODY, INBOX_MSGS } from "../data";
import { Avatar, SectionLabel } from "../ui";

const TYPE_ICON: Record<string, React.ElementType> = {
  assigned: UserPlus, commented: MessageSquare, mentioned: Bell, moved: Check, shared: Archive, due: AlertCircle, joined: UserPlus, completed: CheckCheck,
};

function getType(action: string) {
  if (action.startsWith("assigned")) return "assigned";
  if (action.startsWith("commented")) return "commented";
  if (action.startsWith("mentioned")) return "mentioned";
  if (action.startsWith("moved")) return "moved";
  if (action.startsWith("shared")) return "shared";
  if (action.startsWith("due")) return "due";
  if (action.startsWith("joined")) return "joined";
  return "completed";
}

export default function InboxPage() {
  const [msgs, setMsgs] = useState(INBOX_MSGS);
  const [tab, setTab] = useState<"all" | "unread" | "assigned" | "mentions">("all");

  const markRead = (id: string) => setMsgs(ms => ms.map(m => m.id === id ? { ...m, read: true } : m));
  const markAllRead = () => setMsgs(ms => ms.map(m => ({ ...m, read: true })));
  const remove = (id: string) => setMsgs(ms => ms.filter(m => m.id !== id));

  const filtered = msgs.filter(m => {
    if (tab === "unread") return !m.read;
    if (tab === "assigned") return m.action.includes("assigned");
    if (tab === "mentions") return m.action.includes("mentioned");
    return true;
  });

  const unreadCount = msgs.filter(m => !m.read).length;

  return (
    <div className="px-6 py-6 max-w-2xl" style={{ fontFamily: BODY }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.8rem", fontWeight: 900, color: "#f0f0f2", lineHeight: 1 }}>Inbox</h1>
          <p className="text-muted-foreground text-xs mt-1" style={{ fontWeight: 300 }}>
            {unreadCount} unread notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground transition-all"
            style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.08em" }}>
            <CheckCheck size={13} />Mark all read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-5">
        {(["all", "unread", "assigned", "mentions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2.5 text-xs transition-all relative"
            style={{
              fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: tab === t ? "#f0f0f2" : "#7a7a8c",
              borderBottom: tab === t ? "2px solid #e8002d" : "2px solid transparent",
              marginBottom: "-1px",
            }}>
            {t}
            {t === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 text-[9px] bg-primary text-white px-1" style={{ fontFamily: DISPLAY, fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CheckCheck size={32} className="mb-3 opacity-30" />
          <p style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.1em" }}>ALL CLEAR</p>
          <p className="text-xs mt-1" style={{ fontWeight: 300 }}>No notifications here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Unread */}
          {filtered.some(m => !m.read) && (
            <>
              <SectionLabel>Unread</SectionLabel>
              {filtered.filter(m => !m.read).map(msg => {
                const Icon = TYPE_ICON[getType(msg.action)] ?? Bell;
                return (
                  <div key={msg.id}
                    className="flex items-start gap-3 p-4 border border-border hover:border-white/20 transition-all group cursor-pointer"
                    style={{ background: "#141418", borderLeft: "3px solid #e8002d" }}
                    onClick={() => markRead(msg.id)}>
                    <div className="relative flex-shrink-0">
                      <Avatar initials={msg.user} size="md" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-background"
                        style={{ background: "#e8002d" }}>
                        <Icon size={8} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        <span style={{ fontWeight: 500 }}>{msg.user}</span>{" "}
                        <span style={{ fontWeight: 300 }}>{msg.action}</span>{" "}
                        <span style={{ fontWeight: 500, color: "#e8002d" }}>{msg.target}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">{msg.board} · {msg.time}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); markRead(msg.id); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-white/20">
                        <Check size={11} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); remove(msg.id); }}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Read */}
          {filtered.some(m => m.read) && (
            <div className="mt-5">
              <SectionLabel>Earlier</SectionLabel>
              {filtered.filter(m => m.read).map(msg => {
                const Icon = TYPE_ICON[getType(msg.action)] ?? Bell;
                return (
                  <div key={msg.id}
                    className="flex items-start gap-3 p-4 border border-border hover:border-white/15 transition-all group cursor-pointer opacity-60 hover:opacity-80"
                    style={{ background: "#141418" }}>
                    <div className="relative flex-shrink-0">
                      <Avatar initials={msg.user} size="md" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-background"
                        style={{ background: "#3a3a46" }}>
                        <Icon size={8} className="text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        <span style={{ fontWeight: 500 }}>{msg.user}</span>{" "}
                        <span className="text-muted-foreground" style={{ fontWeight: 300 }}>{msg.action}</span>{" "}
                        <span style={{ fontWeight: 400 }}>{msg.target}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">{msg.board} · {msg.time}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); remove(msg.id); }}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors border border-border">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
