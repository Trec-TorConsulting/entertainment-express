import React, { useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { clsx } from "clsx";
import { Avatar } from "../primitives/Avatar";
import { Button } from "../primitives/Button";
import { Input } from "../primitives/Input";

export interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  content: string;
  timestamp: string;
  isOutgoing?: boolean;
}

export interface ChatThreadProps {
  messages: ChatMessage[];
  onSendMessage?: (content: string) => void;
  currentUser?: string;
  placeholder?: string;
  title?: string;
  className?: string;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  onSendMessage,
  placeholder = "Type your message...",
  title = "Event Conversation",
  className
}) => {
  const [draft, setDraft] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSendMessage?.(draft.trim());
    setDraft("");
  };

  return (
    <div className={clsx("flex flex-col h-full rounded-[var(--ee-radius-lg)] border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] overflow-hidden shadow-ee-sm", className)}>
      {title && (
        <div className="px-5 py-3 border-b border-[var(--ee-border)] bg-[var(--ee-surface-inset)] flex items-center justify-between">
          <h4 className="font-semibold text-sm text-[var(--ee-text)]">{title}</h4>
          <span className="text-xs text-[var(--ee-muted)]">{messages.length} messages</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[220px]">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[var(--ee-muted)]">
            No messages yet. Send a message to start the thread.
          </div>
        ) : (
          messages.map((msg) => {
            return (
              <div
                key={msg.id}
                className={clsx(
                  "flex gap-3 max-w-[85%]",
                  msg.isOutgoing ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <Avatar
                  src={msg.senderAvatar}
                  fallback={msg.senderName}
                  size="sm"
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <div
                    className={clsx(
                      "flex items-baseline gap-2 text-xs",
                      msg.isOutgoing ? "justify-end" : "justify-start"
                    )}
                  >
                    <span className="font-semibold text-[var(--ee-text)]">{msg.senderName}</span>
                    {msg.senderRole && (
                      <span className="text-[10px] text-[var(--ee-muted)]">({msg.senderRole})</span>
                    )}
                    <span className="text-[10px] text-[var(--ee-muted)] tabular-nums">{msg.timestamp}</span>
                  </div>
                  <div
                    className={clsx(
                      "p-3 rounded-2xl text-sm leading-relaxed",
                      msg.isOutgoing
                        ? "bg-[var(--ee-brand)] text-white rounded-tr-none"
                        : "bg-[var(--ee-surface-inset)] text-[var(--ee-text)] border border-[var(--ee-border)] rounded-tl-none"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input composer */}
      <form onSubmit={handleSend} className="p-3 border-t border-[var(--ee-border)] bg-[var(--ee-surface-base)] flex items-center gap-2">
        <Input
          density="cockpit"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="submit"
          density="cockpit"
          variant="primary"
          disabled={!draft.trim()}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          Send
        </Button>
      </form>
    </div>
  );
};
