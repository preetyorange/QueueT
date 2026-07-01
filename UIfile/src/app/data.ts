export const DISPLAY = "'Barlow Condensed', sans-serif";
export const BODY = "'DM Sans', sans-serif";

export const AVATAR_COLORS: Record<string, string> = {
  AN: "#e8002d", LH: "#3b82f6", MV: "#f59e0b", CR: "#8b5cf6",
  SP: "#10b981", LN: "#ec4899", RU: "#06b6d4", JB: "#f97316",
};

export const BOARDS = [
  { id: "1", title: "F1 Season Campaign", color: "#e8002d", visibility: "restricted", starred: true, members: ["AN","LH","MV","CR"], tasks: { done: 18, total: 24 }, daysAgo: 0, tag: "Marketing", activity: "high" },
  { id: "2", title: "Sprint Planning — Q3", color: "#3b82f6", visibility: "team", starred: false, members: ["AN","SP","CL"], tasks: { done: 7, total: 15 }, daysAgo: 1, tag: "Engineering", activity: "medium" },
  { id: "3", title: "Design System v2", color: "#8b5cf6", visibility: "private", starred: true, members: ["AN","LN"], tasks: { done: 31, total: 31 }, daysAgo: 3, tag: "Design", activity: "low" },
  { id: "4", title: "Pit Stop — Infra Upgrades", color: "#f59e0b", visibility: "restricted", starred: false, members: ["MV","SP","RU","AN"], tasks: { done: 4, total: 20 }, daysAgo: 0, tag: "Infrastructure", activity: "high" },
  { id: "5", title: "Onboarding Redesign", color: "#10b981", visibility: "team", starred: false, members: ["AN","CR","LN"], tasks: { done: 9, total: 12 }, daysAgo: 2, tag: "Product", activity: "medium" },
  { id: "6", title: "Race Analytics Dashboard", color: "#ec4899", visibility: "private", starred: false, members: ["AN"], tasks: { done: 2, total: 8 }, daysAgo: 5, tag: "Analytics", activity: "low" },
];

export type Priority = "critical" | "high" | "medium" | "low";
export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: "#e8002d", high: "#f97316", medium: "#f59e0b", low: "#10b981",
};

export interface KanbanCard {
  id: string; title: string; desc?: string;
  priority: Priority; date: string;
  assignees: string[]; tags: string[];
}

export const KANBAN_COLUMNS: { id: string; label: string; color: string; cards: KanbanCard[] }[] = [
  {
    id: "todo", label: "To Do", color: "#7a7a8c",
    cards: [
      { id: "c1", title: "Design system tokens audit", desc: "Review all colour and spacing tokens across components", priority: "high", date: "Jul 8", assignees: ["AN"], tags: ["Design"] },
      { id: "c2", title: "Write API documentation", desc: "Cover all REST endpoints with examples", priority: "medium", date: "Jul 12", assignees: ["SP"], tags: ["Docs"] },
      { id: "c3", title: "Set up CI/CD pipeline", priority: "critical", date: "Jul 10", assignees: ["MV","SP"], tags: ["DevOps"] },
      { id: "c4", title: "Mobile responsive fixes", priority: "low", date: "Jul 15", assignees: ["CR"], tags: ["Frontend"] },
    ],
  },
  {
    id: "inprogress", label: "In Progress", color: "#3b82f6",
    cards: [
      { id: "c5", title: "Backend auth integration", desc: "Connect OAuth2 with existing user service", priority: "critical", date: "Jul 5", assignees: ["AN","LH"], tags: ["Backend"] },
      { id: "c6", title: "Sprint planning doc", priority: "medium", date: "Jul 7", assignees: ["SP"], tags: ["Planning"] },
      { id: "c7", title: "Dashboard analytics charts", priority: "high", date: "Jul 9", assignees: ["LN"], tags: ["Frontend"] },
    ],
  },
  {
    id: "review", label: "In Review", color: "#f59e0b",
    cards: [
      { id: "c8", title: "User research report", desc: "Synthesis of 12 user interviews from June", priority: "medium", date: "Jun 30", assignees: ["CR","AN"], tags: ["Research"] },
      { id: "c9", title: "Figma component library", priority: "high", date: "Jul 2", assignees: ["LN"], tags: ["Design"] },
    ],
  },
  {
    id: "done", label: "Done", color: "#10b981",
    cards: [
      { id: "c10", title: "Database schema v2", priority: "medium", date: "Jun 28", assignees: ["MV"], tags: ["Backend"] },
      { id: "c11", title: "Figma handoff complete", priority: "low", date: "Jun 25", assignees: ["LN"], tags: ["Design"] },
      { id: "c12", title: "User research interviews", priority: "high", date: "Jun 20", assignees: ["CR","AN"], tags: ["Research"] },
    ],
  },
];

export const MY_TASKS = [
  { id: "t1", title: "Review PR #142 — auth middleware", priority: "critical" as Priority, board: "Sprint Q3", due: "Today", done: false, assignees: ["AN","LH"] },
  { id: "t2", title: "Update Figma design tokens", priority: "high" as Priority, board: "Design System v2", due: "Today", done: false, assignees: ["AN"] },
  { id: "t3", title: "Write release notes for v2.4", priority: "medium" as Priority, board: "F1 Campaign", due: "Today", done: true, assignees: ["AN"] },
  { id: "t4", title: "Schedule team retrospective", priority: "medium" as Priority, board: "Sprint Q3", due: "Tomorrow", done: false, assignees: ["AN","SP"] },
  { id: "t5", title: "Audit accessibility on login page", priority: "high" as Priority, board: "Onboarding Redesign", due: "Jul 5", done: false, assignees: ["AN"] },
  { id: "t6", title: "Deploy staging environment", priority: "critical" as Priority, board: "Pit Stop — Infra", due: "Jul 6", done: false, assignees: ["AN","MV"] },
  { id: "t7", title: "Draft Q3 OKRs", priority: "medium" as Priority, board: "Sprint Q3", due: "Jul 8", done: false, assignees: ["AN"] },
  { id: "t8", title: "Finalise onboarding copy", priority: "low" as Priority, board: "Onboarding Redesign", due: "Jul 10", done: false, assignees: ["AN","CR"] },
];

export const INBOX_MSGS = [
  { id: "m1", user: "LH", color: "#3b82f6", action: "assigned you to", target: "Backend auth integration", board: "Sprint Q3", time: "2m ago", read: false },
  { id: "m2", user: "MV", color: "#f59e0b", action: "commented on", target: "Set up CI/CD pipeline", board: "Pit Stop", time: "14m ago", read: false },
  { id: "m3", user: "SP", color: "#10b981", action: "mentioned you in", target: "Sprint planning doc", board: "Sprint Q3", time: "1h ago", read: false },
  { id: "m4", user: "CR", color: "#8b5cf6", action: "moved your card to Done:", target: "User research report", board: "F1 Campaign", time: "2h ago", read: true },
  { id: "m5", user: "LN", color: "#ec4899", action: "shared a file on", target: "Design System v2", board: "Design System", time: "3h ago", read: true },
  { id: "m6", user: "AN", color: "#e8002d", action: "due date approaching:", target: "Backend auth integration", board: "Sprint Q3", time: "5h ago", read: true },
  { id: "m7", user: "RU", color: "#06b6d4", action: "joined board", target: "Pit Stop — Infra Upgrades", board: "Pit Stop", time: "Yesterday", read: true },
  { id: "m8", user: "JB", color: "#f97316", action: "completed", target: "Mobile responsive fixes", board: "Onboarding Redesign", time: "Yesterday", read: true },
];

export const TIMELINE_ITEMS = [
  { id: "tl1", title: "Backend auth integration", assignees: ["AN","LH"], color: "#e8002d", start: 1, span: 6, row: 0, priority: "critical" as Priority },
  { id: "tl2", title: "Design system tokens", assignees: ["AN"], color: "#8b5cf6", start: 3, span: 5, row: 1, priority: "high" as Priority },
  { id: "tl3", title: "Set up CI/CD pipeline", assignees: ["MV","SP"], color: "#f59e0b", start: 2, span: 8, row: 2, priority: "critical" as Priority },
  { id: "tl4", title: "Sprint planning doc", assignees: ["SP"], color: "#3b82f6", start: 1, span: 4, row: 3, priority: "medium" as Priority },
  { id: "tl5", title: "Dashboard analytics charts", assignees: ["LN"], color: "#ec4899", start: 5, span: 7, row: 4, priority: "high" as Priority },
  { id: "tl6", title: "API documentation", assignees: ["SP"], color: "#10b981", start: 7, span: 5, row: 5, priority: "medium" as Priority },
  { id: "tl7", title: "Mobile responsive fixes", assignees: ["CR"], color: "#06b6d4", start: 9, span: 6, row: 6, priority: "low" as Priority },
];

export const TEAM_MEMBERS = [
  { id: "u1", initials: "AN", name: "Ananya Sharma", role: "Product Lead", email: "ananya@gmail.com", boards: 6, tasksThisWeek: 12, color: "#e8002d", status: "online" },
  { id: "u2", initials: "LH", name: "Lewis Hart", role: "Backend Engineer", email: "lewis@queuet.io", boards: 3, tasksThisWeek: 8, color: "#3b82f6", status: "online" },
  { id: "u3", initials: "MV", name: "Max Verdun", role: "DevOps Engineer", email: "max@queuet.io", boards: 4, tasksThisWeek: 6, color: "#f59e0b", status: "away" },
  { id: "u4", initials: "CR", name: "Carlos Reyes", role: "UX Researcher", email: "carlos@queuet.io", boards: 3, tasksThisWeek: 9, color: "#8b5cf6", status: "online" },
  { id: "u5", initials: "SP", name: "Sergio Patel", role: "Frontend Engineer", email: "sergio@queuet.io", boards: 4, tasksThisWeek: 11, color: "#10b981", status: "offline" },
  { id: "u6", initials: "LN", name: "Lena Novak", role: "UI Designer", email: "lena@queuet.io", boards: 3, tasksThisWeek: 7, color: "#ec4899", status: "online" },
  { id: "u7", initials: "RU", name: "Russell Ueda", role: "Data Engineer", email: "russell@queuet.io", boards: 2, tasksThisWeek: 5, color: "#06b6d4", status: "away" },
  { id: "u8", initials: "JB", name: "Jules Bianchi", role: "QA Engineer", email: "jules@queuet.io", boards: 2, tasksThisWeek: 4, color: "#f97316", status: "offline" },
];

export const ANALYTICS_VELOCITY = [
  { week: "W22", done: 12, added: 8 }, { week: "W23", done: 18, added: 14 },
  { week: "W24", done: 9, added: 11 }, { week: "W25", done: 22, added: 16 },
  { week: "W26", done: 15, added: 10 }, { week: "W27", done: 27, added: 19 },
];
export const ANALYTICS_PRIORITY = [
  { name: "Critical", value: 8, color: "#e8002d" },
  { name: "High", value: 21, color: "#f97316" },
  { name: "Medium", value: 34, color: "#f59e0b" },
  { name: "Low", value: 16, color: "#10b981" },
];
export const ANALYTICS_BOARDS = [
  { board: "F1 Campaign", pct: 75 }, { board: "Sprint Q3", pct: 47 },
  { board: "Design Sys", pct: 100 }, { board: "Pit Stop", pct: 20 },
  { board: "Onboarding", pct: 75 }, { board: "Analytics", pct: 25 },
];
