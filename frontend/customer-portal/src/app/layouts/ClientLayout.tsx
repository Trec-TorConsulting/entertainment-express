import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AppShell,
  SidebarNav,
  BottomNav,
  getSessionBootstrap,
  Badge,
  call
} from "@portal-kit";
import {
  Home, Calendar, CreditCard, FileText, Clock,
  CheckSquare, Users, MessageSquare, Image, Settings, Sparkles, UserPlus
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
  const [unreadChat, setUnreadChat] = useState<number>(0);

  useEffect(() => {
    call("entertainment_express.api.portal_collaboration.list_my_events", {})
      .then((res) => setEvents(res || []))
      .catch(() => setEvents([]));

    call("entertainment_express.api.portal_collaboration.unread_chat_count", {})
      .then((res) => setUnreadChat(Number(res) || 0))
      .catch(() => {});

    if (!guest) {
      call("entertainment_express.api.portal_reports.client_money_summary", {})
        .then(setMoney)
        .catch(() => {});
    }
  }, [guest, location.pathname]);

  const booking = searchParams.get("booking") || events[0]?.name || "";
  const currentPath = location.pathname;

  const href = (path: string) => (booking ? `${path}?booking=${encodeURIComponent(booking)}` : path);

  const hasBalance = !guest && Number(money?.remaining || money?.owed || 0) > 0;

  const navGroups = guest
    ? [
        {
          id: "guest-plan",
          label: "Event Collaboration",
          items: [
            { id: "home", label: "Event Overview", icon: <Home className="w-4 h-4" />, active: currentPath === "/", onClick: () => navigate(href("/")) },
            { id: "planning", label: "Planning Hub", icon: <CheckSquare className="w-4 h-4" />, active: currentPath.startsWith("/planning"), onClick: () => navigate(href("/planning")) },
            {
              id: "chat",
              label: "DJ & Host Chat",
              icon: <MessageSquare className="w-4 h-4" />,
              active: currentPath.startsWith("/chat"),
              badge: unreadChat > 0 ? <Badge variant="brand" size="sm">{unreadChat}</Badge> : undefined,
              onClick: () => navigate(href("/chat"))
            },
            { id: "people", label: "Event Guests", icon: <Users className="w-4 h-4" />, active: currentPath.startsWith("/people"), onClick: () => navigate(href("/people")) },
            { id: "photos", label: "Shared Gallery", icon: <Image className="w-4 h-4" />, active: currentPath.startsWith("/photos"), onClick: () => navigate(href("/photos")) },
          ]
        },
        {
          id: "guest-account",
          label: "Preferences",
          items: [
            { id: "account", label: "My Settings", icon: <Settings className="w-4 h-4" />, active: currentPath.startsWith("/account"), onClick: () => navigate(href("/account")) }
          ]
        }
      ]
    : [
        {
          id: "client-main",
          label: "Event Dashboard",
          items: [
            { id: "home", label: "Home", icon: <Home className="w-4 h-4" />, active: currentPath === "/", onClick: () => navigate(href("/")) },
            { id: "events", label: "My Events", icon: <Calendar className="w-4 h-4" />, active: currentPath === "/events" || currentPath.startsWith("/events/"), onClick: () => navigate(href("/events")) },
            {
              id: "pay",
              label: "Payments & Invoices",
              icon: <CreditCard className="w-4 h-4" />,
              active: currentPath.startsWith("/pay"),
              badge: hasBalance ? <Badge variant="warning" size="sm">Due</Badge> : undefined,
              onClick: () => navigate(href("/pay"))
            },
            { id: "planning", label: "Planning Hub", icon: <CheckSquare className="w-4 h-4" />, active: currentPath.startsWith("/planning"), onClick: () => navigate(href("/planning")) },
          ]
        },
        {
          id: "client-collab",
          label: "Coordination & People",
          items: [
            {
              id: "chat",
              label: "Live Event Chat",
              icon: <MessageSquare className="w-4 h-4" />,
              active: currentPath.startsWith("/chat"),
              badge: unreadChat > 0 ? <Badge variant="brand" size="sm">{unreadChat}</Badge> : undefined,
              onClick: () => navigate(href("/chat"))
            },
            { id: "people", label: "Co-Hosts & Guests", icon: <UserPlus className="w-4 h-4" />, active: currentPath.startsWith("/people"), onClick: () => navigate(href("/people")) },
            { id: "appointments", label: "Consultations", icon: <Clock className="w-4 h-4" />, active: currentPath.startsWith("/appointments"), onClick: () => navigate(href("/appointments")) },
          ]
        },
        {
          id: "client-media",
          label: "Contracts & Deliverables",
          items: [
            { id: "documents", label: "Contracts & Docs", icon: <FileText className="w-4 h-4" />, active: currentPath.startsWith("/documents"), onClick: () => navigate(href("/documents")) },
            { id: "photos", label: "Event Photos", icon: <Image className="w-4 h-4" />, active: currentPath.startsWith("/photos"), onClick: () => navigate(href("/photos")) },
            { id: "account", label: "Account & Preferences", icon: <Settings className="w-4 h-4" />, active: currentPath.startsWith("/account"), onClick: () => navigate(href("/account")) },
          ]
        }
      ];

  const bottomItems = guest
    ? [
        { id: "home", label: "Home", icon: <Home className="w-5 h-5" />, active: currentPath === "/", onClick: () => navigate(href("/")) },
        { id: "planning", label: "Plan", icon: <CheckSquare className="w-5 h-5" />, active: currentPath.startsWith("/planning"), onClick: () => navigate(href("/planning")) },
        {
          id: "chat",
          label: "Chat",
          icon: <MessageSquare className="w-5 h-5" />,
          active: currentPath.startsWith("/chat"),
          badge: unreadChat > 0 ? <Badge variant="brand" size="sm">{unreadChat}</Badge> : undefined,
          onClick: () => navigate(href("/chat"))
        },
        { id: "photos", label: "Photos", icon: <Image className="w-5 h-5" />, active: currentPath.startsWith("/photos"), onClick: () => navigate(href("/photos")) }
      ]
    : [
        { id: "home", label: "Home", icon: <Home className="w-5 h-5" />, active: currentPath === "/", onClick: () => navigate(href("/")) },
        { id: "events", label: "Events", icon: <Calendar className="w-5 h-5" />, active: currentPath === "/events" || currentPath.startsWith("/events/"), onClick: () => navigate(href("/events")) },
        {
          id: "pay",
          label: "Pay",
          icon: <CreditCard className="w-5 h-5" />,
          active: currentPath.startsWith("/pay"),
          badge: hasBalance ? <Badge variant="warning" size="sm">Due</Badge> : undefined,
          onClick: () => navigate(href("/pay"))
        },
        { id: "planning", label: "Plan", icon: <CheckSquare className="w-5 h-5" />, active: currentPath.startsWith("/planning"), onClick: () => navigate(href("/planning")) },
        {
          id: "chat",
          label: "Chat",
          icon: <MessageSquare className="w-5 h-5" />,
          active: currentPath.startsWith("/chat"),
          badge: unreadChat > 0 ? <Badge variant="brand" size="sm">{unreadChat}</Badge> : undefined,
          onClick: () => navigate(href("/chat"))
        }
      ];

  return (
    <AppShell
      title={guest ? "Guest Planning Portal" : "Event Experience"}
      portal="client"
      density="consumer"
      sidebar={<SidebarNav groups={navGroups} />}
      bottom={<BottomNav items={bottomItems} />}
    >
      {children}
    </AppShell>
  );
};
