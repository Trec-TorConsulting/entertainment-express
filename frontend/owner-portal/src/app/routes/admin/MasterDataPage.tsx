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
  Database, Search, Plus, Edit2, Trash2, X, Save, RefreshCw, CheckCircle, ChevronRight
} from "lucide-react";

export const MasterDataPage: React.FC = () => {
  const { toast } = useToast();
  const [doctypes, setDoctypes] = useState<any[]>([]);
  const [selectedDoctype, setSelectedDoctype] = useState<string>("Terms and Conditions");
  const [schemaMeta, setSchemaMeta] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  // Edit / Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<any>({});
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);

  useEffect(() => {
    // Load permitted DocTypes
    call("entertainment_express.api.owner_admin.get_permitted_doctypes")
      .then((res) => {
        if (res && res.length > 0) {
          setDoctypes(res);
          setSelectedDoctype(res[0].doctype);
        }
      })
      .catch((e) => console.warn("Error loading doctypes", e));
  }, []);

  useEffect(() => {
    if (selectedDoctype) {
      loadSchemaAndData(selectedDoctype, searchQuery);
    }
  }, [selectedDoctype]);

  const loadSchemaAndData = async (dt: string, query: string = "") => {
    setLoadingList(true);
    try {
      const [metaRes, listRes] = await Promise.all([
        call("entertainment_express.api.owner_admin.get_schema_meta", { doctype: dt }),
        call("entertainment_express.api.owner_admin.get_doc_list", { doctype: dt, search: query, limit: 50 })
      ]);
      setSchemaMeta(metaRes);
      setRecords(listRes?.records || []);
      setTotalRecords(listRes?.total || 0);
    } catch (e: any) {
      toast({
        title: "Error Loading Data",
        description: e?.message || `Could not load ${dt} schema.`,
        variant: "destructive"
      });
    } finally {
      setLoadingList(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSchemaAndData(selectedDoctype, searchQuery);
  };

  const handleOpenCreate = () => {
    const defaultObj: any = {};
    if (schemaMeta?.fields) {
      schemaMeta.fields.forEach((f: any) => {
        defaultObj[f.fieldname] = f.default || "";
      });
    }
    setActiveRecord(defaultObj);
    setIsNewRecord(true);
    setModalOpen(true);
  };

  const handleOpenEdit = async (name: string) => {
    try {
      const detail = await call("entertainment_express.api.owner_admin.get_doc_detail", {
        doctype: selectedDoctype,
        name
      });
      setActiveRecord(detail || {});
      setIsNewRecord(false);
      setModalOpen(true);
    } catch (e: any) {
      toast({
        title: "Could not open record",
        description: e?.message,
        variant: "destructive"
      });
    }
  };

  const handleSaveRecord = async () => {
    setSavingRecord(true);
    try {
      await call("entertainment_express.api.owner_admin.save_doc", {
        doctype: selectedDoctype,
        doc_data: JSON.stringify(activeRecord)
      });
      toast({
        title: "Saved Successfully",
        description: `${selectedDoctype} record saved.`
      });
      setModalOpen(false);
      loadSchemaAndData(selectedDoctype, searchQuery);
    } catch (e: any) {
      toast({
        title: "Save Failed",
        description: e?.message || "Validation error saving record.",
        variant: "destructive"
      });
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await call("entertainment_express.api.owner_admin.delete_doc", {
        doctype: selectedDoctype,
        name
      });
      toast({
        title: "Record Deleted",
        description: `${name} has been removed.`
      });
      setModalOpen(false);
      loadSchemaAndData(selectedDoctype, searchQuery);
    } catch (e: any) {
      toast({
        title: "Delete Failed",
        description: e?.message,
        variant: "destructive"
      });
    }
  };

  const renderFieldInput = (field: any) => {
    const val = activeRecord[field.fieldname] ?? "";
    const updateVal = (newVal: any) => setActiveRecord({ ...activeRecord, [field.fieldname]: newVal });

    if (field.fieldtype === "Select") {
      const options = (field.options || "").split("\n").filter(Boolean);
      return (
        <select
          value={val}
          onChange={(e) => updateVal(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none"
        >
          <option value="">-- Select {field.label} --</option>
          {options.map((opt: string, i: number) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.fieldtype === "Check") {
      return (
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id={`chk-${field.fieldname}`}
            checked={Boolean(val)}
            onChange={(e) => updateVal(e.target.checked ? 1 : 0)}
            className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
          />
          <label htmlFor={`chk-${field.fieldname}`} className="text-sm text-zinc-300">
            {field.label}
          </label>
        </div>
      );
    }

    if (["Text", "Small Text", "Long Text"].includes(field.fieldtype)) {
      return (
        <textarea
          rows={3}
          value={val}
          onChange={(e) => updateVal(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          placeholder={field.description || ""}
        />
      );
    }

    if (["Currency", "Float", "Int"].includes(field.fieldtype)) {
      return (
        <Input
          type="number"
          step={field.fieldtype === "Int" ? "1" : "0.01"}
          value={val}
          onChange={(e) => updateVal(e.target.value)}
          placeholder={field.description || ""}
        />
      );
    }

    return (
      <Input
        value={val}
        onChange={(e) => updateVal(e.target.value)}
        placeholder={field.description || ""}
      />
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Master Configuration Explorer"
        subtitle="Manage underlying ERPNext business records and master entities directly inside the owner cockpit."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left: Permitted Entities List */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Master Entities
          </span>
          <div className="space-y-1">
            {doctypes.map((dt) => (
              <button
                key={dt.doctype}
                onClick={() => setSelectedDoctype(dt.doctype)}
                className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                  selectedDoctype === dt.doctype
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                    : "bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                <div>
                  <p className="font-semibold">{dt.label}</p>
                  <p className={`text-[11px] ${selectedDoctype === dt.doctype ? "text-indigo-200" : "text-zinc-500"}`}>
                    {dt.module}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Record Explorer Table */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-80">
              <Input
                placeholder={`Search ${selectedDoctype}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950"
              />
              <Button type="submit" size="sm" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </form>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New {selectedDoctype}
            </Button>
          </div>

          <Card className="bg-zinc-950 border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="p-3.5">ID / Name</th>
                    {schemaMeta?.fields
                      ?.filter((f: any) => f.in_list_view && f.fieldname !== "name")
                      .slice(0, 4)
                      .map((f: any) => (
                        <th key={f.fieldname} className="p-3.5">{f.label}</th>
                      ))}
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {loadingList ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading records...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        No records found in {selectedDoctype}. Click &quot;New Record&quot; to create one.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.name} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="p-3.5 font-medium text-white">{r.name}</td>
                        {schemaMeta?.fields
                          ?.filter((f: any) => f.in_list_view && f.fieldname !== "name")
                          .slice(0, 4)
                          .map((f: any) => (
                            <td key={f.fieldname} className="p-3.5 text-zinc-400">
                              {String(r[f.fieldname] ?? "-")}
                            </td>
                          ))}
                        <td className="p-3.5 text-right">
                          <Button
                            onClick={() => handleOpenEdit(r.name)}
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Dynamic Edit / Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/60">
              <div>
                <h3 className="font-bold text-lg text-white">
                  {isNewRecord ? `Create ${selectedDoctype}` : `Edit: ${activeRecord.name}`}
                </h3>
                <p className="text-xs text-zinc-400">Underlying ERPNext metadata with server validation</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schemaMeta?.fields?.map((f: any) => (
                  <div key={f.fieldname} className={["Text", "Small Text", "Long Text"].includes(f.fieldtype) ? "col-span-2" : ""}>
                    <FormField label={`${f.label} ${f.reqd ? "*" : ""}`}>
                      {renderFieldInput(f)}
                    </FormField>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/40">
              {!isNewRecord ? (
                <Button
                  onClick={() => handleDeleteRecord(activeRecord.name)}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              ) : <div />}

              <div className="flex gap-2">
                <Button onClick={() => setModalOpen(false)} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRecord}
                  disabled={savingRecord}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {savingRecord ? "Saving..." : "Save Record"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
