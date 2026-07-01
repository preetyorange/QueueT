import { createBrowserRouter, Navigate } from "react-router";
import Shell from "./Shell";
import DashboardPage from "./pages/DashboardPage";
import BoardPage from "./pages/BoardPage";
import TasksPage from "./pages/TasksPage";
import InboxPage from "./pages/InboxPage";
import TimelinePage from "./pages/TimelinePage";
import TeamsPage from "./pages/TeamsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

import React from "react";

export const router = createBrowserRouter([
  {
    path: "/",
    element: React.createElement(Navigate, { to: "/dashboard", replace: true })
  },
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
]);
