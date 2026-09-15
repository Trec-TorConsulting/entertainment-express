import React, { useState, useEffect } from "react";
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
  useToast,
  Skeleton,
  call
} from "@portal-kit";
import {
  Building2, Receipt, Landmark, CreditCard, Save, Plus, CheckCircle2, DollarSign
} from "lucide-react";

export const CompanyStudioPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"general" | "taxes" | "accounts">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings State
  const [companyProfile, setCompanyProfile] = useState<any>({
    company_name: "",
    default_currency: "USD",
    country: "United States",
    tax_id: "",
    phone_no: "",
    email: "",
    website: "",
    date_of_establishment: ""
  });

  // Tax Templates State
  const [taxRules, setTaxRules] = useState<any[]>([]);
  const [newTaxTitle, setNewTaxTitle] = useState("");
  const [newTaxRate, setNewTaxRate] = useState<string>("7.5");
  const [newTaxDefault, setNewTaxDefault] = useState(false);
  const [addingTax, setAddingTax] = useState(false);

  // Accounts Mapping State
  const [accountsMapping, setAccountsMapping] = useState<any>({});
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      const [profileRes, taxesRes, accountsRes] = await Promise.all([
        call("entertainment_express.api.company_setup.get_company_settings"),
        call("entertainment_express.api.company_setup.get_tax_templates"),
        call("entertainment_express.api.company_setup.get_chart_of_accounts_mapping")
      ]);

      if (profileRes) setCompanyProfile(profileRes);
      if (taxesRes) setTaxRules(taxesRes);
      if (accountsRes) {
        setAccountsMapping(accountsRes.mappings || {});
        setAvailableAccounts(accountsRes.available_accounts || []);
      }
    } catch (e: any) {
      toast({
        title: "Error Loading Settings",
        description: e?.message || "Failed to load company studio settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await call("entertainment_express.api.company_setup.save_company_settings", {
        data: JSON.stringify(companyProfile)
      });
      toast({
        title: "Profile Saved",
        description: "Company details and defaults updated successfully."
      });
    } catch (e: any) {
      toast({
        title: "Save Failed",
        description: e?.message || "Could not update company profile.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTaxRule = async () => {
    if (!newTaxTitle || !newTaxRate) return;
    setSaving(true);
    try {
      await call("entertainment_express.api.company_setup.save_tax_rule", {
        title: newTaxTitle,
        rate: parseFloat(newTaxRate),
        is_default: newTaxDefault ? 1 : 0
      });
      toast({
        title: "Tax Rule Created",
        description: `Created tax rule '${newTaxTitle}' @ ${newTaxRate}%`
      });
      setNewTaxTitle("");
      setAddingTax(false);
      const updated = await call("entertainment_express.api.company_setup.get_tax_templates");
      if (updated) setTaxRules(updated);
    } catch (e: any) {
      toast({
        title: "Failed to Add Tax Rule",
        description: e?.message || "Could not save tax template.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccounts = async () => {
    setSaving(true);
    try {
      await call("entertainment_express.api.company_setup.save_chart_of_accounts_mapping", {
        mappings: JSON.stringify(accountsMapping)
      });
      toast({
        title: "Accounts Mapping Saved",
        description: "Core accounting links updated successfully."
      });
    } catch (e: any) {
      toast({
        title: "Save Failed",
        description: e?.message || "Could not update account mappings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton width="300px" height="2rem" />
        <Skeleton height="12rem" />
        <Skeleton height="8rem" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Company Studio"
        subtitle="Manage company profile, tax rules, and core ERP accounting mappings without Frappe Desk."
        actions={
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-950/20">
            Enterprise Parity Active
          </Badge>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "general"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          Company Profile
        </button>
        <button
          onClick={() => setActiveTab("taxes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "taxes"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-400" />
          Sales Tax Rules
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "accounts"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Landmark className="w-4 h-4 text-amber-400" />
          Chart of Accounts
        </button>
      </div>

      {/* Tab: General Company Profile */}
      {activeTab === "general" && (
        <Card className="bg-zinc-950 border border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100 flex items-center justify-between">
              <span>Legal Entity & Currency Defaults</span>
              <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Legal Company Name">
                <Input
                  value={companyProfile.company_name}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, company_name: e.target.value })}
                />
              </FormField>

              <FormField label="Default Currency">
                <select
                  value={companyProfile.default_currency}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, default_currency: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                </select>
              </FormField>

              <FormField label="Business Phone">
                <Input
                  value={companyProfile.phone_no}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, phone_no: e.target.value })}
                  placeholder="e.g. (555) 123-4567"
                />
              </FormField>

              <FormField label="Accounting / Billing Email">
                <Input
                  value={companyProfile.email}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                  placeholder="billing@yourcompany.com"
                />
              </FormField>

              <FormField label="Tax ID / EIN">
                <Input
                  value={companyProfile.tax_id}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, tax_id: e.target.value })}
                  placeholder="e.g. 12-3456789"
                />
              </FormField>

              <FormField label="Official Website">
                <Input
                  value={companyProfile.website}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, website: e.target.value })}
                  placeholder="https://www.yourcompany.com"
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Sales Tax Rules */}
      {activeTab === "taxes" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Sales Tax Templates</h3>
              <p className="text-xs text-zinc-400">Rules applied automatically to quote packages and booking invoices.</p>
            </div>
            <Button
              onClick={() => setAddingTax(!addingTax)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Tax Rule
            </Button>
          </div>

          {addingTax && (
            <Card className="bg-zinc-900/60 border border-emerald-500/30 animate-in slide-in-from-top duration-200">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-emerald-400">New Sales Tax Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Rule Title (e.g. State Sales Tax)">
                    <Input
                      value={newTaxTitle}
                      onChange={(e) => setNewTaxTitle(e.target.value)}
                      placeholder="State Tax (Austin TX)"
                    />
                  </FormField>
                  <FormField label="Rate Percentage (%)">
                    <Input
                      type="number"
                      step="0.01"
                      value={newTaxRate}
                      onChange={(e) => setNewTaxRate(e.target.value)}
                      placeholder="8.25"
                    />
                  </FormField>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isDefaultTax"
                      checked={newTaxDefault}
                      onChange={(e) => setNewTaxDefault(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-0"
                    />
                    <label htmlFor="isDefaultTax" className="text-xs text-zinc-300 font-medium">
                      Set as Default Proposal Tax
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button onClick={() => setAddingTax(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button onClick={handleAddTaxRule} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    Create Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taxRules.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950 border border-zinc-800 rounded-xl col-span-2 text-zinc-400 text-sm">
                No custom tax rules configured. Taxes default to 0% exempt.
              </div>
            ) : (
              taxRules.map((rule, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-100">{rule.title || rule.name}</span>
                      {rule.is_default && (
                        <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">Account: {rule.account_head || "Sales Tax Liability"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-white">{rule.rate}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Chart of Accounts Mapping */}
      {activeTab === "accounts" && (
        <Card className="bg-zinc-950 border border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100 flex items-center justify-between">
              <span>Core Event Ledger Mapping</span>
              <Button onClick={handleSaveAccounts} disabled={saving} size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? "Saving..." : "Save Mappings"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-xs text-zinc-400">
              Control where event revenue, crew costs, receivables, and tips flow in your ERPNext double-entry general ledger.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Default Income / Sales Account">
                <select
                  value={accountsMapping.default_income_account || ""}
                  onChange={(e) => setAccountsMapping({ ...accountsMapping, default_income_account: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none"
                >
                  <option value="">-- Select Account --</option>
                  {availableAccounts.map((a, i) => (
                    <option key={i} value={a.name}>{a.name} ({a.root_type})</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Default Operating Expense Account">
                <select
                  value={accountsMapping.default_expense_account || ""}
                  onChange={(e) => setAccountsMapping({ ...accountsMapping, default_expense_account: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none"
                >
                  <option value="">-- Select Account --</option>
                  {availableAccounts.map((a, i) => (
                    <option key={i} value={a.name}>{a.name} ({a.root_type})</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Accounts Receivable (Debtors)">
                <select
                  value={accountsMapping.default_receivable_account || ""}
                  onChange={(e) => setAccountsMapping({ ...accountsMapping, default_receivable_account: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none"
                >
                  <option value="">-- Select Account --</option>
                  {availableAccounts.map((a, i) => (
                    <option key={i} value={a.name}>{a.name} ({a.root_type})</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Primary Operating Bank Account">
                <select
                  value={accountsMapping.default_bank_account || ""}
                  onChange={(e) => setAccountsMapping({ ...accountsMapping, default_bank_account: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none"
                >
                  <option value="">-- Select Account --</option>
                  {availableAccounts.map((a, i) => (
                    <option key={i} value={a.name}>{a.name} ({a.root_type})</option>
                  ))}
                </select>
              </FormField>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
