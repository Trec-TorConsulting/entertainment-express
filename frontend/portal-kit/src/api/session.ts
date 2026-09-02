export type PortalBootstrap = {
  user?: string;
  roles?: string[];
  csrf_token?: string;
  inbox_count?: number;
  canonical_host?: string;
  person?: {
    name?: string;
    full_name?: string;
    email?: string;
    image?: string;
  };
  branding?: {
    name?: string;
    logo?: string;
    color?: string;
    favicon?: string;
    hide_product_chrome?: number | boolean;
  };
};

export function getSessionBootstrap(): PortalBootstrap {
  return ((globalThis as any).eePortalBootstrap || {}) as PortalBootstrap;
}
