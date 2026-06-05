import { Flag, Shield, Send } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ApiError } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { acceptConnection, listConnectionRequests, rejectConnection } from "../services/connectionApi";
import { blockUser, listConversations, listMessages, reportUser, sendMessage } from "../services/messageApi";
import type { Connection } from "../types/connection";
import type { Conversation, DirectMessage } from "../types/message";

function otherParticipant(conversation: Conversation, currentUserId?: string) {
  return conversation.participants.find((participant) => participant._id !== currentUserId) ?? conversation.participants[0];
}

export function MessagesPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<Connection[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Connection[]>([]);
  const [moderationWarning, setModerationWarning] = useState<{
    reason: string;
    category?: string;
    suggestedRewrite?: string;
    mode?: "soft" | "blocked";
  } | null>(null);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const activeId = searchParams.get("conversation");

  async function loadConversationList() {
    setStatus("loading");
    setError(null);
    try {
      const response = await listConversations();
      setConversations(response.conversations);
      const selected = response.conversations.find((conversation) => conversation._id === activeId) ?? response.conversations[0] ?? null;
      setActiveConversation(selected);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conversations");
      setStatus("error");
    }
  }

  async function loadRequests() {
    const response = await listConnectionRequests();
    setIncomingRequests(response.incoming ?? []);
    setOutgoingRequests(response.outgoing ?? []);
  }

  useEffect(() => {
    void loadConversationList();
    void loadRequests();
  }, []);

  useEffect(() => {
    async function loadActiveMessages() {
      if (!activeConversation) {
        setMessages([]);
        return;
      }

      const response = await listMessages(activeConversation._id);
      setMessages(response.messages);
    }

    void loadActiveMessages();
  }, [activeConversation?._id]);

  useEffect(() => {
    if (activeId && conversations.length) {
      const selected = conversations.find((conversation) => conversation._id === activeId);
      if (selected) setActiveConversation(selected);
    }
  }, [activeId, conversations]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!activeConversation || !messageText.trim()) return;

    setModerationWarning(null);
    setBlockedNotice(null);
    try {
      const response = await sendMessage(activeConversation._id, messageText.trim());
      setMessages((current) => [...current, response.message]);
      setMessageText("");
      if (response.moderation?.action === "warned") {
        setModerationWarning({
          reason: "Please keep messages professional.",
          category: response.moderation.category,
          suggestedRewrite: response.moderation.suggestedRewrite,
          mode: "soft"
        });
      }
      await loadConversationList();
    } catch (err) {
      if (err instanceof ApiError && typeof err.payload === "object" && err.payload && "blocked" in err.payload) {
        const payload = err.payload as { reason?: string; category?: string; suggestedRewrite?: string };
        setModerationWarning({
          reason: payload.reason ?? "This message may violate platform guidelines. Please rewrite it.",
          category: payload.category,
          suggestedRewrite: payload.suggestedRewrite,
          mode: "blocked"
        });
        return;
      }
      const message = err instanceof Error ? err.message : "Unable to send message";
      setBlockedNotice(message);
    }
  }

  async function decideRequest(connectionId: string, decision: "accept" | "reject") {
    if (decision === "accept") {
      await acceptConnection(connectionId);
    } else {
      await rejectConnection(connectionId);
    }
    await Promise.all([loadRequests(), loadConversationList()]);
  }

  const activeRecipient = useMemo(() => (activeConversation ? otherParticipant(activeConversation, currentUser?._id) : null), [activeConversation, currentUser?._id]);
  const activeRecipientId = activeRecipient?._id;

  async function handleReport(reason: string) {
    if (!activeRecipientId) return;
    await reportUser(activeRecipientId, { reason, description: "Reported from conversation header." });
    setReportStatus("Report submitted for review.");
  }

  async function handleBlock() {
    if (!activeRecipientId) return;
    await blockUser(activeRecipientId);
    setBlockedNotice("You cannot message this user.");
    setReportStatus("User blocked.");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {status === "error" && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {status === "loading" && <p className="text-sm text-muted-foreground">Loading messages...</p>}

      <ConnectionRequestsPanel incoming={incomingRequests} outgoing={outgoingRequests} onDecision={decideRequest} />

      {status === "ready" && conversations.length === 0 ? (
        <section className="rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">No messages yet.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Connect with students to start chatting.</p>
        </section>
      ) : (
        <section className="grid min-h-[620px] overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[320px_1fr]">
          <aside className="border-b border-border lg:border-b-0 lg:border-r">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold">Conversations</h2>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {conversations.map((conversation) => {
                const other = otherParticipant(conversation, currentUser?._id);
                const active = conversation._id === activeConversation?._id;
                return (
                  <button
                    className={`block w-full border-b border-border p-4 text-left transition ${active ? "bg-primary/10" : "hover:bg-muted/50"}`}
                    key={conversation._id}
                    onClick={() => {
                      setActiveConversation(conversation);
                      setSearchParams({ conversation: conversation._id });
                    }}
                    type="button"
                  >
                    <p className="font-semibold">{other?.displayName ?? other?.email ?? "Student"}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{conversation.lastMessage || "No messages yet"}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex min-h-[620px] flex-col">
            <div className="border-b border-border p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-semibold">{activeRecipient?.displayName ?? activeRecipient?.email ?? "Select a conversation"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Messages are available after a connection is accepted.</p>
                </div>
                {activeRecipientId && (
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="h-9 rounded-md border border-border bg-background px-2 text-xs font-medium"
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) void handleReport(event.target.value);
                        event.currentTarget.value = "";
                      }}
                    >
                      <option value="" disabled>Report User</option>
                      <option value="spam">Spam</option>
                      <option value="harassment">Harassment</option>
                      <option value="abusive_language">Abusive language</option>
                      <option value="fake_profile">Fake profile</option>
                      <option value="promotional">Promotional message</option>
                      <option value="other">Other</option>
                    </select>
                    <Button className="h-9 bg-muted px-3 text-foreground" onClick={handleBlock}>
                      <Shield size={15} />
                      Block User
                    </Button>
                  </div>
                )}
              </div>
              {reportStatus && <p className="mt-2 text-xs font-medium text-primary">{reportStatus}</p>}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/25 p-4">
              {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Send the first message.</p>}
              {messages.map((message) => {
                const mine = message.senderId === currentUser?._id;
                return (
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`} key={message._id}>
                    <p className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-6 ${mine ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                      {message.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <form className="flex gap-3 border-t border-border p-4" onSubmit={handleSend}>
              <div className="min-w-0 flex-1">
                {moderationWarning && (
                  <div
                    className={`mb-3 rounded-lg border p-3 text-sm ${
                      moderationWarning.mode === "blocked" ? "border-red-300 bg-red-50 text-red-800" : "border-amber-300 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <Flag size={15} />
                      {moderationWarning.mode === "blocked" ? "This message may violate platform guidelines." : "Please keep messages professional."}
                    </div>
                    <p className="mt-1">{moderationWarning.reason}</p>
                    {moderationWarning.suggestedRewrite && (
                      <div className="mt-3 rounded-md bg-white/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide">Suggested rewrite</p>
                        <p className="mt-1">{moderationWarning.suggestedRewrite}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button className="h-8 px-3" onClick={() => { setMessageText(moderationWarning.suggestedRewrite ?? ""); setModerationWarning(null); }} type="button">
                            Use Suggested Message
                          </Button>
                          <Button className="h-8 bg-muted px-3 text-foreground" onClick={() => setModerationWarning(null)} type="button">
                            Edit Myself
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {blockedNotice && <p className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{blockedNotice}</p>}
                <p className="mb-2 text-xs text-muted-foreground">Keep messages respectful and professional.</p>
                <input
                  className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  disabled={!activeConversation || Boolean(blockedNotice?.includes("cannot message"))}
                  placeholder={activeConversation ? "Write a professional message..." : "Select a conversation"}
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                />
              </div>
              <Button disabled={!activeConversation || !messageText.trim() || Boolean(blockedNotice?.includes("cannot message"))}>
                <Send size={16} />
                Send
              </Button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}

function connectionUser(connection: Connection, side: "requesterId" | "recipientId") {
  return typeof connection[side] === "string" ? null : connection[side];
}

function ConnectionRequestsPanel({
  incoming,
  onDecision,
  outgoing
}: {
  incoming: Connection[];
  onDecision: (connectionId: string, decision: "accept" | "reject") => Promise<void>;
  outgoing: Connection[];
}) {
  if (!incoming.length && !outgoing.length) {
    return (
      <section className="mb-4 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold">Connection requests</p>
        <p className="mt-1 text-sm text-muted-foreground">No pending requests.</p>
      </section>
    );
  }

  return (
    <section className="mb-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold">Incoming requests</p>
        <div className="mt-3 space-y-3">
          {incoming.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
          {incoming.map((connection) => {
            const user = connectionUser(connection, "requesterId");
            return (
              <article className="flex flex-col justify-between gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center" key={connection._id}>
                <div>
                  <p className="font-semibold">{user?.displayName ?? user?.email ?? "Student"}</p>
                  <p className="text-sm text-muted-foreground">wants to connect</p>
                </div>
                <div className="flex gap-2">
                  <Button className="h-9 px-3" onClick={() => onDecision(connection._id, "accept")}>Accept</Button>
                  <Button className="h-9 bg-muted px-3 text-foreground" onClick={() => onDecision(connection._id, "reject")}>Reject</Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold">Outgoing requests</p>
        <div className="mt-3 space-y-3">
          {outgoing.length === 0 && <p className="text-sm text-muted-foreground">No sent requests.</p>}
          {outgoing.map((connection) => {
            const user = connectionUser(connection, "recipientId");
            return (
              <article className="rounded-md border border-border p-3" key={connection._id}>
                <p className="font-semibold">{user?.displayName ?? user?.email ?? "Student"}</p>
                <p className="text-sm text-muted-foreground">Request sent</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
