import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  FormField,
  Skeleton,
  useToast,
  call
} from "@portal-kit";
import {
  Users, UserPlus, Mail, Shield, CheckCircle2,
  Trash2, Copy, QrCode, Share2, Sparkles, Lock
} from "lucide-react";
import { isGuest } from "../../layouts/ClientLayout";
import { getSessionBootstrap } from "@portal-kit";

export const PeoplePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);

  const [events, setEvents] = useState<any[]>([]);
  const [booking, setBooking] = useState<string>("");
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);

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
          await loadInvites(current);
        }
      } catch {
        // Fallbacks
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [bookingParam]);

  const loadInvites = async (bookingName: string) => {
    try {
      const res = await call("entertainment_express.api.portal_collaboration.list_invites", { booking: bookingName });
      setInvites(res || []);
    } catch {
      setInvites([]);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !booking) return;
    setInviting(true);
    try {
      await call("entertainment_express.api.portal_collaboration.invite_guest", {
        booking,
        email: inviteEmail.trim(),
        full_name: inviteName.trim() || inviteEmail.trim()
      });

      toast({
        title: "Invitation Sent",
        description: `An invite has been emailed to ${inviteEmail.trim()}.`,
        variant: "success",
      });
      setInviteEmail("");
      setInviteName("");
      await loadInvites(booking);
    } catch (err: any) {
      toast({
        title: "Invitation Issue",
        description: err.message || "Could not send invite.",
        variant: "danger",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (inviteName: string) => {
    try {
      await call("entertainment_express.api.portal_collaboration.revoke_invite", {
        booking,
        invite: inviteName
      });
      toast({ title: "Invite Revoked", description: "Access has been removed.", variant: "brand" });
      await loadInvites(booking);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not revoke invite.", variant: "danger" });
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/client/events/${booking}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link Copied", description: "Direct collaboration link copied to clipboard.", variant: "success" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton height="12rem" />
          <Skeleton height="12rem" />
        </div>
      </div>
    );
  }

  const activeEvent = events.find((e) => e.name === booking) || events[0];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Co-Hosts & Event Guests"
          subtitle={`Invite wedding party, family, or friends to collaborate on ${activeEvent?.event_name || "your event"}.`}
          badge={<Badge variant="brand">{invites.length} Collaborators</Badge>}
        />

        {events.length > 1 && (
          <select
            value={booking}
            onChange={(e) => {
              setBooking(e.target.value);
              loadInvites(e.target.value);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Invites List & Sender */}
        <div className="md:col-span-2 space-y-6">
          {!guest && (
            <Card elevated className="p-5 space-y-4 border-[var(--ee-brand-border)] bg-gradient-to-br from-[var(--ee-brand-soft)]/30 to-[var(--ee-surface-raised)]">
              <h3 className="font-bold text-sm text-[var(--ee-text)] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[var(--ee-brand)]" />
                Invite a Co-Host or Guest Collaborator
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Full name (e.g., Sarah Johnson)"
                  density="consumer"
                />
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  density="consumer"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-[var(--ee-muted)]">
                  Invited guests receive access to request songs, vote on timeline items, and chat.
                </span>
                <Button
                  variant="primary"
                  density="consumer"
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  leftIcon={<Mail className="w-4 h-4" />}
                >
                  {inviting ? "Sending…" : "Send Invite"}
                </Button>
              </div>
            </Card>
          )}

          {/* Current Collaborators List */}
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--ee-brand)]" />
                Event Team & Collaborators ({invites.length + 1})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Primary Host (You) */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--ee-brand)] text-white flex items-center justify-center font-bold text-xs">
                    HOST
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-[var(--ee-text)]">
                      {getSessionBootstrap().user || "Primary Host"}
                    </h5>
                    <span className="text-[10px] text-[var(--ee-muted)]">Primary Event Account & Contract Signer</span>
                  </div>
                </div>
                <Badge variant="brand" size="sm">Host / Payer</Badge>
              </div>

              {/* Invited Guests */}
              {invites.map((inv) => (
                <div
                  key={inv.name}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-base)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      {(inv.full_name || inv.email || "G").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs text-[var(--ee-text)]">
                        {inv.full_name || inv.email}
                      </h5>
                      <span className="text-[10px] text-[var(--ee-muted)]">{inv.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={inv.status === "accepted" ? "success" : "brand"} size="sm">
                      {inv.status === "accepted" ? "Joined" : "Invited"}
                    </Badge>
                    {!guest && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(inv.name)}
                        className="p-1 text-[var(--ee-muted)] hover:text-[var(--ee-danger)] transition-colors"
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Share Link & Permissions Info */}
        <div className="space-y-4">
          <Card elevated className="p-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--ee-text)] flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
              Quick Event Share
            </h4>
            <p className="text-xs text-[var(--ee-muted)]">
              Send this direct link to your wedding party or co-planners so they can join the planning hub.
            </p>
            <Button
              variant="outline"
              density="consumer"
              className="w-full"
              onClick={copyShareLink}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              Copy Direct Link
            </Button>
          </Card>

          <Card elevated className="p-5 space-y-3 text-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--ee-text)] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Guest Privacy Guarantee
            </h4>
            <p className="text-[var(--ee-muted)] leading-relaxed">
              Invited guests can <strong>never</strong> see your contracts, pricing, invoices, or make financial payments. Their access is strictly scoped to songs, timeline suggestions, and shared event photos.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PeoplePage;
