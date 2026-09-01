import React, { useMemo, useState } from "react";
import { NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  AccountPanel,
  AppShell,
  CommandPalette,
  ConflictBanner,
  DataTable,
  DispatchBoard,
  EmptyState,
  FieldBoard,
  FormField,
  StatCard,
  focusCommandPalette,
  getSessionBootstrap,
  call,
  downloadBase64,
  downloadText,
} from "../../portal-kit/src";

type SearchItem = {
  type: string;
  id: string;
  label: string;
  meta: string;
  route: string;
};

const ROLE_PRIMARY: Array<{ roles: string[]; to: string; label: string }> = [
  { roles: ["EE Dispatcher"], to: "/dispatch", label: "Dispatch" },
  { roles: ["EE Crew", "EE Entertainer"], to: "/field", label: "Field" },
  { roles: ["EE Sales"], to: "/sales", label: "Sales" },
  { roles: ["EE Accounting"], to: "/accounting", label: "Accounting" },
];

function Home() {
  const bootstrap = getSessionBootstrap();
  const roles = bootstrap.roles || [];
  const [results, setResults] = useState<SearchItem[]>([]);
  const [day, setDay] = useState<any>(null);

  React.useEffect(() => {
    call("entertainment_express.api.portal_employee.get_my_day", {})
      .then(setDay)
      .catch(() => setDay({ tasks: [], assignments: [], schedule: [], today_jobs: [], at_risk: [], at_risk_count: 0 }));
  }, []);

  const isDispatcher = roles.includes("EE Dispatcher");
  const jobs = day?.today_jobs?.length ? day.today_jobs : day?.schedule || [];
  const atRisk = day?.at_risk || jobs.filter((row: any) => row.at_risk);

  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <CommandPalette
        onSearch={async (query) => {
          const payload = await call("entertainment_express.api.portal_employee.search", { query });
          setResults(payload || []);
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.5rem" }}>
        <StatCard compact label="User" value={bootstrap.user || "Unknown"} />
        <StatCard compact label="Jobs today" value={String(jobs.length)} />
        <StatCard compact label="At risk" value={String(day?.at_risk_count ?? atRisk.length ?? 0)} />
      </div>

      {isDispatcher ? (
        jobs.length ? (
          <DataTable
            id="employee-my-day-jobs"
            columns={[
              { key: "name", label: "Booking" },
              { key: "event_name", label: "Event" },
              { key: "event_date", label: "Date" },
              { key: "start_time", label: "Start" },
              { key: "status", label: "Status" },
            ]}
            rows={jobs}
          />
        ) : (
          <EmptyState title="Today's jobs" message="No bookings on the board for today." />
        )
      ) : day?.assignments?.length ? (
        <DataTable
          id="employee-my-day-assignments"
          columns={[
            { key: "name", label: "Assignment" },
            { key: "booking", label: "Booking" },
            { key: "status", label: "Status" },
            { key: "role", label: "Role" },
          ]}
          rows={day.assignments}
        />
      ) : day?.tasks?.length ? (
        <DataTable
          id="employee-my-day-tasks"
          columns={[
            { key: "name", label: "Inquiry" },
            { key: "lead_name", label: "Contact" },
            { key: "status", label: "Status" },
          ]}
          rows={day.tasks}
        />
      ) : (
        <EmptyState title="My Day" message="Nothing queued for your roles yet." />
      )}

      {isDispatcher && atRisk.length ? (
        <DataTable
          id="employee-my-day-at-risk"
          columns={[
            { key: "name", label: "At-risk booking" },
            { key: "event_name", label: "Event" },
            { key: "status", label: "Status" },
          ]}
          rows={atRisk}
        />
      ) : null}

      {results.length ? (
        <ul>
          {results.map((item) => (
            <li key={`${item.type}:${item.id}`}>
              <a href={item.route} style={{ color: "var(--ee-brand)" }}>
                {item.label}
              </a>{" "}
              - {item.meta}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function GuardedWorkspace({ roles, allow, children }: { roles: string[]; allow: string[]; children: React.ReactNode }) {
  const ok = roles.some((role) => allow.includes(role));
  if (!ok) {
    return <EmptyState title="Access Denied" message="Your role does not include this workspace." />;
  }
  return <>{children}</>;
}

function FieldWorkspace() {
  return <FieldBoard />;
}

function SalesWorkspace() {
  const go = useNavigate();
  const [rows, setRows] = React.useState<any[]>([]);

  React.useEffect(() => {
    call("entertainment_express.api.portal_proposal.list_inquiries", {})
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  }, []);

  return rows.length ? (
    <DataTable
      id="employee-sales-leads"
      columns={[
        { key: "contact", label: "Inquiry" },
        { key: "status", label: "Status" },
        { key: "updated", label: "Updated" },
      ]}
      rows={rows}
      onRowClick={(row) => go(`/sales/${encodeURIComponent(row.id)}/proposal`)}
    />
  ) : (
    <EmptyState title="Sales" message="Open inquiries will appear here. Click one to send a proposal." />
  );
}

function ProposalWorkspace() {
  const { id } = useParams();
  const go = useNavigate();
  const [doc, setDoc] = React.useState<any>(null);
  const [picked, setPicked] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const reload = () => {
    if (!id) return;
    call("entertainment_express.api.portal_proposal.get_proposal", { source: "inquiry", name: id })
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
  }, [id]);

  const selected = (doc?.catalog || []).filter((row: any) => picked[row.id]).map((row: any) => ({ id: row.id, kind: row.kind, qty: 1, rate_raw: row.rate_raw }));

  const save = async (send = false) => {
    setBusy(true);
    setError("");
    try {
      await call("entertainment_express.api.portal_proposal.save_proposal", { source: "inquiry", name: id, selected, deposit_percent: doc?.deposit_percent || 25 });
      if (send) await call("entertainment_express.api.portal_proposal.send_proposal", { source: "inquiry", name: id });
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
          <button type="button" className="ee-back" onClick={() => go("/sales")}>
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

function AccountingWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);

  React.useEffect(() => {
    call("frappe.client.get_list", {
      doctype: "Sales Invoice",
      fields: ["name", "customer", "outstanding_amount", "currency"],
      order_by: "modified desc",
      limit_page_length: 20,
    })
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  }, []);

  return rows.length ? (
    <DataTable
      id="employee-accounting-invoices"
      columns={[
        { key: "name", label: "Invoice" },
        { key: "customer", label: "Client" },
        { key: "outstanding_amount", label: "Outstanding" },
        { key: "currency", label: "Currency" },
      ]}
      rows={rows}
    />
  ) : (
    <EmptyState title="Accounting Workspace" message="Open invoices will appear here." />
  );
}

function PullSheetWorkspace() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [booking, setBooking] = React.useState("");
  const [sheet, setSheet] = React.useState<any>(null);

  React.useEffect(() => {
    call("entertainment_express.api.portal_employee.get_my_day", {})
      .then((day) => {
        const rows = day?.schedule?.length ? day.schedule : day?.today_jobs || [];
        setJobs(rows);
        if (rows[0]?.name) setBooking(rows[0].name);
      })
      .catch(() => setJobs([]));
  }, []);

  React.useEffect(() => {
    if (!booking) return;
    call("entertainment_express.api.fleet_ops.generate_packing_list", { booking_name: booking })
      .then(setSheet)
      .catch(() =>
        call("entertainment_express.api.fleet_ops.packing_status", { booking_name: booking })
          .then(setSheet)
          .catch(() => setSheet({ items: [] }))
      );
  }, [booking]);

  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <h1 style={{ margin: 0 }}>Pull sheet</h1>
      {jobs.length ? (
        <FormField label="Job">
          <select value={booking} onChange={(e) => setBooking(e.target.value)}>
            {jobs.map((job: any) => (
              <option key={job.name} value={job.name}>
                {job.event_name || job.name}
              </option>
            ))}
          </select>
        </FormField>
      ) : null}
      {sheet?.items?.length ? (
        <DataTable
          id="pull-sheet"
          columns={[
            { key: "item_name", label: "Item" },
            { key: "qty", label: "Qty" },
            { key: "kind", label: "From" },
          ]}
          rows={sheet.items}
        />
      ) : (
        <EmptyState title="Nothing to pull" message="Warehouse and rental gear for today’s jobs shows here." />
      )}
    </section>
  );
}

function DispatchWorkspace() {
  const roles = getSessionBootstrap().roles || [];
  return <DispatchBoard canAssign={roles.includes("EE Dispatcher")} />;
}

function MeWorkspace() {
  return <AccountPanel />;
}

function ReportsWorkspace() {
  const [pack, setPack] = React.useState<any>(null);
  React.useEffect(() => {
    call("entertainment_express.api.portal_reports.employee_pack", {}).then(setPack).catch(() => setPack(null));
  }, []);
  if (!pack) return <EmptyState title="Reports" message="Your numbers for this role show here." />;
  const cards = Object.entries(pack).filter(([, value]) => value !== undefined && typeof value !== "object");
  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        {cards.map(([key, value]) => (
          <StatCard key={key} label={key.replace(/_/g, " ")} value={String(value)} />
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={async () => {
            const csv = await call("entertainment_express.api.portal_reports.employee_pack_csv", {});
            downloadText("my-reports.csv", String(csv || ""), "text/csv");
          }}
          style={{ background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.5rem 0.8rem" }}
        >
          Download spreadsheet
        </button>
        <button
          type="button"
          onClick={async () => {
            const pdf = await call("entertainment_express.api.portal_reports.employee_pack_pdf", {});
            if (pdf?.content_b64) downloadBase64(pdf.filename || "my-reports.pdf", pdf.content_b64, "application/pdf");
          }}
          style={{ background: "var(--ee-panel)", color: "var(--ee-text)", border: "1px solid var(--ee-border)", borderRadius: "0.5rem", padding: "0.5rem 0.8rem" }}
        >
          Download PDF
        </button>
      </div>
    </section>
  );
}

export function EmployeeApp() {
  const roles = getSessionBootstrap().roles || [];
  const navigate = useNavigate();
  const primary = useMemo(() => ROLE_PRIMARY.find((entry) => entry.roles.some((role) => roles.includes(role))), [roles]);

  const nav = [
    { to: "/", label: "My Day" },
    { to: "/dispatch", label: "Dispatch" },
    { to: "/pull-sheet", label: "Pull sheet" },
    { to: "/field", label: "Field" },
    { to: "/sales", label: "Sales" },
    { to: "/accounting", label: "Money" },
    { to: "/reports", label: "Reports" },
    { to: "/me", label: "Me" },
  ];

  const bottomNav = [
    { kind: "link" as const, to: "/", label: "Home" },
    { kind: "link" as const, to: primary?.to || "/me", label: primary?.label || "Ops" },
    {
      kind: "action" as const,
      id: "search",
      label: "Search",
      onClick: () => {
        navigate("/");
        window.setTimeout(() => focusCommandPalette(), 0);
      },
    },
    { kind: "link" as const, to: "/me", label: "Me" },
  ];

  const sidebar = nav.map((item) => (
    <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => (isActive ? "ee-nav-active" : "")}>
      {item.label}
    </NavLink>
  ));

  const bottom = (
    <>
      {bottomNav.map((item) =>
        item.kind === "link" ? (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => (isActive ? "ee-nav-active" : "")}>
            {item.label}
          </NavLink>
        ) : (
          <button key={item.id} type="button" onClick={item.onClick}>
            {item.label}
          </button>
        )
      )}
    </>
  );

  return (
    <AppShell title="Staff" portal="employee" density="ops" sidebar={sidebar} bottom={bottom}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dispatch"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Dispatcher"]}>
              <DispatchWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route
          path="/pull-sheet"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Dispatcher", "EE Crew"]}>
              <PullSheetWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route
          path="/field"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Crew", "EE Entertainer"]}>
              <FieldWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route
          path="/sales"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Sales"]}>
              <SalesWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route
          path="/sales/:id/proposal"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Sales"]}>
              <ProposalWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route
          path="/accounting"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Accounting"]}>
              <AccountingWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route path="/me" element={<MeWorkspace />} />
        <Route path="/reports" element={<ReportsWorkspace />} />
        <Route path="*" element={<EmptyState title="Employee Workspace" message="That page is not in this portal." />} />
      </Routes>
    </AppShell>
  );
}
