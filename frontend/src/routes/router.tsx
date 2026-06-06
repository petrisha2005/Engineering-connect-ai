import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { ActivityPage } from "../pages/ActivityPage";
import { CareerTwinPage } from "../pages/CareerTwinPage";
import { CofounderMatcherPage } from "../pages/CofounderMatcherPage";
import { CommunityPage } from "../pages/CommunityPage";
import { DashboardPage } from "../pages/DashboardPage";
import { HackathonTeamDetailPage } from "../pages/HackathonTeamDetailPage";
import { HackathonTeamsPage } from "../pages/HackathonTeamsPage";
import { InnovationScorePage } from "../pages/InnovationScorePage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { MatchesPage } from "../pages/MatchesPage";
import { MessagesPage } from "../pages/MessagesPage";
import { MentorsPage } from "../pages/MentorsPage";
import { NewHackathonTeamPage } from "../pages/NewHackathonTeamPage";
import { NewProjectPage } from "../pages/NewProjectPage";
import { OpportunitiesPage } from "../pages/OpportunitiesPage";
import { PortfolioGeneratorPage } from "../pages/PortfolioGeneratorPage";
import { ProfileDetailPage } from "../pages/ProfileDetailPage";
import { ProfileDirectoryPage } from "../pages/ProfileDirectoryPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectHealthPage } from "../pages/ProjectHealthPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { PublicPortfolioPage } from "../pages/PublicPortfolioPage";
import { ResearchHubPage } from "../pages/ResearchHubPage";
import { ResumeAnalyzerPage } from "../pages/ResumeAnalyzerPage";
import { RoadmapDetailPage } from "../pages/RoadmapDetailPage";
import { RoadmapsPage } from "../pages/RoadmapsPage";
import { RootPage } from "../pages/RootPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SkillExchangePage } from "../pages/SkillExchangePage";
import { StartupIncubatorPage } from "../pages/StartupIncubatorPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";

export const router = createBrowserRouter([
  {
    element: <RootPage />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/portfolio/:username", element: <PublicPortfolioPage /> },
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
              { path: "/career-twin", element: <CareerTwinPage /> },
              { path: "/innovation-score", element: <InnovationScorePage /> },
              { path: "/opportunities", element: <OpportunitiesPage /> },
              { path: "/cofounder-matcher", element: <CofounderMatcherPage /> },
              { path: "/startup-incubator", element: <StartupIncubatorPage /> },
              { path: "/project-health", element: <ProjectHealthPage /> },
              { path: "/community", element: <CommunityPage /> },
              { path: "/skill-exchange", element: <SkillExchangePage /> },
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
              { path: "/portfolio-generator", element: <PortfolioGeneratorPage /> },
              { path: "/research-hub", element: <ResearchHubPage /> },
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
