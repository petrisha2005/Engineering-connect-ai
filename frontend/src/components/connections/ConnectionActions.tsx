import { Check, MessageCircle, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { acceptConnection, getConnectionStatus, rejectConnection, requestConnection } from "../../services/connectionApi";
import { createOrGetConversation } from "../../services/messageApi";
import type { Connection, ConnectionState } from "../../types/connection";

export function ConnectionActions({ compact = false, userId }: { compact?: boolean; userId?: string }) {
  const navigate = useNavigate();
  const [state, setState] = useState<ConnectionState>("none");
  const [connection, setConnection] = useState<Connection | undefined>();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    if (!userId) return;
    setStatus("loading");
    setError(null);
    try {
      const response = await getConnectionStatus(userId);
      setState(response.state);
      setConnection(response.connection);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load connection status");
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadStatus();
  }, [userId]);

  async function run(action: () => Promise<{ state: ConnectionState; connection?: Connection }>) {
    setStatus("loading");
    setError(null);
    try {
      const response = await action();
      setState(response.state);
      setConnection(response.connection);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      setStatus("error");
    }
  }

  async function openMessages() {
    if (!userId) return;
    setStatus("loading");
    try {
      const response = await createOrGetConversation(userId);
      navigate(`/messages?conversation=${response.conversation._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect first to start messaging.");
      setStatus("error");
    } finally {
      setStatus("idle");
    }
  }

  if (!userId || state === "self") return null;

  const disabled = status === "loading";
  const buttonClass = compact ? "h-9 px-3" : "";

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {state === "none" && (
          <Button className={buttonClass} disabled={disabled} onClick={() => run(() => requestConnection(userId))}>
            <UserPlus size={16} />
            {disabled ? "Sending..." : "Connect"}
          </Button>
        )}
        {state === "request_sent" && (
          <Button className={`${buttonClass} bg-muted text-foreground`} disabled>
            <Check size={16} />
            Request Sent
          </Button>
        )}
        {state === "request_received" && connection && (
          <>
            <Button className={buttonClass} disabled={disabled} onClick={() => run(() => acceptConnection(connection._id))}>
              <Check size={16} />
              Accept Request
            </Button>
            <Button className={`${buttonClass} bg-muted text-foreground`} disabled={disabled} onClick={() => run(() => rejectConnection(connection._id))}>
              <X size={16} />
              Reject
            </Button>
          </>
        )}
        {state === "connected" && (
          <>
            <Button className={`${buttonClass} bg-muted text-foreground`} disabled>
              <Check size={16} />
              Connected
            </Button>
            <Button className={buttonClass} disabled={disabled} onClick={openMessages}>
              <MessageCircle size={16} />
              Message
            </Button>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
