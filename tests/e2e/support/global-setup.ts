import { FullConfig } from "@playwright/test";
import { tenantBase, personas } from "./session";

export default async function globalSetup(config: FullConfig) {
  const base = tenantBase();
  const p = personas();

  console.log(`[Global Setup] Verifying target tenant: ${base}`);
  console.log(`[Global Setup] Owner: ${p.owner.email}`);
  console.log(`[Global Setup] Employee: ${p.employee.email}`);
  console.log(`[Global Setup] Client: ${p.client.email}`);

  // Ping tenant root to verify connectivity
  try {
    const res = await fetch(`${base}/api/method/ping`);
    if (!res.ok) {
      console.warn(`[Global Setup] Tenant ping returned HTTP ${res.status}. Tests will attempt session login regardless.`);
    } else {
      console.log(`[Global Setup] Tenant ping OK`);
    }
  } catch (err: any) {
    console.warn(`[Global Setup] Warning pinging tenant ${base}: ${err.message}`);
  }
}
