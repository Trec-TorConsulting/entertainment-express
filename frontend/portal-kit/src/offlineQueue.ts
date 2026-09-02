const KEY = "ee.field.queue";

export type QueuedCall = {
  id: string;
  method: string;
  args: Record<string, unknown>;
};

function read(): QueuedCall[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(rows: QueuedCall[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(-50)));
}

export function enqueueFieldCall(method: string, args: Record<string, unknown>) {
  const rows = read();
  rows.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, method, args });
  write(rows);
}

export function pendingFieldCount() {
  return read().length;
}

export function shouldQueueFieldError(err: { status?: number } | null, online = typeof navigator !== "undefined" ? navigator.onLine : true) {
  if (!online) return true;
  const status = err?.status;
  if (status === undefined || status === 0) return true;
  return status >= 500;
}

export async function flushFieldQueue(callFn: (method: string, args: Record<string, unknown>) => Promise<unknown>) {
  const rows = read();
  if (!rows.length) return 0;
  const kept: QueuedCall[] = [];
  for (const row of rows) {
    try {
      await callFn(row.method, row.args);
    } catch (err: any) {
      if (err?.status === 403 || err?.status === 401) continue;
      kept.push(row);
    }
  }
  write(kept);
  return rows.length - kept.length;
}
