import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AppShell,
  SidebarNav,
  BottomNav,
  NavGroup,
  getSessionBootstrap,
  Badge,
  call
} from "@portal-kit";
import {
  Home, Calendar, CreditCard, FileText, Clock,
  CheckSquare, Users, MessageSquare, Image, Sparkles
} from "lucide-react";

export interface ClientLayoutProps {
  children: React.ReactNode;
}

export function isGuest(roles: string[]) {
  return roles.includes("EE Event Guest") && !roles.includes("EE Customer");
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);

  const [events, setEvents] = useState<any[]>([]);
  const [money, setMoney] = useState<any>(null);

  useEffect(() => {
    call("entertainment_express.api.portal_collaboration.list_my_events", {})
      .then((res) => setEvents(res || []))
      .catch(() => setEvents([]));

    if (!guest) {
      call("entertainment_express.api.portal_reports.client_money_summary", {})
        .then(setMoney)
        .catch(() => {});
    }
  }, [guest]);

  const booking = searchParams.get("booking") || events[0]?.name || "";
  const currentPath = location.pathname;

  const href = (path: string) => (booking ? `${path}?booking=${encodeURIComponent(booking)}` : path);

  const hasBalance = !guest && Number(money?.remaining || money?.owed || 0) > 0;

  const navItems = guest
    ? [
        { id: "home", label: "Event Overview", icon: <Home className="w-4 h-4" />, active: currentPath === "/", onClick: () => navigate(href("/")) },
        { id: "planning", label: "Event Planning", icon: <CheckSquare className="w-4 h-4" />, active: currentPath.startsWith("/planning"), onClick: () => navigate(href("/planning")) },
        { id: "chat", label: "Host & DJ Chat", icon: <MessageSquare className="w-4 h-4" />, active: currentPath.startsWith("/chat"), onClick: () => navigate(href("/chat")) },
        { id: "photos", label: "Shared Gallery", icon: <Image className="w-4 h-4" />, active: currentPath.startsWith("/photos"), onClick: () => navigate(href("/photos")) },
      ]
    : [
        { id: "home", label: "Home", icon: <Home className="w-4 h-4" />, active: currentPath === "/", onClick: () => navigate(href("/")) },
        { id: "events", label: "My Events", icon: <Calendar className="w-4 h-4" />, active: currentPath.startsWith("/events"), onClick: () => navigate(href("/events")) },
        {
          id: "pay",
          label: "Payments",
          icon: <CreditCard className="w-4 h-4" />,
          active: currentPath.startsWith("/pay"),
          badge: hasBalance ? <Badge variant="warning" size="sm">Due</Badge> : undefined,
          onClick: () => navigate(href("/pay"))
        },
        { id: "planning", label: "Planning Hub", icon: <CheckSquare className="w-4 h-4" />, active: currentPath.startsWith("/planning"), onClick: () => navigate(href("/planning")) },
        { id: "documents", label: "Contracts & Docs", icon: <FileText className="w-4 h-4" />, active: currentPath.startsWith("/documents"), onClick: () => navigate(href("/documents")) },
        { id: "appointments", label: "Consultations", icon: <Clock className="w-4 h-4" />, active: currentPath.startsWith("/appointments"), onClick: () => navigate(href("/appointments")) },
        { id: "chat", label: "Event Chat", icon: <MessageSquare className="w-4 h-4" />, active: currentPath.startsWith("/chat"), onClick: () => navigate(href("/chat")) },
        { id: "photos", label: "Event Photos", icon: <Image className="w-4 h-4" />, active: currentPath.startsWith("/photos"), onClick: () => navigate(href("/photos")) },
      ];

  const bottomItems = [
    { id: "home", label: "Home", icon: <Home className="w-5 h-5" />, active: currentPath === "/", onClick: () => navigate(href("/")) },
    ...(guest
      ? [
          { id: "planning", label: "Plan", icon: <CheckSquare className="w-5 h-5" />, active: currentPath.startsWith("/planning"), onClick: () => navigate(href("/planning")) },
          { id: "chat", label: "Chat", icon: <MessageSquare className="w-5 h-5" />, active: currentPath.startsWith("/chat"), onClick: () => navigate(href("/chat")) }
        ]
      : [
          { id: "events", label: "Events", icon: <Calendar className="w-5 h-5" />, active: currentPath.startsWith("/events"), onClick: () => navigate(href("/events")) },
          { id: "pay", label: "Pay", icon: <CreditCard className="w-5 h-5" />, active: currentPath.startsWith("/pay"), onClick: () => navigate(href("/pay")) },
          { id: "planning", label: "Plan", icon: <CheckSquare className="w-5 h-5" />, active: currentPath.startsWith("/planning"), onClick: () => navigate(href("/planning")) }
        ])
  ];

  return (
    <AppShell
      title={guest ? "Guest Planning Portal" : "Event Experience"}
      portal="client"
      density="consumer"
      sidebar={
        <SidebarNav
          groups={[
            {
              id: "client-nav",
              label: guest ? "Event Access" : "Planning & Billing",
              items: navItems
            }
          ]}
        />
      }
      bottom={<BottomNav items={bottomItems} />}
    >
      {children}
    </AppShell>
  );
};
