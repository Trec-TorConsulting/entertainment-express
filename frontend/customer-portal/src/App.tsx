// Portal Navigation Order: sign -> pay -> plan
export const CLIENT_NAV_FLOW = [
  { to: "/pay", label: "Pay" },
  { to: "/documents", label: "Documents" },
  { to: "/planning", label: "Planning" },
];

export { ClientApp, default } from "./app/App";
