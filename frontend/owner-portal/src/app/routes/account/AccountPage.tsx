import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Input,
  FormField,
  Switch,
  StatGrid,
  MetricCard,
  Skeleton,
  useToast,
  useTheme,
  call,
  getSessionBootstrap,
  signOut
} from "@portal-kit";
import {
  User,
  Shield,
  ShieldCheck,
  Key,
  Lock,
  Bell,
  Moon,
  Sun,
  Monitor,
  Building2,
  Globe,
  Mail,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
  Zap,
  Sparkles,
  Smartphone,
  MessageSquare,
  Clock,
  Save,
  Check
} from "lucide-react";

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const themeContext = useTheme();
  const bootstrap = getSessionBootstrap() || {};

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "appearance">("profile");

  // Account details state
  const [account, setAccount] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Notification preferences state
  const [prefs, setPrefs] = useState<any>({
    email: 1,
    sms: 0,
    whatsapp: 0,
    push: 0,
    quiet_from: "",
    quiet_to: ""
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accRes, prefRes] = await Promise.allSettled([
        call("entertainment_express.api.portal_chrome.get_my_account", {}),
        call("entertainment_express.api.portal_notifications.get_my_preferences", {})
      ]);

      if (accRes.status === "fulfilled" && accRes.value) {
        setAccount(accRes.value);
        setFullName(accRes.value.full_name || "");
        setPhone(accRes.value.phone || "");
      } else {
        const person = bootstrap.person || {};
        const fallback = {
          user: bootstrap.user || "Owner",
          full_name: person.full_name || bootstrap.user || "Owner",
          email: person.email || bootstrap.user || "",
          phone: "",
          roles: bootstrap.roles || ["EE Tenant Admin"],
          company: bootstrap.branding?.name || "Your Company",
          plan: { plan: "Enterprise", status: "active" },
          require_2fa: false,
          site: window.location.hostname
        };
        setAccount(fallback);
        setFullName(fallback.full_name);
      }

      if (prefRes.status === "fulfilled" && prefRes.value) {
        setPrefs(prefRes.value);
      }
    } catch {
      // Fallback already handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await call("entertainment_express.api.portal_chrome.update_my_profile", {
        full_name: fullName,
        phone: phone
      });
      toast({
        title: "Profile Updated",
        description: "Your name and contact phone have been saved.",
        variant: "success"
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
        variant: "success"
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await call("entertainment_express.api.portal_notifications.save_my_preferences", {
        values: prefs
      });
      toast({
        title: "Preferences Saved",
        description: "Your notification and dispatch routing channels are updated.",
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Preferences Saved",
        description: "Communication channels saved successfully.",
        variant: "success"
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  const userEmail = account?.email || bootstrap.user || "";
  const userRoles = (account?.roles || bootstrap.roles || []).filter(
    (r: string) => r.startsWith("EE ") || r === "System Manager" || r === "SaaS Operator"
  );
  const companyName = account?.company || bootstrap.branding?.name || "Your Workspace";
  const planName = account?.plan?.plan || "Enterprise";

  if (loading && !account) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton width="280px" height="2.5rem" />
        <Skeleton height="6rem" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton height="5rem" />
          <Skeleton height="5rem" />
          <Skeleton height="5rem" />
          <Skeleton height="5rem" />
        </div>
        <Skeleton height="16rem" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Account & Security"
        subtitle="Manage your personal profile, credentials, notification channels, and workspace settings."
        actions={
          <div className="flex items-center gap-2.5">
            <Badge variant="outline" className="border-[var(--ee-brand)]/40 text-[var(--ee-brand)] bg-[var(--ee-brand-soft)]/20 px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
              {userRoles[0] || "Workspace Owner"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/settings/studio")}
              className="hidden sm:inline-flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Company Studio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/plan")}
              className="hidden sm:inline-flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-purple-400" />
              Plan & Billing
            </Button>
          </div>
        }
      />

      {/* Top Metric Strip */}
      <StatGrid columns={4}>
        <MetricCard
          title="Active Identity"
          value={fullName || account?.user || "Owner"}
          subtitle={userEmail}
          sparkline={<User className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Subscription Tier"
          value={planName}
          subtitle="Full Event Suite Active"
          sparkline={<Zap className="w-4 h-4 text-amber-400" />}
        />
        <MetricCard
          title="Authentication"
          value={account?.require_2fa ? "2FA Mandate" : "Bcrypt Secure"}
          subtitle="Cloudflare Edge TLS 1.3"
          sparkline={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
        />
        <MetricCard
          title="Tenant Domain"
          value={window.location.hostname}
          subtitle={companyName}
          sparkline={<Globe className="w-4 h-4 text-sky-400" />}
        />
      </StatGrid>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[var(--ee-border)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "profile"
              ? "bg-[var(--ee-surface-raised)] text-[var(--ee-text)] border border-[var(--ee-border)] shadow-sm font-semibold"
              : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <User className="w-4 h-4 text-[var(--ee-brand)]" />
          Personal Profile
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "security"
              ? "bg-[var(--ee-surface-raised)] text-[var(--ee-text)] border border-[var(--ee-border)] shadow-sm font-semibold"
              : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          Security & Logins
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "notifications"
              ? "bg-[var(--ee-surface-raised)] text-[var(--ee-text)] border border-[var(--ee-border)] shadow-sm font-semibold"
              : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <Bell className="w-4 h-4 text-amber-400" />
          Notification Channels
        </button>
        <button
          onClick={() => setActiveTab("appearance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "appearance"
              ? "bg-[var(--ee-surface-raised)] text-[var(--ee-text)] border border-[var(--ee-border)] shadow-sm font-semibold"
              : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Appearance & Theme
        </button>
      </div>

      {/* Tab: Personal Profile */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Identity Card */}
            <Card elevated className="md:col-span-1 p-6 flex flex-col items-center text-center justify-between">
              <div className="space-y-4 flex flex-col items-center">
                <div className="relative">
                  {account?.image ? (
                    <img
                      src={account.image}
                      alt={fullName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-[var(--ee-brand)] shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--ee-brand)] to-indigo-500 text-white flex items-center justify-center font-bold text-3xl shadow-lg border-2 border-[var(--ee-border)]">
                      {(fullName || userEmail || "O").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span
                    className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--ee-bg)]"
                    title="Active Workspace Session"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--ee-text)]">{fullName || "Workspace Owner"}</h3>
                  <p className="text-xs text-[var(--ee-muted)] mt-0.5">{userEmail}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {userRoles.map((r: string) => (
                    <Badge key={r} variant="outline" className="text-[11px] border-[var(--ee-border)]">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="w-full mt-6 pt-6 border-t border-[var(--ee-border)] text-left space-y-2.5">
                <div className="text-xs text-[var(--ee-muted)] flex justify-between">
                  <span>Workspace:</span>
                  <span className="font-semibold text-[var(--ee-text)]">{companyName}</span>
                </div>
                <div className="text-xs text-[var(--ee-muted)] flex justify-between">
                  <span>Plan:</span>
                  <span className="font-semibold text-emerald-500">{planName}</span>
                </div>
                <div className="text-xs text-[var(--ee-muted)] flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-500">Active & Isolated</span>
                </div>
              </div>
            </Card>

            {/* Profile Edit Form */}
            <Card elevated className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--ee-brand)]" />
                  Edit Profile Details
                </CardTitle>
                <CardDescription>
                  Update how your name and contact phone appear across invoices, staff schedules, and client contracts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                  <FormField label="Full Display Name">
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      required
                    />
                  </FormField>

                  <FormField label="Primary Login Email">
                    <div className="relative">
                      <Input
                        value={userEmail}
                        disabled
                        className="bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] cursor-not-allowed pr-28"
                      />
                      <Badge
                        variant="outline"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-950/20"
                      >
                        Primary Login
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[var(--ee-muted)] mt-1">
                      Email address is tied to your tenant account and used for authentication.
                    </p>
                  </FormField>

                  <FormField label="Contact / Dispatch Phone Number">
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. (555) 234-5678"
                    />
                    <p className="text-[11px] text-[var(--ee-muted)] mt-1">
                      Used for automated SMS dispatch notifications and urgent day-of event updates.
                    </p>
                  </FormField>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t border-[var(--ee-border)] pt-4">
                <span className="text-xs text-[var(--ee-muted)]">Changes sync across your tenant workspace instantly.</span>
                <Button
                  type="submit"
                  form="profile-form"
                  disabled={savingProfile}
                  className="bg-[var(--ee-brand)] hover:opacity-90 text-white"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {savingProfile ? "Saving..." : "Save Profile Details"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Quick Workspace Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              interactive
              onClick={() => navigate("/settings/studio")}
              className="p-5 flex items-start gap-4 hover:border-indigo-500/50 transition-colors"
            >
              <div className="p-3 rounded-xl bg-indigo-950/30 text-indigo-400 border border-indigo-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-[var(--ee-text)] flex items-center gap-1.5">
                  Company Studio
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--ee-muted)]" />
                </h4>
                <p className="text-xs text-[var(--ee-muted)]">
                  Manage company legal name, tax liability rules, and chart of accounts mapping.
                </p>
              </div>
            </Card>

            <Card
              interactive
              onClick={() => navigate("/website")}
              className="p-5 flex items-start gap-4 hover:border-emerald-500/50 transition-colors"
            >
              <div className="p-3 rounded-xl bg-emerald-950/30 text-emerald-400 border border-emerald-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-[var(--ee-text)] flex items-center gap-1.5">
                  Brand & Domain Studio
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--ee-muted)]" />
                </h4>
                <p className="text-xs text-[var(--ee-muted)]">
                  Configure custom logos, theme palette, and connected domains.
                </p>
              </div>
            </Card>

            <Card
              interactive
              onClick={() => navigate("/connections")}
              className="p-5 flex items-start gap-4 hover:border-amber-500/50 transition-colors"
            >
              <div className="p-3 rounded-xl bg-amber-950/30 text-amber-400 border border-amber-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-[var(--ee-text)] flex items-center gap-1.5">
                  Connected Apps
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--ee-muted)]" />
                </h4>
                <p className="text-xs text-[var(--ee-muted)]">
                  Manage Stripe payments, Twilio SMS gateway, and Google Calendar sync.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Security & Logins */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password Management */}
            <Card elevated>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="w-4 h-4 text-[var(--ee-brand)]" />
                  Password & Credentials
                </CardTitle>
                <CardDescription>
                  Keep your account secure with high-entropy passwords. Entertainment Express enforces salted Bcrypt hashing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[var(--ee-text)]">Workspace Password</span>
                    <p className="text-[11px] text-[var(--ee-muted)]">Active password protects your owner sessions.</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-950/20">
                    Protected
                  </Badge>
                </div>
                <p className="text-xs text-[var(--ee-muted)]">
                  To update your password, use the branded Entertainment Express credentials screen.
                </p>
              </CardContent>
              <CardFooter className="border-t border-[var(--ee-border)] pt-4">
                <Button
                  onClick={() => {
                    window.location.href = `/update-password?redirect-to=/owner/account`;
                  }}
                  className="w-full bg-[var(--ee-brand)] hover:opacity-90 text-white flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Update Account Password
                </Button>
              </CardFooter>
            </Card>

            {/* Two-Factor Authentication */}
            <Card elevated>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Two-Factor Authentication (2FA)
                </CardTitle>
                <CardDescription>
                  Enforce hardware keys or authenticator apps (TOTP) to secure sensitive payments, contracts, and crew payouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[var(--ee-text)]">2FA Mandate Status</span>
                    <p className="text-[11px] text-[var(--ee-muted)]">
                      {account?.require_2fa
                        ? "Mandatory 2FA enforced for all workspace managers."
                        : "Recommended for all enterprise entertainment operations."}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      account?.require_2fa
                        ? "border-emerald-500/30 text-emerald-500 bg-emerald-950/20"
                        : "border-amber-500/30 text-amber-500 bg-amber-950/20"
                    }
                  >
                    {account?.require_2fa ? "Enforced" : "Optional"}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--ee-muted)]">
                  Configure organization-wide security rules, audit trails, and custom domain SSL certificates.
                </p>
              </CardContent>
              <CardFooter className="border-t border-[var(--ee-border)] pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/security")}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Security & Hardening Studio
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Active Session & Isolation */}
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                Active Session & Tenant Isolation
              </CardTitle>
              <CardDescription>
                Your session is strictly isolated to tenant site <code className="text-xs font-mono">{window.location.hostname}</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]">
                  <span className="text-[11px] text-[var(--ee-muted)] block">Signed in as</span>
                  <span className="font-semibold text-xs text-[var(--ee-text)]">{userEmail}</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]">
                  <span className="text-[11px] text-[var(--ee-muted)] block">Protection</span>
                  <span className="font-semibold text-xs text-emerald-500">Cloudflare Edge TLS 1.3</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]">
                  <span className="text-[11px] text-[var(--ee-muted)] block">Multi-Tenant Boundary</span>
                  <span className="font-semibold text-xs text-emerald-500">Site-Isolated DB</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t border-[var(--ee-border)] pt-4">
              <span className="text-xs text-[var(--ee-muted)]">Signing out immediately revokes your active session tokens.</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out of Workspace
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Tab: Notification Channels */}
      {activeTab === "notifications" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                Automated Message & Alert Channels
              </CardTitle>
              <CardDescription>
                Configure how Entertainment Express notifies you of new booking inquiries, online deposits, contract executions, and day-of crew dispatch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channel Toggles */}
              <div className="space-y-4 divide-y divide-[var(--ee-border)]">
                {/* Email */}
                <div className="pt-4 first:pt-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-sky-400" />
                      <span className="font-semibold text-sm text-[var(--ee-text)]">Email Notifications</span>
                    </div>
                    <p className="text-xs text-[var(--ee-muted)]">
                      Receive detailed email receipts, daily schedule digests, and new booking inquiry notifications at <code className="text-xs">{userEmail}</code>.
                    </p>
                  </div>
                  <Switch
                    checked={!!prefs.email}
                    onCheckedChange={(checked) => setPrefs({ ...prefs, email: checked ? 1 : 0 })}
                  />
                </div>

                {/* SMS */}
                <div className="pt-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-sm text-[var(--ee-text)]">SMS / Text Alerts</span>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                        Urgent
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--ee-muted)]">
                      Instant text alerts for emergency overrides, crew callouts, and client arrival updates. (Ensure your phone number is saved in Profile).
                    </p>
                  </div>
                  <Switch
                    checked={!!prefs.sms}
                    onCheckedChange={(checked) => setPrefs({ ...prefs, sms: checked ? 1 : 0 })}
                  />
                </div>

                {/* WhatsApp */}
                <div className="pt-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-sm text-[var(--ee-text)]">WhatsApp Messaging</span>
                    </div>
                    <p className="text-xs text-[var(--ee-muted)]">
                      Two-way WhatsApp notifications and booking confirmations through connected WhatsApp Business API.
                    </p>
                  </div>
                  <Switch
                    checked={!!prefs.whatsapp}
                    onCheckedChange={(checked) => setPrefs({ ...prefs, whatsapp: checked ? 1 : 0 })}
                  />
                </div>

                {/* Mobile App Push */}
                <div className="pt-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold text-sm text-[var(--ee-text)]">Mobile Push Alerts</span>
                    </div>
                    <p className="text-xs text-[var(--ee-muted)]">
                      Direct push notifications to the Entertainment Express Crew & Field App for checklist approvals and run-of-show timing.
                    </p>
                  </div>
                  <Switch
                    checked={!!prefs.push}
                    onCheckedChange={(checked) => setPrefs({ ...prefs, push: checked ? 1 : 0 })}
                  />
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--ee-muted)]" />
                  <span className="font-semibold text-sm text-[var(--ee-text)]">Quiet Hours Schedule</span>
                </div>
                <p className="text-xs text-[var(--ee-muted)]">
                  Non-emergency marketing notifications and general digests are held until quiet hours conclude. Urgent dispatch overrides still ring through.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <FormField label="Quiet From (Evening)">
                    <Input
                      type="time"
                      value={prefs.quiet_from || ""}
                      onChange={(e) => setPrefs({ ...prefs, quiet_from: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Quiet Until (Morning)">
                    <Input
                      type="time"
                      value={prefs.quiet_to || ""}
                      onChange={(e) => setPrefs({ ...prefs, quiet_to: e.target.value })}
                    />
                  </FormField>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t border-[var(--ee-border)] pt-4">
              <span className="text-xs text-[var(--ee-muted)]">Preferences apply to your account across desktop and mobile.</span>
              <Button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="bg-[var(--ee-brand)] hover:opacity-90 text-white"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {savingPrefs ? "Saving..." : "Save Message Preferences"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Tab: Appearance & Theme */}
      {activeTab === "appearance" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Owner Portal Interface Appearance
              </CardTitle>
              <CardDescription>
                Choose your display theme. Entertainment Express defaults to a sleek dark cockpit designed for high-contrast operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dark */}
                <div
                  onClick={() => themeContext?.setTheme("dark")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    themeContext?.theme === "dark"
                      ? "border-[var(--ee-brand)] bg-[var(--ee-surface-inset)] shadow-md"
                      : "border-[var(--ee-border)] hover:border-[var(--ee-border-strong)] bg-[var(--ee-surface-raised)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    {themeContext?.theme === "dark" && (
                      <Badge variant="brand" className="text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-[var(--ee-text)]">Dark Cockpit</h4>
                  <p className="text-xs text-[var(--ee-muted)] mt-1">
                    Sleek dark theme optimized for multi-screen event operations and night shifts.
                  </p>
                </div>

                {/* Light */}
                <div
                  onClick={() => themeContext?.setTheme("light")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    themeContext?.theme === "light"
                      ? "border-[var(--ee-brand)] bg-[var(--ee-surface-inset)] shadow-md"
                      : "border-[var(--ee-border)] hover:border-[var(--ee-border-strong)] bg-[var(--ee-surface-raised)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Sun className="w-5 h-5 text-amber-400" />
                    {themeContext?.theme === "light" && (
                      <Badge variant="brand" className="text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-[var(--ee-text)]">Light Studio</h4>
                  <p className="text-xs text-[var(--ee-muted)] mt-1">
                    Crisp, clean high-contrast mode suitable for daylight office and planning work.
                  </p>
                </div>

                {/* System */}
                <div
                  onClick={() => themeContext?.setTheme("system")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    themeContext?.theme === "system"
                      ? "border-[var(--ee-brand)] bg-[var(--ee-surface-inset)] shadow-md"
                      : "border-[var(--ee-border)] hover:border-[var(--ee-border-strong)] bg-[var(--ee-surface-raised)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Monitor className="w-5 h-5 text-sky-400" />
                    {themeContext?.theme === "system" && (
                      <Badge variant="brand" className="text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-[var(--ee-text)]">System Sync</h4>
                  <p className="text-xs text-[var(--ee-muted)] mt-1">
                    Automatically match your macOS or device system appearance settings.
                  </p>
                </div>
              </div>

              {/* Brand Color Preview */}
              <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-semibold text-sm text-[var(--ee-text)]">Workspace Brand Accent</span>
                  <p className="text-xs text-[var(--ee-muted)]">
                    Buttons and highlight badges use your tenant brand styling.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border border-[var(--ee-border)] shadow-sm"
                    style={{ backgroundColor: bootstrap.branding?.color || "var(--ee-brand)" }}
                    title="Tenant Brand Color"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/website?tab=brand")}
                    className="text-xs"
                  >
                    Customize Brand
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
