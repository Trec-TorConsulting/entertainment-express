import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import {
  AppShell,
  CommandPalette,
  DataTable,
  EmptyState,
  StatCard,
  getSessionBootstrap,
  call,
} from "../../portal-kit/src";

type SearchItem = {
  type: string;
  id: string;
  label: string;
  meta: string;
  route: string;
};

function Home() {
  const bootstrap = getSessionBootstrap();
  const [results, setResults] = useState<SearchItem[]>([]);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <CommandPalette
        onSearch={async (query) => {
          const payload = await call("entertainment_express.api.portal_employee.search", { query });
          setResults(payload || []);
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
        <StatCard label="User" value={bootstrap.user || "Unknown"} />
        <StatCard label="Roles" value={(bootstrap.roles || []).join(", ") || "None"} />
      </div>

      {results.length ? (
        <ul>
          {results.map((item) => (
            <li key={`${item.type}:${item.id}`}>
              {item.label} - {item.meta}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="My Day" message="Search bookings, customers, and tasks from one place." />
      )}
    </section>
  );
}

function Placeholder({ title }: { title: string }) {
  return <EmptyState title={title} message="Workspace is scaffolded and ready for feature implementation." />;
}

function GuardedWorkspace({ roles, allow, children }: { roles: string[]; allow: string[]; children: React.ReactNode }) {
  const ok = roles.some((role) => allow.includes(role));
  if (!ok) {
    return <EmptyState title="Access Denied" message="Your role does not include this workspace." />;
  }
  return <>{children}</>;
}

function FieldWorkspace() {
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [statusMsg, setStatusMsg] = React.useState("");

  React.useEffect(() => {
    call("entertainment_express.api.mobile_api_v2.crew_assignments", { page: 1 })
      .then((res) => setAssignments(res?.data?.items || []))
      .catch(() => setAssignments([]));
  }, []);

  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <h2>Field Workspace</h2>
      <button
        onClick={() => setStatusMsg("Check-in/out uses mobile_api_v2 endpoints during full crew flow.")}
        style={{ width: "fit-content", padding: "0.5rem 0.8rem" }}
      >
        Check-In Actions
      </button>
      {statusMsg ? <p>{statusMsg}</p> : null}
      {assignments.length ? (
        <DataTable
          id="employee-field-assignments"
          columns={[
            { key: "name", label: "Assignment" },
            { key: "booking", label: "Booking" },
            { key: "status", label: "Status" },
            { key: "role", label: "Role" },
          ]}
          rows={assignments}
        />
      ) : (
        <EmptyState title="No Assignments" message="Your upcoming shifts will appear here." />
      )}
    </section>
  );
}

function SalesWorkspace() {
  const [rows, setRows] = React.useState<any[]>([]);

  React.useEffect(() => {
    call("frappe.client.get_list", {
      doctype: "Lead",
      fields: ["name", "lead_name", "status", "modified"],
      order_by: "modified desc",
      limit_page_length: 20,
    })
      .then((res) => setRows(res || []))
      .catch(() => setRows([]));
  }, []);

  return rows.length ? (
    <DataTable
      id="employee-sales-leads"
      columns={[
        { key: "name", label: "Lead" },
        { key: "lead_name", label: "Contact" },
        { key: "status", label: "Status" },
        { key: "modified", label: "Updated" },
      ]}
      rows={rows}
    />
  ) : (
    <EmptyState title="Sales Workspace" message="Open leads will appear here." />
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
        { key: "customer", label: "Customer" },
        { key: "outstanding_amount", label: "Outstanding" },
        { key: "currency", label: "Currency" },
      ]}
      rows={rows}
    />
  ) : (
    <EmptyState title="Accounting Workspace" message="Open invoices will appear here." />
  );
}

function DispatchWorkspace() {
  return (
    <EmptyState
      title="Dispatch Workspace"
      message="Dispatch board integration is temporarily unavailable in this build."
    />
  );
}

export function EmployeeApp() {
  const roles = getSessionBootstrap().roles || [];

  return (
    <AppShell title="Employee Portal">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/employee" element={<Home />} />
        <Route
          path="/employee/dispatch"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Dispatcher"]}>
              <DispatchWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route
          path="/employee/field"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Crew", "EE Entertainer"]}>
              <FieldWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route
          path="/employee/sales"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Sales"]}>
              <SalesWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route
          path="/employee/accounting"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Accounting"]}>
              <AccountingWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route path="*" element={<Placeholder title="Employee Workspace" />} />
      </Routes>
    </AppShell>
  );
}
