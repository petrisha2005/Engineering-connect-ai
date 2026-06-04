import { CheckCircle2, MessageSquarePlus, Send, Star } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { submitFeedback } from "../services/feedbackApi";
import { useAuthStore } from "../store/authStore";
import type { FeedbackType } from "../types/feedback";

const feedbackTypes: FeedbackType[] = ["Bug", "Suggestion", "UI Issue", "Feature Request", "Other"];
type ToastState = { type: "success" | "error"; message: string } | null;

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [type, setType] = useState<FeedbackType>("Suggestion");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ message?: string; type?: string; rating?: string }>({});
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setToast(null);

    const nextErrors: typeof errors = {};
    if (!feedbackTypes.includes(type)) nextErrors.type = "Please select a valid feedback type.";
    if (!message.trim()) nextErrors.message = "Feedback message is required.";
    if (message.trim().length > 2000) nextErrors.message = "Feedback message must be 2000 characters or less.";
    if (rating !== null && (rating < 1 || rating > 5)) nextErrors.rating = "Rating must be between 1 and 5.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({ type, message: message.trim(), rating });
      setToast({ type: "success", message: "Thank you for your feedback!" });
      setMessage("");
      setRating(null);
      setErrors({});
    } catch {
      setToast({ type: "error", message: "Unable to submit feedback. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Toast toast={toast} />
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold">Account settings</h1>
      </div>
      <section className="rounded-lg border border-border bg-card p-6">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{user?.displayName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium capitalize">{user?.role}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm" id="feedback">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquarePlus size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">Feedback</p>
            <h2 className="mt-1 text-2xl font-semibold">Help improve EngineerConnect AI</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Share bugs, UI issues, suggestions, or feature ideas. Your feedback is saved securely with your account.
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold" htmlFor="feedback-type">
              Feedback type
            </label>
            <select
              className={`mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.type ? "border-red-400" : "border-border"
              }`}
              id="feedback-type"
              onChange={(event) => setType(event.target.value as FeedbackType)}
              value={type}
            >
              {feedbackTypes.map((feedbackType) => (
                <option key={feedbackType} value={feedbackType}>
                  {feedbackType}
                </option>
              ))}
            </select>
            {errors.type && <p className="mt-2 text-sm text-red-600">{errors.type}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold" htmlFor="feedback-message">
              Message
            </label>
            <textarea
              className={`mt-2 min-h-36 w-full resize-y rounded-md border bg-background px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.message ? "border-red-400" : "border-border"
              }`}
              id="feedback-message"
              maxLength={2000}
              onChange={(event) => {
                setMessage(event.target.value);
                setErrors((current) => ({ ...current, message: undefined }));
              }}
              placeholder="Tell us what happened, what would help, or what you want improved..."
              value={message}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              {errors.message ? <p className="text-sm text-red-600">{errors.message}</p> : <p className="text-sm text-muted-foreground">Required</p>}
              <p className="text-xs text-muted-foreground">{message.length}/2000</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Optional rating</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  className={`inline-flex h-10 items-center gap-1 rounded-md border px-3 text-sm font-semibold transition ${
                    rating === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                  key={value}
                  onClick={() => {
                    setRating(rating === value ? null : value);
                    setErrors((current) => ({ ...current, rating: undefined }));
                  }}
                  type="button"
                >
                  <Star size={15} className={rating !== null && value <= rating ? "fill-current" : ""} />
                  {value}
                </button>
              ))}
            </div>
            {errors.rating && <p className="mt-2 text-sm text-red-600">{errors.rating}</p>}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button disabled={isSubmitting}>
              <Send size={17} />
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">Feedback is linked to your signed-in account for follow-up context.</p>
          </div>
        </form>
      </section>
    </main>
  );
}

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  const classes =
    toast.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className={`fixed right-4 top-20 z-50 flex max-w-sm items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg ${classes}`}>
      {toast.type === "success" && <CheckCircle2 size={18} />}
      {toast.message}
    </div>
  );
}
