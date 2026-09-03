import React, { useState } from "react";
import { SidebarNav, NavGroup } from "../src/patterns/SidebarNav";
import { BottomNav } from "../src/patterns/BottomNav";
import { FilterBar } from "../src/patterns/FilterBar";
import { Timeline } from "../src/patterns/Timeline";
import { RecordDrawer } from "../src/patterns/RecordDrawer";
import { Button } from "../src/primitives/Button";
import { Badge } from "../src/primitives/Badge";
import {
  Calendar, LayoutDashboard, DollarSign, Users, Truck, Sparkles,
  FileText, Settings, Shield, HelpCircle, BarChart3, Inbox,
  Bell, Palette, Key, CheckSquare, Music, Camera, Gift, AlertCircle,
  Clock, MapPin, Tag, Sliders, Briefcase
} from "lucide-react";

export default {
  title: "Patterns/Navigation & Workflow",
};

export const NavigationSuite = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("today");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeChip, setActiveChip] = useState("all");

  // 25 items across 3 groups
  const navGroups: NavGroup[] = [
    {
      id: "operations",
      label: "Operations & Schedule (9 items)",
      items: [
        { id: "today", label: "Today Cockpit", icon: <LayoutDashboard />, active: activeItem === "today", onClick: () => setActiveItem("today") },
        { id: "schedule", label: "Master Calendar", icon: <Calendar />, active: activeItem === "schedule", onClick: () => setActiveItem("schedule") },
        { id: "dispatch", label: "Dispatch Board", icon: <Truck />, active: activeItem === "dispatch", onClick: () => setActiveItem("dispatch") },
        { id: "crew", label: "Talent & Crew", icon: <Users />, active: activeItem === "crew", onClick: () => setActiveItem("crew") },
        { id: "equipment", label: "Asset Inventory", icon: <Briefcase />, active: activeItem === "equipment", onClick: () => setActiveItem("equipment") },
        { id: "runs-sheets", label: "Run Sheets", icon: <FileText />, active: activeItem === "runs-sheets", onClick: () => setActiveItem("runs-sheets") },
        { id: "venues", label: "Venues Directory", icon: <MapPin />, active: activeItem === "venues", onClick: () => setActiveItem("venues") },
        { id: "music", label: "Music & Playlists", icon: <Music />, active: activeItem === "music", onClick: () => setActiveItem("music") },
        { id: "photos", label: "Booth Galleries", icon: <Camera />, active: activeItem === "photos", onClick: () => setActiveItem("photos") },
      ]
    },
    {
      id: "sales",
      label: "Sales & Clientflow (8 items)",
      items: [
        { id: "pipeline", label: "Inquiries & Pipeline", icon: <Sparkles />, active: activeItem === "pipeline", onClick: () => setActiveItem("pipeline"), badge: <Badge variant="brand" size="sm">4 new</Badge> },
        { id: "money", label: "Money & Invoices", icon: <DollarSign />, active: activeItem === "money", onClick: () => setActiveItem("money") },
        { id: "proposals", label: "Quotes & Contracts", icon: <FileText />, active: activeItem === "proposals", onClick: () => setActiveItem("proposals") },
        { id: "customers", label: "Client Accounts", icon: <Users />, active: activeItem === "customers", onClick: () => setActiveItem("customers") },
        { id: "packages", label: "Service Catalog", icon: <Tag />, active: activeItem === "packages", onClick: () => setActiveItem("packages") },
        { id: "reviews", label: "Customer Reviews", icon: <Gift />, active: activeItem === "reviews", onClick: () => setActiveItem("reviews") },
        { id: "inbox", label: "Message Inbox", icon: <Inbox />, active: activeItem === "inbox", onClick: () => setActiveItem("inbox"), badge: <Badge variant="danger" size="sm">2</Badge> },
        { id: "reports", label: "Financial Reports", icon: <BarChart3 />, active: activeItem === "reports", onClick: () => setActiveItem("reports") },
      ]
    },
    {
      id: "admin",
      label: "System & Brand (8 items)",
      items: [
        { id: "brand", label: "Brand White-Label", icon: <Palette />, active: activeItem === "brand", onClick: () => setActiveItem("brand") },
        { id: "domain", label: "Custom Domain", icon: <Key />, active: activeItem === "domain", onClick: () => setActiveItem("domain") },
        { id: "compliance", label: "Insurance & COI", icon: <Shield />, active: activeItem === "compliance", onClick: () => setActiveItem("compliance") },
        { id: "notifications", label: "SMS & Reminders", icon: <Bell />, active: activeItem === "notifications", onClick: () => setActiveItem("notifications") },
        { id: "tasks", label: "Office Tasks", icon: <CheckSquare />, active: activeItem === "tasks", onClick: () => setActiveItem("tasks") },
        { id: "rules", label: "Pricing Rules", icon: <Sliders />, active: activeItem === "rules", onClick: () => setActiveItem("rules") },
        { id: "settings", label: "Company Settings", icon: <Settings />, active: activeItem === "settings", onClick: () => setActiveItem("settings") },
        { id: "support", label: "Support & Docs", icon: <HelpCircle />, active: activeItem === "support", onClick: () => setActiveItem("support") },
      ]
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-body">
      <div>
        <h2 className="text-2xl font-bold mb-1">Navigation Patterns (3.3)</h2>
        <p className="text-sm text-[var(--ee-muted)]">
          SidebarNav (25 items in 3 groups), FilterBar, Timeline, RecordDrawer, BottomNav
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" density="cockpit" onClick={() => setCollapsed(!collapsed)}>
          Toggle Rail Collapse: {collapsed ? "Collapsed" : "Expanded"}
        </Button>
        <Button variant="primary" density="cockpit" onClick={() => setDrawerOpen(true)}>
          Open Record Drawer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Nav */}
        <div className="bg-[var(--ee-rail)] p-3 rounded-2xl shadow-ee-xl text-[var(--ee-rail-text)] max-h-[600px] overflow-y-auto">
          <SidebarNav groups={navGroups} collapsed={collapsed} />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <FilterBar
            searchPlaceholder="Filter bookings or talent..."
            chips={[
              { id: "all", label: "All Events", count: 18 },
              { id: "confirmed", label: "Confirmed", count: 12 },
              { id: "at-risk", label: "At Risk", count: 2 },
              { id: "completed", label: "Completed", count: 4 },
            ]}
            activeChip={activeChip}
            onChipSelect={setActiveChip}
          />

          <div className="p-6 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl shadow-sm">
            <h3 className="font-semibold text-base mb-4">Run-of-Show Timeline</h3>
            <Timeline
              items={[
                { id: "1", time: "14:00", title: "Load-in & Rig Assembly", description: "Crew checks in via gate 4. Staging DJ booth and uplights.", status: "completed" },
                { id: "2", time: "16:30", title: "Sound Check & EQ Match", description: "Test mic channels 1-4 and wireless pack battery levels.", status: "current" },
                { id: "3", time: "17:00", title: "Cocktail Hour Begins", description: "Jazz trio playlist in foyer; ambient warm lighting.", status: "pending" },
                { id: "4", time: "19:00", title: "Grand Entrance & First Dance", description: "Spotlight entrance; cue 'At Last' track 4.", status: "at-risk", badge: <Badge variant="warning" size="sm">Review Cue</Badge> },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Record Drawer */}
      <RecordDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Wedding: Sarah & David"
        subtitle="Booking ID #EV-2026-903 • Sept 12, 2026"
        badge={<Badge variant="success">Confirmed</Badge>}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Close</Button>
            <div className="flex gap-2">
              <Button variant="outline">Edit Run Sheet</Button>
              <Button variant="primary">Send Update</Button>
            </div>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <div className="p-4 bg-[var(--ee-surface-inset)] rounded-xl space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--ee-muted)]">Client Contact:</span>
              <span className="font-medium">sarah.j@example.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ee-muted)]">Venue:</span>
              <span className="font-medium">Grand Palace Ballroom</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ee-muted)]">Package:</span>
              <span className="font-medium">Platinum DJ + 360 Booth</span>
            </div>
          </div>
          <p className="text-xs text-[var(--ee-muted)]">
            Auto-saved via Traefik websocket channel. All changes auditable in Frappe changelog.
          </p>
        </div>
      </RecordDrawer>

      {/* Bottom Nav Simulation */}
      <div className="p-4 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl">
        <h4 className="text-xs font-semibold uppercase text-[var(--ee-muted)] mb-2">Mobile Bottom Nav Bar (Rendered at bottom of viewport on mobile)</h4>
        <div className="relative h-16 border rounded-lg bg-[var(--ee-surface-base)] flex items-center justify-around">
          <span className="text-xs text-[var(--ee-muted)]">Fixed to bottom of screen on viewports &lt; 768px with 44px tap targets</span>
        </div>
      </div>
    </div>
  );
};
