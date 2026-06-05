import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { ActivityPage } from "../pages/ActivityPage";
import { DashboardPage } from "../pages/DashboardPage";
import { HackathonTeamDetailPage } from "../pages/HackathonTeamDetailPage";
import { HackathonTeamsPage } from "../pages/HackathonTeamsPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { MatchesPage } from "../pages/MatchesPage";
import { MessagesPage } from "../pages/MessagesPage";
import { MentorsPage } from "../pages/MentorsPage";
import { NewHackathonTeamPage } from "../pages/NewHackathonTeamPage";
import { NewProjectPage } from "../pages/NewProjectPage";
import { ProfileDetailPage } from "../pages/ProfileDetailPage";
import { ProfileDirectoryPage } from "../pages/ProfileDirectoryPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ResumeAnalyzerPage } from "../pages/ResumeAnalyzerPage";
import { RoadmapDetailPage } from "../pages/RoadmapDetailPage";
import { RoadmapsPage } from "../pages/RoadmapsPage";
import { RootPage } from "../pages/RootPage";
import { SettingsPage } from "../pages/SettingsPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";

export const router = createBrowserRouter([
  {
    element: <RootPage />,
    children: [
      { path: "/", element: <LandingPage /> },
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [{ path: "/login", element: <LoginPage /> }]
          }
        ]
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/dashboard", element: <DashboardPage /> },
              { path: "/activity", element: <ActivityPage /> },
              { path: "/matches", element: <MatchesPage /> },
              { path: "/messages", element: <MessagesPage /> },
              { path: "/profile", element: <ProfilePage /> },
              { path: "/discover", element: <ProfileDirectoryPage /> },
              { path: "/profiles", element: <ProfileDirectoryPage /> },
              { path: "/profiles/:id", element: <ProfileDetailPage /> },
              { path: "/projects", element: <ProjectsPage /> },
              { path: "/projects/new", element: <NewProjectPage /> },
              { path: "/projects/:id", element: <ProjectDetailPage /> },
              { path: "/hackathons", element: <HackathonTeamsPage /> },
              { path: "/hackathon-builder", element: <HackathonTeamsPage /> },
              { path: "/hackathons/new", element: <NewHackathonTeamPage /> },
              { path: "/hackathons/:id", element: <HackathonTeamDetailPage /> },
              { path: "/roadmaps", element: <RoadmapsPage /> },
              { path: "/career-roadmap", element: <RoadmapsPage /> },
              { path: "/roadmaps/:id", element: <RoadmapDetailPage /> },
              { path: "/resume-analyzer", element: <ResumeAnalyzerPage /> },
              { path: "/mentors", element: <MentorsPage /> },
              { path: "/settings", element: <SettingsPage /> }
            ]
          }
        ]
      },
      { path: "*", element: <Navigate to="/" replace /> }
    ]
  }
]);
