import { createMemoryRouter } from "react-router";
import AuthPage from "./pages/AuthPage";
import Shell from "./Shell";
import DashboardPage from "./pages/DashboardPage";
import BoardPage from "./pages/BoardPage";
import TasksPage from "./pages/TasksPage";
import InboxPage from "./pages/InboxPage";
import TimelinePage from "./pages/TimelinePage";
import TeamsPage from "./pages/TeamsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export const router = createMemoryRouter([
  { path: "/", Component: AuthPage },
  {
    Component: Shell,
    children: [
      { path: "/dashboard", Component: DashboardPage },
      { path: "/board/:id", Component: BoardPage },
      { path: "/tasks", Component: TasksPage },
      { path: "/inbox", Component: InboxPage },
      { path: "/timeline", Component: TimelinePage },
      { path: "/teams", Component: TeamsPage },
      { path: "/analytics", Component: AnalyticsPage },
    ],
  },
], { initialEntries: ["/"] });
