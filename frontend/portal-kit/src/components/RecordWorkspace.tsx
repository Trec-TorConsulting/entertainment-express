import React from "react";
import { call } from "../api/client";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { FormField } from "./FormField";
import "./RecordWorkspace.css";

type Field = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  readonly?: boolean;
  options?: string[];
};

type Schema = {
  kind: string;
  title: string;
  singular: string;
  can_create?: boolean;
  can_delete?: boolean;
  empty?: string;
  columns: Array<{ key: string; label: string }>;
  fields: Field[];
};

type Nav = {
  kind: string;
  basePath: string;
  go: (path: string) => void;
};

export function RecordList({ kind, basePath, go }: Nav) {
  const [schema, setSchema] = React.useState<Schema | null>(null);
  const [rows, setRows] = React.useState<any[]>([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    call("entertainment_express.api.portal_crud.list_records", { kind })
      .then((res) => {
        setSchema(res.schema);
        setRows((res.rows || []).map((row: any) => ({ ...row, name: row.id })));
      })
      .catch((err) => setError(err.message || "Could not load this list."));
  }, [kind]);

  if (error) return <EmptyState title="Could not load" message={error} />;
  if (!schema) return <p className="ee-muted">Loading…</p>;

  return (
    <section className="ee-records">
      <header className="ee-records__bar">
        <h1>{schema.title}</h1>
        {schema.can_create ? (
          <button type="button" className="ee-btn" onClick={() => go(`${basePath}/new`)}>
            New {schema.singular.toLowerCase()}
          </button>
        ) : null}
      </header>
      {rows.length ? (
        <DataTable
          id={`owner-${kind}`}
          columns={schema.columns as any}
          rows={rows}
          onRowClick={(row) => go(`${basePath}/${encodeURIComponent(row.id || row.name)}`)}
        />
      ) : (
        <EmptyState
          title={schema.empty || "Nothing here yet"}
          message={schema.can_create ? `Create a ${schema.singular.toLowerCase()} to get started.` : "Records show here when they exist."}
          actionLabel={schema.can_create ? `New ${schema.singular.toLowerCase()}` : undefined}
          onAction={schema.can_create ? () => go(`${basePath}/new`) : undefined}
        />
      )}
    </section>
  );
}

export function RecordEditor({ kind, basePath, go, recordId }: Nav & { recordId?: string }) {
  const isNew = !recordId || recordId === "new";
  const [schema, setSchema] = React.useState<Schema | null>(null);
  const [values, setValues] = React.useState<Record<string, any>>({});
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (isNew) {
      call("entertainment_express.api.portal_crud.describe", { kind })
        .then((next) => {
          setSchema(next);
          const seed: Record<string, any> = {};
          for (const field of next.fields || []) {
            seed[field.key] = field.type === "select" && field.options?.length ? field.options[0] : "";
          }
          setValues(seed);
        })
        .catch((err) => setError(err.message || "Could not open the form."));
      return;
    }
    call("entertainment_express.api.portal_crud.get_record", { kind, name: recordId })
      .then((res) => {
        setSchema(res.schema);
        setValues(res.row || {});
      })
      .catch((err) => setError(err.message || "Could not open this record."));
  }, [kind, recordId, isNew]);

  const setField = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const saved = await call("entertainment_express.api.portal_crud.save_record", {
        kind,
        name: isNew ? null : recordId,
        values,
      });
      go(`${basePath}/${encodeURIComponent(saved.name)}`);
    } catch (err: any) {
      setError(err.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!recordId || isNew) return;
    if (!window.confirm(`Remove this ${schema?.singular.toLowerCase() || "record"}?`)) return;
    setBusy(true);
    try {
      await call("entertainment_express.api.portal_crud.delete_record", { kind, name: recordId });
      go(basePath);
    } catch (err: any) {
      setError(err.message || "Could not remove.");
      setBusy(false);
    }
  };

  if (error && !schema) return <EmptyState title="Could not load" message={error} />;
  if (!schema) return <p className="ee-muted">Loading…</p>;

  return (
    <section className="ee-records">
      <header className="ee-records__bar">
        <div>
          <button type="button" className="ee-back" onClick={() => go(basePath)}>
            ← {schema.title}
          </button>
          <h1>{isNew ? `New ${schema.singular.toLowerCase()}` : values[schema.fields[0]?.key] || schema.singular}</h1>
        </div>
      </header>
      <form
        className="ee-form"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        {schema.fields.map((field) => (
          <FormField key={field.key} label={field.label}>
            {field.type === "textarea" ? (
              <textarea value={values[field.key] ?? ""} onChange={(e) => setField(field.key, e.target.value)} readOnly={field.readonly} rows={4} />
            ) : field.type === "select" ? (
              <select value={values[field.key] ?? ""} onChange={(e) => setField(field.key, e.target.value)} disabled={field.readonly}>
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "date" ? "date" : field.type === "time" ? "time" : "text"}
                value={values[field.key] ?? ""}
                onChange={(e) => setField(field.key, e.target.value)}
                required={field.required}
                readOnly={field.readonly}
              />
            )}
          </FormField>
        ))}
        {error ? <p className="ee-form__error">{error}</p> : null}
        <div className="ee-form__actions">
          <button type="submit" className="ee-btn" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
          {!isNew && schema.can_delete ? (
            <button type="button" className="ee-btn ee-btn--danger" onClick={remove} disabled={busy}>
              Remove
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
