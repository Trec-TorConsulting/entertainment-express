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
    </section>
  );
}

export function DispatchBoard({ canAssign = true }: { canAssign?: boolean }) {
  const [day, setDay] = React.useState(today);
  const [jobs, setJobs] = React.useState<JobRow[]>([]);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [error, setError] = React.useState("");

  const reload = React.useCallback(() => {
    call("entertainment_express.api.portal_dispatch.board", { day })
      .then((res) => setJobs(res?.jobs || []))
      .catch((err) => {
        setJobs([]);
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
          </article>
        ))
      ) : (
        <EmptyState title="Nothing on this day" message="Jobs with a date set appear here so you can staff them." />
      )}
    </section>
  );
}

type Shift = {
  id: string;
  job: string;
  place: string;
  when: string;
  role: string;
  status: string;
  can_accept?: boolean;
  can_check_in?: boolean;
  can_check_out?: boolean;
};

export function FieldBoard() {
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [error, setError] = React.useState("");

  const reload = React.useCallback(() => {
    call("entertainment_express.api.portal_dispatch.my_shifts", {})
      .then((res) => setShifts(res || []))
      .catch((err) => {
        setShifts([]);
        setError(err.message || "Could not load your shifts.");
      });
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const run = async (method: string, args: Record<string, string>) => {
    setError("");
    try {
      await call(method, args);
      reload();
    } catch (err: any) {
      setError(err.message || "Could not update this shift.");
    }
  };

  return (
    <section className="ee-dispatch">
      <div>
        <p className="ee-muted" style={{ margin: 0 }}>
          Your jobs
        </p>
        <h1>Field</h1>
      </div>
      {error ? <p className="ee-form__error">{error}</p> : null}
      {shifts.length ? (
        shifts.map((shift) => (
          <article key={shift.id} className="ee-dispatch__job">
            <div>
              <h2>{shift.job}</h2>
              <p className="ee-dispatch__meta">
                {shift.when}
                {shift.place ? ` · ${shift.place}` : ""}
                {shift.role ? ` · ${shift.role}` : ""}
              </p>
              <p style={{ margin: 0 }}>{shift.status}</p>
            </div>
            <div className="ee-form__actions">
              {shift.can_accept ? (
                <>
                  <button
                    type="button"
                    className="ee-btn"
                    onClick={() => run("entertainment_express.api.portal_dispatch.respond", { assignment: shift.id, decision: "accept" })}
                  >
                    I&apos;m in
                  </button>
                  <button
                    type="button"
                    className="ee-btn ee-btn--danger"
                    onClick={() => run("entertainment_express.api.portal_dispatch.respond", { assignment: shift.id, decision: "decline" })}
                  >
                    Can&apos;t make it
                  </button>
                </>
              ) : null}
              {shift.can_check_in ? (
                <button type="button" className="ee-btn" onClick={() => run("entertainment_express.api.portal_dispatch.check_in", { assignment: shift.id })}>
                  Check in
                </button>
              ) : null}
              {shift.can_check_out ? (
                <button type="button" className="ee-btn" onClick={() => run("entertainment_express.api.portal_dispatch.check_out", { assignment: shift.id })}>
                  Check out
                </button>
              ) : null}
            </div>
          </article>
        ))
      ) : (
        <EmptyState title="No shifts yet" message="When someone offers you a job, it shows up here." />
      )}
    </section>
  );
}
