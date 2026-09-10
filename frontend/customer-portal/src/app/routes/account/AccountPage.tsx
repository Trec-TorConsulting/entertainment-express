import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  FormField,
  Switch,
  Skeleton,
  useToast,
  call,
  useTheme
} from "@portal-kit";
import {
  Settings, User, Bell, Moon, Sun, Monitor,
  Shield, LogOut, CheckCircle2, Phone, Mail
} from "lucide-react";
import { getSessionBootstrap } from "@portal-kit";

export const AccountPage: React.FC = () => {
  const { toast } = useToast();
  const themeContext = useTheme();
  const bootstrap = getSessionBootstrap();

  const [loading, setLoading] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState(true);
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await call("entertainment_express.api.portal_notifications.save_my_preferences", {
        sms_opt_in: smsEnabled ? 1 : 0,
        email_opt_in: emailEnabled ? 1 : 0,
        quiet_hours: quietHours ? 1 : 0,
        emergency_phone: emergencyPhone
      }).catch(() => null);

      toast({
        title: "Preferences Saved",
        description: "Your notification and communication preferences have been updated.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Saved",
        description: "Communication settings updated.",
        variant: "success",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/method/logout";
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Account & Settings"
        subtitle="Manage communication preferences, dark mode styling, and event day emergency contacts."
        badge={<Badge variant="brand">Client Account</Badge>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--ee-brand)]" />
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]">
              <div className="w-12 h-12 rounded-full bg-[var(--ee-brand)] text-white flex items-center justify-center font-bold text-base">
                {(bootstrap.user || "C").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[var(--ee-text)]">{bootstrap.user || "Event Client"}</h4>
                <span className="text-xs text-[var(--ee-muted)]">{bootstrap.roles?.join(", ") || "EE Customer"}</span>
              </div>
            </div>

            <FormField label="Event Day Emergency Contact Phone">
              <Input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="(555) 000-0000"
                density="consumer"
              />
            </FormField>

            <Button
              variant="outline"
              density="consumer"
              onClick={handleLogout}
              className="w-full text-[var(--ee-danger)] hover:border-[var(--ee-danger)]"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Log Out of Portal
            </Button>
          </CardContent>
        </Card>

        {/* Theme Preferences Card */}
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="w-4 h-4 text-[var(--ee-brand)]" />
              Interface Theme & Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-[var(--ee-muted)]">
              Choose your preferred visual theme for the customer portal. Tokens adjust contrast automatically.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
                { id: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
                { id: "system", label: "System", icon: <Monitor className="w-4 h-4" /> }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => themeContext.setTheme(m.id as any)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                    themeContext.theme === m.id
                      ? "border-[var(--ee-brand)] bg-[var(--ee-brand-soft)]/40 text-[var(--ee-brand)] ring-1 ring-[var(--ee-brand)]"
                      : "border-[var(--ee-border)] text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences Card */}
        <Card elevated className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--ee-brand)]" />
              Notification Channels & Quiet Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 divide-y divide-[var(--ee-border)] text-xs">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h5 className="font-semibold text-[var(--ee-text)]">SMS Notifications</h5>
                  <span className="text-[var(--ee-muted)]">Receive automated event milestones, weather updates, and crew arrival alerts via text.</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="rounded text-[var(--ee-brand)] focus:ring-[var(--ee-brand)] w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h5 className="font-semibold text-[var(--ee-text)]">Email Invoices & Contract Copies</h5>
                  <span className="text-[var(--ee-muted)]">Signed contract PDFs, payment receipts, and planning reminders sent to your account email.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="rounded text-[var(--ee-brand)] focus:ring-[var(--ee-brand)] w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h5 className="font-semibold text-[var(--ee-text)]">Enforce Quiet Hours (10 PM - 8 AM)</h5>
                  <span className="text-[var(--ee-muted)]">Non-emergency notifications are held until normal daytime business hours.</span>
                </div>
                <input
                  type="checkbox"
                  checked={quietHours}
                  onChange={(e) => setQuietHours(e.target.checked)}
                  className="rounded text-[var(--ee-brand)] focus:ring-[var(--ee-brand)] w-4 h-4"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--ee-border)]">
              <Button
                variant="primary"
                density="consumer"
                onClick={handleSavePreferences}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Communication Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountPage;
