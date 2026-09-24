import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Input,
  useToast,
  call
} from "@portal-kit";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Code,
  Eye,
  Edit3,
  Plus,
  Wand2,
  FileText,
  AlertCircle,
  Heading,
  Split,
  HelpCircle
} from "lucide-react";

interface RichContractEditorProps {
  value: string;
  onChange: (html: string) => void;
  signerName?: string;
  signerEmail?: string;
  height?: string;
}

export const RichContractEditor: React.FC<RichContractEditorProps> = ({
  value,
  onChange,
  signerName = "Alex Morgan",
  signerEmail = "alex@example.com",
  height = "h-[360px]"
}) => {
  const { toast } = useToast();
  const [editorMode, setEditorMode] = useState<"visual" | "code" | "preview">("visual");
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Keep visual editor content in sync when mode changes or external value updates
  useEffect(() => {
    if (editorRef.current && editorMode === "visual") {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "<p>Start typing contract terms...</p>";
      }
    }
  }, [editorMode, value]);

  const handleVisualInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    handleVisualInput();
  };

  const insertVariable = (variableTag: string) => {
    if (editorMode === "visual" && editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(` ${variableTag} `);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += ` ${variableTag} `;
      }
      handleVisualInput();
    } else {
      onChange((value || "") + ` ${variableTag} `);
    }

    toast({
      title: "Tag Inserted",
      description: `Added placeholder ${variableTag}`,
      variant: "success"
    });
  };

  const insertPresetClause = async (clauseType: string) => {
    try {
      const res = await call("entertainment_express.api.contract.ai_generate_clause", {
        clause_type: clauseType
      });
      if (res && res.html) {
        const appended = (value || "").trim() + "\n<br/>\n" + res.html;
        onChange(appended);
        if (editorRef.current && editorMode === "visual") {
          editorRef.current.innerHTML = appended;
        }
        toast({
          title: "Clause Inserted",
          description: `Added ${clauseType.replace("_", " ")} clause to contract.`,
          variant: "success"
        });
      }
    } catch (err: any) {
      toast({
        title: "Clause Insertion Error",
        description: err.message || "Failed to fetch clause.",
        variant: "danger"
      });
    }
  };

  const handleAiGenerate = async (presetPrompt?: string) => {
    const promptToUse = presetPrompt || aiPrompt;
    if (!promptToUse.trim()) {
      toast({ title: "Please enter an AI prompt instruction", variant: "danger" });
      return;
    }

    setAiLoading(true);
    try {
      const res = await call("entertainment_express.api.contract.ai_generate_clause", {
        prompt: promptToUse,
        existing_text: value
      });

      if (res && res.html) {
        const appended = (value || "").trim() + "\n<br/>\n" + res.html;
        onChange(appended);
        if (editorRef.current && editorMode === "visual") {
          editorRef.current.innerHTML = appended;
        }
        toast({
          title: "AI Clause Drafted",
          description: "Inserted custom AI-generated legal clause.",
          variant: "success"
        });
        setShowAiModal(false);
        setAiPrompt("");
      }
    } catch (err: any) {
      toast({
        title: "AI Generation Error",
        description: err.message || "Failed to generate contract clause.",
        variant: "danger"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const samplePreviewHtml = (value || "")
    .replace(/\{\{\s*doc\.signer_name\s*\}\}/g, signerName || "Alex Morgan")
    .replace(/\{\{\s*doc\.signer_email\s*\}\}/g, signerEmail || "alex@example.com")
    .replace(/\{\{\s*customer_name\s*\}\}/g, signerName || "Alex Morgan")
    .replace(/\{\{\s*doc\.customer_name\s*\}\}/g, signerName || "Alex Morgan")
    .replace(/\{\{\s*doc\.event_date\s*\}\}/g, "October 15, 2026")
    .replace(/\{\{\s*event_date\s*\}\}/g, "October 15, 2026")
    .replace(/\{\{\s*doc\.venue_address\s*\}\}/g, "Grand Ballroom, 100 Main St, Suite 400")
    .replace(/\{\{\s*venue_address\s*\}\}/g, "Grand Ballroom, 100 Main St, Suite 400")
    .replace(/\{\{\s*doc\.grand_total\s*\}\}/g, "$2,450.00")
    .replace(/\{\{\s*grand_total\s*\}\}/g, "$2,450.00")
    .replace(/\{\{\s*doc\.deposit_amount\s*\}\}/g, "$612.50")
    .replace(/\{\{\s*deposit_amount\s*\}\}/g, "$612.50")
    .replace(/\{\{\s*owner\.company_name\s*\}\}/g, "Express Entertainment LLC")
    .replace(/\{\{\s*company_name\s*\}\}/g, "Express Entertainment LLC");

  const variableCategories = [
    {
      category: "Client Info",
      tags: [
        { label: "Signer Name", tag: "{{ doc.signer_name }}" },
        { label: "Signer Email", tag: "{{ doc.signer_email }}" }
      ]
    },
    {
      category: "Event Details",
      tags: [
        { label: "Event Date", tag: "{{ doc.event_date }}" },
        { label: "Venue Address", tag: "{{ doc.venue_address }}" }
      ]
    },
    {
      category: "Financials",
      tags: [
        { label: "Grand Total", tag: "{{ doc.grand_total }}" },
        { label: "Deposit Amount", tag: "{{ doc.deposit_amount }}" }
      ]
    },
    {
      category: "Company",
      tags: [
        { label: "Company Name", tag: "{{ owner.company_name }}" }
      ]
    }
  ];

  return (
    <div className="rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface)] overflow-hidden shadow-sm">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[var(--ee-surface-inset)] border-b border-[var(--ee-border)]">
        {/* Editor Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--ee-panel)] rounded-lg border border-[var(--ee-border)]">
          <button
            type="button"
            onClick={() => setEditorMode("visual")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
              editorMode === "visual"
                ? "bg-[var(--ee-brand)] text-white shadow-sm"
                : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Visual WYSIWYG
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("code")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
              editorMode === "code"
                ? "bg-[var(--ee-brand)] text-white shadow-sm"
                : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
            }`}
          >
            <Code className="w-3.5 h-3.5" /> HTML / Jinja Code
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("preview")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
              editorMode === "preview"
                ? "bg-[var(--ee-brand)] text-white shadow-sm"
                : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Live Sample Preview
          </button>
        </div>

        {/* AI Copilot & Preset Action Buttons */}
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                insertPresetClause(e.target.value);
                e.target.value = "";
              }
            }}
            className="h-8 px-2.5 text-xs font-medium border rounded-lg bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
          >
            <option value="">+ Insert Clause Preset...</option>
            <option value="cancellation">📜 Cancellation & Refund Terms</option>
            <option value="deposit">📜 Deposit & Payment Schedule</option>
            <option value="safety_weather">📜 Equipment & Weather Safety</option>
            <option value="overtime">📜 Overtime & Hourly Rate Policy</option>
            <option value="media_release">📜 Photo & Video Release</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAiModal(!showAiModal)}
            className="h-8 text-xs font-semibold border-[var(--ee-brand)] text-[var(--ee-brand)] hover:bg-[var(--ee-brand)] hover:text-white"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Clause Copilot
          </Button>
        </div>
      </div>

      {/* AI Copilot Drawer / Modal Bar */}
      {showAiModal && (
        <div className="p-3 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-emerald-500/10 border-b border-[var(--ee-border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ee-brand)]">
              <Wand2 className="w-4 h-4" /> AI Legal & Clause Drafting Assistant
            </div>
            <button
              type="button"
              onClick={() => setShowAiModal(false)}
              className="text-xs text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
            >
              ✕ Close
            </button>
          </div>

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. Write a noise limit and residential neighborhood DJ policy..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="h-9 text-xs bg-[var(--ee-surface)]"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={aiLoading}
              onClick={() => handleAiGenerate()}
              className="h-9 text-xs font-semibold whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Generate Clause
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--ee-muted)]">
            <span className="font-semibold text-[var(--ee-text)]">Quick AI Prompts:</span>
            {[
              "Sound limit & quiet hours policy",
              "Inflatable wind & rain shutdown rule",
              "Game truck power & parking space rule",
              "Client cancellation within 7 days"
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAiGenerate(preset)}
                className="px-2 py-0.5 rounded-full bg-[var(--ee-surface)] border border-[var(--ee-border)] text-[var(--ee-text)] hover:border-[var(--ee-brand)] hover:text-[var(--ee-brand)] transition-colors"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formatting Toolbar (Active in Visual WYSIWYG Mode) */}
      {editorMode === "visual" && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-[var(--ee-surface)] border-b border-[var(--ee-border)] text-xs">
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<h2>")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)] font-bold"
            title="Heading 2 (Title)"
          >
            H2 Title
          </button>
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<h3>")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)] font-semibold"
            title="Heading 3 (Section)"
          >
            H3 Section
          </button>
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<p>")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
            title="Paragraph"
          >
            Paragraph
          </button>

          <div className="h-4 w-px bg-[var(--ee-border)] mx-1" />

          <button
            type="button"
            onClick={() => execCmd("bold")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("italic")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("underline")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[var(--ee-border)] mx-1" />

          <button
            type="button"
            onClick={() => execCmd("insertUnorderedList")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
            title="Bulleted List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertOrderedList")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[var(--ee-border)] mx-1" />

          <button
            type="button"
            onClick={() => execCmd("justifyLeft")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyCenter")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyRight")}
            className="p-1.5 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[var(--ee-border)] mx-1" />

          <button
            type="button"
            onClick={() => execCmd("insertHorizontalRule")}
            className="px-2 py-1 rounded hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs font-mono"
            title="Divider Line"
          >
            — Divider
          </button>
        </div>
      )}

      {/* Editor Body Area */}
      <div className={`relative ${height} bg-[var(--ee-surface)] overflow-y-auto p-3 text-sm text-[var(--ee-text)]`}>
        {editorMode === "visual" && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleVisualInput}
            className="min-h-full outline-none prose max-w-none prose-headings:text-[var(--ee-text)] prose-p:text-[var(--ee-text)] prose-strong:text-[var(--ee-text)] focus:ring-1 focus:ring-[var(--ee-brand)] p-2 rounded-lg"
          />
        )}

        {editorMode === "code" && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full font-mono text-xs p-2 bg-[var(--ee-surface-inset)] text-[var(--ee-text)] border-0 focus:outline-none resize-none leading-relaxed"
            placeholder="<div>Enter Jinja / HTML contract body...</div>"
          />
        )}

        {editorMode === "preview" && (
          <div className="p-4 bg-white rounded-lg shadow border border-slate-200 text-slate-800 font-sans leading-normal space-y-3 min-h-full">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 pb-2 border-b border-slate-200 flex items-center justify-between">
              <span>📄 Live Contract Sample Render</span>
              <span className="text-[10px] text-slate-500 font-normal">Interpolated with sample booking values</span>
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: samplePreviewHtml || "<p class='text-slate-400 italic'>No content yet...</p>" }}
              className="prose max-w-none text-sm"
            />
          </div>
        )}
      </div>

      {/* Variable Chips Bar Footer */}
      <div className="p-2.5 bg-[var(--ee-surface-inset)] border-t border-[var(--ee-border)] space-y-1.5">
        <div className="text-xs font-bold text-[var(--ee-text)] flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
          <span>Interactive Variable Tags (Click to insert):</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {variableCategories.map((cat) => (
            <div key={cat.category} className="flex items-center gap-1 bg-[var(--ee-surface)] px-2 py-1 rounded-md border border-[var(--ee-border)]">
              <span className="text-[10px] font-bold uppercase text-[var(--ee-muted)] mr-1">{cat.category}:</span>
              {cat.tags.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => insertVariable(t.tag)}
                  className="px-2 py-0.5 rounded bg-[var(--ee-panel)] border border-[var(--ee-border)] font-mono text-[11px] text-[var(--ee-brand)] font-semibold hover:bg-[var(--ee-brand)] hover:text-white transition-all"
                  title={`Insert ${t.tag}`}
                >
                  + {t.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
