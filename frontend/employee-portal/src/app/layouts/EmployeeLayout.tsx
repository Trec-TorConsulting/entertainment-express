import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  SidebarNav,
  BottomNav,
  NavGroup,
  getSessionBootstrap,
  Badge
} from "@portal-kit";
import {
  Sun, Truck, Package, Shield, DollarSign,
  BarChart3, User, WifiOff, FileText, CheckSquare
} from "lucide-react";

export interface EmployeeLayoutProps {
  children: React.ReactNode;
}

export const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const bootstrap = getSessionBootstrap();
  const roles = bootstrap.roles || [];

  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const currentPath = location.pathname;

  const isDispatcher = roles.includes("EE Dispatcher");
  const isField = roles.includes("EE Crew") || roles.includes("EE Entertainer");
  const isSales = roles.includes("EE Sales");
  const isAccounting = roles.includes("EE Accounting");

  const navItems = [
    { id: "today", label: "My Day", icon: <Sun className="w-4 h-4" />, active: currentPath === "/", onClick: () => navigate("/") },
    ...(isDispatcher ? [{ id: "dispatch", label: "Dispatch", icon: <Truck className="w-4 h-4" />, active: currentPath.startsWith("/dispatch"), onClick: () => navigate("/dispatch") }] : []),
    ...(isDispatcher || isField ? [{ id: "pull-sheet", label: "Pull Sheet", icon: <Package className="w-4 h-4" />, active: currentPath.startsWith("/pull-sheet"), onClick: () => navigate("/pull-sheet") }] : []),
    ...(isField ? [{ id: "field", label: "Field Board", icon: <CheckSquare className="w-4 h-4" />, active: currentPath.startsWith("/field"), onClick: () => navigate("/field") }] : []),
    ...(isSales ? [{ id: "sales", label: "Sales Pipeline", icon: <FileText className="w-4 h-4" />, active: currentPath.startsWith("/sales"), onClick: () => navigate("/sales") }] : []),
    ...(isAccounting ? [{ id: "accounting", label: "Accounting", icon: <DollarSign className="w-4 h-4" />, active: currentPath.startsWith("/accounting"), onClick: () => navigate("/accounting") }] : []),
    { id: "reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" />, active: currentPath.startsWith("/reports"), onClick: () => navigate("/reports") },
    { id: "me", label: "My Profile", icon: <User className="w-4 h-4" />, active: currentPath.startsWith("/me"), onClick: () => navigate("/me") },
  ];

  const bottomItems = [
    { id: "today", label: "My Day", icon: <Sun className="w-5 h-5" />, active: currentPath === "/", onClick: () => navigate("/") },
    ...(isDispatcher
      ? [{ id: "dispatch", label: "Dispatch", icon: <Truck className="w-5 h-5" />, active: currentPath.startsWith("/dispatch"), onClick: () => navigate("/dispatch") }]
      : isField
      ? [{ id: "field", label: "Field", icon: <CheckSquare className="w-5 h-5" />, active: currentPath.startsWith("/field"), onClick: () => navigate("/field") }]
      : [{ id: "sales", label: "Sales", icon: <FileText className="w-5 h-5" />, active: currentPath.startsWith("/sales"), onClick: () => navigate("/sales") }]),
    { id: "me", label: "Profile", icon: <User className="w-5 h-5" />, active: currentPath.startsWith("/me"), onClick: () => navigate("/me") }
  ];

  return (
    <AppShell
      title="Staff Operations"
      portal="employee"
      density="ops"
      sidebar={
        <SidebarNav
          groups={[
            {
              id: "staff-nav",
              label: "Workspaces",
              items: navItems
            }
          ]}
        />
      }
      bottom={<BottomNav items={bottomItems} />}
      headerExtra={
        !isOnline ? (
          <Badge variant="warning" dot size="sm" className="flex items-center gap-1">
            <WifiOff className="w-3.5 h-3.5" />
            Offline Mode
          </Badge>
        ) : undefined
      }
    >
      {!isOnline && (
        <div className="mb-4 p-2.5 rounded-lg bg-[var(--ee-warning-soft)] border border-[var(--ee-warning-border)] text-xs font-medium text-[var(--ee-warning-text)] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            You are working offline. Roster and assignment details are served from local cache.
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider">Cached Roster</span>
        </div>
      )}
      {children}
    </AppShell>
  );
};
