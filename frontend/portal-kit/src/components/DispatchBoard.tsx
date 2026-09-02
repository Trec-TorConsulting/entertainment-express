import React from "react";
import { call } from "../api/client";
import { EmptyState } from "./EmptyState";
import { FormField } from "./FormField";
import "./RecordWorkspace.css";
import "./DispatchBoard.css";

type CrewRow = {
  id: string;
  person: string;
  role: string;
  status: string;
  status_key: string;
};

type JobRow = {
  id: string;
  title: string;
  when: string;
  place: string;
  at_risk: boolean;
  crew: CrewRow[];
  assets?: string[];
};

type Person = { id: string; name: string; roles?: string[] };
type Role = { id: string; name: string };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function AssignForm({
  jobId,
  people,
  roles,
  onOffered,
}: {
  jobId: string;
  people: Person[];
  roles: Role[];
  onOffered: () => void;
}) {
  const [person, setPerson] = React.useState(people[0]?.id || "");
  const [role, setRole] = React.useState(roles[0]?.id || "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!person && people[0]?.id) setPerson(people[0].id);
  }, [people, person]);
  React.useEffect(() => {
    if (!role && roles[0]?.id) setRole(roles[0].id);
  }, [roles, role]);

  if (!people.length) {
    return <p className="ee-muted">Invite field crew under People before you can staff this job.</p>;
  }

  return (
    <div className="ee-dispatch__assign">
      <FormField label="Person">
        <select value={person} onChange={(e) => setPerson(e.target.value)}>
          {people.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Role on this job">
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </FormField>
      <button
        type="button"
        className="ee-btn"
        disabled={!person || busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await call("entertainment_express.api.portal_dispatch.offer", { job: jobId, person, role });
            onOffered();
          } catch (err: any) {
            setError(err.message || "Could not offer this shift.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Offer shift
      </button>
      {error ? <p className="ee-form__error">{error}</p> : null}
    </div>
  );
}

function CrewActions({
  row,
  canManage,
  onChanged,
}: {
  row: CrewRow;
  canManage: boolean;
  onChanged: () => void;
}) {
  const [error, setError] = React.useState("");
  const run = async (method: string, args: Record<string, string>) => {
    setError("");
    try {
      await call(method, args);
      onChanged();
    } catch (err: any) {
      setError(err.message || "Could not update this shift.");
    }
  };
  return (
    <div className="ee-form__actions">
      {canManage && row.status_key === "accepted" ? (
        <button type="button" className="ee-btn" onClick={() => run("entertainment_express.api.portal_dispatch.check_in", { assignment: row.id })}>
          Mark on site
        </button>
      ) : null}
      {canManage && row.status_key === "checked_in" ? (
        <button type="button" className="ee-btn" onClick={() => run("entertainment_express.api.portal_dispatch.check_out", { assignment: row.id })}>
          Mark done
        </button>
      ) : null}
      {error ? <p className="ee-form__error">{error}</p> : null}
    </div>
  );
}

export function JobCrewPanel({ jobId }: { jobId: string }) {
  const [crew, setCrew] = React.useState<CrewRow[]>([]);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [error, setError] = React.useState("");

  const reload = React.useCallback(() => {
    call("entertainment_express.api.portal_dispatch.job_crew", { job: jobId })
      .then((res) => setCrew(res || []))
      .catch((err) => setError(err.message || "Could not load crew."));
    call("entertainment_express.api.portal_dispatch.people", { job: jobId })
      .then((res) => setPeople(res || []))
      .catch(() => setPeople([]));
    call("entertainment_express.api.portal_dispatch.roles", {})
      .then((res) => setRoles(res || []))
      .catch(() => setRoles([]));
  }, [jobId]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  return (
    <section className="ee-form" style={{ marginTop: "1rem" }}>
      <h2 style={{ margin: 0 }}>Crew</h2>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {crew.length ? (
        <div className="ee-dispatch__crew">
          {crew.map((row) => (
            <div key={row.id} className="ee-dispatch__person">
              <span>
                {row.person} · {row.role} · {row.status}
              </span>
              <CrewActions row={row} canManage onChanged={reload} />
            </div>
          ))}
        </div>
      ) : (
        <p className="ee-muted">Nobody is assigned yet.</p>
      )}
      <AssignForm jobId={jobId} people={people} roles={roles} onOffered={reload} />
      <SuggestCrew jobId={jobId} atRisk={!crew.length} onOffered={reload} />
    </section>
  );
}

function SuggestCrew({
  jobId,
  atRisk,
  onOffered,
}: {
  jobId: string;
  atRisk: boolean;
  onOffered: () => void;
}) {
  const [rows, setRows] = React.useState<any[]>([]);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");

  const load = React.useCallback(() => {
    if (!atRisk) {
      setRows([]);
      return;
    }
    call("entertainment_express.api.portal_dispatch.suggest", { job: jobId })
      .then((res) => setRows(res || []))
      .catch((err) => setError(err.message || "Could not suggest crew."));
  }, [jobId, atRisk]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (!atRisk && !rows.length) return null;

  return (
    <div className="ee-dispatch__assign">
      <p className="ee-muted" style={{ margin: 0 }}>
        Suggested people
      </p>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {rows.map((row) => (
        <p key={row.employee} style={{ margin: 0 }}>
          {row.rank}. {row.name} · {row.reason}{" "}
          <button
            type="button"
            className="ee-btn"
            disabled={!!busy}
            onClick={async () => {
              setBusy(row.employee);
              setError("");
              try {
                await call("entertainment_express.api.portal_dispatch.offer", {
                  job: jobId,
                  person: row.employee,
                  role: (row.roles || [])[0] || "",
                });
                onOffered();
              } catch (err: any) {
                setError(err.message || "Could not offer that shift.");
              } finally {
                setBusy("");
              }
            }}
          >
            Offer this person
          </button>
        </p>
      ))}
    </div>
  );
}

export function DispatchBoard({ canAssign = true }: { canAssign?: boolean }) {
  const [day, setDay] = React.useState(today);
  const [jobs, setJobs] = React.useState<JobRow[]>([]);
  const [route, setRoute] = React.useState<any[]>([]);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [error, setError] = React.useState("");

  const reload = React.useCallback(() => {
    call("entertainment_express.api.portal_dispatch.board", { day })
      .then((res) => {
        setJobs(res?.jobs || []);
        setRoute(res?.route || []);
      })
      .catch((err) => {
        setJobs([]);
        setRoute([]);
        setError(err.message || "Could not load dispatch.");
      });
    if (canAssign) {
      call("entertainment_express.api.portal_dispatch.people", { day })
        .then((res) => setPeople(res || []))
        .catch(() => setPeople([]));
      call("entertainment_express.api.portal_dispatch.roles", {})
        .then((res) => setRoles(res || []))
        .catch(() => setRoles([]));
    }
  }, [day, canAssign]);

  React.useEffect(() => {
    setError("");
    reload();
  }, [reload]);

  return (
    <section className="ee-dispatch">
      <div className="ee-dispatch__bar">
        <div>
          <p className="ee-muted" style={{ margin: 0 }}>
            Staff
          </p>
          <h1>Dispatch</h1>
        </div>
        <FormField label="Day">
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </FormField>
      </div>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {route.length > 1 ? (
        <section className="ee-form" style={{ maxWidth: "none" }}>
          <h2 style={{ margin: 0 }}>Drive order</h2>
          <p className="ee-muted">Stops follow call times. Drive minutes appear when maps are connected.</p>
          {route.map((stop) => (
            <p key={stop.booking} style={{ margin: 0 }}>
              {stop.sequence}. {stop.when} {stop.title}
              {stop.travel_minutes != null ? ` · ${stop.travel_minutes} min from last` : ""}
              {stop.place ? ` · ${stop.place}` : ""}
            </p>
          ))}
          {canAssign ? (
            <button
              type="button"
              className="ee-btn ee-btn--ghost"
              onClick={async () => {
                setError("");
                try {
                  await call("entertainment_express.api.portal_dispatch.save_route", { day });
                } catch (err: any) {
                  setError(err.message || "Could not save the drive order.");
                }
              }}
            >
              Save drive order
            </button>
          ) : null}
        </section>
      ) : null}
      {jobs.length ? (
        jobs.map((job) => (
          <article key={job.id} className={job.at_risk ? "ee-dispatch__job ee-dispatch__job--risk" : "ee-dispatch__job"}>
            <div>
              <h2>{job.title}</h2>
              <p className="ee-dispatch__meta">
                {job.when}
                {job.place ? ` · ${job.place}` : ""}
              </p>
              {job.at_risk ? <p className="ee-form__error">Needs a confirmed crew</p> : null}
              {(job.assets || []).length ? <p className="ee-muted">Gear: {job.assets?.join(", ")}</p> : null}
            </div>
            {job.crew.length ? (
              <div className="ee-dispatch__crew">
                {job.crew.map((row) => (
                  <div key={row.id} className="ee-dispatch__person">
                    <span>
                      {row.person} · {row.role} · {row.status}
                    </span>
                    {canAssign ? <CrewActions row={row} canManage onChanged={reload} /> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="ee-muted">No crew yet.</p>
            )}
            {canAssign ? <AssignForm jobId={job.id} people={people} roles={roles} onOffered={reload} /> : null}
            {canAssign ? <SuggestCrew jobId={job.id} atRisk={job.at_risk || !job.crew.length} onOffered={reload} /> : null}
            {canAssign ? (
              <button
                type="button"
                className="ee-btn ee-btn--ghost"
                onClick={async () => {
                  setError("");
                  try {
                    await call("entertainment_express.api.portal_dispatch.publish_packet", { job: job.id });
                    reload();
                  } catch (err: any) {
                    setError(err.message || "Could not issue the run sheet.");
                  }
                }}
              >
                Issue run sheet
              </button>
            ) : null}
          </article>
        ))
      ) : (
        <EmptyState title="Nothing on this day" message="Jobs with a date set appear here so you can staff them." />
      )}
    </section>
  );
}
