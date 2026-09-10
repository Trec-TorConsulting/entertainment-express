import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
  Skeleton,
  useToast,
  call
} from "@portal-kit";
import {
  MessageSquare, Send, Users, ShieldCheck,
  CheckCircle2, Sparkles, Clock
} from "lucide-react";
import { getSessionBootstrap } from "@portal-kit";

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const currentUser = getSessionBootstrap().user || "";

  const [events, setEvents] = useState<any[]>([]);
  const [booking, setBooking] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bookingParam = searchParams.get("booking");

  useEffect(() => {
    const init = async () => {
      try {
        const evList = await call("entertainment_express.api.portal_collaboration.list_my_events", {});
        const evs = evList || [];
        setEvents(evs);
        const current = bookingParam || evs[0]?.name || "";
        setBooking(current);

        if (current) {
          await loadMessages(current);
        }
      } catch {
        // Fallbacks
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [bookingParam]);

  const loadMessages = async (bookingName: string) => {
    try {
      const res = await call("entertainment_express.api.portal_collaboration.list_messages", { booking: bookingName });
      setMessages(res || []);
      scrollToBottom();
    } catch {
      // ignore
    }
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!booking) return;
    const interval = setInterval(() => {
      loadMessages(booking);
    }, 5000);
    return () => clearInterval(interval);
  }, [booking]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text || !booking || sending) return;

    setSending(true);
    try {
      await call("entertainment_express.api.portal_collaboration.post_message", {
        booking,
        message_body: text
      });
      setNewMessage("");
      await loadMessages(booking);
      scrollToBottom();
    } catch (err: any) {
      toast({ title: "Message Failed", description: err.message || "Could not send message.", variant: "danger" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <Skeleton height="24rem" />
      </div>
    );
  }

  const activeEvent = events.find((e) => e.name === booking) || events[0];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Event Team Chat"
          subtitle={`Direct messaging with your assigned entertainment team and coordinator for ${activeEvent?.event_name || "your event"}.`}
          badge={<Badge variant="brand">Live Channel</Badge>}
        />

        {events.length > 1 && (
          <select
            value={booking}
            onChange={(e) => {
              setBooking(e.target.value);
              loadMessages(e.target.value);
            }}
            className="text-xs p-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-base)] text-[var(--ee-text)] max-w-xs"
          >
            {events.map((ev) => (
              <option key={ev.name} value={ev.name}>
                {ev.event_name || ev.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Chat Container Card */}
      <Card elevated className="flex flex-col h-[650px] border-[var(--ee-border)] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-[var(--ee-border)] bg-[var(--ee-surface-raised)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--ee-brand-soft)] text-[var(--ee-brand-text)] flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-[var(--ee-text)]">
                {activeEvent?.event_name || "Event Channel"}
              </h4>
              <span className="text-[10px] text-[var(--ee-muted)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Talent & Dispatch Active
              </span>
            </div>
          </div>
          <Badge variant="outline" size="sm">Auto-Refreshed</Badge>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[var(--ee-surface-inset)]">
          {messages.length > 0 ? (
            messages.map((m, idx) => {
              const isMe = m.author === currentUser || m.author?.toLowerCase() === currentUser.toLowerCase();

              return (
                <div
                  key={m.name || idx}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-[var(--ee-muted)]">
                      {isMe ? "You" : m.author}
                    </span>
                    <span className="text-[9px] text-[var(--ee-muted)]">
                      {m.creation ? new Date(m.creation).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl max-w-sm sm:max-w-md text-xs leading-relaxed ${
                      isMe
                        ? "bg-[var(--ee-brand)] text-white rounded-tr-none shadow-sm"
                        : "bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] text-[var(--ee-text)] rounded-tl-none"
                    }`}
                  >
                    {m.message_body}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <MessageSquare className="w-10 h-10 text-[var(--ee-muted)]" />
              <h4 className="font-semibold text-xs text-[var(--ee-text)]">No messages yet</h4>
              <p className="text-[11px] text-[var(--ee-muted)] max-w-xs">
                Have a question about ceremony timing, special song cues, or equipment staging? Send a message to your team below!
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Footer */}
        <form onSubmit={handleSend} className="p-3 border-t border-[var(--ee-border)] bg-[var(--ee-surface-raised)] flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message to your DJ and coordinator..."
            density="consumer"
            className="flex-1 text-xs"
            disabled={sending}
          />
          <Button
            type="submit"
            variant="primary"
            density="consumer"
            disabled={sending || !newMessage.trim()}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ChatPage;
