import React from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import {
  AppShell,
  DataTable,
  EmptyState,
  FormField,
  Money,
  StatCard,
  call,
  resource,
} from "../../portal-kit/src";

const OWNER_NAV = [
  { to: "/", label: "Overview" },
  { to: "/approvals", label: "Approvals" },
  { to: "/money", label: "Money" },
  { to: "/team", label: "Team" },
  { to: "/catalog", label: "Catalog" },
  { to: "/settings", label: "Settings" },
];

function Overview() {
  const [stats, setStats] = React.useState<any>(null);
  const [approvals, setApprovals] = React.useState<any[]>([]);

  React.useEffect(() => {
    call("entertainment_express.api.portal_owner.get_owner_dashboard", {})
      .then(setStats)
      .catch(() => setStats({ revenue: "0.00", new_bookings: 0, pipeline_value: "0.00", outstanding_balance: "0.00", at_risk_count: 0 }));
    call("entertainment_express.api.portal_owner.get_approvals", {})
      .then((res) => setApprovals(res || []))
      .catch(() => setApprovals([]));
  }, []);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <StatCard label="Revenue" value={String(stats?.revenue || "0.00")} />
        <StatCard label="Pipeline" value={String(stats?.pipeline_value || "0.00")} />
        <StatCard label="Outstanding" value={String(stats?.outstanding_balance || "0.00")} />
        <StatCard label="New bookings" value={String(stats?.new_bookings || 0)} />
        <StatCard label="At risk" value={String(stats?.at_risk_count || 0)} />
        <StatCard label="Pending approvals" value={String(approvals.length)} />
      </div>
      <p style={{ margin: 0, color: "var(--ee-muted)" }}>
        Money figures are API strings: <Money amount={String(stats?.revenue || "0.00")} /> revenue.
      </p>
      {approvals.length ? (
        <ApprovalsList rows={approvals} onChanged={() => call("entertainment_express.api.portal_owner.get_approvals", {}).then((res) => setApprovals(res || [])).catch(() => setApprovals([]))} />
      ) : (
        <EmptyState title="Approvals" message="No pending approvals." />
      )}
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
              Approve
            </button>
            <button type="button" onClick={() => act(row, "rejected")} style={{ background: "var(--ee-danger)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.4rem 0.75rem" }}>
              Reject
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
    <EmptyState title="Catalog" message="Service items will appear here." />
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
  const sidebar = OWNER_NAV.map((item) => (
    <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => (isActive ? "ee-nav-active" : "")}>
      {item.label}
    </NavLink>
  ));

  return (
    <AppShell title="Owner Portal" density="cockpit" sidebar={sidebar}>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/approvals" element={<ApprovalsWorkspace />} />
        <Route path="/money" element={<MoneyWorkspace />} />
        <Route path="/finances" element={<Navigate to="/money" replace />} />
        <Route path="/team" element={<TeamWorkspace />} />
        <Route path="/catalog" element={<CatalogWorkspace />} />
        <Route path="/settings" element={<SettingsWorkspace />} />
        <Route path="*" element={<EmptyState title="Owner Workspace" message="That page is not in the owner cockpit." />} />
      </Routes>
    </AppShell>
  );
}
