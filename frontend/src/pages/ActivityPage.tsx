import {
  Bell,
  Check,
  Clock3,
  FolderKanban,
  GraduationCap,
  Inbox,
  MessageCircle,
  Send,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApplicationStatusChart } from "../components/charts/ApplicationStatusChart";
import { ChartCard } from "../components/charts/ChartCard";
import { Button } from "../components/ui/Button";
import { getActivityAnalytics } from "../services/analyticsApi";
import { acceptApplication, listMyApplications, listReceivedApplications, rejectApplication } from "../services/applicationApi";
import { acceptConnection, listReceivedConnections, listSentConnections, rejectConnection } from "../services/connectionApi";
import { createOrGetConversation } from "../services/messageApi";
import { acceptMentorRequest, listReceivedMentorRequests, listSentMentorRequests, rejectMentorRequest } from "../services/mentorApi";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationApi";
import type { NotificationItem } from "../types/activity";
import type { ActivityAnalytics } from "../types/analytics";
import type { AppUser } from "../types/auth";
import type { Connection } from "../types/connection";
import type { MentorRequest } from "../types/mentor";
import type { StudentProfile } from "../types/profile";
import type { Project, ProjectApplication } from "../types/project";

type ActivityTab = "connections" | "mentorship" | "applications" | "invites" | "notifications";
type LoadStatus = "idle" | "loading" | "ready" | "error";

const tabs: Array<{ id: ActivityTab; label: string; icon: typeof Inbox }> = [
  { id: "connections", label: "Connection Requests", icon: UserRound },
  { id: "mentorship", label: "Mentorship", icon: GraduationCap },
  { id: "applications", label: "Project Applications", icon: FolderKanban },
  { id: "invites", label: "Sent Invites", icon: Send },
  { id: "notifications", label: "Notifications", icon: Bell }
];

function isAppUser(value: string | AppUser): value is AppUser {
  return typeof value !== "string";
}

function userProfile(user: string | AppUser) {
  if (!isAppUser(user)) return null;
  return typeof user.profile === "object" && user.profile ? (user.profile as StudentProfile) : null;
}

function displayUser(user: string | AppUser) {
  if (!isAppUser(user)) return { name: "Student", email: "", profile: null, id: user };
  const profile = userProfile(user);
  return { name: profile?.name || user.displayName || "Student", email: user.email, profile, id: user._id };
}

function projectFromApplication(application: ProjectApplication) {
  return typeof application.project === "string" ? null : application.project;
}

function statusTone(status: string) {
  if (status === "accepted") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected" || status === "withdrawn") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function ActivityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActivityTab>("connections");
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sentConnections, setSentConnections] = useState<Connection[]>([]);
  const [receivedConnections, setReceivedConnections] = useState<Connection[]>([]);
  const [sentMentorRequests, setSentMentorRequests] = useState<MentorRequest[]>([]);
  const [receivedMentorRequests, setReceivedMentorRequests] = useState<MentorRequest[]>([]);
  const [myApplications, setMyApplications] = useState<ProjectApplication[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<ProjectApplication[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [analytics, setAnalytics] = useState<ActivityAnalytics | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadActivity() {
    setStatus("loading");
    setError(null);
    try {
      const [sentResponse, receivedResponse, sentMentorsResponse, receivedMentorsResponse, myAppsResponse, receivedAppsResponse, notificationResponse, analyticsResponse] = await Promise.all([
        listSentConnections(),
        listReceivedConnections(),
        listSentMentorRequests(),
        listReceivedMentorRequests(),
        listMyApplications(),
        listReceivedApplications(),
        listNotifications(),
        getActivityAnalytics()
      ]);
      setSentConnections(sentResponse.connections ?? []);
      setReceivedConnections(receivedResponse.connections ?? []);
      setSentMentorRequests(sentMentorsResponse.requests ?? []);
      setReceivedMentorRequests(receivedMentorsResponse.requests ?? []);
      setMyApplications(myAppsResponse.applications ?? []);
      setReceivedApplications(receivedAppsResponse.applications ?? []);
      setNotifications(notificationResponse.notifications ?? []);
      setAnalytics(analyticsResponse);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load activity");
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadActivity();
  }, []);

  const pendingReceivedConnections = useMemo(() => receivedConnections.filter((connection) => connection.status === "pending"), [receivedConnections]);
  const pendingReceivedMentorRequests = useMemo(() => receivedMentorRequests.filter((request) => request.status === "pending"), [receivedMentorRequests]);
  const pendingReceivedApplications = useMemo(() => receivedApplications.filter((application) => application.status === "pending"), [receivedApplications]);
  const unreadNotifications = useMemo(() => notifications.filter((notification) => !notification.readAt).length, [notifications]);

  async function decideConnection(connectionId: string, decision: "accept" | "reject") {
    setBusyId(connectionId);
    try {
      if (decision === "accept") {
        await acceptConnection(connectionId);
      } else {
        await rejectConnection(connectionId);
      }
      await loadActivity();
    } finally {
      setBusyId(null);
    }
  }

  async function decideProjectApplication(applicationId: string, decision: "accept" | "reject") {
    setBusyId(applicationId);
    try {
      if (decision === "accept") {
        await acceptApplication(applicationId);
      } else {
        await rejectApplication(applicationId);
      }
      await loadActivity();
    } finally {
      setBusyId(null);
    }
  }

  async function decideMentorRequest(requestId: string, decision: "accept" | "reject") {
    setBusyId(requestId);
    try {
      if (decision === "accept") {
        await acceptMentorRequest(requestId);
      } else {
        await rejectMentorRequest(requestId);
      }
      await loadActivity();
    } finally {
      setBusyId(null);
    }
  }

  async function openConversation(userId: string) {
    setBusyId(userId);
    try {
      const response = await createOrGetConversation(userId);
      navigate(`/messages?conversation=${response.conversation._id}`);
    } finally {
      setBusyId(null);
    }
  }

  async function markRead(notificationId: string) {
    setBusyId(notificationId);
    try {
      await markNotificationRead(notificationId);
      await loadActivity();
    } finally {
      setBusyId(null);
    }
  }

  async function markReadAll() {
    setBusyId("read-all");
    try {
      await markAllNotificationsRead();
      await loadActivity();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
              <Inbox size={16} />
              Request tracking
            </p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">My Activity</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Track every real request, application, invite, and notification tied to your MongoDB account.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
            <ActivityMetric label="Pending requests" value={pendingReceivedConnections.length + pendingReceivedMentorRequests.length} />
            <ActivityMetric label="Applications" value={myApplications.length + receivedApplications.length} />
            <ActivityMetric label="Unread" value={unreadNotifications} />
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border pb-2">
          {tabs.map((tab) => (
            <button
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {status === "loading" && <StateCard title="Loading activity..." text="Fetching your requests, applications, and notifications." />}
      {status === "error" && <StateCard tone="error" title="Unable to load activity" text={error ?? "Please try again after the backend is running."} />}

      {status === "ready" && (
        <section className="mt-4">
          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Request Status" description="Sent connection requests by status.">
              <ApplicationStatusChart counts={analytics?.connectionRequestStatus ?? { pending: 0, accepted: 0, rejected: 0 }} />
            </ChartCard>
            <ChartCard title="Project Application Status" description="Project applications you submitted.">
              <ApplicationStatusChart counts={analytics?.projectApplicationStatus ?? { pending: 0, accepted: 0, rejected: 0 }} />
            </ChartCard>
          </div>

          {activeTab === "connections" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <ActivityPanel title="Received Requests" description="Students who want to connect with you.">
                {receivedConnections.length ? (
                  <div className="grid gap-3">
                    {receivedConnections.map((connection) => (
                      <ConnectionCard
                        connection={connection}
                        key={connection._id}
                        mode="received"
                        onAccept={() => decideConnection(connection._id, "accept")}
                        onMessage={() => openConversation(displayUser(connection.requesterId).id)}
                        onReject={() => decideConnection(connection._id, "reject")}
                        busy={busyId === connection._id || busyId === displayUser(connection.requesterId).id}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No received requests" text="Connection requests from other students will appear here." />
                )}
              </ActivityPanel>

              <ActivityPanel title="Sent Requests" description="Requests you have sent to other students.">
                {sentConnections.length ? (
                  <div className="grid gap-3">
                    {sentConnections.map((connection) => (
                      <ConnectionCard
                        connection={connection}
                        key={connection._id}
                        mode="sent"
                        onMessage={() => openConversation(displayUser(connection.recipientId).id)}
                        busy={busyId === displayUser(connection.recipientId).id}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No sent requests" text="Browse Discover or Matches to send your first connection request." action="Discover students" to="/discover" />
                )}
              </ActivityPanel>
            </div>
          )}

          {activeTab === "mentorship" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <ActivityPanel title="Received Mentor Requests" description="Students asking for your guidance.">
                {receivedMentorRequests.length ? (
                  <div className="grid gap-3">
                    {receivedMentorRequests.map((request) => (
                      <MentorRequestCard
                        busy={busyId === request._id || busyId === displayUser(request.student).id}
                        key={request._id}
                        mode="received"
                        onAccept={() => decideMentorRequest(request._id, "accept")}
                        onMessage={() => openConversation(displayUser(request.student).id)}
                        onReject={() => decideMentorRequest(request._id, "reject")}
                        request={request}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No mentor requests received" text="Requests from students who need guidance will appear here." action="Create mentor profile" to="/mentors" />
                )}
              </ActivityPanel>

              <ActivityPanel title="Sent Mentor Requests" description="Mentorship requests you sent.">
                {sentMentorRequests.length ? (
                  <div className="grid gap-3">
                    {sentMentorRequests.map((request) => (
                      <MentorRequestCard
                        busy={busyId === displayUser(request.mentor).id}
                        key={request._id}
                        mode="sent"
                        onMessage={() => openConversation(displayUser(request.mentor).id)}
                        request={request}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No mentor requests sent" text="Find mentors who match your goals and send your first mentorship request." action="Find mentors" to="/mentors" />
                )}
              </ActivityPanel>
            </div>
          )}

          {activeTab === "applications" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <ActivityPanel title="My Applications" description="Project applications you sent.">
                {myApplications.length ? (
                  <div className="grid gap-3">
                    {myApplications.map((application) => (
                      <ApplicationCard application={application} key={application._id} mode="sent" />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No applications sent" text="Apply to open projects from the marketplace." action="Browse projects" to="/projects" />
                )}
              </ActivityPanel>

              <ActivityPanel title="Applications Received" description="Students applying to your projects.">
                {receivedApplications.length ? (
                  <div className="grid gap-3">
                    {receivedApplications.map((application) => (
                      <ApplicationCard
                        application={application}
                        key={application._id}
                        mode="received"
                        onAccept={() => decideProjectApplication(application._id, "accept")}
                        onReject={() => decideProjectApplication(application._id, "reject")}
                        busy={busyId === application._id}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No applications received" text="Applications to projects you own will appear here." />
                )}
              </ActivityPanel>
            </div>
          )}

          {activeTab === "invites" && (
            <ActivityPanel title="Sent Invites" description="Project and team invites sent by you.">
              <EmptyState title="No sent invites yet" text="Invite tracking will appear here after you invite students from projects or teams." />
            </ActivityPanel>
          )}

          {activeTab === "notifications" && (
            <ActivityPanel
              title="Notifications"
              description="Recent account activity and request updates."
              action={
                notifications.length ? (
                  <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busyId === "read-all"} onClick={markReadAll}>
                    <Check size={16} />
                    Mark all read
                  </Button>
                ) : null
              }
            >
              {notifications.length ? (
                <div className="grid gap-3">
                  {notifications.map((notification) => (
                    <NotificationCard
                      busy={busyId === notification._id}
                      key={notification._id}
                      notification={notification}
                      onRead={() => markRead(notification._id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No notifications" text="Important updates about requests, applications, and messages will appear here." />
              )}
            </ActivityPanel>
          )}
        </section>
      )}
    </main>
  );
}

function ActivityMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/35 px-3 py-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function ActivityPanel({
  action,
  children,
  description,
  title
}: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ConnectionCard({
  busy,
  connection,
  mode,
  onAccept,
  onMessage,
  onReject
}: {
  busy?: boolean;
  connection: Connection;
  mode: "received" | "sent";
  onAccept?: () => void;
  onMessage?: () => void;
  onReject?: () => void;
}) {
  const other = displayUser(mode === "received" ? connection.requesterId : connection.recipientId);

  return (
    <article className="rounded-lg border border-border p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{other.name}</p>
            <StatusBadge status={connection.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{other.profile ? `${other.profile.branch} · Year ${other.profile.year}` : other.email || "Student profile"}</p>
          <p className="mt-2 text-xs text-muted-foreground">Requested {new Date(connection.createdAt).toLocaleDateString()}</p>
          {other.profile?.skills?.length ? <TagRow values={other.profile.skills.slice(0, 4)} /> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {other.profile?._id && (
            <Link className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" to={`/profiles/${other.profile._id}`}>
              View profile
            </Link>
          )}
          {connection.status === "accepted" && onMessage && (
            <Button className="bg-primary text-primary-foreground" disabled={busy} onClick={onMessage}>
              <MessageCircle size={16} />
              Message
            </Button>
          )}
          {mode === "received" && connection.status === "pending" && (
            <>
              <Button disabled={busy} onClick={onAccept}>
                <Check size={16} />
                Accept
              </Button>
              <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busy} onClick={onReject}>
                <X size={16} />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function MentorRequestCard({
  busy,
  mode,
  onAccept,
  onMessage,
  onReject,
  request
}: {
  busy?: boolean;
  mode: "received" | "sent";
  onAccept?: () => void;
  onMessage?: () => void;
  onReject?: () => void;
  request: MentorRequest;
}) {
  const other = displayUser(mode === "received" ? request.student : request.mentor);
  const mentorProfile = typeof request.mentorProfile === "string" ? null : request.mentorProfile;

  return (
    <article className="rounded-lg border border-border p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{other.name}</p>
            <StatusBadge status={request.status} />
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              {request.compatibilityScore}% match
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "received" ? other.email || "Student requesting mentorship" : mentorProfile ? mentorProfile.currentRole : other.email || "Mentor"}
          </p>
          {request.message && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{request.message}</p>}
          {request.matchingReasons?.length ? <TagRow values={request.matchingReasons.slice(0, 3)} /> : null}
          <p className="mt-2 text-xs text-muted-foreground">Requested {new Date(request.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {request.status === "accepted" && onMessage && (
            <Button className="bg-primary text-primary-foreground" disabled={busy} onClick={onMessage}>
              <MessageCircle size={16} />
              Message
            </Button>
          )}
          {mode === "received" && request.status === "pending" && (
            <>
              <Button disabled={busy} onClick={onAccept}>
                <Check size={16} />
                Accept
              </Button>
              <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busy} onClick={onReject}>
                <X size={16} />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function ApplicationCard({
  application,
  busy,
  mode,
  onAccept,
  onReject
}: {
  application: ProjectApplication;
  busy?: boolean;
  mode: "received" | "sent";
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const project = projectFromApplication(application);
  const applicant = displayUser(application.applicant);

  return (
    <article className="rounded-lg border border-border p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{project?.title ?? "Project application"}</p>
            <StatusBadge status={application.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "received" ? `Applicant: ${applicant.name}` : project ? `Owner: ${displayProjectOwner(project)}` : "Application status"}
          </p>
          {application.rolePreference && <p className="mt-2 text-sm text-muted-foreground">Role preference: {application.rolePreference}</p>}
          {application.message && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{application.message}</p>}
          <p className="mt-2 text-xs text-muted-foreground">Submitted {new Date(application.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project?._id && (
            <Link className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" to={`/projects/${project._id}`}>
              View project
            </Link>
          )}
          {mode === "received" && application.status === "pending" && (
            <>
              <Button disabled={busy} onClick={onAccept}>
                <Check size={16} />
                Accept
              </Button>
              <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busy} onClick={onReject}>
                <X size={16} />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function NotificationCard({ busy, notification, onRead }: { busy: boolean; notification: NotificationItem; onRead: () => void }) {
  const isUnread = !notification.readAt;

  return (
    <article className={`rounded-lg border p-4 ${isUnread ? "border-primary/30 bg-primary/5" : "border-border"}`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{notification.title}</p>
            {isUnread && <span className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">New</span>}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.body}</p>
          <p className="mt-2 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {notification.link && (
            <Link className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" to={notification.link}>
              Open
            </Link>
          )}
          {isUnread && (
            <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busy} onClick={onRead}>
              <Check size={16} />
              Mark read
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function displayProjectOwner(project: Project) {
  return typeof project.owner === "string" ? "Project owner" : project.owner.displayName;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-md border px-2 py-1 text-xs font-semibold capitalize ${statusTone(status)}`}>{status.replace("_", " ")}</span>;
}

function TagRow({ values }: { values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {values.map((value) => (
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground" key={value}>
          {value}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ action, text, title, to }: { action?: string; text: string; title: string; to?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/35 p-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      {action && to && (
        <Link className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary" to={to}>
          {action}
        </Link>
      )}
    </div>
  );
}

function StateCard({ text, title, tone = "default" }: { text: string; title: string; tone?: "default" | "error" }) {
  return (
    <section className={`mt-4 rounded-lg border p-5 ${tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2">
        <Clock3 size={18} />
        <p className="font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 opacity-80">{text}</p>
    </section>
  );
}
