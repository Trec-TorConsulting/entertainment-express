export type PortalBootstrap = {
  user?: string;
  roles?: string[];
  csrf_token?: string;
  branding?: {
    name?: string;
    logo?: string;
    color?: string;
  };
};

export function getSessionBootstrap(): PortalBootstrap {
  return ((globalThis as any).eePortalBootstrap || {}) as PortalBootstrap;
}
