import React from "react";
import { NavLink, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import {
  AccountPanel,
  AppShell,
  BookingDetail,
  DataTable,
  EmptyState,
  FormField,
  MoneySummary,
  call,
  getSessionBootstrap,
} from "../../portal-kit/src";

function isGuest(roles: string[]) {
  return roles.includes("EE Event Guest") && !roles.includes("EE Customer");
}

function Home({ booking, events }: { booking: string; events: any[] }) {
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);
  const [money, setMoney] = React.useState<any>(null);
  const [action, setAction] = React.useState<{ key: string; label: string; href: string } | null>(null);
  const current = events.find((row) => row.name === booking);

  React.useEffect(() => {
    if (guest) return;
    call("entertainment_express.api.portal_reports.client_money_summary", {})
      .then(setMoney)
      .catch(() => setMoney({ owed: "0.00", paid: "0.00", remaining: "0.00" }));
    call("entertainment_express.api.portal_client.next_action", {})
      .then(setAction)
      .catch(() => setAction({ key: "none", label: "", href: "" }));
  }, [guest]);

  if (guest) {
    return (
      <EmptyState
        title={current?.event_name || "You're helping plan an event"}
        message="Open Planning or Chat from the menu. Payments stay with the host."
      />
    );
  }

  const copy =
    action?.key === "sign"
      ? { title: "A contract is waiting", message: "Review and sign to lock in the date." }
      : action?.key === "pay"
        ? { title: "A payment is due", message: "Finish the deposit or balance to lock the date." }
        : action?.key === "planning"
          ? { title: "Finish event details", message: "A few planning questions are still open." }
          : { title: "You're all set for now", message: "When something needs a signature or a payment, it shows up here." };

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      {money ? <MoneySummary owed={money.owed} paid={money.paid} remaining={money.remaining} /> : null}
      <EmptyState
        title={copy.title}
        message={copy.message}
        actionLabel={action?.label || undefined}
        onAction={action?.href ? () => (window.location.href = action.href) : undefined}
      />
    </section>
  );
}

function Events() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [proposal, setProposal] = React.useState<any>(null);
  React.useEffect(() => {
    call("frappe.client.get_list", {
      doctype: "Event Booking",
      fields: ["name", "event_name", "event_date", "status", "venue_address", "grand_total", "balance_due", "deposit_status"],
      limit_page_length: 20,
    })
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
    call("entertainment_express.api.portal_proposal.client_proposal", {})
      .then(setProposal)
      .catch(() => setProposal(null));
  }, []);
  return rows.length || proposal?.lines?.length ? (
    <section style={{ display: "grid", gap: "1rem" }}>
      {proposal?.lines?.length ? (
        <div className="ee-form">
          <h2 style={{ margin: 0 }}>Your proposal</h2>
          <p style={{ margin: 0 }}>
            {proposal.status} · {proposal.total} · deposit {proposal.deposit}
          </p>
          {proposal.lines.map((line: any) => (
            <p key={line.id} style={{ margin: 0 }}>
              {line.name} · {line.amount || line.rate}
            </p>
          ))}
        </div>
      ) : null}
      {rows.length ? (
        <>
          <DataTable id="client-events" columns={[{ key: "event_name", label: "Event" }, { key: "event_date", label: "Date" }, { key: "status", label: "Status" }]} rows={rows} />
          <BookingDetail booking={rows[0]} />
        </>
      ) : null}
    </section>
  ) : (
    <EmptyState title="No events yet" message="When you book, your events show here." />
  );
}

function Pay() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");

  const reload = () => {
    call("entertainment_express.api.portal_client.list_invoices", {})
      .then((res) => setRows(res || []))
      .catch((err) => setError(err.message || "Could not load invoices."));
  };

  React.useEffect(() => {
    reload();
  }, []);

  const pay = async (invoice: any) => {
    setBusy(invoice.id);
    setError("");
    try {
      const session = await call("entertainment_express.api.portal_client.start_checkout", { invoice_name: invoice.id });
      if (session?.checkout_url) {
        window.location.href = session.checkout_url;
        return;
      }
      setError("Checkout is not ready yet. Ask your coordinator to send a payment link.");
    } catch (err: any) {
      setError(err.message || "Could not start checkout.");
    } finally {
      setBusy("");
    }
  };

  if (error && !rows.length) return <EmptyState title="Pay" message={error} />;
  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {rows.length ? (
        rows.map((row) => (
          <article key={row.id} className="ee-job-card" style={{ background: "var(--ee-panel)", borderRadius: "var(--ee-radius)", padding: "0.85rem" }}>
            <h3 style={{ margin: 0 }}>{row.title}</h3>
            <p style={{ margin: "0.35rem 0", color: "var(--ee-muted)" }}>
              {row.event ? `${row.event} · ` : ""}
              {row.status} · still owed {row.outstanding}
            </p>
            {row.can_pay ? (
              <button type="button" className="ee-btn" disabled={busy === row.id} onClick={() => pay(row)}>
                {busy === row.id ? "Opening checkout…" : "Pay now"}
              </button>
            ) : (
              <p style={{ margin: 0, color: "var(--ee-success)" }}>Paid</p>
            )}
          </article>
        ))
      ) : (
        <EmptyState title="Nothing due" message="When an invoice is ready, you can pay the deposit or balance here." />
      )}
    </section>
  );
}

function Documents() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState<any>(null);
  const [signer, setSigner] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const reload = () => {
    call("entertainment_express.api.portal_client.list_contracts", {})
      .then((res) => setRows(res || []))
      .catch((err) => setError(err.message || "Could not load documents."));
  };

  React.useEffect(() => {
    reload();
  }, []);

  const openContract = async (row: any) => {
    if (row.kind === "receipt") return;
    setError("");
    try {
      const doc = await call("entertainment_express.api.portal_client.get_contract", { name: row.id });
      setOpen(doc);
      setSigner(doc.signer_name || "");
    } catch (err: any) {
      setError(err.message || "Could not open this contract.");
    }
  };

  const sign = async () => {
    if (!open) return;
    setBusy(true);
    setError("");
    try {
      await call("entertainment_express.api.portal_client.sign_contract", {
        name: open.contract_name,
        signer_name: signer,
        signature_typed: signer,
      });
      setOpen(null);
      reload();
    } catch (err: any) {
      setError(err.message || "Could not sign.");
    } finally {
      setBusy(false);
    }
  };

  if (open) {
    return (
      <section className="ee-form" style={{ maxWidth: "48rem" }}>
        <button type="button" className="ee-back" onClick={() => setOpen(null)}>
          ← Documents
        </button>
        <h1 style={{ margin: 0 }}>Contract</h1>
        <div dangerouslySetInnerHTML={{ __html: open.rendered_html || "" }} />
        {open.status === "signed" ? (
          <p style={{ color: "var(--ee-success)", margin: 0 }}>This is already signed.</p>
        ) : (
          <>
            <FormField label="Your full legal name">
              <input value={signer} onChange={(e) => setSigner(e.target.value)} />
            </FormField>
            <p style={{ color: "var(--ee-muted)", margin: 0 }}>
              Typing your name is your electronic signature.
            </p>
            {error ? <p className="ee-form__error">{error}</p> : null}
            <button type="button" className="ee-btn" disabled={busy || !signer.trim()} onClick={sign}>
              {busy ? "Signing…" : "I agree and sign"}
            </button>
          </>
        )}
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {rows.length ? (
        <DataTable
          id="client-documents"
          columns={[
            { key: "title", label: "Document" },
            { key: "status", label: "Status" },
            { key: "event", label: "Event" },
          ]}
          rows={rows}
          onRowClick={openContract}
        />
      ) : (
        <EmptyState title="No documents yet" message="Contracts to sign and copies of signed agreements show here." />
      )}
    </section>
  );
}

function EventPicker({ booking, events, onChange }: { booking: string; events: any[]; onChange: (name: string) => void }) {
  if (events.length < 2) return null;
  return (
    <FormField label="Event">
      <select value={booking} onChange={(e) => onChange(e.target.value)}>
        {events.map((row) => (
          <option key={row.name} value={row.name}>
            {row.event_name || row.name}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function Planning({ booking }: { booking?: string }) {
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);
  const [items, setItems] = React.useState<any[]>([]);
  const [title, setTitle] = React.useState("");
  const [form, setForm] = React.useState<any>(null);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [timeline, setTimeline] = React.useState<any>(null);
  const [songs, setSongs] = React.useState<any[]>([]);
  const [song, setSong] = React.useState("");
  const [wish, setWish] = React.useState<any[]>([]);
  const eventId = booking || "";

  const reload = () => {
    if (!eventId) return;
    call("entertainment_express.api.portal_collaboration.list_plan_items", { booking: eventId })
      .then((res) => setItems(res || []))
      .catch(() => setItems([]));
    call("entertainment_express.api.planning.get_form", { booking_name: eventId })
      .then((res) => {
        setForm(res);
        const seed: Record<string, string> = {};
        for (const field of res.fields || []) seed[field.field_key] = field.value || "";
        setAnswers(seed);
      })
      .catch(() => setForm(null));
    call("entertainment_express.api.timeline.get_timeline", { booking_name: eventId })
      .then(setTimeline)
      .catch(() => setTimeline(null));
    call("entertainment_express.api.music.list_selections", { booking_name: eventId })
      .then((res) => setSongs(res || []))
      .catch(() => setSongs([]));
    if (!guest) {
      call("entertainment_express.api.catalog.wishlist_list", {})
        .then((res) => setWish(res || []))
        .catch(() => setWish([]));
    }
  };

  React.useEffect(() => {
    reload();
  }, [eventId, guest]);

  if (!eventId) {
    return <EmptyState title="Pick an event" message="Open an event first, then add songs, add-ons, and ideas." />;
  }

  return (
    <section style={{ display: "grid", gap: "1.25rem" }}>
      {form ? (
        <div className="ee-form">
          <h2 style={{ margin: 0 }}>{form.template_name || "Event details"}</h2>
          {(form.fields || [])
            .filter((field: any) => field.visible !== false)
            .map((field: any) => (
              <FormField key={field.field_key} label={field.label}>
                {field.field_type === "select" ? (
                  <select value={answers[field.field_key] || ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [field.field_key]: e.target.value }))} disabled={guest}>
                    <option value="">Choose</option>
                    {(field.options || []).map((opt: string) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input value={answers[field.field_key] || ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [field.field_key]: e.target.value }))} readOnly={guest} />
                )}
              </FormField>
            ))}
          {!guest ? (
            <button
              type="button"
              className="ee-btn"
              onClick={async () => {
                await call("entertainment_express.api.planning.save_answers", { instance_name: form.name, answers });
                reload();
              }}
            >
              Save details
            </button>
          ) : null}
        </div>
      ) : (
        <EmptyState title="Event details" message="Your questionnaire shows here after the date is confirmed." />
      )}

      <div className="ee-form">
        <h2 style={{ margin: 0 }}>Run of show</h2>
        {timeline?.items?.length ? (
          timeline.items.map((row: any, idx: number) => (
            <p key={row.name || idx} style={{ margin: 0 }}>
              {row.start_time || row.time || ""} {row.title || row.label}
            </p>
          ))
        ) : (
          <p className="ee-muted">The timeline appears here once it is shared.</p>
        )}
      </div>

      <div className="ee-form">
        <h2 style={{ margin: 0 }}>Music</h2>
        <FormField label="Must-play or request">
          <input value={song} onChange={(e) => setSong(e.target.value)} />
        </FormField>
        <button
          type="button"
          className="ee-btn"
          onClick={async () => {
            await call("entertainment_express.api.music.add_selection", { booking_name: eventId, category: "must_play", free_text: song });
            setSong("");
            reload();
          }}
        >
          Add song
        </button>
        {songs.map((row: any) => (
          <p key={row.name} style={{ margin: 0 }}>
            {row.category}: {row.free_text || row.song}
          </p>
        ))}
      </div>

      {wish.length ? (
        <div className="ee-form">
          <h2 style={{ margin: 0 }}>Saved packages</h2>
          {wish.map((row: any) => (
            <p key={row.name} style={{ margin: 0 }}>
              {row.item_name || row.item}
            </p>
          ))}
        </div>
      ) : null}

      <FormField label="Suggest an idea">
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormField>
      <button
        type="button"
        onClick={async () => {
          await call("entertainment_express.api.portal_collaboration.suggest_plan_item", { booking: eventId, title });
          setTitle("");
          reload();
        }}
        style={{ width: "fit-content", background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.5rem 0.8rem" }}
      >
        Add idea
      </button>
      {items.length ? (
        <DataTable id="plan-items" columns={[{ key: "title", label: "Idea" }, { key: "source", label: "From" }, { key: "status", label: "Status" }, { key: "votes", label: "Votes" }]} rows={items} />
      ) : (
        <EmptyState title="No ideas yet" message="Guests and the host can suggest add-ons and vote." />
      )}
    </section>
  );
}

function People({ booking }: { booking?: string }) {
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);
  const [rows, setRows] = React.useState<any[]>([]);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const eventId = booking || "";

  const reload = () => {
    if (!eventId) return;
    call("entertainment_express.api.portal_collaboration.list_invites", { booking: eventId })
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  };

  React.useEffect(() => {
    reload();
  }, [eventId]);

  if (guest) {
    return <EmptyState title="People" message="Only the host can invite others." />;
  }

  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <FormField label="Invite email">
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <button
        type="button"
        disabled={!eventId}
        onClick={async () => {
          await call("entertainment_express.api.portal_collaboration.invite_guest", { booking: eventId, email, full_name: name });
          setEmail("");
          setName("");
          reload();
        }}
        style={{ width: "fit-content", background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.5rem 0.8rem" }}
      >
        Send invite
      </button>
      {rows.length
        ? rows.map((row: any) => (
            <div key={row.name} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", background: "var(--ee-panel)", padding: "0.75rem", borderRadius: "var(--ee-radius)" }}>
              <span>
                {row.full_name || row.email} · {row.status}
              </span>
              <button
                type="button"
                className="ee-btn ee-btn--danger"
                onClick={async () => {
                  await call("entertainment_express.api.portal_collaboration.revoke_invite", { booking: eventId, invite: row.name });
                  reload();
                }}
              >
                Remove
              </button>
            </div>
          ))
        : (
        <EmptyState title="No guests yet" message="Invite wedding-party or co-hosts. They can plan and chat, not pay." />
      )}
    </section>
  );
}

function Chat({ booking }: { booking?: string }) {
  const [rows, setRows] = React.useState<any[]>([]);
  const [text, setText] = React.useState("");
  const eventId = booking || "";
  const reload = () => {
    if (!eventId) return;
    call("entertainment_express.api.portal_collaboration.list_messages", { booking: eventId })
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  };
  React.useEffect(() => {
    reload();
  }, [eventId]);
  if (!eventId) return <EmptyState title="Chat" message="Open an event to message the host and talent." />;
  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <ul>
        {rows.map((row) => (
          <li key={row.name}>
            <strong>{row.author}</strong>: {row.message_body}
          </li>
        ))}
      </ul>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
      <button
        type="button"
        onClick={async () => {
          await call("entertainment_express.api.portal_collaboration.post_message", { booking: eventId, message_body: text });
          setText("");
          reload();
        }}
        style={{ width: "fit-content", background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.5rem 0.8rem" }}
      >
        Send
      </button>
    </section>
  );
}

function Appointments() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [pick, setPick] = React.useState("");
  const [slots, setSlots] = React.useState<any[]>([]);
  const [start, setStart] = React.useState("");
  const [error, setError] = React.useState("");

  const reload = () => {
    call("entertainment_express.api.appointments.list_mine", {})
      .then((res) => setRows(res || []))
      .catch((err) => setError(err.message || "Could not load meetings."));
  };

  React.useEffect(() => {
    reload();
  }, []);

  const loadSlots = async (row: any) => {
    setError("");
    setPick(row.id);
    setStart("");
    try {
      const next = await call("entertainment_express.api.appointments.list_slots", { meeting_type: row.meeting_type });
      setSlots(next || []);
    } catch (err: any) {
      setSlots([]);
      setError(err.message || "Could not load open times.");
    }
  };

  if (error && !rows.length) return <EmptyState title="Meetings" message={error} />;

  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Meetings</h1>
        <p className="ee-muted">Consults you booked with us. Event jobs stay under Events.</p>
      </header>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {rows.length ? (
        rows.map((row) => (
          <article key={row.id} style={{ background: "var(--ee-panel)", borderRadius: "var(--ee-radius)", padding: "0.85rem" }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              {row.title} · {row.start}
            </p>
            <p className="ee-muted" style={{ margin: "0.25rem 0 0.5rem" }}>
              {row.status}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" className="ee-btn" onClick={() => loadSlots(row)}>
                Move
              </button>
              <button
                type="button"
                className="ee-btn ee-btn--ghost"
                onClick={async () => {
                  setError("");
                  try {
                    await call("entertainment_express.api.appointments.cancel", { name: row.id });
                    setPick("");
                    reload();
                  } catch (err: any) {
                    setError(err.message || "Could not cancel.");
                  }
                }}
              >
                Cancel
              </button>
            </div>
            {pick === row.id ? (
              <form
                className="ee-form"
                style={{ marginTop: "0.75rem" }}
                onSubmit={async (event) => {
                  event.preventDefault();
                  setError("");
                  try {
                    await call("entertainment_express.api.appointments.reschedule", { name: row.id, start });
                    setPick("");
                    reload();
                  } catch (err: any) {
                    setError(err.message || "That time just filled.");
                  }
                }}
              >
                <FormField label="New time">
                  <select value={start} onChange={(e) => setStart(e.target.value)} required>
                    <option value="">Pick a time</option>
                    {slots.map((slot) => (
                      <option key={slot.start} value={slot.start}>
                        {slot.start}
                      </option>
                    ))}
                  </select>
                </FormField>
                <button type="submit" className="ee-btn" disabled={!start}>
                  Save new time
                </button>
              </form>
            ) : null}
          </article>
        ))
      ) : (
        <EmptyState title="No meetings" message="When you book a consult, it shows up here." />
      )}
    </section>
  );
}

function Photos() {
  return <EmptyState title="Photos" message="Galleries show here after the event." />;
}

function EventScoped({ children }: { children: (booking: string) => React.ReactNode }) {
  const { booking } = useParams();
  return <>{children(booking || "")}</>;
}

export function ClientApp() {
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    call("entertainment_express.api.portal_collaboration.list_my_events", {})
      .then((res) => setEvents(res || []))
      .catch(() => setEvents([]));
  }, []);

  const booking = searchParams.get("booking") || events[0]?.name || "";

  React.useEffect(() => {
    if (searchParams.get("booking") || !events[0]?.name) return;
    setSearchParams({ booking: events[0].name }, { replace: true });
  }, [events, searchParams, setSearchParams]);

  const setBooking = (name: string) => setSearchParams({ booking: name });

  const nav = guest
    ? [
        { to: "/", label: "This event" },
        { to: "/planning", label: "Planning" },
        { to: "/chat", label: "Chat" },
        { to: "/photos", label: "Photos" },
      ]
    : [
        { to: "/", label: "Home" },
        { to: "/events", label: "Events" },
        { to: "/pay", label: "Pay" },
        { to: "/documents", label: "Documents" },
        { to: "/appointments", label: "Meetings" },
        { to: "/planning", label: "Planning" },
        { to: "/people", label: "People" },
        { to: "/chat", label: "Chat" },
        { to: "/photos", label: "Photos" },
      ];

  const href = (to: string) => (booking ? `${to}?booking=${encodeURIComponent(booking)}` : to);

  const sidebar = nav.map((item) => (
    <NavLink key={item.to} to={href(item.to)} end={item.to === "/"} className={({ isActive }) => (isActive ? "ee-nav-active" : "")}>
      {item.label}
    </NavLink>
  ));

  const scoped = (node: React.ReactNode) => (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <EventPicker booking={booking} events={events} onChange={setBooking} />
      {node}
    </section>
  );

  return (
    <AppShell title={guest ? "This event" : "Your events"} portal="client" density="consumer" sidebar={sidebar} showSearch={!guest}>
      <Routes>
        <Route path="/" element={<Home booking={booking} events={events} />} />
        <Route path="/events" element={guest ? <EmptyState title="Events" message="You only see this event." /> : <Events />} />
        <Route path="/pay" element={guest ? <EmptyState title="Payments" message="Only the host can pay." /> : <Pay />} />
        <Route path="/documents" element={guest ? <EmptyState title="Documents" message="Contracts stay with the host." /> : <Documents />} />
        <Route path="/appointments" element={guest ? <EmptyState title="Meetings" message="Only the host can manage meetings." /> : <Appointments />} />
        <Route path="/planning" element={scoped(<Planning booking={booking} />)} />
        <Route path="/people" element={scoped(<People booking={booking} />)} />
        <Route path="/chat" element={scoped(<Chat booking={booking} />)} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/account" element={<AccountPanel />} />
        <Route path="/events/:booking" element={<EventScoped>{(b) => <Planning booking={b} />}</EventScoped>} />
        <Route path="*" element={<EmptyState title="Not found" message="That page is not in your event portal." />} />
      </Routes>
    </AppShell>
  );
}
