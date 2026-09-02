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
      { to: "/event-details", label: "Event details" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/catalog", label: "Packages" },
      { to: "/gear", label: "Gear" },
      { to: "/people", label: "People" },
      { to: "/places", label: "Places" },
      { to: "/partners", label: "Partners" },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/money", label: "Money" },
      { to: "/reports", label: "Reports" },
      { to: "/assistant", label: "Assistant" },
      { to: "/plan", label: "Plan" },
      { to: "/automations", label: "Reminders" },
      { to: "/grow", label: "Grow" },
      { to: "/coverage", label: "Coverage" },
      { to: "/move", label: "Move" },
      { to: "/brand", label: "Brand" },
      { to: "/connections", label: "Connections" },
      { to: "/security", label: "Security" },
    ],
  },
];

function Today() {
  const person = getSessionBootstrap().person;
  const [stats, setStats] = React.useState<any>(null);
  const [approvals, setApprovals] = React.useState<any[]>([]);
  const [workflows, setWorkflows] = React.useState<any[]>([]);
  const [setup, setSetup] = React.useState<any>(null);
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [forecast, setForecast] = React.useState<any>(null);

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
    call("entertainment_express.api.migration.onboarding", {})
      .then(setSetup)
      .catch(() => setSetup(null));
    call("entertainment_express.api.ai.forecast", { months: 3 })
      .then(setForecast)
      .catch(() => setForecast(null));
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
      {setup && !setup.complete ? (
        <section className="ee-form" style={{ maxWidth: "none" }}>
          <h2 style={{ margin: 0 }}>Finish setup</h2>
          <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
            {(setup.steps || []).map((step: any) => (
              <li key={step.key}>
                {step.done ? (
                  <>Done · {step.label}</>
                ) : (
                  <NavLink to={step.href}>{step.label}</NavLink>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="ee-metrics">
        <StatCard label="Billed this month" value={String(stats?.revenue || "0.00")} />
        <StatCard label="Open quotes" value={String(stats?.pipeline_value || "0.00")} />
        <StatCard label="What customers owe" value={String(stats?.outstanding_balance || "0.00")} />
        <StatCard label="Jobs on the books" value={String(stats?.new_bookings || jobs.length || 0)} />
        <StatCard label="Needs a crew" value={String(stats?.at_risk_count || 0)} />
        <StatCard label="Open tasks" value={String((approvals.length || 0) + (stats?.unread_chat || 0))} />
      </div>
      {forecast?.periods?.length ? (
        <section className="ee-form" style={{ maxWidth: "none" }}>
          <h2 style={{ margin: 0 }}>Next few months</h2>
          {forecast.available === false ? <p className="ee-muted">AI suggestion unavailable</p> : null}
          <p className="ee-muted" style={{ margin: 0 }}>
            {forecast.message}
          </p>
          <ul>
            {forecast.periods.map((row: any) => (
              <li key={row.month}>
                {row.month} · {row.jobs} jobs · billed {row.revenue} · still quoting {row.pipeline} · people needed {row.crew_need}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
              {row.type === "todo" || row.type === "workflow" || row.type === "field_issue" ? "Done" : "Approve"}
            </button>
            <button type="button" onClick={() => act(row, "rejected")} style={{ background: "var(--ee-danger)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.4rem 0.75rem" }}>
              {row.type === "todo" || row.type === "workflow" || row.type === "field_issue" ? "Dismiss" : "Reject"}
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

function BillingTools() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [job, setJob] = React.useState("");
  const [invoice, setInvoice] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [splits, setSplits] = React.useState("3");
  const [schedule, setSchedule] = React.useState<any>(null);
  const [hint, setHint] = React.useState("");
  React.useEffect(() => {
    call("entertainment_express.api.portal_billing.list_jobs", {})
      .then((res) => setJobs(res || []))
      .catch(() => setJobs([]));
  }, []);
  return (
    <div className="ee-form">
      <h2 style={{ margin: 0 }}>Invoices and holds</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <FormField label="Job">
          <select value={job} onChange={(e) => setJob(e.target.value)}>
            <option value="">Pick a job</option>
            {jobs.map((row: any) => (
              <option key={row.name} value={row.name}>
                {row.event_name || row.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Invoice">
          <input value={invoice} onChange={(e) => setInvoice(e.target.value)} />
        </FormField>
        <FormField label="Amount">
          <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormField>
        <FormField label="Reason">
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
        <FormField label="Split into">
          <input type="number" min="2" max="12" value={splits} onChange={(e) => setSplits(e.target.value)} />
        </FormField>
      </div>
      {hint ? <p>{hint}</p> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <button
          type="button"
          className="ee-btn"
          disabled={!invoice || !amount}
          onClick={async () => {
            const res = await call("entertainment_express.api.portal_billing.refund_invoice", {
              invoice_name: invoice,
              amount: Number(amount),
              reason,
            });
            setHint(`Refund ${res.status || "sent"}.`);
          }}
        >
          Refund
        </button>
        <button
          type="button"
          className="ee-btn"
          disabled={!job || !amount}
          onClick={async () => {
            const res = await call("entertainment_express.api.portal_billing.create_damage_hold", {
              booking_name: job,
              amount: Number(amount),
            });
            setHint(`Hold ${res.invoice || "placed"}.`);
            if (res.invoice) setInvoice(res.invoice);
          }}
        >
          Hold on card
        </button>
        <button
          type="button"
          className="ee-btn"
          disabled={!invoice}
          onClick={async () => {
            await call("entertainment_express.api.portal_billing.capture_hold", { invoice_name: invoice, amount: amount ? Number(amount) : null });
            setHint("Hold captured.");
          }}
        >
          Capture hold
        </button>
        <button
          type="button"
          className="ee-btn"
          disabled={!invoice}
          onClick={async () => {
            await call("entertainment_express.api.portal_billing.release_hold", { invoice_name: invoice });
            setHint("Hold released.");
          }}
        >
          Release hold
        </button>
        <button
          type="button"
          className="ee-btn"
          disabled={!job}
          onClick={async () => {
            await call("entertainment_express.api.portal_billing.create_installments", { booking_name: job, count: Number(splits) });
            setHint("Balance split.");
          }}
        >
          Split balance
        </button>
        <button
          type="button"
          className="ee-btn"
          disabled={!job}
          onClick={async () => {
            const res = await call("entertainment_express.api.portal_billing.get_schedule", { booking_name: job });
            setSchedule(res);
          }}
        >
          Show schedule
        </button>
      </div>
      {schedule?.milestones?.length ? (
        <DataTable
          id="pay-schedule"
          columns={[
            { key: "kind", label: "When" },
            { key: "due_date", label: "Due" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status" },
          ]}
          rows={schedule.milestones}
        />
      ) : null}
    </div>
  );
}

function MoneyWorkspace() {
  const go = useNavigate();
  const [runs, setRuns] = React.useState<any[]>([]);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const reload = () => {
    call("entertainment_express.api.portal_hr.list_pay_runs", {})
      .then((res) => setRuns(res || []))
      .catch(() => setRuns([]));
  };
  React.useEffect(() => {
    reload();
  }, []);
  return (
    <section style={{ display: "grid", gap: "1.25rem" }}>
      <RecordList kind="invoice" basePath="/money" go={go} />
      <BillingTools />
      <div className="ee-form">
        <h2 style={{ margin: 0 }}>Pay crew</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
          <FormField label="From">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </FormField>
          <FormField label="Through">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </FormField>
        </div>
        <button
          type="button"
          className="ee-btn"
          onClick={async () => {
            await call("entertainment_express.api.portal_hr.create_pay_run", { period_from: from, period_to: to });
            reload();
          }}
        >
          Build pay run
        </button>
        {runs.length ? (
          <DataTable
            id="owner-pay-runs"
            columns={[
              { key: "name", label: "Run" },
              { key: "period_from", label: "From" },
              { key: "period_to", label: "Through" },
              { key: "status", label: "Status" },
              { key: "total_amount", label: "Total" },
            ]}
            rows={runs}
            onRowClick={async (row) => {
              if (row.status === "draft") await call("entertainment_express.api.portal_hr.finalize_pay_run", { name: row.name });
              else if (row.status === "finalized") await call("entertainment_express.api.portal_hr.process_payout", { name: row.name });
              reload();
            }}
          />
        ) : (
          <EmptyState title="No pay runs" message="Pick a date range after hours are approved." />
        )}
      </div>
    </section>
  );
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
  const [workerType, setWorkerType] = React.useState("1099");
  const [skills, setSkills] = React.useState("");
  const [payBasis, setPayBasis] = React.useState("per_event");
  const [payRate, setPayRate] = React.useState("");
  const [hours, setHours] = React.useState({ start: "10:00", end: "22:00" });
  const [offFrom, setOffFrom] = React.useState("");
  const [offTo, setOffTo] = React.useState("");
  const [docType, setDocType] = React.useState("w9");
  const [docFile, setDocFile] = React.useState("");
  const [timesheets, setTimesheets] = React.useState<any[]>([]);

  const userId = (row: any) => row.user || row.name;

  const reload = () => {
    call("entertainment_express.api.portal_hr.list_people", {})
      .then((res) => setRows(res || []))
      .catch(() =>
        call("entertainment_express.api.portal_owner.list_staff", {})
          .then((res) => setRows(res || []))
          .catch(() => setRows([]))
      );
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
    await call("entertainment_express.api.portal_owner.set_staff_roles", { user: userId(selected), roles: selectedRoles });
    reload();
  };

  const deactivate = async () => {
    if (!selected) return;
    await call("entertainment_express.api.portal_owner.deactivate_staff", { user: userId(selected) });
    setSelected(null);
    reload();
  };

  const pick = (row: any) => {
    setSelected(row);
    setSelectedRoles((row.roles || []).filter((role: string) => ACCESS.some((item) => item.id === role)));
    setWorkerType(row.worker_type || "1099");
    setSkills(row.skills || "");
    setPayBasis(row.pay_basis || "per_event");
    setPayRate(String(row.pay_rate || ""));
    if (row.employee) {
      call("entertainment_express.api.portal_hr.list_timesheets", { employee: row.employee })
        .then((res) => setTimesheets(res || []))
        .catch(() => setTimesheets([]));
    } else {
      setTimesheets([]);
    }
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
            { key: "worker_type", label: "Type" },
          ]}
          rows={rows}
          onRowClick={pick}
        />
      ) : (
        <EmptyState title="Team" message="Invite the first person who helps run jobs." />
      )}
      {selected ? (
        <div className="ee-form">
          <h2 style={{ margin: 0 }}>{selected.full_name || userId(selected)}</h2>
          {selected.block_reason ? <p>{selected.block_reason}</p> : null}
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
          {selected.employee ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                <FormField label="Worker type">
                  <select value={workerType} onChange={(e) => setWorkerType(e.target.value)}>
                    <option value="1099">1099</option>
                    <option value="w2">W2</option>
                    <option value="volunteer">Volunteer</option>
                  </select>
                </FormField>
                <FormField label="Skills">
                  <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="DJ, Driver" />
                </FormField>
                <FormField label="Pay">
                  <select value={payBasis} onChange={(e) => setPayBasis(e.target.value)}>
                    <option value="per_event">Per event</option>
                    <option value="hourly">Hourly</option>
                    <option value="salary">Salary</option>
                  </select>
                </FormField>
                <FormField label="Rate">
                  <input value={payRate} onChange={(e) => setPayRate(e.target.value)} />
                </FormField>
              </div>
              <button
                type="button"
                className="ee-btn"
                onClick={async () => {
                  await call("entertainment_express.api.portal_hr.save_profile", {
                    employee: selected.employee,
                    values: { worker_type: workerType, skills, pay_basis: payBasis, pay_rate: payRate },
                  });
                  reload();
                }}
              >
                Save worker
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                <FormField label="Typical start">
                  <input type="time" value={hours.start} onChange={(e) => setHours({ ...hours, start: e.target.value })} />
                </FormField>
                <FormField label="Typical end">
                  <input type="time" value={hours.end} onChange={(e) => setHours({ ...hours, end: e.target.value })} />
                </FormField>
              </div>
              <button
                type="button"
                className="ee-btn"
                onClick={async () => {
                  const days: Record<string, { start: string; end: string }> = {};
                  ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].forEach((day) => {
                    days[day] = { start: hours.start, end: hours.end };
                  });
                  await call("entertainment_express.api.portal_hr.save_hours", { employee: selected.employee, days });
                }}
              >
                Save hours
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                <FormField label="Time-off from">
                  <input type="date" value={offFrom} onChange={(e) => setOffFrom(e.target.value)} />
                </FormField>
                <FormField label="Through">
                  <input type="date" value={offTo} onChange={(e) => setOffTo(e.target.value)} />
                </FormField>
              </div>
              <button
                type="button"
                className="ee-btn"
                onClick={async () => {
                  await call("entertainment_express.api.portal_hr.save_time_off", {
                    employee: selected.employee,
                    start_date: offFrom,
                    end_date: offTo || offFrom,
                  });
                }}
              >
                Save time-off
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                <FormField label="Document">
                  <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                    <option value="w9">W9</option>
                    <option value="contract">Contract</option>
                    <option value="background_check">Background check</option>
                    <option value="driver_license">License</option>
                  </select>
                </FormField>
                <FormField label="File path">
                  <input value={docFile} onChange={(e) => setDocFile(e.target.value)} />
                </FormField>
              </div>
              <button
                type="button"
                className="ee-btn"
                onClick={async () => {
                  await call("entertainment_express.api.portal_hr.upload_document", {
                    employee: selected.employee,
                    doc_type: docType,
                    file_path: docFile,
                  });
                  reload();
                }}
              >
                Save document
              </button>
              {timesheets.filter((row) => row.pending).length ? (
                <div>
                  <h3>Hours to approve</h3>
                  {timesheets
                    .filter((row) => row.pending)
                    .map((row) => (
                      <button
                        key={row.name}
                        type="button"
                        className="ee-btn"
                        onClick={async () => {
                          await call("entertainment_express.api.portal_hr.approve_hours", { timesheet: row.name });
                          pick(selected);
                        }}
                      >
                        Approve {row.hours}h
                      </button>
                    ))}
                </div>
              ) : null}
            </>
          ) : (
            <p>Give this person field access so they can be paid and dispatched.</p>
          )}
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
  return (
    <section style={{ display: "grid", gap: "1.25rem" }}>
      <RecordList kind="gear" basePath="/gear" go={go} />
      <FleetVehicles />
      <StockMove />
      <SubRentalForm />
      <MaintenanceDue />
    </section>
  );
}

function GearUtilization({ id }: { id: string }) {
  const [util, setUtil] = React.useState<any>(null);
  React.useEffect(() => {
    call("entertainment_express.api.portal_fleet.utilization", { asset_name: id })
      .then(setUtil)
      .catch(() => setUtil(null));
  }, [id]);
  if (!util) return null;
  return (
    <section className="ee-form" style={{ marginTop: "1rem" }}>
      <h2 style={{ margin: 0 }}>Use</h2>
      <p style={{ margin: 0 }}>
        {util.utilization_pct}% booked over {util.period_days} days · {util.events} jobs · {util.hours_booked} hours
      </p>
      {util.condition ? <p style={{ margin: 0 }}>Condition: {util.condition}</p> : null}
    </section>
  );
}

function FleetVehicles() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [plate, setPlate] = React.useState("");
  const [kind, setKind] = React.useState("van");
  const [status, setStatus] = React.useState("active");
  const [reg, setReg] = React.useState("");
  const [ins, setIns] = React.useState("");
  const [vehicle, setVehicle] = React.useState("");
  const [job, setJob] = React.useState("");
  const reload = () => {
    call("entertainment_express.api.portal_fleet.list_vehicles", {})
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
    call("entertainment_express.api.portal_fleet.list_jobs", {})
      .then((res) => setJobs(res || []))
      .catch(() => setJobs([]));
  };
  React.useEffect(() => {
    reload();
  }, []);
  return (
    <div className="ee-form">
      <h2 style={{ margin: 0 }}>Trucks</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <FormField label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Plate">
          <input value={plate} onChange={(e) => setPlate(e.target.value)} />
        </FormField>
        <FormField label="Type">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="van">Van</option>
            <option value="box_truck">Box truck</option>
            <option value="trailer">Trailer</option>
            <option value="car">Car</option>
            <option value="other">Other</option>
          </select>
        </FormField>
        <FormField label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">On the road</option>
            <option value="in_service">In the shop</option>
            <option value="out_of_service">Parked</option>
          </select>
        </FormField>
        <FormField label="Registration expires">
          <input type="date" value={reg} onChange={(e) => setReg(e.target.value)} />
        </FormField>
        <FormField label="Insurance expires">
          <input type="date" value={ins} onChange={(e) => setIns(e.target.value)} />
        </FormField>
      </div>
      <button
        type="button"
        className="ee-btn"
        onClick={async () => {
          await call("entertainment_express.api.portal_fleet.save_vehicle", {
            values: { vehicle_name: name, plate, vehicle_type: kind, status, registration_expiry: reg, insurance_expiry: ins },
          });
          setName("");
          setPlate("");
          reload();
        }}
      >
        Save truck
      </button>
      {rows.length ? (
        <DataTable
          id="owner-trucks"
          columns={[
            { key: "vehicle_name", label: "Truck" },
            { key: "plate", label: "Plate" },
            { key: "status", label: "Status" },
            { key: "alert", label: "Due soon" },
          ]}
          rows={rows}
          onRowClick={(row) => setVehicle(row.name)}
        />
      ) : (
        <EmptyState title="No trucks" message="Add the vans and box trucks you take to jobs." />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <FormField label="Park on job">
          <select value={job} onChange={(e) => setJob(e.target.value)}>
            <option value="">Pick a job</option>
            {jobs.map((row: any) => (
              <option key={row.name} value={row.name}>
                {row.event_name || row.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <button
        type="button"
        className="ee-btn"
        disabled={!vehicle || !job}
        onClick={async () => {
          await call("entertainment_express.api.portal_fleet.assign_vehicle", { booking_name: job, vehicle_name: vehicle });
        }}
      >
        Assign truck
      </button>
    </div>
  );
}

function StockMove() {
  const [stock, setStock] = React.useState<any[]>([]);
  const [locations, setLocations] = React.useState<any[]>([]);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [item, setItem] = React.useState("");
  const [qty, setQty] = React.useState("1");
  const reload = () => {
    call("entertainment_express.api.portal_fleet.list_stock", {})
      .then((res) => setStock(res || []))
      .catch(() => setStock([]));
    call("entertainment_express.api.portal_fleet.list_locations", {})
      .then((res) => {
        const rows = res || [];
        setLocations(rows);
        if (rows[0] && !from) setFrom(rows[0].name);
        if (rows[1] && !to) setTo(rows[1].name);
      })
      .catch(() => setLocations([]));
  };
  React.useEffect(() => {
    reload();
  }, []);
  const locLabel = (name: string) => locations.find((row) => row.name === name)?.location_name || name;
  return (
    <div className="ee-form">
      <h2 style={{ margin: 0 }}>Stock</h2>
      {stock.length ? (
        <DataTable
          id="owner-stock"
          columns={[
            { key: "item_name", label: "Item" },
            { key: "location", label: "Where" },
            { key: "qty", label: "Qty" },
          ]}
          rows={stock.map((row) => ({ ...row, location: locLabel(row.location), item_name: row.item_name || row.item_code }))}
          onRowClick={(row) => setItem(row.item_code)}
        />
      ) : (
        <EmptyState title="No stock yet" message="Balances show here after you receive consumables." />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <FormField label="From">
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {locations.map((row: any) => (
              <option key={row.name} value={row.name}>
                {row.location_name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="To">
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {locations.map((row: any) => (
              <option key={row.name} value={row.name}>
                {row.location_name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Item code">
          <input value={item} onChange={(e) => setItem(e.target.value)} />
        </FormField>
        <FormField label="Qty">
          <input type="number" min="0" step="1" value={qty} onChange={(e) => setQty(e.target.value)} />
        </FormField>
      </div>
      <button
        type="button"
        className="ee-btn"
        disabled={!from || !to || !item}
        onClick={async () => {
          await call("entertainment_express.api.portal_fleet.transfer_stock", {
            from_location: from,
            to_location: to,
            item_code: item,
            qty: Number(qty),
          });
          reload();
        }}
      >
        Move stock
      </button>
    </div>
  );
}

function SubRentalForm() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [job, setJob] = React.useState("");
  const [item, setItem] = React.useState("");
  const [qty, setQty] = React.useState("1");
  const [supplier, setSupplier] = React.useState("");
  const [cost, setCost] = React.useState("0");
  React.useEffect(() => {
    call("entertainment_express.api.portal_fleet.list_jobs", {})
      .then((res) => setJobs(res || []))
      .catch(() => setJobs([]));
  }, []);
  return (
    <div className="ee-form">
      <h2 style={{ margin: 0 }}>Borrow gear</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <FormField label="Job">
          <select value={job} onChange={(e) => setJob(e.target.value)}>
            <option value="">Pick a job</option>
            {jobs.map((row: any) => (
              <option key={row.name} value={row.name}>
                {row.event_name || row.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="What">
          <input value={item} onChange={(e) => setItem(e.target.value)} />
        </FormField>
        <FormField label="Qty">
          <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
        </FormField>
        <FormField label="From">
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </FormField>
        <FormField label="Cost">
          <input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
        </FormField>
      </div>
      <button
        type="button"
        className="ee-btn"
        disabled={!job || !item || !supplier}
        onClick={async () => {
          await call("entertainment_express.api.portal_fleet.create_sub_rental", {
            booking_name: job,
            item_name: item,
            qty: Number(qty),
            supplier,
            cost: Number(cost),
          });
          setItem("");
        }}
      >
        Record borrow
      </button>
    </div>
  );
}

function MaintenanceDue() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [asset, setAsset] = React.useState("");
  const [due, setDue] = React.useState("");
  const reload = () => {
    call("entertainment_express.api.portal_fleet.list_maintenance", {})
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  };
  React.useEffect(() => {
    reload();
  }, []);
  return (
    <div className="ee-form">
      <h2 style={{ margin: 0 }}>Shop work</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <FormField label="Gear id">
          <input value={asset} onChange={(e) => setAsset(e.target.value)} />
        </FormField>
        <FormField label="Due">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </FormField>
      </div>
      <button
        type="button"
        className="ee-btn"
        disabled={!asset || !due}
        onClick={async () => {
          await call("entertainment_express.api.portal_fleet.save_maintenance", {
            values: { resource_type: "asset", asset, due_on: due, blocks_booking: 1 },
          });
          reload();
        }}
      >
        Block for shop
      </button>
      {rows.length ? (
        <DataTable
          id="owner-shop"
          columns={[
            { key: "asset", label: "Gear" },
            { key: "vehicle", label: "Truck" },
            { key: "due_on", label: "Due" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
        />
      ) : (
        <EmptyState title="Nothing in the shop" message="Due work that blocks a booking shows here." />
      )}
    </div>
  );
}

function CrudEditor({ kind, basePath }: { kind: string; basePath: string }) {
  const go = useNavigate();
  const { id } = useParams();
  return (
    <>
      <RecordEditor kind={kind} basePath={basePath} go={go} recordId={id} />
      {id && id !== "new" && kind === "gear" ? <GearUtilization id={id} /> : null}
      {id && id !== "new" && kind === "invoice" ? <BillingTools /> : null}
      {id && id !== "new" && (kind === "job" || kind === "inquiry") ? <RecordExtras kind={kind} id={id} /> : null}
    </>
  );
}

function JobRiskPanel({ jobId }: { jobId: string }) {
  const [risk, setRisk] = React.useState<any>(null);
  const [venues, setVenues] = React.useState<any[]>([]);
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [venue, setVenue] = React.useState("");
  const [partner, setPartner] = React.useState("");
  const [role, setRole] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [hold, setHold] = React.useState("");
  const [error, setError] = React.useState("");

  const reload = () => {
    call("entertainment_express.api.compliance.job_risk", { booking: jobId })
      .then((res) => {
        setRisk(res);
        setVenue(res.venue_id || "");
      })
      .catch(() => setRisk(null));
    call("entertainment_express.api.venues.list_venues", {})
      .then((res) => setVenues(res || []))
      .catch(() => setVenues([]));
    call("entertainment_express.api.vendors.list_vendors", {})
      .then((res) => setVendors(res || []))
      .catch(() => setVendors([]));
    call("entertainment_express.api.compliance.list_waiver_templates", {})
      .then((res) => setTemplates(res || []))
      .catch(() => setTemplates([]));
  };

  React.useEffect(() => {
    reload();
  }, [jobId]);

  if (!risk) return null;

  return (
    <section className="ee-form" style={{ marginTop: "1rem" }}>
      <h2 style={{ margin: 0 }}>Place, partners, and coverage</h2>
      {error ? <p className="ee-form__error">{error}</p> : null}
      <FormField label="Place">
        <select
          value={venue}
          onChange={async (e) => {
            const next = e.target.value;
            setVenue(next);
            if (!next) return;
            try {
              await call("entertainment_express.api.venues.attach_to_booking", { booking: jobId, venue: next });
              reload();
            } catch (err: any) {
              setError(err.message || "Could not attach that place.");
            }
          }}
        >
          <option value="">Pick a saved place</option>
          {venues.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </FormField>
      {risk.coi_needed ? <p style={{ color: "var(--ee-danger)", margin: 0 }}>This place still needs a certificate of insurance.</p> : null}
      {risk.coi?.status === "delivered" ? <p style={{ color: "var(--ee-success)", margin: 0 }}>Certificate is on file.</p> : null}
      <button
        type="button"
        className="ee-btn"
        onClick={async () => {
          setError("");
          try {
            await call("entertainment_express.api.compliance.save_coi", { booking: jobId, status: "delivered" });
            reload();
          } catch (err: any) {
            setError(err.message || "Could not mark the certificate delivered.");
          }
        }}
      >
        Mark certificate delivered
      </button>
      {templates.length ? (
        <FormField label="Send a waiver">
          <select
            defaultValue=""
            onChange={async (e) => {
              const tmpl = e.target.value;
              if (!tmpl) return;
              try {
                await call("entertainment_express.api.compliance.issue_waiver", { booking: jobId, template: tmpl });
                e.target.value = "";
                reload();
              } catch (err: any) {
                setError(err.message || "Could not send that waiver.");
              }
            }}
          >
            <option value="">Pick a waiver</option>
            {templates.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title}
              </option>
            ))}
          </select>
        </FormField>
      ) : null}
      {(risk.waivers || []).map((row: any) => (
        <p key={row.id} className="ee-muted" style={{ margin: 0 }}>
          Waiver {row.status}
          {row.signed_at ? ` · ${row.signed_at}` : ""}
        </p>
      ))}
      <p className="ee-muted" style={{ margin: 0 }}>
        Damage hold: {risk.hold_status}
      </p>
      <FormField label="Hold amount">
        <input value={hold} onChange={(e) => setHold(e.target.value)} inputMode="decimal" />
      </FormField>
      <div className="ee-form__actions">
        <button
          type="button"
          className="ee-btn"
          onClick={async () => {
            setError("");
            try {
              await call("entertainment_express.api.compliance.place_hold", { booking: jobId, amount: hold });
              reload();
            } catch (err: any) {
              setError(err.message || "Could not place a hold.");
            }
          }}
        >
          Place hold
        </button>
        <button type="button" className="ee-btn ee-btn--ghost" onClick={async () => call("entertainment_express.api.compliance.release_hold", { booking: jobId }).then(reload)}>
          Release
        </button>
      </div>
      <FormField label="Add a partner on this job">
        <select value={partner} onChange={(e) => setPartner(e.target.value)}>
          <option value="">Pick a partner</option>
          {vendors.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Their role">
        <input value={role} onChange={(e) => setRole(e.target.value)} />
      </FormField>
      <FormField label="Agreed cost">
        <input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" />
      </FormField>
      <button
        type="button"
        className="ee-btn"
        disabled={!partner}
        onClick={async () => {
          setError("");
          try {
            await call("entertainment_express.api.vendors.save_assignment", { booking: jobId, vendor: partner, role, cost });
            setPartner("");
            setRole("");
            setCost("");
            reload();
          } catch (err: any) {
            setError(err.message || "Could not add that partner.");
          }
        }}
      >
        Add partner
      </button>
      {(risk.vendors || []).map((row: any) => (
        <p key={row.id} className="ee-muted" style={{ margin: 0 }}>
          {row.vendor} · {row.role} · {row.cost}
        </p>
      ))}
    </section>
  );
}

function JobFilesPanel({ jobId }: { jobId: string }) {
  const [rows, setRows] = React.useState<any[]>([]);
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const reload = () => {
    call("entertainment_express.api.deliverables.list_deliverables", { booking: jobId })
      .then(setRows)
      .catch(() => setRows([]));
  };
  React.useEffect(() => {
    reload();
  }, [jobId]);

  const readFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read that file."));
      reader.readAsDataURL(file);
    });

  return (
    <section className="ee-form" style={{ marginTop: "1rem" }}>
      <h2 style={{ margin: 0 }}>Photos and files</h2>
      <p className="ee-muted" style={{ margin: 0 }}>
        Publish a gallery for the host and guests. Keep each file under 5 MB.
      </p>
      <FormField label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormField>
      <FormField label="File">
        <input
          type="file"
          accept="image/*,application/pdf,video/mp4"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError("");
            setBusy(true);
            try {
              const dataUrl = await readFile(file);
              await call("entertainment_express.api.deliverables.save_deliverable", {
                booking: jobId,
                title: title || file.name,
                file_name: file.name,
                content_b64: dataUrl,
                kind: file.type.startsWith("video/") ? "video" : file.type === "application/pdf" ? "receipt" : "photo",
                mime: file.type,
              });
              setTitle("");
              reload();
            } catch (err: any) {
              setError(err.message || "Could not save that file.");
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </FormField>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {busy ? <p className="ee-muted">Saving…</p> : null}
      {rows.length ? (
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              {row.title}
              {row.published ? " · published" : " · hidden"}
              <button
                type="button"
                className="ee-btn"
                style={{ marginLeft: "0.5rem" }}
                onClick={async () => {
                  await call("entertainment_express.api.deliverables.publish_deliverable", { name: row.id, published: row.published ? 0 : 1 });
                  reload();
                }}
              >
                {row.published ? "Hide" : "Publish"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ee-muted">No files yet.</p>
      )}
    </section>
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
      {kind === "job" ? <JobRiskPanel jobId={id} /> : null}
      {kind === "job" ? <JobCrewPanel jobId={id} /> : null}
      {kind === "job" ? <JobPlanningPanel jobId={id} /> : null}
      {kind === "job" ? <JobFilesPanel jobId={id} /> : null}
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
  const [hint, setHint] = React.useState("");

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
        {hint ? <p className="ee-muted">{hint}</p> : null}
        <div className="ee-form__actions">
          <button type="button" className="ee-btn" disabled={busy} onClick={() => save(false)}>
            Save
          </button>
          <button
            type="button"
            className="ee-btn"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              setHint("");
              try {
                const res = await call("entertainment_express.api.ai.suggest_quote", { source, name: id });
                if (res.available === false) setHint("AI suggestion unavailable");
                else setHint(res.why || res.message || "");
                const next = { ...picked };
                for (const row of res.items || []) next[row.id] = true;
                setPicked(next);
              } catch (err: any) {
                setError(err.message || "Could not suggest a package.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Suggest a package
          </button>
          <button type="button" className="ee-btn" disabled={busy} onClick={() => save(true)}>
            Send to client
          </button>
        </div>
      </div>
    </section>
  );
}

function PlanWorkspace() {
  const [info, setInfo] = React.useState<any>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = () => {
    call("entertainment_express.api.saas_billing.my_plan", {})
      .then((res) => setInfo(res))
      .catch(() => setInfo(null));
  };

  React.useEffect(() => {
    load();
  }, []);

  const pay = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await call("entertainment_express.api.saas_billing.create_subscription_checkout", {});
      if (res?.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      setError("Checkout is not available yet.");
    } catch (err: any) {
      setError(err.message || "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    setError("");
    try {
      await call("entertainment_express.api.saas_billing.request_cancel", {});
      load();
    } catch (err: any) {
      setError(err.message || "Could not request cancel.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Plan</h1>
        <p className="ee-muted">Your Entertainment Express subscription for this company. Amounts come from billing — this page does not calculate prices.</p>
      </header>
      {info ? (
        <div className="ee-form" style={{ maxWidth: "none" }}>
          <p style={{ margin: 0 }}>
            <strong>{info.plan}</strong> · {info.status}
          </p>
          {info.price ? <p className="ee-muted">Monthly {info.price}</p> : null}
          {info.period_end ? <p className="ee-muted">Current period ends {info.period_end}</p> : null}
          {info.cancel_at_period_end || info.cancel_requested ? (
            <p>Access continues until the period ends, then this workspace pauses.</p>
          ) : null}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" className="ee-btn" disabled={busy} onClick={pay}>
              Pay / convert
            </button>
            <button type="button" className="ee-btn ee-btn--ghost" disabled={busy || info.cancel_requested || info.cancel_at_period_end} onClick={cancel}>
              Cancel at period end
            </button>
          </div>
        </div>
      ) : (
        <EmptyState title="Plan" message="Plan details will show here after your company is billed." />
      )}
      {error ? <p className="ee-form__error">{error}</p> : null}
    </section>
  );
}

function AssistantWorkspace() {
  const [question, setQuestion] = React.useState("");
  const [reply, setReply] = React.useState<any>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Assistant</h1>
        <p className="ee-muted">Ask about this company&apos;s jobs. Drafts wait for you to confirm before anything is sent or saved.</p>
      </header>
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const res = await call("entertainment_express.api.ai.ask", { message: question });
            setReply(res);
          } catch (err: any) {
            setError(err.message || "Could not ask that.");
            setReply(null);
          } finally {
            setBusy(false);
          }
        }}
      >
        <FormField label="Question">
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} required />
        </FormField>
        <button type="submit" className="ee-btn" disabled={busy}>
          Ask
        </button>
      </form>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {reply ? (
        <div className="ee-form" style={{ maxWidth: "none" }}>
          {reply.available === false ? <p className="ee-muted">AI suggestion unavailable</p> : null}
          <p style={{ margin: 0 }}>{reply.message}</p>
          {(reply.jobs || []).length ? (
            <ul>
              {reply.jobs.map((job: any) => (
                <li key={job.id}>
                  {job.title} · {job.when}
                  {job.unassigned ? " · needs a crew" : ""}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing this week" message="Jobs on the calendar for the next seven days show up here." />
          )}
        </div>
      ) : null}
    </section>
  );
}

function ReportsWorkspace() {
  const monthStart = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  };
  const today = () => new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = React.useState(monthStart);
  const [toDate, setToDate] = React.useState(today);
  const [pack, setPack] = React.useState<any>(null);
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");

  const reload = React.useCallback(() => {
    call("entertainment_express.api.portal_reports.owner_pack", { from_date: fromDate, to_date: toDate })
      .then(setPack)
      .catch(() => setPack(null));
    call("entertainment_express.api.portal_reports.list_schedules", {})
      .then((res) => setSchedules(res || []))
      .catch(() => setSchedules([]));
  }, [fromDate, toDate]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  if (!pack) return <EmptyState title="Reports" message="Company snapshots appear here." />;
  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <FormField label="From">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </FormField>
        <FormField label="To">
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </FormField>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <StatCard label="Jobs" value={String(pack.jobs ?? 0)} />
        <StatCard label="Billed" value={String(pack.revenue || "0.00")} />
        <StatCard label="Still owed" value={String(pack.outstanding || "0.00")} />
        <StatCard label="Tax" value={String(pack.tax || "0.00")} />
        <StatCard label="Deposits held" value={String(pack.deposits_held || "0.00")} />
        <StatCard label="Payouts due" value={String(pack.payouts_due || "0.00")} />
        <StatCard label="Open quotes" value={String(pack.pipeline_value || "0.00")} />
        <StatCard label="Average job" value={String(pack.avg_deal || "0.00")} />
        <StatCard label="Needs a crew" value={String(pack.at_risk ?? 0)} />
        <StatCard label="People use" value={String(pack.crew_utilization || "—")} />
        <StatCard label="Gear use" value={String(pack.gear_utilization || "—")} />
        <StatCard label="Pipeline" value={String(pack.pipeline_conversion || "—")} />
      </div>
      {pack.by_service_type?.length ? (
        <ul>
          {pack.by_service_type.map((row: any) => (
            <li key={row.name}>
              {row.name} · {row.amount} · {row.jobs} jobs
            </li>
          ))}
        </ul>
      ) : null}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={async () => {
            const csv = await call("entertainment_express.api.portal_reports.owner_pack_csv", { from_date: fromDate, to_date: toDate });
            downloadText("company-reports.csv", String(csv || ""), "text/csv");
          }}
          style={{ background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.5rem 0.8rem" }}
        >
          Download spreadsheet
        </button>
        <button
          type="button"
          onClick={async () => {
            const pdf = await call("entertainment_express.api.portal_reports.owner_pack_pdf", { from_date: fromDate, to_date: toDate });
            if (pdf?.content_b64) downloadBase64(pdf.filename || "company-reports.pdf", pdf.content_b64, "application/pdf");
          }}
          style={{ background: "var(--ee-panel)", color: "var(--ee-text)", border: "1px solid var(--ee-border)", borderRadius: "0.5rem", padding: "0.5rem 0.8rem" }}
        >
          Download for accountant
        </button>
      </div>
      <section className="ee-form" style={{ maxWidth: "none" }}>
        <h2 style={{ margin: 0 }}>Email this snapshot</h2>
        <FormField label="Send to">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </FormField>
        <button
          type="button"
          className="ee-btn"
          onClick={async () => {
            setError("");
            try {
              await call("entertainment_express.api.portal_reports.save_schedule", {
                title: "Weekly snapshot",
                recipients: email,
                pack: "owner",
                cadence: "weekly",
                weekday: 0,
              });
              setEmail("");
              reload();
            } catch (err: any) {
              setError(err.message || "Could not save that schedule.");
            }
          }}
        >
          Email me each Monday
        </button>
        {error ? <p className="ee-form__error">{error}</p> : null}
        {schedules.map((row) => (
          <p key={row.id} className="ee-muted">
            {row.title} · {row.cadence} · {row.recipients}
            {row.active ? (
              <button type="button" className="ee-btn" style={{ marginLeft: "0.5rem" }} onClick={() => call("entertainment_express.api.portal_reports.stop_schedule", { name: row.id }).then(reload)}>
                Stop
              </button>
            ) : null}
          </p>
        ))}
      </section>
    </section>
  );
}

function PlacesWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [loadIn, setLoadIn] = React.useState("");
  const [coi, setCoi] = React.useState(false);
  const [error, setError] = React.useState("");

  const reload = () => {
    call("entertainment_express.api.venues.list_venues", {})
      .then(setRows)
      .catch(() => setRows([]));
  };
  React.useEffect(() => {
    reload();
  }, []);

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Places</h1>
        <p className="ee-muted">Save halls and parks once. Jobs pick them up with load-in notes.</p>
      </header>
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await call("entertainment_express.api.venues.save_venue", { values: { name, address, load_in: loadIn, coi_required: coi ? 1 : 0 } });
            setName("");
            setAddress("");
            setLoadIn("");
            setCoi(false);
            reload();
          } catch (err: any) {
            setError(err.message || "Could not save that place.");
          }
        }}
      >
        <FormField label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="Address">
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
        </FormField>
        <FormField label="Load-in">
          <textarea value={loadIn} onChange={(e) => setLoadIn(e.target.value)} rows={2} />
        </FormField>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input type="checkbox" checked={coi} onChange={(e) => setCoi(e.target.checked)} />
          Certificate of insurance required
        </label>
        {error ? <p className="ee-form__error">{error}</p> : null}
        <button type="submit" className="ee-btn">
          Save place
        </button>
      </form>
      {rows.length ? (
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              {row.name}
              {row.coi_required ? " · certificate required" : ""}
              {row.address ? ` · ${row.address}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ee-muted">Add a place so jobs stop retyping the address.</p>
      )}
    </section>
  );
}

function PartnersWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [referrals, setReferrals] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Photographer");
  const [error, setError] = React.useState("");

  const reload = () => {
    call("entertainment_express.api.vendors.list_vendors", {})
      .then(setRows)
      .catch(() => setRows([]));
    call("entertainment_express.api.vendors.list_referrals", {})
      .then(setReferrals)
      .catch(() => setReferrals([]));
  };
  React.useEffect(() => {
    reload();
  }, []);

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Partners</h1>
        <p className="ee-muted">Photographers, planners, and overflow help — not your own crew.</p>
      </header>
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await call("entertainment_express.api.vendors.save_vendor", { values: { name, category, preferred: 1 } });
            setName("");
            reload();
          } catch (err: any) {
            setError(err.message || "Could not save that partner.");
          }
        }}
      >
        <FormField label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="Category">
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </FormField>
        {error ? <p className="ee-form__error">{error}</p> : null}
        <button type="submit" className="ee-btn">
          Save partner
        </button>
      </form>
      {rows.length ? (
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              {row.name} · {row.category}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ee-muted">Add partners you send or receive work with.</p>
      )}
      {referrals.length ? (
        <div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>Referrals</h2>
          <ul>
            {referrals.map((row) => (
              <li key={row.id}>
                {row.direction} · {row.vendor} · {row.commission}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CoverageWorkspace() {
  const [policies, setPolicies] = React.useState<any[]>([]);
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [provider, setProvider] = React.useState("");
  const [expires, setExpires] = React.useState("");
  const [title, setTitle] = React.useState("Liability waiver");
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState("");

  const reload = () => {
    call("entertainment_express.api.compliance.list_policies", {})
      .then(setPolicies)
      .catch(() => setPolicies([]));
    call("entertainment_express.api.compliance.list_waiver_templates", {})
      .then(setTemplates)
      .catch(() => setTemplates([]));
  };
  React.useEffect(() => {
    reload();
  }, []);

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Coverage</h1>
        <p className="ee-muted">Your policies, certificates on jobs, and waivers clients sign.</p>
      </header>
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await call("entertainment_express.api.compliance.save_policy", { values: { provider, expires } });
            setProvider("");
            reload();
          } catch (err: any) {
            setError(err.message || "Could not save that policy.");
          }
        }}
      >
        <FormField label="Provider">
          <input value={provider} onChange={(e) => setProvider(e.target.value)} required />
        </FormField>
        <FormField label="Expires">
          <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </FormField>
        <button type="submit" className="ee-btn">
          Save policy
        </button>
      </form>
      {policies.length ? (
        <ul>
          {policies.map((row) => (
            <li key={row.id}>
              {row.provider}
              {row.expires ? ` · expires ${row.expires}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ee-muted">Add the coverage you carry so expiry reminders have somewhere to look.</p>
      )}
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await call("entertainment_express.api.compliance.save_waiver_template", { values: { title, body } });
            setBody("");
            reload();
          } catch (err: any) {
            setError(err.message || "Could not save that waiver.");
          }
        }}
      >
        <FormField label="Waiver title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField label="Waiver text">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        </FormField>
        {error ? <p className="ee-form__error">{error}</p> : null}
        <button type="submit" className="ee-btn">
          Save waiver
        </button>
      </form>
      {templates.length ? (
        <ul>
          {templates.map((row) => (
            <li key={row.id}>{row.title}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

const MOVE_TARGETS = [
  { id: "customers", label: "Customers", fields: ["name", "email", "phone"] },
  { id: "leads", label: "Inquiries", fields: ["name", "email", "phone"] },
  { id: "bookings", label: "Jobs", fields: ["name", "email", "date", "address", "start", "end"] },
  { id: "packages", label: "Packages", fields: ["name", "rate"] },
  { id: "gear", label: "Gear", fields: ["name", "type"] },
  { id: "venues", label: "Places", fields: ["name", "address", "load_in"] },
  { id: "vendors", label: "Partners", fields: ["name", "category"] },
  { id: "songs", label: "Songs", fields: ["title", "artist"] },
];

const MOVE_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  date: "Date",
  address: "Address",
  start: "Start",
  end: "End",
  rate: "Price",
  type: "Type",
  load_in: "Load-in",
  category: "Category",
  title: "Title",
  artist: "Artist",
};

const MOVE_PRESET_LABELS: Record<string, string> = {
  honeybook: "HoneyBook",
  djeventplanner: "DJ Event Planner",
  checkcherry: "Check Cherry",
  booqable: "Booqable",
};

function MoveWorkspace() {
  const [target, setTarget] = React.useState("customers");
  const [csv, setCsv] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [presets, setPresets] = React.useState<any>({});
  const [preset, setPreset] = React.useState("");
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const fields = MOVE_TARGETS.find((row) => row.id === target)?.fields || [];

  React.useEffect(() => {
    call("entertainment_express.api.migration.list_presets", {})
      .then(setPresets)
      .catch(() => setPresets({}));
  }, []);

  React.useEffect(() => {
    setResult(null);
    if (!preset) return;
    const starter = presets?.[preset]?.[target] || {};
    setMapping({ ...starter });
  }, [preset, target, presets]);

  const readFile = (file: File) => {
    setError("");
    setResult(null);
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      setError("Save the spreadsheet as CSV and try again.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || "");
      setCsv(text);
      try {
        const cols = await call("entertainment_express.api.migration.preview_headers", { csv_text: text });
        setHeaders(cols || []);
      } catch (err: any) {
        setError(err.message || "Could not read that file.");
        setHeaders([]);
      }
    };
    reader.readAsText(file);
  };

  const run = async (dry: boolean) => {
    setError("");
    setBusy(true);
    try {
      const job = await call("entertainment_express.api.migration.start_import", {
        target,
        csv_text: csv,
        mapping,
        dry_run: dry ? 1 : 0,
      });
      setResult(job);
      if (!dry && job?.id && (job.status === "pending" || job.status === "running")) {
        const tick = window.setInterval(async () => {
          try {
            const next = await call("entertainment_express.api.migration.get_job", { name: job.id });
            if (next?.status && next.status !== "pending" && next.status !== "running") {
              window.clearInterval(tick);
              setResult(next);
            }
          } catch {
            window.clearInterval(tick);
          }
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Could not run that file.");
    } finally {
      setBusy(false);
    }
  };

  const downloadExport = async () => {
    setError("");
    try {
      const file = await call("entertainment_express.api.migration.export_csv", { target });
      downloadText(file.filename || `${target}.csv`, file.content || "", "text/csv");
    } catch (err: any) {
      setError(err.message || "Could not download that list.");
    }
  };

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Move</h1>
        <p className="ee-muted">Bring lists in from a spreadsheet, preview first, then commit. Download what is already here anytime.</p>
      </header>
      <form className="ee-form" onSubmit={(event) => event.preventDefault()}>
        <FormField label="What to move">
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            {MOVE_TARGETS.map((row) => (
              <option key={row.id} value={row.id}>
                {row.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Starter map">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            <option value="">None — map columns yourself</option>
            {Object.keys(MOVE_PRESET_LABELS).map((key) => (
              <option key={key} value={key}>
                {MOVE_PRESET_LABELS[key]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="CSV file">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file);
            }}
          />
        </FormField>
        {fields.map((field) => (
          <FormField key={field} label={MOVE_FIELD_LABELS[field] || field}>
            <select
              value={mapping[field] || ""}
              onChange={(e) => setMapping((current) => ({ ...current, [field]: e.target.value }))}
            >
              <option value="">Skip</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </FormField>
        ))}
        {error ? <p className="ee-form__error">{error}</p> : null}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" className="ee-btn" disabled={busy || !csv} onClick={() => run(true)}>
            Preview
          </button>
          <button type="button" className="ee-btn" disabled={busy || !csv} onClick={() => run(false)}>
            Commit
          </button>
          <button type="button" className="ee-btn" disabled={busy} onClick={downloadExport}>
            Download current list
          </button>
        </div>
      </form>
      {result ? (
        <div>
          <p>
            {result.dry_run ? "Preview" : "Commit"} · {result.rows_ok || 0} {result.dry_run ? "would land" : "landed"}
            {result.skipped ? ` · ${result.skipped} already here` : ""}
            {result.rows_failed ? ` · ${result.rows_failed} failed` : ""}
          </p>
          {(result.errors || []).length ? (
            <ul>
              {result.errors.map((row: any, idx: number) => (
                <li key={`${row.row}-${idx}`}>
                  Row {row.row}: {row.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : csv ? (
        <p className="ee-muted">Preview before you commit. Nothing is written until you confirm.</p>
      ) : (
        <p className="ee-muted">Upload a CSV from HoneyBook, DJ Event Planner, Check Cherry, Booqable, or your own export.</p>
      )}
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

function JobPlanningPanel({ jobId }: { jobId: string }) {
  const [forms, setForms] = React.useState<any[]>([]);
  const [timeline, setTimeline] = React.useState<any>(null);
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [music, setMusic] = React.useState<any>(null);
  const [guestUrl, setGuestUrl] = React.useState("");
  const [pick, setPick] = React.useState("");
  const [error, setError] = React.useState("");

  const reload = () => {
    call("entertainment_express.api.planning.list_forms", { booking_name: jobId })
      .then((res) => setForms(res || []))
      .catch(() => setForms([]));
    call("entertainment_express.api.timeline.get_timeline", { booking_name: jobId })
      .then(setTimeline)
      .catch(() => setTimeline(null));
    call("entertainment_express.api.timeline.list_timeline_templates", {})
      .then((res) => setTemplates(res || []))
      .catch(() => setTemplates([]));
    call("entertainment_express.api.music.play_view", { booking_name: jobId })
      .then(setMusic)
      .catch(() => setMusic(null));
  };

  React.useEffect(() => {
    reload();
  }, [jobId]);

  const lists = music?.lists || {};

  return (
    <section className="ee-form" style={{ marginTop: "1rem" }}>
      <h2 style={{ margin: 0 }}>Event details</h2>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {forms.length ? (
        forms.map((row) => (
          <p key={row.name} style={{ margin: 0 }}>
            {row.template_name || row.template} · {Math.round(Number(row.completion_percent) || 0)}% · {row.status}
          </p>
        ))
      ) : (
        <p className="ee-muted">A questionnaire attaches after this job is confirmed and matches an event type.</p>
      )}
      <div className="ee-form__actions">
        <button
          type="button"
          className="ee-btn ee-btn--ghost"
          onClick={async () => {
            setError("");
            try {
              await call("entertainment_express.api.planning.send_evaluation", { booking_name: jobId });
              reload();
            } catch (err: any) {
              setError(err.message || "Could not send the follow-up form.");
            }
          }}
        >
          Send follow-up form
        </button>
      </div>
      <h3 style={{ margin: "1rem 0 0.35rem", fontSize: "1.05rem" }}>Run of show</h3>
      <FormField label="Start from a template">
        <select value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">Choose a template</option>
          {templates.map((row) => (
            <option key={row.name} value={row.name}>
              {row.template_name}
            </option>
          ))}
        </select>
      </FormField>
      <button
        type="button"
        className="ee-btn"
        disabled={!pick}
        onClick={async () => {
          setError("");
          try {
            await call("entertainment_express.api.timeline.apply_template", { booking_name: jobId, template_name: pick });
            reload();
          } catch (err: any) {
            setError(err.message || "Could not apply that template.");
          }
        }}
      >
        Apply template
      </button>
      {(timeline?.items || []).map((row: any, idx: number) => (
        <p key={row.name || idx} style={{ margin: 0 }}>
          {row.start_time || ""} {row.title}
        </p>
      ))}
      {(timeline?.pending_requests || []).map((row: any) => (
        <p key={row.name} style={{ margin: 0 }}>
          Suggested change · {row.requested_by}
          <button
            type="button"
            className="ee-btn ee-btn--ghost"
            style={{ marginLeft: "0.5rem" }}
            onClick={async () => {
              await call("entertainment_express.api.timeline.review_change", { request_name: row.name, approve: 1 });
              reload();
            }}
          >
            Approve
          </button>
        </p>
      ))}
      {timeline?.status !== "finalized" ? (
        <button
          type="button"
          className="ee-btn"
          onClick={async () => {
            setError("");
            try {
              await call("entertainment_express.api.timeline.finalize", { booking_name: jobId, share_with_client: 1 });
              reload();
            } catch (err: any) {
              setError(err.message || "Could not finalize the run of show.");
            }
          }}
        >
          Finalize and share
        </button>
      ) : (
        <p className="ee-muted">Run of show is finalized.</p>
      )}
      <h3 style={{ margin: "1rem 0 0.35rem", fontSize: "1.05rem" }}>Music</h3>
      {["must_play", "do_not_play", "special_moment", "general_request"].map((key) =>
        (lists[key] || []).length ? (
          <div key={key}>
            <p style={{ margin: "0.4rem 0 0", fontWeight: 600 }}>{key.split("_").join(" ")}</p>
            {(lists[key] || []).map((row: any) => (
              <p key={row.name} style={{ margin: 0 }}>
                {row.free_text || row.song} {row.in_library ? "· in library" : "· not in library"} · {row.status}
              </p>
            ))}
          </div>
        ) : null
      )}
      <button
        type="button"
        className="ee-btn"
        onClick={async () => {
          setError("");
          try {
            const res = await call("entertainment_express.api.music.create_guest_link", { booking_name: jobId });
            setGuestUrl(res?.url || "");
          } catch (err: any) {
            setError(err.message || "Could not create a guest request link.");
          }
        }}
      >
        Guest song-request link
      </button>
      {guestUrl ? <p className="ee-muted">Copy now: {guestUrl}</p> : null}
    </section>
  );
}

function EventPlanningWorkspace() {
  const emptyField = { field_key: "", label: "", field_type: "text", options: "", required: 0, conditional_on_field: "", conditional_on_value: "" };
  const emptyBeat = { title: "", offset_minutes: 0, duration_minutes: 15, moment_key: "" };
  const [forms, setForms] = React.useState<any[]>([]);
  const [timelines, setTimelines] = React.useState<any[]>([]);
  const [formDraft, setFormDraft] = React.useState<any>({
    template_name: "",
    event_type: "wedding",
    purpose: "planning",
    active: 1,
    reminder_cadence_days: 3,
    fields: [{ ...emptyField, field_key: "pronunciations", label: "Names to announce" }],
  });
  const [tlDraft, setTlDraft] = React.useState<any>({
    template_name: "",
    event_type: "wedding",
    active: 1,
    items: [{ ...emptyBeat, title: "Grand entrance" }],
  });
  const [error, setError] = React.useState("");

  const load = () => {
    call("entertainment_express.api.planning.list_form_templates", {})
      .then((res) => setForms(res || []))
      .catch(() => setForms([]));
    call("entertainment_express.api.timeline.list_timeline_templates", {})
      .then((res) => setTimelines(res || []))
      .catch(() => setTimelines([]));
  };

  React.useEffect(() => {
    load();
  }, []);

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Event details</h1>
        <p className="ee-muted">Questionnaires and run-of-show templates for each event type. Confirmed jobs pick these up automatically.</p>
      </header>
      {error ? <p className="ee-form__error">{error}</p> : null}
      <div className="ee-form" style={{ maxWidth: "none" }}>
        <h2 style={{ margin: 0 }}>Questionnaires</h2>
        {forms.map((row) => (
          <p key={row.name} style={{ margin: 0 }}>
            {row.template_name} · {row.event_type} · {row.purpose} · {row.active ? "on" : "off"}
          </p>
        ))}
        <FormField label="Template name">
          <input value={formDraft.template_name} onChange={(e) => setFormDraft({ ...formDraft, template_name: e.target.value })} />
        </FormField>
        <FormField label="Event type">
          <input value={formDraft.event_type} onChange={(e) => setFormDraft({ ...formDraft, event_type: e.target.value })} />
        </FormField>
        {(formDraft.fields || []).map((field: any, idx: number) => (
          <div key={idx} style={{ display: "grid", gap: "0.35rem" }}>
            <FormField label={`Question ${idx + 1}`}>
              <input
                value={field.label}
                onChange={(e) => {
                  const fields = [...formDraft.fields];
                  const label = e.target.value;
                  fields[idx] = { ...field, label, field_key: field.field_key || label.toLowerCase().replace(/[^a-z0-9]+/g, "_") };
                  setFormDraft({ ...formDraft, fields });
                }}
              />
            </FormField>
            <FormField label="Show only if (field = value)">
              <input
                value={field.conditional_on_field ? `${field.conditional_on_field}=${field.conditional_on_value}` : ""}
                placeholder="ceremony=Yes"
                onChange={(e) => {
                  const [k, ...rest] = e.target.value.split("=");
                  const fields = [...formDraft.fields];
                  fields[idx] = { ...field, conditional_on_field: (k || "").trim(), conditional_on_value: rest.join("=").trim() };
                  setFormDraft({ ...formDraft, fields });
                }}
              />
            </FormField>
          </div>
        ))}
        <div className="ee-form__actions">
          <button type="button" className="ee-btn ee-btn--ghost" onClick={() => setFormDraft({ ...formDraft, fields: [...formDraft.fields, { ...emptyField }] })}>
            Add question
          </button>
          <button
            type="button"
            className="ee-btn"
            onClick={async () => {
              setError("");
              try {
                await call("entertainment_express.api.planning.save_template", { template: formDraft });
                setFormDraft({ ...formDraft, template_name: "", name: undefined });
                load();
              } catch (err: any) {
                setError(err.message || "Could not save that questionnaire.");
              }
            }}
          >
            Save questionnaire
          </button>
        </div>
      </div>
      <div className="ee-form" style={{ maxWidth: "none" }}>
        <h2 style={{ margin: 0 }}>Run of show templates</h2>
        {timelines.map((row) => (
          <p key={row.name} style={{ margin: 0 }}>
            {row.template_name} · {row.event_type}
          </p>
        ))}
        <FormField label="Template name">
          <input value={tlDraft.template_name} onChange={(e) => setTlDraft({ ...tlDraft, template_name: e.target.value })} />
        </FormField>
        {(tlDraft.items || []).map((item: any, idx: number) => (
          <FormField key={idx} label={`Cue ${idx + 1} (minutes from start)`}>
            <input
              value={`${item.offset_minutes} ${item.title}`}
              onChange={(e) => {
                const parts = e.target.value.trim().split(/\s+/);
                const offset = Number(parts[0]);
                const items = [...tlDraft.items];
                items[idx] = { ...item, offset_minutes: Number.isFinite(offset) ? offset : 0, title: Number.isFinite(offset) ? parts.slice(1).join(" ") : e.target.value };
                setTlDraft({ ...tlDraft, items });
              }}
            />
          </FormField>
        ))}
        <div className="ee-form__actions">
          <button type="button" className="ee-btn ee-btn--ghost" onClick={() => setTlDraft({ ...tlDraft, items: [...tlDraft.items, { ...emptyBeat }] })}>
            Add cue
          </button>
          <button
            type="button"
            className="ee-btn"
            onClick={async () => {
              setError("");
              try {
                await call("entertainment_express.api.timeline.save_timeline_template", { template: tlDraft });
                setTlDraft({ ...tlDraft, template_name: "", name: undefined });
                load();
              } catch (err: any) {
                setError(err.message || "Could not save that run of show.");
              }
            }}
          >
            Save run of show
          </button>
        </div>
      </div>
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

function GrowWorkspace() {
  const [data, setData] = React.useState<any>(null);
  const [segName, setSegName] = React.useState("");
  const [match, setMatch] = React.useState("all_customers");
  const [campName, setCampName] = React.useState("");
  const [channel, setChannel] = React.useState("email");
  const [segment, setSegment] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [code, setCode] = React.useState("");
  const [kind, setKind] = React.useState("percent");
  const [value, setValue] = React.useState("10");
  const [reviewUrl, setReviewUrl] = React.useState("");
  const [referrer, setReferrer] = React.useState("");
  const [refEmail, setRefEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [note, setNote] = React.useState("");

  const reload = () => {
    call("entertainment_express.api.engagement.get_grow", {})
      .then((res) => {
        setData(res);
        setReviewUrl(res.review_url || "");
        if (!segment && res.segments?.[0]) setSegment(res.segments[0].id);
        if (!referrer && res.customers?.[0]) setReferrer(res.customers[0].id);
      })
      .catch(() => setData({ segments: [], campaigns: [], promos: [], referrals: [], customers: [] }));
  };
  React.useEffect(() => {
    reload();
  }, []);

  if (!data) return <p className="ee-muted">Loading lists…</p>;

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1.25rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Grow</h1>
        <p className="ee-muted">Lists, campaigns, review asks, and thank-you codes — this company only.</p>
      </header>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {note ? <p style={{ color: "var(--ee-success)", margin: 0 }}>{note}</p> : null}
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await call("entertainment_express.api.engagement.save_segment", { values: { name: segName, match } });
            setSegName("");
            reload();
          } catch (err: any) {
            setError(err.message || "Could not save that list.");
          }
        }}
      >
        <h2 style={{ margin: 0 }}>Lists</h2>
        <FormField label="List name">
          <input value={segName} onChange={(e) => setSegName(e.target.value)} required />
        </FormField>
        <FormField label="Who">
          <select value={match} onChange={(e) => setMatch(e.target.value)}>
            <option value="all_customers">All customers</option>
            <option value="completed_jobs">Completed jobs (last year)</option>
            <option value="upcoming_jobs">Upcoming jobs</option>
            <option value="leads">Inquiries</option>
          </select>
        </FormField>
        <button type="submit" className="ee-btn">
          Save list
        </button>
        {(data.segments || []).length ? (
          <ul>
            {data.segments.map((row: any) => (
              <li key={row.id}>{row.name}</li>
            ))}
          </ul>
        ) : (
          <p className="ee-muted">Save a list before you send.</p>
        )}
      </form>
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setNote("");
          try {
            const saved = await call("entertainment_express.api.engagement.save_campaign", {
              values: { name: campName, channel, segment, subject, body },
            });
            const result = await call("entertainment_express.api.engagement.send_campaign", { name: saved.id });
            setCampName("");
            setBody("");
            setNote(`Sent ${result.sent || 0}, skipped ${result.skipped || 0}.`);
            reload();
          } catch (err: any) {
            setError(err.message || "Could not send that campaign.");
          }
        }}
      >
        <h2 style={{ margin: 0 }}>Campaign</h2>
        <FormField label="Name">
          <input value={campName} onChange={(e) => setCampName(e.target.value)} required />
        </FormField>
        <FormField label="Channel">
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="email">Email</option>
            <option value="sms">Text</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </FormField>
        <FormField label="List">
          <select value={segment} onChange={(e) => setSegment(e.target.value)}>
            <option value="">Pick a list</option>
            {(data.segments || []).map((row: any) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Subject">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </FormField>
        <FormField label="Message">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        </FormField>
        <div className="ee-form__actions">
          <button
            type="button"
            className="ee-btn"
            onClick={async () => {
              setError("");
              try {
                const res = await call("entertainment_express.api.ai.draft_campaign", { segment, offer: subject || campName });
                if (res.available === false) setNote("AI suggestion unavailable");
                if (res.subject) setSubject(res.subject);
                if (res.body) setBody(res.body);
              } catch (err: any) {
                setError(err.message || "Could not draft that campaign.");
              }
            }}
          >
            Draft this campaign
          </button>
          <button type="submit" className="ee-btn">
            Send
          </button>
        </div>
        {(data.campaigns || []).length ? (
          <ul>
            {data.campaigns.map((row: any) => (
              <li key={row.id}>
                {row.name} · sent {row.sent} · skipped {row.skipped} · opened {row.opened}
              </li>
            ))}
          </ul>
        ) : null}
      </form>
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await call("entertainment_express.api.engagement.save_promo", { values: { code, kind, value } });
            setCode("");
            reload();
          } catch (err: any) {
            setError(err.message || "Could not save that code.");
          }
        }}
      >
        <h2 style={{ margin: 0 }}>Thank-you codes</h2>
        <FormField label="Code">
          <input value={code} onChange={(e) => setCode(e.target.value)} required />
        </FormField>
        <FormField label="Kind">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="percent">Percent off</option>
            <option value="amount">Amount off</option>
          </select>
        </FormField>
        <FormField label="Value">
          <input value={value} onChange={(e) => setValue(e.target.value)} />
        </FormField>
        <button type="submit" className="ee-btn">
          Save code
        </button>
        {(data.promos || []).length ? (
          <ul>
            {data.promos.map((row: any) => (
              <li key={row.id}>
                {row.code} · {row.value} · used {row.uses}/{row.max_uses}
              </li>
            ))}
          </ul>
        ) : (
          <p className="ee-muted">Codes apply on quotes and jobs.</p>
        )}
      </form>
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await call("entertainment_express.api.engagement.save_referral", { values: { referrer, email: refEmail } });
            setRefEmail("");
            reload();
          } catch (err: any) {
            setError(err.message || "Could not save that referral.");
          }
        }}
      >
        <h2 style={{ margin: 0 }}>Referrals</h2>
        <FormField label="Who sent them">
          <select value={referrer} onChange={(e) => setReferrer(e.target.value)}>
            <option value="">Pick a customer</option>
            {(data.customers || []).map((row: any) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="New person email">
          <input type="email" value={refEmail} onChange={(e) => setRefEmail(e.target.value)} required />
        </FormField>
        <button type="submit" className="ee-btn">
          Save referral
        </button>
        {(data.referrals || []).length ? (
          <ul>
            {data.referrals.map((row: any) => (
              <li key={row.id}>
                {row.referrer} → {row.email} · {row.status}
                {row.reward ? ` · ${row.reward}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </form>
      <form
        className="ee-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await call("entertainment_express.api.engagement.save_review_url", { url: reviewUrl });
            setNote("Review link saved. Completed jobs will get a thank-you.");
          } catch (err: any) {
            setError(err.message || "Could not save that link.");
          }
        }}
      >
        <h2 style={{ margin: 0 }}>Review link</h2>
        <FormField label="Google (or other) review URL">
          <input value={reviewUrl} onChange={(e) => setReviewUrl(e.target.value)} placeholder="https://" />
        </FormField>
        <button type="submit" className="ee-btn">
          Save review link
        </button>
      </form>
    </section>
  );
}

function ConnectionsWorkspace() {
  const GROUPS = [
    { title: "Calendar", ids: ["google_calendar", "microsoft_365", "ical"] },
    { title: "Maps", ids: ["mapbox", "google_maps"] },
    { title: "Signing", ids: ["docusign"] },
    { title: "Books", ids: ["quickbooks", "xero"] },
    { title: "Music", ids: ["spotify", "apple_music", "youtube"] },
    { title: "Payments", ids: ["stripe", "square", "paypal", "ach", "authorizenet"] },
  ];
  const [rows, setRows] = React.useState<any[]>([]);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [draft, setDraft] = React.useState<Record<string, string>>({});
  const [icalUrl, setIcalUrl] = React.useState("");

  const load = () => {
    call("entertainment_express.api.integrations.list_connections", {})
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  };

  React.useEffect(() => {
    load();
  }, []);

  const save = async (provider: string, enabled: number) => {
    setBusy(provider);
    setError("");
    try {
      const raw = (draft[provider] || "").trim();
      const credentials = raw ? { token: raw, api_key: raw, access_token: raw, key: raw } : {};
      await call("entertainment_express.api.integrations.save_connection", { provider, enabled, credentials });
      setDraft({ ...draft, [provider]: "" });
      load();
    } catch (err: any) {
      setError(err.message || "Could not save that connection.");
    } finally {
      setBusy("");
    }
  };

  const rotateIcal = async () => {
    setBusy("ical");
    setError("");
    try {
      const res = await call("entertainment_express.api.integrations.rotate_ical_token", {});
      setIcalUrl(res?.url || "");
      load();
    } catch (err: any) {
      setError(err.message || "Could not create a calendar feed.");
    } finally {
      setBusy("");
    }
  };

  const renderRow = (row: any) => (
    <div key={row.provider} className="ee-form" style={{ maxWidth: "none" }}>
      <p style={{ margin: 0 }}>
        <strong>{row.label}</strong> · {row.status}
        {row.enabled ? " · on" : " · off"}
      </p>
      {row.last_error ? <p className="ee-muted">{row.last_error}</p> : null}
      {row.provider === "ical" ? (
        <button type="button" className="ee-btn" disabled={busy === "ical"} onClick={rotateIcal}>
          New calendar feed link
        </button>
      ) : (
        <>
          <FormField label="Key or token">
            <input
              type="password"
              value={draft[row.provider] || ""}
              onChange={(e) => setDraft({ ...draft, [row.provider]: e.target.value })}
              autoComplete="off"
            />
          </FormField>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="ee-btn" disabled={!!busy} onClick={() => save(row.provider, 1)}>
              Save and turn on
            </button>
            <button type="button" className="ee-btn ee-btn--ghost" disabled={!!busy} onClick={() => save(row.provider, 0)}>
              Turn off
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Connections</h1>
        <p className="ee-muted">Link calendars, maps, signing, books, and music for this company. Keys stay on the server and are never shown again.</p>
      </header>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {rows.length ? (
        GROUPS.map((group) => {
          const items = rows.filter((row) => group.ids.includes(row.provider));
          if (!items.length) return null;
          return (
            <div key={group.title} style={{ display: "grid", gap: "0.75rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{group.title}</h2>
              {items.map(renderRow)}
            </div>
          );
        })
      ) : (
        <EmptyState title="Connections" message="Connections for this company will show here." />
      )}
      {icalUrl ? <p className="ee-muted">Feed URL (copy now): {icalUrl}</p> : null}
    </section>
  );
}

function SecurityWorkspace() {
  const [info, setInfo] = React.useState<any>(null);
  const [domains, setDomains] = React.useState<any[]>([]);
  const [auditRows, setAuditRows] = React.useState<any[]>([]);
  const [host, setHost] = React.useState("");
  const [issuer, setIssuer] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [clientSecret, setClientSecret] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = () => {
    call("entertainment_express.api.hardening.security_status", {})
      .then((res) => setInfo(res || {}))
      .catch(() => setInfo(null));
    call("entertainment_express.api.hardening.list_custom_domains", {})
      .then((res) => setDomains(res || []))
      .catch(() => setDomains([]));
    call("entertainment_express.api.hardening.list_audit", { limit: 20 })
      .then((res) => setAuditRows(res || []))
      .catch(() => setAuditRows([]));
  };

  React.useEffect(() => {
    load();
  }, []);

  const toggle2fa = async (enabled: number) => {
    setBusy(true);
    setError("");
    try {
      await call("entertainment_express.api.hardening.set_require_2fa", { enabled });
      load();
    } catch (err: any) {
      setError(err.message || "Could not update two-step setting.");
    } finally {
      setBusy(false);
    }
  };

  const addDomain = async () => {
    setBusy(true);
    setError("");
    try {
      await call("entertainment_express.api.hardening.request_custom_domain", { hostname: host });
      setHost("");
      load();
    } catch (err: any) {
      setError(err.message || "Could not save that hostname.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (hostname: string) => {
    setBusy(true);
    setError("");
    try {
      await call("entertainment_express.api.hardening.verify_custom_domain", { hostname });
      load();
    } catch (err: any) {
      setError(err.message || "Could not verify that hostname.");
    } finally {
      setBusy(false);
    }
  };

  const saveSso = async (enabled: number) => {
    setBusy(true);
    setError("");
    try {
      await call("entertainment_express.api.hardening.save_sso", {
        issuer,
        client_id: clientId,
        client_secret: clientSecret,
        enabled,
      });
      setClientSecret("");
      load();
    } catch (err: any) {
      setError(err.message || "Could not save sign-in provider.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ee-records" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>Security</h1>
        <p className="ee-muted">Two-step codes, custom hostnames, and sign-in for this company. Keys stay on the server.</p>
      </header>
      {error ? <p className="ee-form__error">{error}</p> : null}
      <div className="ee-form" style={{ maxWidth: "none" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Two-step codes</h2>
        <p className="ee-muted">Require a phone code for company admins on this site. Enroll at sign-in after you turn this on.</p>
        <p>{info?.require_2fa ? "On" : "Off"}</p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" className="ee-btn" disabled={busy} onClick={() => toggle2fa(1)}>
            Turn on
          </button>
          <button type="button" className="ee-btn ee-btn--ghost" disabled={busy} onClick={() => toggle2fa(0)}>
            Turn off
          </button>
        </div>
      </div>
      <div className="ee-form" style={{ maxWidth: "none" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Custom hostname</h2>
        <p className="ee-muted">Point a CNAME at {info?.default_host || "this company's default address"}, then verify. TLS is issued by the operator after verify.</p>
        <FormField label="Hostname">
          <input value={host} onChange={(e) => setHost(e.target.value)} autoComplete="off" />
        </FormField>
        <button type="button" className="ee-btn" disabled={busy || !host.trim()} onClick={addDomain}>
          Save hostname
        </button>
        {domains.length ? (
          <ul>
            {domains.map((row) => (
              <li key={row.hostname}>
                {row.hostname} · {row.verified ? "verified" : "not verified"}
                {!row.verified ? (
                  <button type="button" className="ee-btn ee-btn--ghost" disabled={busy} onClick={() => verify(row.hostname)}>
                    Check DNS
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Hostnames" message="Custom hostnames for this company will show here." />
        )}
      </div>
      <div className="ee-form" style={{ maxWidth: "none" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Sign-in provider</h2>
        <p className="ee-muted">{info?.sso_status === "connected" ? "Connected. Password sign-in still works." : "Off. Password sign-in is the path until you connect a provider."}</p>
        <FormField label="Issuer URL">
          <input value={issuer} onChange={(e) => setIssuer(e.target.value)} autoComplete="off" />
        </FormField>
        <FormField label="Client id">
          <input value={clientId} onChange={(e) => setClientId(e.target.value)} autoComplete="off" />
        </FormField>
        <FormField label="Client secret">
          <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} autoComplete="off" />
        </FormField>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" className="ee-btn" disabled={busy} onClick={() => saveSso(1)}>
            Save and turn on
          </button>
          <button type="button" className="ee-btn ee-btn--ghost" disabled={busy} onClick={() => saveSso(0)}>
            Turn off
          </button>
        </div>
      </div>
      <div className="ee-form" style={{ maxWidth: "none" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Recent activity</h2>
        {auditRows.length ? (
          <ul>
            {auditRows.map((row, idx) => (
              <li key={idx}>
                {row.action} · {row.actor} · {row.when}
                {row.related ? ` · ${row.related}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Activity" message="Security events for this company will show here." />
        )}
      </div>
    </section>
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
          <Route path="/places" element={<PlacesWorkspace />} />
          <Route path="/partners" element={<PartnersWorkspace />} />
          <Route path="/coverage" element={<CoverageWorkspace />} />
          <Route path="/move" element={<MoveWorkspace />} />
          <Route path="/dispatch" element={<DispatchWorkspace />} />
          <Route path="/event-details" element={<EventPlanningWorkspace />} />
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
          <Route path="/assistant" element={<AssistantWorkspace />} />
          <Route path="/plan" element={<PlanWorkspace />} />
          <Route path="/automations" element={<AutomationsWorkspace />} />
          <Route path="/grow" element={<GrowWorkspace />} />
          <Route path="/brand" element={<SettingsWorkspace />} />
          <Route path="/connections" element={<ConnectionsWorkspace />} />
          <Route path="/security" element={<SecurityWorkspace />} />
          <Route path="/account" element={<AccountPanel />} />
          <Route path="/settings" element={<Navigate to="/brand" replace />} />
          <Route path="/approvals" element={<ApprovalsWorkspace />} />
          <Route path="*" element={<EmptyState title="Not found" message="That page is not in your company workspace." />} />
        </Routes>
      )}
    </AppShell>
  );
}
