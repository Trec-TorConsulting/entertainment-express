import React, { useMemo, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  AppShell,
  CommandPalette,
  DataTable,
  EmptyState,
  StatCard,
  focusCommandPalette,
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
            { key: "name", label: "Lead" },
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
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [statusMsg, setStatusMsg] = React.useState("");

  React.useEffect(() => {
    call("entertainment_express.api.mobile_api_v2.crew_assignments", { page: 1 })
      .then((res) => setAssignments(res?.data?.items || []))
      .catch(() => setAssignments([]));
  }, []);

  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <h2 style={{ margin: 0 }}>Field</h2>
      <button
        type="button"
        onClick={() => setStatusMsg("Check-in/out uses mobile_api_v2 endpoints during full crew flow.")}
        style={{ width: "fit-content", padding: "0.5rem 0.8rem", background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem" }}
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
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <p style={{ margin: 0 }}>
        <a href="/dispatch" style={{ color: "var(--ee-brand)" }}>
          Open full dispatch board
        </a>
      </p>
      <iframe title="Dispatch board" src="/dispatch" style={{ width: "100%", minHeight: "70vh", border: "1px solid var(--ee-border)", borderRadius: "var(--ee-radius)", background: "var(--ee-panel)" }} />
    </section>
  );
}

function MeWorkspace() {
  const bootstrap = getSessionBootstrap();
  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <StatCard compact label="Signed in" value={bootstrap.user || "Unknown"} />
      <StatCard compact label="Roles" value={(bootstrap.roles || []).join(", ") || "None"} />
    </section>
  );
}

export function EmployeeApp() {
  const roles = getSessionBootstrap().roles || [];
  const navigate = useNavigate();
  const primary = useMemo(() => ROLE_PRIMARY.find((entry) => entry.roles.some((role) => roles.includes(role))), [roles]);

  const nav = [
    { to: "/", label: "Home" },
    { to: "/dispatch", label: "Dispatch" },
    { to: "/field", label: "Field" },
    { to: "/sales", label: "Sales" },
    { to: "/accounting", label: "Accounting" },
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
    <AppShell title="Employee Portal" density="ops" sidebar={sidebar} bottom={bottom}>
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
          path="/accounting"
          element={
            <GuardedWorkspace roles={roles} allow={["EE Accounting"]}>
              <AccountingWorkspace />
            </GuardedWorkspace>
          }
        />
        <Route path="/me" element={<MeWorkspace />} />
        <Route path="*" element={<EmptyState title="Employee Workspace" message="That page is not in this portal." />} />
      </Routes>
    </AppShell>
  );
}
