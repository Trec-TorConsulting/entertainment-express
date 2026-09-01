export type PortalBootstrap = {
  user?: string;
  roles?: string[];
  csrf_token?: string;
  inbox_count?: number;
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
  };
};

export function getSessionBootstrap(): PortalBootstrap {
  return ((globalThis as any).eePortalBootstrap || {}) as PortalBootstrap;
}
