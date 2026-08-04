import React from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell, DataTable, EmptyState, FormField, StatCard, call, resource } from "../../portal-kit/src";

function Dashboard() {
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    call("entertainment_express.api.portal_owner.get_owner_dashboard", {}).then(setStats).catch(() => {
      setStats({ revenue: "0.00", new_bookings: 0, pipeline_value: "0.00" });
    });
  }, []);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
        <StatCard label="Revenue" value={stats?.revenue || "0.00"} />
        <StatCard label="New Bookings" value={String(stats?.new_bookings || 0)} />
        <StatCard label="Pipeline" value={stats?.pipeline_value || "0.00"} />
      </div>
      <EmptyState title="Owner Cockpit" message="Approvals, team access, and financial views are scaffolded for Phase-20." />
    </section>
  );
}

function ApprovalsWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);

  React.useEffect(() => {
    call("entertainment_express.api.portal_owner.get_approvals", {})
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  }, []);

  return rows.length ? (
    <DataTable
      id="owner-approvals"
      columns={[
        { key: "type", label: "Type" },
        { key: "id", label: "Reference" },
        { key: "summary", label: "Summary" },
      ]}
      rows={rows}
    />
  ) : (
    <EmptyState title="Approvals Queue" message="No pending approvals right now." />
  );
}

function FinancesWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);

  React.useEffect(() => {
    call("entertainment_express.api.portal_owner.get_financial_overview", {})
      .then((res) => setRows(res?.outstanding || []))
      .catch(() => setRows([]));
  }, []);

  return rows.length ? (
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
      <button onClick={invite} style={{ width: "fit-content", padding: "0.5rem 0.8rem" }}>Invite Staff</button>
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

  React.useEffect(() => {
    settings.get("EE Portal Settings")
      .then(setRow)
      .catch(() => setRow(null));
  }, []);

  return row ? (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <p>Portal Mode: {row.portal_mode || "warn"}</p>
      <p>Brand Name: {row.brand_name || "Not set"}</p>
      <p>Brand Color: {row.brand_color || "Not set"}</p>
    </div>
  ) : (
    <EmptyState title="Portal Settings" message="Branding and rollout mode will appear here." />
  );
}

function Placeholder({ title }: { title: string }) {
  return <EmptyState title={title} message="Workspace is scaffolded and ready for feature implementation." />;
}

export function OwnerApp() {
  return (
    <AppShell title="Owner Portal">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/owner" element={<Dashboard />} />
        <Route path="/owner/approvals" element={<ApprovalsWorkspace />} />
        <Route path="/owner/finances" element={<FinancesWorkspace />} />
        <Route path="/owner/team" element={<TeamWorkspace />} />
        <Route path="/owner/catalog" element={<CatalogWorkspace />} />
        <Route path="/owner/settings" element={<SettingsWorkspace />} />
        <Route path="*" element={<Placeholder title="Owner Workspace" />} />
      </Routes>
    </AppShell>
  );
}
