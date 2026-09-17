import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatGrid,
  MetricCard,
  DataTable,
  EmptyState,
  Skeleton,
  FormField,
  useToast,
  call
} from "@portal-kit";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Briefcase,
  DollarSign,
  UserCheck,
  AlertTriangle,
  Mail,
  CheckCircle2,
  XCircle,
  Edit3,
  UserX,
  Search,
  Lock,
  Award
} from "lucide-react";

interface TeamMember {
  user: string;
  email: string;
  full_name: string;
  access?: string;
  roles?: string[];
  employee?: string;
  worker_type?: string;
  skills?: string;
  pay_basis?: string;
  pay_rate?: number;
  block_reason?: string | null;
}

const ACCESS_ROLES = [
  { id: "EE Dispatcher", label: "Dispatcher / Field Lead" },
  { id: "EE Sales", label: "Sales & Proposals" },
  { id: "EE Office", label: "Office & Operations" },
  { id: "EE Crew", label: "Field Crew & Setup" },
  { id: "EE Entertainer", label: "DJ & Lead Entertainer" },
  { id: "EE Marketing", label: "Marketing & Growth" }
];

export const PeoplePage: React.FC = () => {
  const { toast } = useToast();
  const [people, setPeople] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Invite Modal / Drawer State
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRoles, setInviteRoles] = useState<string[]>(["EE Office"]);
  const [inviting, setInviting] = useState(false);

  // Edit Member Modal State
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editWorkerType, setEditWorkerType] = useState<string>("1099");
  const [editSkills, setEditSkills] = useState<string>("");
  const [editPayBasis, setEditPayBasis] = useState<string>("per_event");
  const [editPayRate, setEditPayRate] = useState<string>("150");
  const [saving, setSaving] = useState(false);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.portal_hr.list_people", {});
      setPeople(Array.isArray(res) ? res : []);
    } catch {
      try {
        const staffRes = await call("entertainment_express.api.portal_owner.list_staff", {});
        setPeople(Array.isArray(staffRes) ? staffRes : []);
      } catch {
        setPeople([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  const handleRoleToggle = (current: string[], roleId: string) => {
    return current.includes(roleId) ? current.filter((r) => r !== roleId) : [...current, roleId];
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;
    setInviting(true);
    try {
      await call("entertainment_express.api.portal_owner.invite_staff", {
        email: inviteEmail.trim(),
        full_name: inviteName.trim(),
        roles: inviteRoles.length ? inviteRoles : ["EE Office"]
      });
      toast({
        title: "Invitation Sent",
        description: `Welcome email sent to ${inviteName} (${inviteEmail}).`
      });
      setInviteEmail("");
      setInviteName("");
      setInviteRoles(["EE Office"]);
      setInviteOpen(false);
      await loadPeople();
    } catch (err: any) {
      toast({
        title: "Invitation Failed",
        description: err.message || "Could not invite team member.",
        variant: "danger"
      });
    } finally {
      setInviting(false);
    }
  };

  const handleOpenEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setEditRoles(member.roles || []);
    setEditWorkerType(member.worker_type || "1099");
    setEditSkills(member.skills || "");
    setEditPayBasis(member.pay_basis || "per_event");
    setEditPayRate(String(member.pay_rate || "0"));
  };

  const handleSaveMember = async () => {
    if (!selectedMember) return;
    setSaving(true);
    try {
      // 1. Update roles
      await call("entertainment_express.api.portal_owner.set_staff_roles", {
        user: selectedMember.user || selectedMember.email,
        roles: editRoles
      });

      // 2. Update employee payroll & skills profile
      if (selectedMember.employee || selectedMember.user) {
        await call("entertainment_express.api.portal_hr.save_profile", {
          user: selectedMember.user,
          employee: selectedMember.employee,
          values: {
            worker_type: editWorkerType,
            skills: editSkills,
            pay_basis: editPayBasis,
            pay_rate: parseFloat(editPayRate) || 0
          }
        }).catch(() => {});
      }

      toast({
        title: "Profile Updated",
        description: `Saved access and rate card for ${selectedMember.full_name || selectedMember.email}.`
      });
      setSelectedMember(null);
      await loadPeople();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Could not update staff member profile.",
        variant: "danger"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (member: TeamMember) => {
    if (!window.confirm(`Deactivate access for ${member.full_name || member.email}?`)) return;
    try {
      await call("entertainment_express.api.portal_owner.deactivate_staff", {
        user: member.user || member.email
      });
      toast({
        title: "Staff Access Deactivated",
        description: `${member.full_name || member.email} can no longer log into the platform.`
      });
      setSelectedMember(null);
      await loadPeople();
    } catch (err: any) {
      toast({
        title: "Deactivation Failed",
        description: err.message || "Could not deactivate account.",
        variant: "danger"
      });
    }
  };

  const filteredPeople = people.filter((p) => {
    const nameMatch = (p.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (p.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!nameMatch) return false;
    if (roleFilter === "all") return true;
    if (roleFilter === "w2") return p.worker_type === "W2" || p.worker_type === "W-2";
    if (roleFilter === "1099") return p.worker_type === "1099";
    if (roleFilter === "blocked") return Boolean(p.block_reason);
    return (p.roles || []).includes(roleFilter);
  });

  const totalStaff = people.length;
  const w2Count = people.filter((p) => p.worker_type === "W2" || p.worker_type === "W-2").length;
  const contractorCount = people.filter((p) => p.worker_type === "1099" || !p.worker_type).length;
  const blockedCount = people.filter((p) => Boolean(p.block_reason)).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <Users className="w-8 h-8 text-[var(--ee-brand)]" />
            Team & Workforce Roster
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Manage staff invites, system access roles, W-2/1099 classifications, skills, and gig rate cards.
          </p>
        </div>

        <Button
          variant="primary"
          density="cockpit"
          onClick={() => setInviteOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Invite Team Member
        </Button>
      </div>

      {/* Metrics Grid */}
      <StatGrid columns={4}>
        <MetricCard
          title="Total Team Roster"
          value={String(totalStaff)}
          subtitle="Active platform accounts"
          sparkline={<UserCheck className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="W-2 Staff Employees"
          value={String(w2Count)}
          subtitle="Direct payroll workers"
          sparkline={<Briefcase className="w-4 h-4 text-purple-500" />}
        />
        <MetricCard
          title="1099 Subcontractors"
          value={String(contractorCount)}
          subtitle="Independent gig crew"
          sparkline={<Users className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Compliance Alert"
          value={String(blockedCount)}
          subtitle={blockedCount > 0 ? "Requires safety review" : "All crew cleared"}
          sparkline={<AlertTriangle className={`w-4 h-4 ${blockedCount > 0 ? "text-amber-500" : "text-[var(--ee-success)]"}`} />}
        />
      </StatGrid>

      {/* Table & Controls Card */}
      <Card elevated className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-[var(--ee-border)]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--ee-muted)] absolute left-3 top-3" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs focus:ring-1 focus:ring-[var(--ee-brand)]"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === "all"
                  ? "bg-[var(--ee-brand)] text-white"
                  : "bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] border border-[var(--ee-border)] hover:text-[var(--ee-text)]"
              }`}
            >
              All ({people.length})
            </button>

            <button
              onClick={() => setRoleFilter("1099")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === "1099"
                  ? "bg-purple-600 text-white"
                  : "bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] border border-[var(--ee-border)] hover:text-[var(--ee-text)]"
              }`}
            >
              1099 Contractors
            </button>

            <button
              onClick={() => setRoleFilter("w2")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === "w2"
                  ? "bg-blue-600 text-white"
                  : "bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] border border-[var(--ee-border)] hover:text-[var(--ee-text)]"
              }`}
            >
              W-2 Employees
            </button>

            {blockedCount > 0 && (
              <button
                onClick={() => setRoleFilter("blocked")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  roleFilter === "blocked"
                    ? "bg-amber-600 text-white"
                    : "bg-[var(--ee-surface-inset)] text-amber-500 border border-amber-500/30"
                }`}
              >
                Blocked ({blockedCount})
              </button>
            )}
          </div>
        </div>

        {/* Staff DataTable */}
        {loading ? (
          <Skeleton height="240px" />
        ) : filteredPeople.length > 0 ? (
          <DataTable
            id="owner-people-table"
            columns={[
              {
                key: "full_name",
                label: "Team Member",
                render: (_, row: TeamMember) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--ee-brand)]/10 text-[var(--ee-brand)] font-bold text-xs flex items-center justify-center border border-[var(--ee-brand)]/20">
                      {(row.full_name || row.email || "U").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--ee-text)] flex items-center gap-1.5">
                        {row.full_name || row.email}
                        {row.block_reason && (
                          <span title={row.block_reason}>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--ee-muted)]">{row.email}</div>
                    </div>
                  </div>
                )
              },
              {
                key: "access",
                label: "System Access & Roles",
                render: (_, row: TeamMember) => (
                  <div className="flex flex-wrap items-center gap-1">
                    {row.access ? (
                      row.access.split(",").map((r, idx) => (
                        <Badge key={idx} variant="brand" size="sm">
                          {r.trim()}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Standard Staff
                      </Badge>
                    )}
                  </div>
                )
              },
              {
                key: "worker_type",
                label: "Classification",
                render: (val: any) => (
                  <Badge variant={val === "W2" || val === "W-2" ? "purple" : "info"} size="sm">
                    {val || "1099 Contractor"}
                  </Badge>
                )
              },
              {
                key: "skills",
                label: "Specialty / Skills",
                render: (val: any) => (
                  <span className="text-xs text-[var(--ee-muted)] truncate max-w-[160px] block">
                    {val || "Event Crew"}
                  </span>
                )
              },
              {
                key: "pay_rate",
                label: "Rate Card",
                align: "right",
                render: (_, row: TeamMember) => (
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-[var(--ee-text)]">
                      ${row.pay_rate || 0}
                    </span>
                    <span className="text-[10px] text-[var(--ee-muted)] block">
                      per {row.pay_basis || "event"}
                    </span>
                  </div>
                )
              },
              {
                key: "actions",
                label: "Manage",
                align: "right",
                render: (_, row: TeamMember) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      density="compact"
                      onClick={() => handleOpenEdit(row)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                  </div>
                )
              }
            ]}
            rows={filteredPeople}
          />
        ) : (
          <EmptyState
            title="No Team Members Found"
            message="No staff members matched your current filter criteria."
          />
        )}
      </Card>

      {/* Invite Modal / Card Overlay */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50">
          <Card elevated className="w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--ee-border)] pb-3">
              <h3 className="text-lg font-bold text-[var(--ee-text)] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[var(--ee-brand)]" />
                Invite New Team Member
              </h3>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <FormField label="Full Name">
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                  placeholder="e.g. Alex Morgan"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Email Address">
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                  placeholder="alex@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="System Access & Role Entitlements">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {ACCESS_ROLES.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] text-xs text-[var(--ee-text)] cursor-pointer hover:border-[var(--ee-brand)]"
                    >
                      <input
                        type="checkbox"
                        checked={inviteRoles.includes(role.id)}
                        onChange={() => setInviteRoles(handleRoleToggle(inviteRoles, role.id))}
                      />
                      {role.label}
                    </label>
                  ))}
                </div>
              </FormField>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--ee-border)]">
                <Button variant="outline" density="compact" type="button" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" density="compact" type="submit" loading={inviting}>
                  Send Invitation Email
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Member Drawer / Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50">
          <Card elevated className="w-full max-w-xl p-6 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--ee-border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--ee-text)] flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[var(--ee-brand)]" />
                  Edit Profile: {selectedMember.full_name || selectedMember.email}
                </h3>
                <p className="text-xs text-[var(--ee-muted)]">{selectedMember.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
              >
                ✕
              </button>
            </div>

            {selectedMember.block_reason && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Compliance Safety Hold:</span>
                  {selectedMember.block_reason}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <FormField label="System Access Roles">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {ACCESS_ROLES.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] text-xs text-[var(--ee-text)] cursor-pointer hover:border-[var(--ee-brand)]"
                    >
                      <input
                        type="checkbox"
                        checked={editRoles.includes(role.id)}
                        onChange={() => setEditRoles(handleRoleToggle(editRoles, role.id))}
                      />
                      {role.label}
                    </label>
                  ))}
                </div>
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Employment Worker Type">
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                    value={editWorkerType}
                    onChange={(e) => setEditWorkerType(e.target.value)}
                  >
                    <option value="1099">1099 Independent Contractor</option>
                    <option value="W2">W-2 Payroll Employee</option>
                  </select>
                </FormField>

                <FormField label="Specialty & Skills">
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                    placeholder="e.g. Lead DJ, Sound Engineer, Inflatables"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Pay Basis">
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                    value={editPayBasis}
                    onChange={(e) => setEditPayBasis(e.target.value)}
                  >
                    <option value="per_event">Per Event / Flat Gig Rate</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="monthly">Monthly Retainer</option>
                  </select>
                </FormField>

                <FormField label={`Default Rate ($ per ${editPayBasis})`}>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs font-mono"
                    value={editPayRate}
                    onChange={(e) => setEditPayRate(e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--ee-border)]">
              <Button
                variant="outline"
                density="compact"
                type="button"
                onClick={() => handleDeactivate(selectedMember)}
                className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                leftIcon={<UserX className="w-3.5 h-3.5" />}
              >
                Deactivate Account
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" density="compact" type="button" onClick={() => setSelectedMember(null)}>
                  Cancel
                </Button>
                <Button variant="primary" density="compact" type="button" onClick={handleSaveMember} loading={saving}>
                  Save Member Profile
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PeoplePage;
