import {
  Compass,
  Brain,
  BriefcaseBusiness,
  Gauge,
  Handshake,
  Activity,
  MessagesSquare,
  FolderKanban,
  LayoutDashboard,
  MessageSquarePlus,
  LogOut,
  Map,
  Menu,
  MessageCircle,
  Network,
  Repeat2,
  ListChecks,
  FileText,
  GraduationCap,
  Search,
  Settings,
  Trophy,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, subtitle: "Overview of your network and recommendations" },
  { label: "Career Twin", to: "/career-twin", icon: Brain, subtitle: "AI career readiness and growth intelligence" },
  { label: "Innovation Score", to: "/innovation-score", icon: Gauge, subtitle: "Dynamic reputation and student readiness scoring" },
  { label: "Opportunities", to: "/opportunities", icon: BriefcaseBusiness, subtitle: "AI-matched internships, programs, and applications" },
  { label: "Co-Founder Matcher", to: "/cofounder-matcher", icon: Handshake, subtitle: "Find startup co-founders" },
  { label: "Project Health", to: "/project-health", icon: Activity, subtitle: "AI project manager and risk dashboard" },
  { label: "Community", to: "/community", icon: MessagesSquare, subtitle: "Student feed for updates, questions, and collaboration" },
  { label: "Skill Exchange", to: "/skill-exchange", icon: Repeat2, subtitle: "Trade skills with compatible students" },
  { label: "My Activity", to: "/activity", icon: ListChecks, subtitle: "Requests, applications, and notifications" },
  { label: "Matches", to: "/matches", icon: UsersRound, subtitle: "AI-ranked student compatibility" },
  { label: "Discover", to: "/discover", aliases: ["/profiles"], icon: Search, subtitle: "Browse engineering student profiles" },
  { label: "Projects", to: "/projects", icon: FolderKanban, subtitle: "Project marketplace and teammate requests" },
  { label: "Hackathons", to: "/hackathons", aliases: ["/hackathon-builder"], icon: Trophy, subtitle: "Build and join hackathon teams" },
  { label: "Roadmaps", to: "/roadmaps", aliases: ["/career-roadmap"], icon: Map, subtitle: "AI-generated career roadmaps" },
  { label: "Resume Analyzer", to: "/resume-analyzer", icon: FileText, subtitle: "AI resume ATS and skill gap analysis" },
  { label: "Mentors", to: "/mentors", icon: GraduationCap, subtitle: "Find seniors, alumni, and career mentors" },
  { label: "Messages", to: "/messages", icon: MessageCircle, subtitle: "Chat with accepted connections" },
  { label: "My Profile", to: "/profile", icon: UserRound, subtitle: "Your student profile and links" },
  { label: "Settings", to: "/settings", icon: Settings, subtitle: "Account preferences" }
];

function pageMeta(pathname: string) {
  const item = navItems.find((navItem) => [navItem.to, ...(navItem.aliases ?? [])].some((path) => pathname === path || pathname.startsWith(`${path}/`)));
  if (item) return { title: item.label, subtitle: item.subtitle };
  if (pathname.startsWith("/projects/")) return { title: "Projects", subtitle: "Project details and applications" };
  if (pathname.startsWith("/hackathons/")) return { title: "Hackathons", subtitle: "Team details and applications" };
  if (pathname.startsWith("/roadmaps/")) return { title: "Roadmaps", subtitle: "Career roadmap details" };
  return { title: "EngineerConnect AI", subtitle: "Engineering student collaboration workspace" };
}

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = useMemo(() => pageMeta(location.pathname), [location.pathname]);

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <DesktopSidebar email={user?.email} onLogout={handleLogout} />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close sidebar overlay" className="absolute inset-0 bg-slate-950/60" onClick={() => setMobileOpen(false)} type="button" />
          <div className="relative h-full w-[min(22rem,86vw)]">
            <SidebarContent email={user?.email} onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button className="size-10 bg-slate-100 p-0 text-slate-900 hover:bg-slate-200 lg:hidden" onClick={() => setMobileOpen(true)} title="Open navigation">
                <Menu size={20} />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold sm:text-2xl">{meta.title}</h1>
                <p className="mt-1 hidden text-sm text-muted-foreground sm:block">{meta.subtitle}</p>
              </div>
            </div>
            <div className="hidden max-w-[260px] truncate rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-muted-foreground sm:block">
              {user?.email ?? "Student"}
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

function DesktopSidebar({ email, onLogout }: { email?: string; onLogout: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-emerald-300/10 bg-slate-950 text-white lg:block">
      <SidebarContent email={email} onLogout={onLogout} />
    </aside>
  );
}

function SidebarContent({
  email,
  onClose,
  onLogout,
  onNavigate
}: {
  email?: string;
  onClose?: () => void;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#020617_0%,#052e2b_58%,#064e3b_100%)] px-4 py-5 text-white shadow-2xl shadow-slate-950/35">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Network size={22} />
          </span>
          <div>
            <p className="font-semibold leading-tight">EngineerConnect AI</p>
            <p className="mt-1 text-xs text-emerald-100/70">Student network</p>
          </div>
        </div>
        {onClose && (
          <Button className="size-9 bg-white/10 p-0 text-white hover:bg-white/15" onClick={onClose} title="Close navigation">
            <X size={18} />
          </Button>
        )}
      </div>

      <nav className="mt-8 grid gap-1">
        {navItems.map((item) => (
          <SidebarNavItem activePathname={location.pathname} icon={<item.icon size={18} />} key={item.to} onNavigate={onNavigate} to={item.to} aliases={item.aliases}>
            {item.label}
          </SidebarNavItem>
        ))}
      </nav>

      <Link
        className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-300/18 hover:text-white"
        onClick={onNavigate}
        to="/settings#feedback"
      >
        <MessageSquarePlus size={18} />
        Feedback
      </Link>

      <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-300/15 text-emerald-200">
            <Compass size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{email ?? "Student"}</p>
            <p className="mt-1 text-xs text-emerald-100/65">Signed in</p>
          </div>
        </div>
        <Button className="mt-3 w-full bg-white/10 text-white hover:bg-white/15" onClick={onLogout}>
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
    </div>
  );
}

function SidebarNavItem({
  aliases = [],
  activePathname,
  children,
  icon,
  onNavigate,
  to
}: {
  activePathname: string;
  aliases?: string[];
  children: string;
  icon: ReactNode;
  onNavigate?: () => void;
  to: string;
}) {
  return (
    <NavLink
      className={({ isActive }) => {
        const active = isActive || aliases.some((alias) => activePathname === alias || activePathname.startsWith(`${alias}/`));
        return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          active ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-emerald-50/78 hover:bg-white/10 hover:text-white"
        }`;
      }}
      onClick={onNavigate}
      to={to}
    >
      {icon}
      {children}
    </NavLink>
  );
}
