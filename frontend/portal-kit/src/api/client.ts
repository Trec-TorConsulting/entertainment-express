type RpcArgs = Record<string, unknown>;

type ApiError = Error & { status?: number };

function csrfToken(): string | undefined {
  const bootstrap = (globalThis as any).eePortalBootstrap || {};
  return bootstrap.csrf_token;
}

function friendlyError(status: number, fallback: string): string {
  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You do not have access to this action.";
  if (status >= 500) return "Server unavailable. Try again in a moment.";
  return fallback;
}

async function parseError(res: Response): Promise<ApiError> {
  let message = "Request failed.";
  try {
    const payload = await res.json();
    message = payload?.message || payload?.exc || message;
  } catch (_err) {
    message = friendlyError(res.status, message);
  }
  const err = new Error(friendlyError(res.status, String(message))) as ApiError;
  err.status = res.status;
  return err;
}

export async function call(method: string, args: RpcArgs = {}): Promise<any> {
  const res = await fetch(`/api/method/${method}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Frappe-CSRF-Token": csrfToken() || ""
    },
    body: JSON.stringify(args)
  });

  if (!res.ok) throw await parseError(res);

  const payload = await res.json();
  return payload?.message;
}

export function resource(doctype: string) {
  const base = `/api/resource/${encodeURIComponent(doctype)}`;

  return {
    async list(params = "") {
      const query = params ? `?${params}` : "";
      const res = await fetch(`${base}${query}`, { credentials: "include" });
      if (!res.ok) throw await parseError(res);
      const payload = await res.json();
      return payload?.data || [];
    },
    async get(name: string) {
      const res = await fetch(`${base}/${encodeURIComponent(name)}`, { credentials: "include" });
      if (!res.ok) throw await parseError(res);
      const payload = await res.json();
      return payload?.data;
    }
  };
}
