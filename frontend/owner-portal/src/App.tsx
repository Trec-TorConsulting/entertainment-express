import React from "react";
import { Navigate, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  AccountPanel,
  AppShell,
  ConflictBanner,
  DataTable,
  DispatchBoard,
  EmptyState,
  FormField,
  JobCrewPanel,
  ModeSwitch,
  RecordEditor,
  RecordList,
  StatCard,
  call,
  downloadBase64,
  downloadText,
  getSessionBootstrap,
} from "../../portal-kit/src";

const OWNER_NAV = [
  {
    label: "Operations",
    items: [
      { to: "/", label: "Today" },
      { to: "/calendar", label: "Calendar" },
      { to: "/pipeline", label: "Pipeline" },
      { to: "/schedule", label: "Consults" },
      { to: "/dispatch", label: "Dispatch" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/catalog", label: "Packages" },
      { to: "/gear", label: "Gear" },
      { to: "/people", label: "People" },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/money", label: "Money" },
      { to: "/reports", label: "Reports" },
      { to: "/automations", label: "Reminders" },
      { to: "/brand", label: "Brand" },
    ],
  },
];

function Today() {
  const person = getSessionBootstrap().person;
  const [stats, setStats] = React.useState<any>(null);
  const [approvals, setApprovals] = React.useState<any[]>([]);
  const [workflows, setWorkflows] = React.useState<any[]>([]);
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  React.useEffect(() => {
    call("entertainment_express.api.portal_owner.get_owner_dashboard", {})
      .then(setStats)
      .catch(() => setStats({ revenue: "0.00", outstanding_balance: "0.00", at_risk_count: 0, unread_chat: 0, jobs: [] }));
    call("entertainment_express.api.portal_owner.get_approvals", {})
      .then((res) => setApprovals(res || []))
      .catch(() => setApprovals([]));
    call("entertainment_express.api.portal_proposal.today_workflows", {})
      .then((res) => setWorkflows(res || []))
      .catch(() => setWorkflows([]));
  }, []);

  const jobs = stats?.jobs || [];
  const first = (person?.full_name || "there").split(" ")[0];

  return (
    <section className="ee-today">
      <div className="ee-today__hero">
        <div>
          <p className="ee-lead" style={{ marginBottom: "0.2rem" }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1>
            {hello}, {first}
          </h1>
        </div>
      </div>
      <div className="ee-metrics">
        <StatCard label="What customers owe" value={String(stats?.outstanding_balance || "0.00")} />
        <StatCard label="Jobs on the books" value={String(stats?.new_bookings || jobs.length || 0)} />
        <StatCard label="Needs a crew" value={String(stats?.at_risk_count || 0)} />
        <StatCard label="Open tasks" value={String((approvals.length || 0) + (stats?.unread_chat || 0))} />
      </div>
      <div className="ee-split">
        <div className="ee-job-grid">
          {jobs.length ? (
            jobs.slice(0, 8).map((job: any) => (
              <article key={job.name} className="ee-job-card">
                <h3>
                  <NavLink to={`/calendar/${encodeURIComponent(job.name)}`}>{job.event_name || job.name}</NavLink>
                </h3>
                <p>
                  {job.event_date} {job.start_time ? `· ${job.start_time}` : ""} · {job.status}
                </p>
                {job.venue_address ? <p>{job.venue_address}</p> : null}
                {job.planning_incomplete ? <p>Planning {Math.round(Number(job.planning_percent) || 0)}% complete</p> : null}
                {job.balance_due ? <p>Left {job.balance_due}</p> : null}
              </article>
            ))
          ) : (
            <EmptyState title="No jobs this week" message="When a booking is confirmed it shows up here." actionLabel="Add a job" onAction={() => (window.location.href = "/owner/calendar/new")} />
          )}
        </div>
        {approvals.length ? (
          <ApprovalsList rows={approvals} onChanged={() => call("entertainment_express.api.portal_owner.get_approvals", {}).then((res) => setApprovals(res || [])).catch(() => setApprovals([]))} />
        ) : (
          <EmptyState title="You're clear" message="Open tasks assigned to your team land here. Event chat is in Inbox." />
        )}
      </div>
      {workflows.length ? (
        <section className="ee-form" style={{ maxWidth: "none" }}>
          <h2 style={{ margin: 0 }}>Next on each job</h2>
          {workflows.map((row) => (
            <p key={row.id} style={{ margin: 0 }}>
              <NavLink to={`/calendar/${encodeURIComponent(row.id)}`}>{row.event_name}</NavLink>
              {" · "}
              {row.next}
              {row.conflicts?.length ? ` · ${row.conflicts.length} proposal gap${row.conflicts.length === 1 ? "" : "s"}` : ""}
            </p>
          ))}
        </section>
      ) : null}
    </section>
  );
}

function ApprovalsList({ rows, onChanged }: { rows: any[]; onChanged: () => void }) {
  const act = async (row: any, decision: string) => {
    await call("entertainment_express.api.portal_owner.act_on_approval", {
      approval_type: row.type || row.approval_type || "generic",
      doctype: row.doctype || "Comment",
      name: row.id || row.name,
      decision,
    });
    onChanged();
  };

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {rows.map((row) => (
        <article key={String(row.id || row.name)} style={{ background: "var(--ee-panel)", borderRadius: "var(--ee-radius)", boxShadow: "var(--ee-shadow)", padding: "0.85rem" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{row.summary || row.type || "Approval"}</p>
          <p style={{ margin: "0.25rem 0 0.75rem", color: "var(--ee-muted)" }}>{row.event || row.date || ""}</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={() => act(row, "approved")} style={{ background: "var(--ee-success)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.4rem 0.75rem" }}>
              {row.type === "todo" || row.type === "workflow" ? "Done" : "Approve"}
            </button>
            <button type="button" onClick={() => act(row, "rejected")} style={{ background: "var(--ee-danger)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.4rem 0.75rem" }}>
              {row.type === "todo" || row.type === "workflow" ? "Dismiss" : "Reject"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ApprovalsWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);

  const reload = () => {
    call("entertainment_express.api.portal_owner.get_approvals", {})
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  };

  React.useEffect(() => {
    reload();
  }, []);

  return rows.length ? <ApprovalsList rows={rows} onChanged={reload} /> : <EmptyState title="Approvals Queue" message="No pending approvals right now." />;
}

function MoneyWorkspace() {
  const go = useNavigate();
  return <RecordList kind="invoice" basePath="/money" go={go} />;
}

function TeamWorkspace() {
  const ACCESS = [
    { id: "EE Office", label: "Office" },
    { id: "EE Sales", label: "Sales" },
    { id: "EE Dispatcher", label: "Dispatch" },
    { id: "EE Crew", label: "Field crew" },
    { id: "EE Entertainer", label: "Talent" },
    { id: "EE Accounting", label: "Money" },
    { id: "EE Marketing", label: "Marketing" },
  ];
  const [rows, setRows] = React.useState<any[]>([]);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [inviteRoles, setInviteRoles] = React.useState<string[]>(["EE Office"]);
  const [selected, setSelected] = React.useState<any>(null);
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);

  const reload = () => {
    call("entertainment_express.api.portal_owner.list_staff", {})
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  };

  React.useEffect(() => {
    reload();
  }, []);

  const toggle = (current: string[], id: string) =>
    current.includes(id) ? current.filter((role) => role !== id) : [...current, id];

  const invite = async () => {
    await call("entertainment_express.api.portal_owner.invite_staff", {
      email,
      full_name: name,
      roles: inviteRoles.length ? inviteRoles : ["EE Office"],
    });
    setEmail("");
    setName("");
    setInviteRoles(["EE Office"]);
    reload();
  };

  const saveRoles = async () => {
    if (!selected) return;
    await call("entertainment_express.api.portal_owner.set_staff_roles", { user: selected.name, roles: selectedRoles });
    reload();
  };

  const deactivate = async () => {
    if (!selected) return;
    await call("entertainment_express.api.portal_owner.deactivate_staff", { user: selected.name });
    setSelected(null);
    reload();
  };

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header className="ee-records__bar">
        <h1>People</h1>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
        <FormField label="Email">
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
      </div>
      <fieldset className="ee-form" style={{ maxWidth: "none", padding: "0.85rem" }}>
        <legend style={{ fontWeight: 600 }}>Access</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {ACCESS.map((role) => (
            <label key={role.id} style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
              <input type="checkbox" checked={inviteRoles.includes(role.id)} onChange={() => setInviteRoles(toggle(inviteRoles, role.id))} />
              {role.label}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="button" onClick={invite} className="ee-btn" style={{ width: "fit-content" }}>
        Invite staff
      </button>
      {rows.length ? (
        <DataTable
          id="owner-team"
          columns={[
            { key: "full_name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "access", label: "Access" },
          ]}
          rows={rows}
          onRowClick={(row) => {
            setSelected(row);
            setSelectedRoles((row.roles || []).filter((role: string) => ACCESS.some((item) => item.id === role)));
          }}
        />
      ) : (
        <EmptyState title="Team" message="Invite the first person who helps run jobs." />
      )}
      {selected ? (
        <div className="ee-form">
          <h2 style={{ margin: 0 }}>{selected.full_name || selected.name}</h2>
          <fieldset>
            <legend>Access</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {ACCESS.map((role) => (
                <label key={role.id} style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                  <input type="checkbox" checked={selectedRoles.includes(role.id)} onChange={() => setSelectedRoles(toggle(selectedRoles, role.id))} />
                  {role.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="ee-form__actions">
            <button type="button" className="ee-btn" onClick={saveRoles}>
              Save access
            </button>
            <button type="button" className="ee-btn ee-btn--danger" onClick={deactivate}>
              Deactivate
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CatalogWorkspace() {
  const go = useNavigate();
  return <RecordList kind="package" basePath="/catalog" go={go} />;
}

function CalendarWorkspace() {
  const go = useNavigate();
  return <RecordList kind="job" basePath="/calendar" go={go} />;
}

function PipelineWorkspace() {
  const go = useNavigate();
  return <RecordList kind="inquiry" basePath="/pipeline" go={go} />;
}

function DispatchWorkspace() {
  return <DispatchBoard canAssign />;
}

function GearWorkspace() {
  const go = useNavigate();
  return <RecordList kind="gear" basePath="/gear" go={go} />;
}

function CrudEditor({ kind, basePath }: { kind: string; basePath: string }) {
  const go = useNavigate();
  const { id } = useParams();
  return (
    <>
      <RecordEditor kind={kind} basePath={basePath} go={go} recordId={id} />
      {id && id !== "new" && (kind === "job" || kind === "inquiry") ? <RecordExtras kind={kind} id={id} /> : null}
    </>
  );
}

function RecordExtras({ kind, id }: { kind: string; id: string }) {
  const go = useNavigate();
  const [cloneDate, setCloneDate] = React.useState("");
  const [error, setError] = React.useState("");
  const [checklist, setChecklist] = React.useState<any[]>([]);
  const [conflicts, setConflicts] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (kind !== "job") return;
    call("entertainment_express.api.portal_proposal.job_checklist", { name: id })
      .then((res) => setChecklist(res || []))
      .catch(() => setChecklist([]));
    call("entertainment_express.api.portal_proposal.quote_conflicts", { booking: id })
      .then((res) => setConflicts(res || []))
      .catch(() => setConflicts([]));
  }, [kind, id]);

  return (
    <>
      <section className="ee-form" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0 }}>Next steps</h2>
        {checklist.map((step) => (
          <p key={step.key} style={{ margin: 0, color: step.done ? "var(--ee-success)" : "var(--ee-text)" }}>
            {step.done ? "✓" : "○"} {step.label}
          </p>
        ))}
        {conflicts.map((row) => (
          <p key={row.id} style={{ margin: 0, color: "var(--ee-danger)" }}>
            {row.title}: {row.message}
          </p>
        ))}
        <div className="ee-form__actions">
          <button type="button" className="ee-btn" onClick={() => go(`${kind === "job" ? "/calendar" : "/pipeline"}/${encodeURIComponent(id)}/proposal`)}>
            Open proposal
          </button>
        </div>
        {kind === "job" ? (
          <>
            <FormField label="Clone to a new date">
              <input type="date" value={cloneDate} onChange={(e) => setCloneDate(e.target.value)} />
            </FormField>
            {error ? <p className="ee-form__error">{error}</p> : null}
            <button
              type="button"
              className="ee-btn"
              disabled={!cloneDate}
              onClick={async () => {
                setError("");
                try {
                  const saved = await call("entertainment_express.api.portal_crud.clone_job", { name: id, event_date: cloneDate });
                  go(`/calendar/${encodeURIComponent(saved.name || saved.id)}`);
                } catch (err: any) {
                  setError(err.message || "Could not clone this job.");
                }
              }}
            >
              Clone job
            </button>
          </>
        ) : null}
      </section>
      {kind === "job" ? <JobCrewPanel jobId={id} /> : null}
    </>
  );
}

function ProposalWorkspace() {
  const { id } = useParams();
  const go = useNavigate();
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const source = path.includes("/pipeline/") ? "inquiry" : "job";
  const basePath = source === "inquiry" ? "/pipeline" : "/calendar";
  const [doc, setDoc] = React.useState<any>(null);
  const [picked, setPicked] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const reload = () => {
    if (!id) return;
    call("entertainment_express.api.portal_proposal.get_proposal", { source, name: id })
      .then((res) => {
        setDoc(res);
        const next: Record<string, boolean> = {};
        for (const line of res.lines || []) next[line.id] = true;
        setPicked(next);
      })
      .catch((err) => setError(err.message || "Could not open the proposal."));
  };

  React.useEffect(() => {
    reload();
  }, [id, source]);

  const selected = (doc?.catalog || []).filter((row: any) => picked[row.id]).map((row: any) => ({ id: row.id, kind: row.kind, qty: 1, rate_raw: row.rate_raw }));

  const save = async (send = false) => {
    setBusy(true);
    setError("");
    try {
      await call("entertainment_express.api.portal_proposal.save_proposal", { source, name: id, selected, deposit_percent: doc?.deposit_percent || 25 });
      if (send) await call("entertainment_express.api.portal_proposal.send_proposal", { source, name: id });
      reload();
    } catch (err: any) {
      setError(err.message || "Could not save the proposal.");
    } finally {
      setBusy(false);
    }
  };

  if (error && !doc) return <EmptyState title="Proposal" message={error} />;
  if (!doc) return <p className="ee-muted">Loading…</p>;

  return (
    <section className="ee-records">
      <header className="ee-records__bar">
        <div>
          <button type="button" className="ee-back" onClick={() => go(`${basePath}/${encodeURIComponent(id || "")}`)}>
            ← Back
          </button>
          <h1>Proposal for {doc.party}</h1>
          <p className="ee-muted">{doc.status}</p>
        </div>
      </header>
      <div className="ee-form" style={{ maxWidth: "none" }}>
        {(doc.conflicts || []).map((row: any) => (
          <ConflictBanner key={row.id || row.title} title={row.title} message={row.message} severity={row.severity || "potential"} />
        ))}
        {(doc.catalog || []).map((row: any) => (
          <label key={`${row.kind}:${row.id}`} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
            <input type="checkbox" checked={!!picked[row.id]} onChange={() => setPicked((prev) => ({ ...prev, [row.id]: !prev[row.id] }))} />
            <span>
              <strong>{row.name}</strong> · {row.rate}
              {row.description ? <span style={{ display: "block", color: "var(--ee-muted)" }}>{row.description}</span> : null}
            </span>
          </label>
        ))}
        <p style={{ margin: 0 }}>
          Total {doc.total} · Deposit {doc.deposit}
        </p>
        {error ? <p className="ee-form__error">{error}</p> : null}
        <div className="ee-form__actions">
          <button type="button" className="ee-btn" disabled={busy} onClick={() => save(false)}>
            Save
          </button>
          <button type="button" className="ee-btn" disabled={busy} onClick={() => save(true)}>
            Send to client
          </button>
        </div>
      </div>
    </section>
  );
}

function ReportsWorkspace() {
  const [pack, setPack] = React.useState<any>(null);
  React.useEffect(() => {
    call("entertainment_express.api.portal_reports.owner_pack", {}).then(setPack).catch(() => setPack(null));
  }, []);
  if (!pack) return <EmptyState title="Reports" message="Company snapshots appear here." />;
  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <StatCard label="Jobs" value={String(pack.jobs ?? 0)} />
        <StatCard label="Billed" value={String(pack.revenue || "0.00")} />
        <StatCard label="Still owed" value={String(pack.outstanding || "0.00")} />
        <StatCard label="Needs a crew" value={String(pack.at_risk ?? 0)} />
        <StatCard label="Payouts due" value={String(pack.payouts_due || "0.00")} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={async () => {
            const csv = await call("entertainment_express.api.portal_reports.owner_pack_csv", {});
            downloadText("company-reports.csv", String(csv || ""), "text/csv");
          }}
          style={{ background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.5rem 0.8rem" }}
        >
          Download spreadsheet
        </button>
        <button
          type="button"
          onClick={async () => {
            const pdf = await call("entertainment_express.api.portal_reports.owner_pack_pdf", {});
            if (pdf?.content_b64) downloadBase64(pdf.filename || "company-reports.pdf", pdf.content_b64, "application/pdf");
          }}
          style={{ background: "var(--ee-panel)", color: "var(--ee-text)", border: "1px solid var(--ee-border)", borderRadius: "0.5rem", padding: "0.5rem 0.8rem" }}
        >
          Download for accountant
        </button>
      </div>
    </section>
  );
}

function ScheduleWorkspace() {
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [types, setTypes] = React.useState<any[]>([]);
  const [rows, setRows] = React.useState<any[]>([]);
  const [staff, setStaff] = React.useState<any[]>([]);
  const [employee, setEmployee] = React.useState("");
  const [hours, setHours] = React.useState<{ weekday: string; start_time: string; end_time: string }[]>([]);
  const [name, setName] = React.useState("Free consultation");
  const [duration, setDuration] = React.useState("30");
  const [error, setError] = React.useState("");

  const applyStaff = (row: any) => {
    setEmployee(row.id);
    const byDay = Object.fromEntries((row.hours || []).map((h: any) => [h.weekday, h]));
    setHours(
      weekdays.map((day) => {
        const saved = byDay[day];
        const weekend = day === "Saturday" || day === "Sunday";
        return {
          weekday: day,
          start_time: saved?.start_time || (weekend ? "" : "09:00:00"),
          end_time: saved?.end_time || (weekend ? "" : "17:00:00"),
        };
      })
    );
  };

  const reload = () => {
    call("entertainment_express.api.appointments.list_types", {})
      .then(setTypes)
      .catch(() => setTypes([]));
    call("entertainment_express.api.appointments.list_mine", {})
      .then(setRows)
      .catch(() => setRows([]));
    call("entertainment_express.api.appointments.list_consult_staff", {})
      .then((list) => {
        const next = list || [];
        setStaff(next);
        setEmployee((current) => {
          const row = next.find((s: any) => s.id === current) || next[0];
          if (row) applyStaff(row);
          return row?.id || "";
        });
      })
      .catch(() => setStaff([]));
  };

  React.useEffect(() => {
    reload();
  }, []);

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Consults</h1>
        <p className="ee-muted">Times people can book on your public schedule page.</p>
      </header>
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await call("entertainment_express.api.appointments.save_meeting_type", { values: { name, duration } });
            setName("");
            reload();
          } catch (err: any) {
            setError(err.message || "Could not save that meeting.");
          }
        }}
      >
        <FormField label="Meeting name">
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Length (minutes)">
          <input value={duration} onChange={(e) => setDuration(e.target.value)} />
        </FormField>
        {error ? <p className="ee-form__error">{error}</p> : null}
        <button type="submit" className="ee-btn">
          Save meeting type
        </button>
      </form>
      {types.length ? (
        <ul>
          {types.map((row) => (
            <li key={row.id}>
              {row.name} · {row.duration} min
            </li>
          ))}
        </ul>
      ) : (
        <p className="ee-muted">Add a meeting type to open public booking.</p>
      )}
      {staff.length ? (
        <form
          className="ee-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              await call("entertainment_express.api.appointments.save_hours", { employee, hours });
              reload();
            } catch (err: any) {
              setError(err.message || "Could not save hours.");
            }
          }}
        >
          <FormField label="Who is bookable">
            <select
              value={employee}
              onChange={(e) => {
                const row = staff.find((s) => s.id === e.target.value);
                if (row) applyStaff(row);
              }}
            >
              {staff.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </FormField>
          {hours.map((row, idx) => (
            <div key={row.weekday} style={{ display: "grid", gridTemplateColumns: "7rem 1fr 1fr", gap: "0.5rem", alignItems: "center" }}>
              <span>{row.weekday.slice(0, 3)}</span>
              <input
                type="time"
                value={(row.start_time || "").slice(0, 5)}
                onChange={(e) => {
                  const next = hours.slice();
                  next[idx] = { ...row, start_time: e.target.value ? `${e.target.value}:00` : "" };
                  setHours(next);
                }}
              />
              <input
                type="time"
                value={(row.end_time || "").slice(0, 5)}
                onChange={(e) => {
                  const next = hours.slice();
                  next[idx] = { ...row, end_time: e.target.value ? `${e.target.value}:00` : "" };
                  setHours(next);
                }}
              />
            </div>
          ))}
          <button type="submit" className="ee-btn">
            Save hours
          </button>
        </form>
      ) : (
        <p className="ee-muted">Add active people first, then set the hours they can be booked.</p>
      )}
      {rows.length ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {rows.map((row) => (
            <article key={row.id} style={{ background: "var(--ee-panel)", borderRadius: "var(--ee-radius)", padding: "0.85rem" }}>
              <p style={{ margin: 0, fontWeight: 700 }}>
                {row.title} · {row.who}
              </p>
              <p className="ee-muted" style={{ margin: "0.25rem 0 0.5rem" }}>
                {row.start}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="ee-btn"
                  onClick={async () => {
                    await call("entertainment_express.api.appointments.complete", { name: row.id, decision: "completed" });
                    reload();
                  }}
                >
                  Done
                </button>
                <button
                  type="button"
                  className="ee-btn ee-btn--ghost"
                  onClick={async () => {
                    await call("entertainment_express.api.appointments.cancel", { name: row.id });
                    reload();
                  }}
                >
                  Cancel
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="ee-muted">Upcoming consults show here.</p>
      )}
    </section>
  );
}

function AutomationsWorkspace() {
  const [doc, setDoc] = React.useState<any>(null);
  const [error, setError] = React.useState("");

  const reload = () => {
    call("entertainment_express.api.workflow.get_automations", {})
      .then(setDoc)
      .catch((err) => setError(err.message || "Could not load reminders."));
  };

  React.useEffect(() => {
    reload();
  }, []);

  const toggle = async (key: string, enabled: boolean) => {
    setError("");
    try {
      const next = await call("entertainment_express.api.workflow.set_automation", { key, enabled: enabled ? 0 : 1 });
      setDoc(next);
    } catch (err: any) {
      setError(err.message || "Could not save that reminder.");
    }
  };

  if (error && !doc) return <EmptyState title="Reminders" message={error} />;
  if (!doc) return <p className="ee-muted">Loading…</p>;

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Reminders</h1>
        <p className="ee-muted">Turn automatic follow-ups on or off for this company.</p>
      </header>
      {error ? <p className="ee-form__error">{error}</p> : null}
      <div className="ee-form" style={{ maxWidth: "none" }}>
        {(doc.toggles || []).map((row: any) => (
          <label key={row.key} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <input type="checkbox" checked={!!row.enabled} onChange={() => toggle(row.key, !!row.enabled)} />
            <span>{row.label}</span>
          </label>
        ))}
      </div>
      {(doc.templates || []).length ? (
        <div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>Checklists</h2>
          <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "grid", gap: "0.75rem" }}>
            {(doc.templates || []).map((tmpl: any) => (
              <li key={tmpl.id}>
                <strong>{tmpl.name}</strong>
                {tmpl.event_type ? <span className="ee-muted"> · {tmpl.event_type}</span> : null}
                <span className="ee-muted"> · {tmpl.active ? "on" : "off"}</span>
                <ul>
                  {(tmpl.tasks || []).map((task: any, idx: number) => (
                    <li key={`${tmpl.id}:${idx}`}>
                      {task.title} ({task.offset_days >= 0 ? "+" : ""}
                      {task.offset_days} days)
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="ee-muted">No checklists yet. Add one in settings when you are ready.</p>
      )}
    </section>
  );
}

function TalentHome() {
  const [day, setDay] = React.useState<any>(null);
  React.useEffect(() => {
    call("entertainment_express.api.portal_employee.get_my_day", {}).then(setDay).catch(() => setDay({ assignments: [] }));
  }, []);
  const rows = day?.assignments || [];
  return rows.length ? (
    <DataTable id="owner-talent" columns={[{ key: "name", label: "Gig" }, { key: "booking", label: "Event" }, { key: "status", label: "Status" }]} rows={rows} />
  ) : (
    <EmptyState title="No gigs on your calendar" message="When you are booked as talent, those jobs show here." />
  );
}

function SettingsWorkspace() {
  const [row, setRow] = React.useState<any>(null);
  const [brandName, setBrandName] = React.useState("");
  const [brandColor, setBrandColor] = React.useState("#0f766e");
  const [saved, setSaved] = React.useState("");

  React.useEffect(() => {
    call("entertainment_express.api.portal_owner.get_brand", {})
      .then((doc) => {
        setRow(doc || {});
        setBrandName(doc?.brand_name || "");
        if (doc?.brand_color) setBrandColor(doc.brand_color);
      })
      .catch(() => setRow({}));
  }, []);

  const save = async () => {
    await call("entertainment_express.api.portal_owner.save_brand", {
      brand_name: brandName,
      brand_color: brandColor,
    });
    document.documentElement.style.setProperty("--ee-brand", brandColor);
    setSaved("Saved");
  };

  return row ? (
    <div className="ee-form">
      <h1 style={{ margin: 0 }}>Brand</h1>
      <FormField label="Company name">
        <input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
      </FormField>
      <FormField label="Brand color">
        <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
      </FormField>
      <button type="button" className="ee-btn" onClick={save} style={{ width: "fit-content" }}>
        Save
      </button>
      {saved ? <p style={{ color: "var(--ee-success)", margin: 0 }}>{saved}</p> : null}
    </div>
  ) : (
    <EmptyState title="Brand" message="Your public name and color show here." />
  );
}

export function OwnerApp() {
  const roles = getSessionBootstrap().roles || [];
  const showTalent = roles.includes("EE Entertainer") || roles.includes("EE Crew");
  const [mode, setMode] = React.useState<"company" | "talent">("company");

  const sidebar = (
    <>
      {OWNER_NAV.map((group) => (
        <React.Fragment key={group.label}>
          <p className="ee-nav-label">{group.label}</p>
          {group.items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => (isActive ? "ee-nav-active" : "")}>
              {item.label}
            </NavLink>
          ))}
        </React.Fragment>
      ))}
    </>
  );

  return (
    <AppShell
      title="Company"
      portal="owner"
      density="cockpit"
      sidebar={mode === "company" ? sidebar : undefined}
      headerExtra={
        showTalent ? (
          <ModeSwitch
            value={mode}
            options={[
              { id: "company", label: "Company" },
              { id: "talent", label: "Talent" },
            ]}
            onChange={(id) => setMode(id as "company" | "talent")}
          />
        ) : null
      }
    >
      {mode === "talent" ? (
        <TalentHome />
      ) : (
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/calendar" element={<CalendarWorkspace />} />
          <Route path="/calendar/new" element={<CrudEditor kind="job" basePath="/calendar" />} />
          <Route path="/calendar/:id/proposal" element={<ProposalWorkspace />} />
          <Route path="/calendar/:id" element={<CrudEditor kind="job" basePath="/calendar" />} />
          <Route path="/pipeline" element={<PipelineWorkspace />} />
          <Route path="/pipeline/new" element={<CrudEditor kind="inquiry" basePath="/pipeline" />} />
          <Route path="/pipeline/:id/proposal" element={<ProposalWorkspace />} />
          <Route path="/pipeline/:id" element={<CrudEditor kind="inquiry" basePath="/pipeline" />} />
          <Route path="/schedule" element={<ScheduleWorkspace />} />
          <Route path="/dispatch" element={<DispatchWorkspace />} />
          <Route path="/catalog" element={<CatalogWorkspace />} />
          <Route path="/catalog/new" element={<CrudEditor kind="package" basePath="/catalog" />} />
          <Route path="/catalog/:id" element={<CrudEditor kind="package" basePath="/catalog" />} />
          <Route path="/gear" element={<GearWorkspace />} />
          <Route path="/gear/new" element={<CrudEditor kind="gear" basePath="/gear" />} />
          <Route path="/gear/:id" element={<CrudEditor kind="gear" basePath="/gear" />} />
          <Route path="/people" element={<TeamWorkspace />} />
          <Route path="/team" element={<Navigate to="/people" replace />} />
          <Route path="/money" element={<MoneyWorkspace />} />
          <Route path="/money/:id" element={<CrudEditor kind="invoice" basePath="/money" />} />
          <Route path="/reports" element={<ReportsWorkspace />} />
          <Route path="/automations" element={<AutomationsWorkspace />} />
          <Route path="/brand" element={<SettingsWorkspace />} />
          <Route path="/account" element={<AccountPanel />} />
          <Route path="/settings" element={<Navigate to="/brand" replace />} />
          <Route path="/approvals" element={<ApprovalsWorkspace />} />
          <Route path="*" element={<EmptyState title="Not found" message="That page is not in your company workspace." />} />
        </Routes>
      )}
    </AppShell>
  );
}
