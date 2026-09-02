import React from "react";
import { call } from "../api/client";
import { EmptyState } from "./EmptyState";
import { FormField } from "./FormField";
import { enqueueFieldCall, flushFieldQueue, pendingFieldCount, shouldQueueFieldError } from "../offlineQueue";
import "./RecordWorkspace.css";
import "./DispatchBoard.css";

type CheckItem = { id: string; label: string; done: boolean };

type Shift = {
  id: string;
  job: string;
  job_id?: string;
  place: string;
  when: string;
  role: string;
  status: string;
  stage?: string;
  maps_url?: string;
  load_in?: string;
  parking?: string;
  power?: string;
  curfew?: string;
  vendors?: { name: string; role: string; phone: string }[];
  checklist?: CheckItem[];
  can_accept?: boolean;
  can_check_in?: boolean;
  can_check_out?: boolean;
  can_en_route?: boolean;
  can_setup_complete?: boolean;
};

function geo(): Promise<{ latitude?: number; longitude?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  });
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const drawing = React.useRef(false);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return { x: 0, y: 0 };
    const box = canvas.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={320}
        height={120}
        style={{ width: "100%", maxWidth: 320, height: 120, border: "1px solid var(--ee-border)", borderRadius: 8, touchAction: "none", background: "#fff" }}
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = ref.current?.getContext("2d");
          if (!ctx) return;
          const p = point(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current?.getContext("2d");
          if (!ctx) return;
          const p = point(e);
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#0f172a";
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
      />
      <div className="ee-form__actions">
        <button
          type="button"
          className="ee-btn"
          onClick={() => {
            const ctx = ref.current?.getContext("2d");
            if (!ctx || !ref.current) return;
            ctx.clearRect(0, 0, ref.current.width, ref.current.height);
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="ee-btn"
          onClick={() => {
            if (ref.current) onSave(ref.current.toDataURL("image/png"));
          }}
        >
          Keep mark
        </button>
      </div>
    </div>
  );
}

async function fieldCall(method: string, args: Record<string, unknown>, queueable = true) {
  try {
    return await call(method, args);
  } catch (err: any) {
    if (queueable && shouldQueueFieldError(err)) {
      enqueueFieldCall(method, args);
      const queued = new Error("Saved on this phone. We'll send it when you're back online.");
      (queued as any).queued = true;
      throw queued;
    }
    throw err;
  }
}

export function FieldBoard() {
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [queued, setQueued] = React.useState(0);
  const [signer, setSigner] = React.useState<Record<string, string>>({});
  const [issue, setIssue] = React.useState<Record<string, { kind: string; detail: string }>>({});

  const reload = React.useCallback(() => {
    call("entertainment_express.api.field.my_jobs", {})
      .then((res) => setShifts(res || []))
      .catch((err) => {
        setShifts([]);
        setError(err.message || "Could not load your jobs.");
      });
    setQueued(pendingFieldCount());
  }, []);

  React.useEffect(() => {
    reload();
    const flush = () =>
      flushFieldQueue(call).then((n) => {
        if (n) reload();
        else setQueued(pendingFieldCount());
      });
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [reload]);

  React.useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    Notification.requestPermission().catch(() => undefined);
  }, []);

  const run = async (method: string, args: Record<string, unknown>) => {
    setError("");
    setNotice("");
    try {
      await fieldCall(method, args);
      reload();
    } catch (err: any) {
      if (err.queued) {
        setNotice(err.message);
        setQueued(pendingFieldCount());
        return;
      }
      setError(err.message || "Could not update this shift.");
    }
  };

  return (
    <section className="ee-dispatch">
      <div>
        <p className="ee-muted" style={{ margin: 0 }}>
          Your jobs
        </p>
        <h1>Field</h1>
        {queued ? <p className="ee-muted">{queued} action{queued === 1 ? "" : "s"} waiting to send.</p> : null}
        {notice ? <p className="ee-muted">{notice}</p> : null}
      </div>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {shifts.length ? (
        shifts.map((shift) => (
          <article key={shift.id} className="ee-dispatch__job">
            <div>
              <h2>{shift.job}</h2>
              <p className="ee-dispatch__meta">
                {shift.when}
                {shift.place ? ` · ${shift.place}` : ""}
                {shift.role ? ` · ${shift.role}` : ""}
              </p>
              <p style={{ margin: 0 }}>
                {shift.status}
                {shift.stage ? ` · ${shift.stage.replace("-", " ")}` : ""}
              </p>
              {shift.load_in || shift.parking || shift.power || shift.curfew ? (
                <p className="ee-muted" style={{ margin: "0.35rem 0 0" }}>
                  {[shift.load_in && `Load-in: ${shift.load_in}`, shift.parking && `Parking: ${shift.parking}`, shift.power && `Power: ${shift.power}`, shift.curfew && `Curfew: ${shift.curfew}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              {shift.vendors?.length ? (
                <p className="ee-muted" style={{ margin: "0.25rem 0 0" }}>
                  Other vendors: {shift.vendors.map((v) => `${v.name}${v.phone ? ` (${v.phone})` : ""}`).join(", ")}
                </p>
              ) : null}
            </div>
            <div className="ee-form__actions">
              {shift.maps_url ? (
                <a className="ee-btn" href={shift.maps_url} target="_blank" rel="noreferrer">
                  Navigate
                </a>
              ) : null}
              {shift.can_accept ? (
                <>
                  <button type="button" className="ee-btn" onClick={() => run("entertainment_express.api.portal_dispatch.respond", { assignment: shift.id, decision: "accept" })}>
                    I&apos;m in
                  </button>
                  <button type="button" className="ee-btn ee-btn--danger" onClick={() => run("entertainment_express.api.portal_dispatch.respond", { assignment: shift.id, decision: "decline" })}>
                    Can&apos;t make it
                  </button>
                </>
              ) : null}
              {shift.can_en_route ? (
                <button type="button" className="ee-btn" onClick={() => run("entertainment_express.api.field.set_stage", { assignment: shift.id, stage: "en-route" })}>
                  On the way
                </button>
              ) : null}
              {shift.can_check_in ? (
                <button
                  type="button"
                  className="ee-btn"
                  onClick={async () => {
                    const loc = await geo();
                    await run("entertainment_express.api.field.check_in", { assignment: shift.id, ...loc });
                  }}
                >
                  Check in
                </button>
              ) : null}
              {shift.can_setup_complete ? (
                <button type="button" className="ee-btn" onClick={() => run("entertainment_express.api.field.set_stage", { assignment: shift.id, stage: "setup-complete" })}>
                  Setup complete
                </button>
              ) : null}
              {shift.can_check_out ? (
                <button type="button" className="ee-btn" onClick={() => run("entertainment_express.api.field.check_out", { assignment: shift.id })}>
                  Check out
                </button>
              ) : null}
            </div>
            {shift.checklist?.length ? (
              <div>
                <p style={{ margin: "0.5rem 0 0.25rem", fontWeight: 600 }}>Setup</p>
                {shift.checklist.map((item) => (
                  <label key={item.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center", margin: "0.2rem 0" }}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => run("entertainment_express.api.field.toggle_checklist", { assignment: shift.id, item: item.id, done: item.done ? 0 : 1 })}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            ) : null}
            {shift.can_check_in || shift.can_check_out || shift.can_setup_complete ? (
              <>
                <FormField label="Photo">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await readFile(file);
                        await run("entertainment_express.api.field.upload_photo", {
                          assignment: shift.id,
                          title: file.name,
                          file_name: file.name,
                          content_b64: dataUrl,
                          kind: "photo",
                        });
                      } catch (err: any) {
                        setError(err.message || "Could not save that photo.");
                      }
                      e.target.value = "";
                    }}
                  />
                </FormField>
                <FormField label="Host signs as">
                  <input
                    value={signer[shift.id] || ""}
                    onChange={(e) => setSigner({ ...signer, [shift.id]: e.target.value })}
                    placeholder="Name"
                  />
                </FormField>
                <SignaturePad
                  onSave={(dataUrl) =>
                    run("entertainment_express.api.field.capture_signature", {
                      assignment: shift.id,
                      signer_name: signer[shift.id] || "Host",
                      content_b64: dataUrl,
                    })
                  }
                />
                <FormField label="Report a problem">
                  <select
                    value={issue[shift.id]?.kind || "other"}
                    onChange={(e) => setIssue({ ...issue, [shift.id]: { kind: e.target.value, detail: issue[shift.id]?.detail || "" } })}
                  >
                    <option value="damage">Damage</option>
                    <option value="no_show">No-show</option>
                    <option value="access">Cannot get in</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>
                <FormField label="What happened">
                  <textarea
                    value={issue[shift.id]?.detail || ""}
                    onChange={(e) => setIssue({ ...issue, [shift.id]: { kind: issue[shift.id]?.kind || "other", detail: e.target.value } })}
                    rows={3}
                  />
                </FormField>
                <button
                  type="button"
                  className="ee-btn ee-btn--danger"
                  onClick={() =>
                    run("entertainment_express.api.field.report_issue", {
                      assignment: shift.id,
                      kind: issue[shift.id]?.kind || "other",
                      detail: issue[shift.id]?.detail || "",
                    })
                  }
                >
                  Send issue
                </button>
              </>
            ) : null}
          </article>
        ))
      ) : (
        <EmptyState title="No shifts yet" message="When someone offers you a job, it shows up here." />
      )}
    </section>
  );
}
