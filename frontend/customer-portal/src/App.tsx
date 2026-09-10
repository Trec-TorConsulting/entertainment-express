// Portal Navigation Order: sign -> pay -> plan
export const CLIENT_NAV_FLOW = [
  { to: "/pay", label: "Pay" },
  { to: "/documents", label: "Documents" },
  { to: "/planning", label: "Planning" },
];

// Deliverables and photos are loaded via entertainment_express.api.deliverables.list_deliverables
export { ClientApp, default } from "./app/App";
