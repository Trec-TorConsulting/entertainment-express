import React from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import {
  AccountPanel,
  AppShell,
  BookingDetail,
  DataTable,
  EmptyState,
  FormField,
  Money,
  ModeSwitch,
  StatCard,
  call,
  downloadBase64,
  downloadText,
  getSessionBootstrap,
  resource,
} from "../../portal-kit/src";

const OWNER_NAV = [
  {
    label: "Operations",
    items: [
      { to: "/", label: "Today" },
      { to: "/calendar", label: "Calendar" },
      { to: "/pipeline", label: "Pipeline" },
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
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  React.useEffect(() => {
    call("entertainment_express.api.portal_owner.get_owner_dashboard", {})
      .then(setStats)
      .catch(() => setStats({ revenue: "0.00", outstanding_balance: "0.00", at_risk_count: 0, unread_chat: 0, jobs: [] }));
    call("entertainment_express.api.portal_owner.get_approvals", {})
      .then((res) => setApprovals(res || []))
      .catch(() => setApprovals([]));
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
                <h3>{job.event_name || job.name}</h3>
                <p>
                  {job.event_date} {job.start_time ? `· ${job.start_time}` : ""} · {job.status}
                </p>
                {job.venue_address ? <p>{job.venue_address}</p> : null}
                {job.balance_due ? <p>Left {job.balance_due}</p> : null}
              </article>
            ))
          ) : (
            <EmptyState title="No jobs this week" message="When a booking is confirmed it shows up here." actionLabel="Open pipeline" onAction={() => (window.location.href = "/owner/pipeline")} />
          )}
        </div>
        {approvals.length ? (
          <ApprovalsList rows={approvals} onChanged={() => call("entertainment_express.api.portal_owner.get_approvals", {}).then((res) => setApprovals(res || [])).catch(() => setApprovals([]))} />
        ) : (
          <EmptyState title="You're clear" message="Open Frappe tasks assigned to your team land here. Chat from events is in Inbox." />
        )}
      </div>
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
          <p style={{ margin: "0.25rem 0 0.75rem", color: "var(--ee-muted)" }}>{row.id || row.name}</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={() => act(row, "approved")} style={{ background: "var(--ee-success)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.4rem 0.75rem" }}>
              {row.type === "todo" ? "Done" : "Approve"}
            </button>
            <button type="button" onClick={() => act(row, "rejected")} style={{ background: "var(--ee-danger)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.4rem 0.75rem" }}>
              {row.type === "todo" ? "Dismiss" : "Reject"}
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
  const [payload, setPayload] = React.useState<any>(null);

  React.useEffect(() => {
    call("entertainment_express.api.portal_owner.get_financial_overview", {})
      .then(setPayload)
      .catch(() => setPayload({ outstanding: [], totals: { outstanding_total: "0.00" } }));
  }, []);

  const rows = payload?.outstanding || [];

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <StatCard label="Outstanding total" value={String(payload?.totals?.outstanding_total || "0.00")} />
      <p style={{ margin: 0 }}>
        Total: <Money amount={String(payload?.totals?.outstanding_total || "0.00")} />
      </p>
      {rows.length ? (
        <DataTable
          id="owner-finances"
          columns={[
            { key: "name", label: "Invoice" },
            { key: "customer", label: "Customer" },
            { key: "outstanding_amount", label: "Outstanding" },
            { key: "currency", label: "Currency" },
          ]}
          rows={rows}
        />
      ) : (
        <EmptyState title="Financial Overview" message="Outstanding balances will appear here." />
      )}
    </section>
  );
}

function TeamWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");

  const reload = () => {
    call("entertainment_express.api.portal_owner.list_staff", {})
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  };

  React.useEffect(() => {
    reload();
  }, []);

  const invite = async () => {
    await call("entertainment_express.api.portal_owner.invite_staff", {
      email,
      full_name: name,
      roles: ["EE Office"],
    });
    setEmail("");
    setName("");
    reload();
  };

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
        <FormField label="Email">
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Full Name">
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
      </div>
      <button type="button" onClick={invite} style={{ width: "fit-content", padding: "0.5rem 0.8rem", background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem" }}>
        Invite Staff
      </button>
      {rows.length ? (
        <DataTable
          id="owner-team"
          columns={[
            { key: "name", label: "User" },
            { key: "full_name", label: "Name" },
            { key: "email", label: "Email" },
          ]}
          rows={rows}
        />
      ) : (
        <EmptyState title="Team" message="No active staff records found." />
      )}
    </section>
  );
}

function CatalogWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);

  React.useEffect(() => {
    call("entertainment_express.api.catalog.list_service_items", {})
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  }, []);

  return rows.length ? (
    <DataTable
      id="owner-catalog"
      columns={[
        { key: "name", label: "Item" },
        { key: "item_name", label: "Name" },
        { key: "standard_rate", label: "Rate" },
        { key: "ee_unit", label: "Unit" },
      ]}
      rows={rows}
    />
  ) : (
    <EmptyState title="Packages" message="Add what you sell so quotes pick it up automatically." />
  );
}

function CalendarWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(() => {
    call("entertainment_express.api.portal_owner.get_owner_dashboard", {})
      .then((res) => setRows(res?.jobs || []))
      .catch(() => setRows([]));
  }, []);
  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      {rows.length ? (
        <DataTable id="owner-calendar" columns={[{ key: "event_name", label: "Event" }, { key: "event_date", label: "Date" }, { key: "status", label: "Status" }]} rows={rows} />
      ) : (
        <EmptyState title="Calendar is empty" message="Confirmed events show here by date." />
      )}
      <BookingDetail booking={rows[0] || null} emptyMessage="Your next event details show here." />
    </section>
  );
}

function PipelineWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(() => {
    call("frappe.client.get_list", { doctype: "Lead", fields: ["name", "lead_name", "status", "modified"], order_by: "modified desc", limit_page_length: 20 })
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  }, []);
  return rows.length ? (
    <DataTable id="owner-pipeline" columns={[{ key: "lead_name", label: "Lead" }, { key: "status", label: "Status" }, { key: "modified", label: "Updated" }]} rows={rows} />
  ) : (
    <EmptyState title="No leads yet" message="New inquiries land here until they become a booking." />
  );
}

function DispatchWorkspace() {
  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <p style={{ margin: 0 }}>
        <a href="/dispatch" style={{ color: "var(--ee-brand)" }}>Open the dispatch board</a>
      </p>
      <iframe title="Dispatch" src="/dispatch" style={{ width: "100%", minHeight: "70vh", border: "1px solid var(--ee-border)", borderRadius: "var(--ee-radius)" }} />
    </section>
  );
}

function GearWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(() => {
    call("frappe.client.get_list", { doctype: "Vehicle", fields: ["name", "vehicle_name", "status"], limit_page_length: 20 })
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  }, []);
  return rows.length ? (
    <DataTable id="owner-gear" columns={[{ key: "name", label: "Gear" }, { key: "vehicle_name", label: "Name" }, { key: "status", label: "Status" }]} rows={rows} />
  ) : (
    <EmptyState title="No gear listed" message="Trucks, booths, and bounce units you track show here." />
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

function AutomationsWorkspace() {
  return <EmptyState title="Reminders" message="Deposit chasers and planning nudges use your existing notification settings. Nothing extra to install." />;
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
  const settings = resource("EE Portal Settings");
  const [row, setRow] = React.useState<any>(null);
  const [brandColor, setBrandColor] = React.useState("#006c67");
  const [saved, setSaved] = React.useState("");

  React.useEffect(() => {
    settings
      .get("EE Portal Settings")
      .then((doc) => {
        setRow(doc);
        if (doc?.brand_color) setBrandColor(doc.brand_color);
      })
      .catch(() => setRow(null));
  }, []);

  const saveColor = async () => {
    await call("frappe.client.set_value", {
      doctype: "EE Portal Settings",
      name: "EE Portal Settings",
      fieldname: "brand_color",
      value: brandColor,
    });
    document.documentElement.style.setProperty("--ee-brand", brandColor);
    setSaved("Saved");
  };

  return row ? (
    <div style={{ display: "grid", gap: "0.75rem", maxWidth: 420 }}>
      <p>Portal Mode: {row.portal_mode || "warn"}</p>
      <p>Brand Name: {row.brand_name || "Not set"}</p>
      <FormField label="Brand color">
        <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
      </FormField>
      <button type="button" onClick={saveColor} style={{ width: "fit-content", padding: "0.5rem 0.8rem", background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem" }}>
        Save brand color
      </button>
      {saved ? <p style={{ color: "var(--ee-success)" }}>{saved}</p> : null}
    </div>
  ) : (
    <EmptyState title="Portal Settings" message="Branding and rollout mode will appear here." />
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
          <Route path="/pipeline" element={<PipelineWorkspace />} />
          <Route path="/dispatch" element={<DispatchWorkspace />} />
          <Route path="/catalog" element={<CatalogWorkspace />} />
          <Route path="/gear" element={<GearWorkspace />} />
          <Route path="/people" element={<TeamWorkspace />} />
          <Route path="/team" element={<Navigate to="/people" replace />} />
          <Route path="/money" element={<MoneyWorkspace />} />
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
