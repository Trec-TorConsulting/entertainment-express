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
    logo_dark?: string;
    color?: string;
    color_secondary?: string;
    color_accent?: string;
    color_bg?: string;
    color_text?: string;
    font_heading?: string;
    font_body?: string;
    favicon?: string;
    og_image?: string;
    footer_text?: string;
    white_label_mode?: string;
    hide_product_chrome?: number | boolean;
    email_from_name?: string;
  };
};

export function getSessionBootstrap(): PortalBootstrap {
  return ((globalThis as any).eePortalBootstrap || {}) as PortalBootstrap;
}
