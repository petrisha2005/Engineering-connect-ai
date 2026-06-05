import {
  Bookmark,
  BookmarkCheck,
  Bot,
  Check,
  Flag,
  Heart,
  Loader2,
  MessageCircle,
  PenLine,
  Send,
  Sparkles,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConnectionActions } from "../components/connections/ConnectionActions";
import { Button } from "../components/ui/Button";
import {
  addCommunityComment,
  createCommunityPost,
  deleteCommunityPost,
  listCommunityComments,
  listCommunityFeed,
  reportCommunityPost,
  suggestCommunityPost,
  toggleCommunityBookmark,
  toggleCommunityLike
} from "../services/communityApi";
import { useAuthStore } from "../store/authStore";
import type { AppUser } from "../types/auth";
import type { CommunityComment, CommunityPost, CommunityPostType } from "../types/community";
import type { StudentProfile } from "../types/profile";

type Status = "loading" | "ready" | "error";

const postTypes: Array<{ value: CommunityPostType; label: string }> = [
  { value: "project_update", label: "Project Update" },
  { value: "hackathon", label: "Hackathon" },
  { value: "learning_progress", label: "Learning Progress" },
  { value: "question", label: "Question" },
  { value: "collaboration_request", label: "Collaboration Request" },
  { value: "achievement", label: "Achievement" }
];

function profileOf(user: AppUser) {
  return typeof user.profile === "object" && user.profile ? (user.profile as StudentProfile) : null;
}

function typeLabel(type: CommunityPostType) {
  return postTypes.find((item) => item.value === type)?.label ?? type.replace(/_/g, " ");
}

function csvToList(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function CommunityPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [status, setStatus] = useState<Status>("loading");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [personalized, setPersonalized] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  async function loadFeed(nextPersonalized = personalized) {
    setStatus("loading");
    setError(null);
    try {
      const response = await listCommunityFeed(nextPersonalized);
      setPosts(response.posts ?? []);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load community feed.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadFeed();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function refreshWithToast(message: string) {
    setToast(message);
    await loadFeed();
  }

  const savedCount = useMemo(() => posts.filter((post) => post.bookmarkedByMe).length, [posts]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_62%,#0f766e_100%)] p-6 text-white shadow-sm">
        <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100">
          <Sparkles size={16} />
          Student community
        </p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Share progress, ask questions, and find collaborators.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">
              A professional feed for engineering students to post project updates, hackathon wins, learning milestones, and collaboration requests.
            </p>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-emerald-100">Saved posts</p>
            <p className="mt-2 text-4xl font-semibold">{savedCount}</p>
            <p className="mt-2 text-sm text-emerald-50/75">Bookmarks stay tied to your account.</p>
          </div>
        </div>
      </section>

      <CreatePostBox onCreated={() => refreshWithToast("Post shared successfully.")} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Community Feed</h2>
          <p className="mt-1 text-sm text-muted-foreground">Real posts from EngineerConnect AI students.</p>
        </div>
        <Button
          className="bg-muted text-foreground hover:bg-muted/80"
          onClick={() => {
            const next = !personalized;
            setPersonalized(next);
            void loadFeed(next);
          }}
        >
          {personalized ? "Showing recommended" : "Showing latest"}
        </Button>
      </div>

      {status === "loading" && <StateCard title="Loading feed..." text="Fetching community posts from MongoDB." />}
      {status === "error" && <StateCard tone="error" title="Unable to load feed" text={error ?? "Please try again."} />}

      {status === "ready" && (
        <section className="mt-4 grid gap-4">
          {posts.length ? (
            posts.map((post) => (
              <PostCard
                currentUserId={currentUser?._id}
                key={post._id}
                onDeleted={() => refreshWithToast("Post deleted.")}
                onReported={() => refreshWithToast("Post reported. Thank you.")}
                onUpdated={() => loadFeed()}
                post={post}
              />
            ))
          ) : (
            <EmptyState title="No community posts yet" text="Share the first learning update, project milestone, or collaboration request." />
          )}
        </section>
      )}

      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">{toast}</div>}
    </main>
  );
}

function CreatePostBox({ onCreated }: { onCreated: () => Promise<void> }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<CommunityPostType>("project_update");
  const [tags, setTags] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"idle" | "posting" | "suggesting">("idle");

  async function suggest() {
    if (!content.trim()) {
      setError("Add post content first.");
      return;
    }
    setBusy("suggesting");
    setError(null);
    try {
      const response = await suggestCommunityPost(content);
      setContent(response.suggestedContent);
      setTips(response.tips ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to suggest wording.");
    } finally {
      setBusy("idle");
    }
  }

  async function submit() {
    if (!content.trim()) {
      setError("Post content is required.");
      return;
    }
    setBusy("posting");
    setError(null);
    try {
      await createCommunityPost({ content, type, tags: csvToList(tags) });
      setContent("");
      setTags("");
      setTips([]);
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create post.");
    } finally {
      setBusy("idle");
    }
  }

  return (
    <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <PenLine className="text-emerald-600" size={20} />
        <h2 className="text-xl font-semibold">Create post</h2>
      </div>
      <div className="mt-4 grid gap-3">
        <textarea
          className="min-h-28 rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-emerald-400"
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share a project update, ask a question, or request collaborators..."
          value={content}
        />
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <select className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none" onChange={(event) => setType(event.target.value as CommunityPostType)} value={type}>
            {postTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <input
            className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-emerald-400"
            onChange={(event) => setTags(event.target.value)}
            placeholder="Tags/skills: React, DSA, MongoDB"
            value={tags}
          />
        </div>
        {tips.length ? <p className="text-sm text-muted-foreground">AI tip: {tips[0]}</p> : null}
        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busy !== "idle"} onClick={suggest}>
            {busy === "suggesting" ? <Loader2 className="animate-spin" size={16} /> : <Bot size={16} />}
            AI improve wording
          </Button>
          <Button disabled={busy !== "idle"} onClick={submit}>
            {busy === "posting" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            Post
          </Button>
        </div>
      </div>
    </section>
  );
}

function PostCard({
  currentUserId,
  onDeleted,
  onReported,
  onUpdated,
  post
}: {
  currentUserId?: string;
  onDeleted: () => Promise<void>;
  onReported: () => Promise<void>;
  onUpdated: () => Promise<void>;
  post: CommunityPost;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const profile = profileOf(post.author);
  const isOwn = currentUserId === post.author._id;

  async function loadComments() {
    setBusy("comments");
    try {
      const response = await listCommunityComments(post._id);
      setComments(response.comments ?? []);
      setCommentsOpen(true);
    } finally {
      setBusy(null);
    }
  }

  async function addComment() {
    if (!commentText.trim()) return;
    setBusy("comment");
    try {
      await addCommunityComment(post._id, commentText);
      setCommentText("");
      await loadComments();
      await onUpdated();
    } finally {
      setBusy(null);
    }
  }

  async function toggleLike() {
    setBusy("like");
    try {
      await toggleCommunityLike(post._id);
      await onUpdated();
    } finally {
      setBusy(null);
    }
  }

  async function toggleBookmark() {
    setBusy("bookmark");
    try {
      await toggleCommunityBookmark(post._id);
      await onUpdated();
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{profile?.name || post.author.displayName}</h3>
            <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{typeLabel(post.type)}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile ? `${profile.college} · ${profile.branch}` : post.author.email} · {new Date(post.createdAt).toLocaleString()}
          </p>
          {!isOwn && <ConnectionActions compact userId={post.author._id} />}
        </div>
        <div className="flex flex-wrap gap-2">
          {isOwn ? (
            <Button className="bg-red-50 text-red-700 hover:bg-red-100" disabled={busy === "delete"} onClick={async () => { setBusy("delete"); await deleteCommunityPost(post._id); await onDeleted(); }}>
              <Trash2 size={16} />
              Delete
            </Button>
          ) : (
            <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busy === "report"} onClick={async () => { setBusy("report"); await reportCommunityPost(post._id, "other"); await onReported(); }}>
              <Flag size={16} />
              Report
            </Button>
          )}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">{post.content}</p>
      {post.tags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground" key={tag}>#{tag}</span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button className={post.likedByMe ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-muted text-foreground hover:bg-muted/80"} disabled={busy === "like"} onClick={toggleLike}>
          <Heart size={16} />
          {post.likeCount}
        </Button>
        <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busy === "comments"} onClick={commentsOpen ? () => setCommentsOpen(false) : loadComments}>
          <MessageCircle size={16} />
          {post.commentCount}
        </Button>
        <Button className={post.bookmarkedByMe ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-muted text-foreground hover:bg-muted/80"} disabled={busy === "bookmark"} onClick={toggleBookmark}>
          {post.bookmarkedByMe ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          Save
        </Button>
      </div>

      {commentsOpen && (
        <div className="mt-4 rounded-lg border border-border bg-muted/25 p-4">
          <div className="grid gap-3">
            {comments.length ? (
              comments.map((comment) => <CommentItem comment={comment} key={comment._id} />)
            ) : (
              <p className="text-sm text-muted-foreground">No comments yet. Start the discussion professionally.</p>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="h-11 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-emerald-400"
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write a comment..."
              value={commentText}
            />
            <Button disabled={busy === "comment"} onClick={addComment}>
              {busy === "comment" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

function CommentItem({ comment }: { comment: CommunityComment }) {
  const profile = profileOf(comment.author);
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-sm font-semibold">{profile?.name || comment.author.displayName}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{comment.content}</p>
    </div>
  );
}

function EmptyState({ text, title }: { text: string; title: string }) {
  return (
    <section className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <Check className="mx-auto text-emerald-500" size={34} />
      <h2 className="mt-3 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p>
    </section>
  );
}

function StateCard({ text, title, tone = "default" }: { text: string; title: string; tone?: "default" | "error" }) {
  return (
    <section className={`mt-5 rounded-lg border p-5 ${tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-border bg-card"}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-80">{text}</p>
    </section>
  );
}
