import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  SidebarNav,
  NavGroup,
  ModeSwitch,
  getSessionBootstrap,
  Badge
} from "@portal-kit";
import {
  LayoutDashboard, Calendar, Sparkles, Clock, Truck, FileText,
  Tag, Briefcase, Users, MapPin, Handshake, DollarSign,
  BarChart3, Bot, Compass, Bell, TrendingUp, Globe,
  Shield, Move, Palette, Key, Lock
} from "lucide-react";

export interface OwnerLayoutProps {
  children: React.ReactNode;
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const roles = getSessionBootstrap().roles || [];
  const showTalent = roles.includes("EE Entertainer") || roles.includes("EE Crew");
  const [mode, setMode] = useState<"company" | "talent">("company");

  const currentPath = location.pathname;

  const navGroups: NavGroup[] = [
    {
      id: "operations",
      label: "Operations",
      items: [
        { id: "today", label: "Today", icon: <LayoutDashboard className="w-4 h-4" />, active: currentPath === "/", onClick: () => navigate("/") },
        { id: "calendar", label: "Calendar", icon: <Calendar className="w-4 h-4" />, active: currentPath.startsWith("/calendar"), onClick: () => navigate("/calendar") },
        { id: "pipeline", label: "Pipeline", icon: <Sparkles className="w-4 h-4" />, active: currentPath.startsWith("/pipeline"), onClick: () => navigate("/pipeline") },
        { id: "schedule", label: "Consults", icon: <Clock className="w-4 h-4" />, active: currentPath.startsWith("/schedule"), onClick: () => navigate("/schedule") },
        { id: "dispatch", label: "Dispatch", icon: <Truck className="w-4 h-4" />, active: currentPath.startsWith("/dispatch"), onClick: () => navigate("/dispatch") },
        { id: "event-details", label: "Event details", icon: <FileText className="w-4 h-4" />, active: currentPath.startsWith("/event-details"), onClick: () => navigate("/event-details") },
      ]
    },
    {
      id: "catalog",
      label: "Catalog",
      items: [
        { id: "catalog", label: "Packages", icon: <Tag className="w-4 h-4" />, active: currentPath.startsWith("/catalog"), onClick: () => navigate("/catalog") },
        { id: "gear", label: "Gear", icon: <Briefcase className="w-4 h-4" />, active: currentPath.startsWith("/gear"), onClick: () => navigate("/gear") },
        { id: "people", label: "People", icon: <Users className="w-4 h-4" />, active: currentPath.startsWith("/people"), onClick: () => navigate("/people") },
        { id: "places", label: "Places", icon: <MapPin className="w-4 h-4" />, active: currentPath.startsWith("/places"), onClick: () => navigate("/places") },
        { id: "partners", label: "Partners", icon: <Handshake className="w-4 h-4" />, active: currentPath.startsWith("/partners"), onClick: () => navigate("/partners") },
      ]
    },
    {
      id: "business",
      label: "Business",
      items: [
        { id: "money", label: "Money", icon: <DollarSign className="w-4 h-4" />, active: currentPath.startsWith("/money"), onClick: () => navigate("/money") },
        { id: "reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" />, active: currentPath.startsWith("/reports"), onClick: () => navigate("/reports") },
        { id: "assistant", label: "Assistant", icon: <Bot className="w-4 h-4" />, active: currentPath.startsWith("/assistant"), onClick: () => navigate("/assistant") },
        { id: "plan", label: "Plan", icon: <Compass className="w-4 h-4" />, active: currentPath.startsWith("/plan"), onClick: () => navigate("/plan") },
        { id: "automations", label: "Reminders", icon: <Bell className="w-4 h-4" />, active: currentPath.startsWith("/automations"), onClick: () => navigate("/automations") },
        { id: "grow", label: "Grow", icon: <TrendingUp className="w-4 h-4" />, active: currentPath.startsWith("/grow"), onClick: () => navigate("/grow") },
        { id: "website", label: "Website", icon: <Globe className="w-4 h-4" />, active: currentPath.startsWith("/website"), onClick: () => navigate("/website") },
        { id: "coverage", label: "Coverage", icon: <Shield className="w-4 h-4" />, active: currentPath.startsWith("/coverage"), onClick: () => navigate("/coverage") },
        { id: "move", label: "Move", icon: <Move className="w-4 h-4" />, active: currentPath.startsWith("/move"), onClick: () => navigate("/move") },
        { id: "brand", label: "Brand", icon: <Palette className="w-4 h-4" />, active: currentPath.startsWith("/brand"), onClick: () => navigate("/brand") },
        { id: "connections", label: "Connections", icon: <Key className="w-4 h-4" />, active: currentPath.startsWith("/connections"), onClick: () => navigate("/connections") },
        { id: "security", label: "Security", icon: <Lock className="w-4 h-4" />, active: currentPath.startsWith("/security"), onClick: () => navigate("/security") },
      ]
    }
  ];

  const sidebar = <SidebarNav groups={navGroups} />;

  return (
    <AppShell
      title="Company"
      portal="owner"
      density="cockpit"
      sidebar={mode === "company" ? sidebar : undefined}
      headerExtra={
        showTalent ? (
          <ModeSwitch
            value={mode}
            options={[
              { id: "company", label: "Company" },
              { id: "talent", label: "Talent" },
            ]}
            onChange={(id) => setMode(id as "company" | "talent")}
          />
        ) : null
      }
    >
      {children}
    </AppShell>
  );
};
