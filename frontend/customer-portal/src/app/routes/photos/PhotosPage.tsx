import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Skeleton,
  useToast,
  call,
  downloadBase64
} from "@portal-kit";
import {
  Image, Download, Eye, Sparkles, Camera,
  Film, Music, Share2, Copy
} from "lucide-react";

export const PhotosPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [booking, setBooking] = useState<string>("");
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string>("");
  const [previewItem, setPreviewItem] = useState<any>(null);

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
          await loadDeliverables(current);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [bookingParam]);

  const loadDeliverables = async (bookingName: string) => {
    try {
      const res = await call("entertainment_express.api.deliverables.list_deliverables", { booking: bookingName });
      setDeliverables(res || []);
    } catch {
      setDeliverables([]);
    }
  };

  const handleDownload = async (item: any) => {
    setDownloadingId(item.id || item.name);
    try {
      const file = await call("entertainment_express.api.deliverables.get_deliverable", { name: item.id || item.name });
      downloadBase64(
        file.filename || item.title || "event-photo",
        file.content_b64,
        file.mime || "application/octet-stream"
      );
      toast({ title: "Download Started", description: "File is downloading to your device.", variant: "success" });
    } catch (err: any) {
      toast({ title: "Download Failed", description: err.message || "Could not retrieve file.", variant: "danger" });
    } finally {
      setDownloadingId("");
    }
  };

  const copyGalleryLink = () => {
    const url = `${window.location.origin}/client/photos?booking=${encodeURIComponent(booking)}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Gallery Link Copied", description: "Link copied for sharing with guests.", variant: "success" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Skeleton height="14rem" />
          <Skeleton height="14rem" />
          <Skeleton height="14rem" />
        </div>
      </div>
    );
  }

  const activeEvent = events.find((e) => e.name === booking) || events[0];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Event Photos & Media"
          subtitle={`High-resolution photography, photo booth prints, and live recordings from ${activeEvent?.event_name || "your event"}.`}
          badge={<Badge variant="brand">{deliverables.length} Deliverables</Badge>}
        />

        <div className="flex flex-wrap items-center gap-2">
          {events.length > 1 && (
            <select
              value={booking}
              onChange={(e) => {
                setBooking(e.target.value);
                loadDeliverables(e.target.value);
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

          <Button
            variant="outline"
            density="consumer"
            onClick={copyGalleryLink}
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
          >
            Share Gallery
          </Button>
        </div>
      </div>

      {/* Deliverables Grid */}
      {deliverables.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {deliverables.map((item) => {
            const isVideo = (item.kind || "").toLowerCase().includes("video") || (item.kind || "").toLowerCase().includes("360");
            const isAudio = (item.kind || "").toLowerCase().includes("audio");

            return (
              <Card key={item.id || item.name} elevated className="overflow-hidden space-y-3 group border-[var(--ee-border)]">
                {/* Media Thumbnail Container */}
                <div className="relative w-full h-44 bg-[var(--ee-surface-inset)] flex items-center justify-center border-b border-[var(--ee-border)] overflow-hidden">
                  {isVideo ? (
                    <Film className="w-10 h-10 text-[var(--ee-brand)]" />
                  ) : isAudio ? (
                    <Music className="w-10 h-10 text-purple-500" />
                  ) : (
                    <Camera className="w-10 h-10 text-[var(--ee-muted)] group-hover:scale-105 transition-transform" />
                  )}
                  <Badge variant="outline" size="sm" className="absolute top-2 left-2 bg-[var(--ee-surface-raised)]/90 backdrop-blur-sm">
                    {item.kind || "Photo"}
                  </Badge>
                </div>

                <div className="p-3 space-y-2">
                  <div>
                    <h4 className="font-semibold text-xs text-[var(--ee-text)] truncate">{item.title}</h4>
                    <span className="text-[10px] text-[var(--ee-muted)] block">Published on file</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="primary"
                      density="consumer"
                      className="w-full text-xs"
                      onClick={() => handleDownload(item)}
                      disabled={downloadingId === (item.id || item.name)}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      {downloadingId === (item.id || item.name) ? "Saving…" : "Download"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card elevated className="p-12 text-center space-y-4">
          <Camera className="w-12 h-12 text-[var(--ee-muted)] mx-auto" />
          <div className="space-y-1">
            <h4 className="font-semibold text-base text-[var(--ee-text)]">Photos & Deliverables in Production</h4>
            <p className="text-xs text-[var(--ee-muted)] max-w-md mx-auto">
              Your high-resolution photo booth strips, guest gallery captures, and audio recordings will appear here once published by your event production team.
            </p>
          </div>
          <Button
            variant="outline"
            density="consumer"
            onClick={() => loadDeliverables(booking)}
          >
            Refresh Gallery
          </Button>
        </Card>
      )}
    </div>
  );
};

export default PhotosPage;
