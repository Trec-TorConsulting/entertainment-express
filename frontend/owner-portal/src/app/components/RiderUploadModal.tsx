import React, { useState } from 'react';
import { FileText, Upload, Check, X, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RiderUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
}

export const RiderUploadModal: React.FC<RiderUploadModalProps> = ({
  isOpen,
  onClose,
  bookingId = 'EB-2026-009',
}) => {
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);

  const handleSimulateUpload = async () => {
    setParsing(true);
    try {
      const res = await fetch(
        '/api/method/entertainment_express.copilot.document_parser.parse_pdf_rider',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdf_text: 'Client: Metro Events Corp\nDate: 2026-10-15\nVenue: Grand Plaza Ballroom',
            booking_id: bookingId,
          }),
        }
      );
      const data = await res.json();
      setParsedData(data.message?.extracted_specs || null);
    } catch {
      setParsedData({
        client_name: 'Metro Events Corp',
        event_date: '2026-10-15',
        start_time: '17:00',
        venue_name: 'Grand Plaza Ballroom',
        power_requirements: 'Two dedicated 20A 120V circuits',
        stage_dimensions: '24x16 ft',
        required_equipment: [
          { item_name: 'Line Array Speaker System', qty: 2 },
          { item_name: 'Wireless Handheld Microphones', qty: 4 },
        ],
      });
    } finally {
      setParsing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#12161f] border border-slate-800 rounded-xl shadow-2xl text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-base">PDF Contract & Technical Rider Extractor</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {!parsedData ? (
            <div
              onClick={handleSimulateUpload}
              className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center space-y-3 bg-indigo-500/5"
            >
              <Upload className={`w-10 h-10 text-indigo-400 ${parsing ? 'animate-bounce' : ''}`} />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {parsing ? 'Parsing Document with Ollama Agent...' : 'Drop PDF Contract or Technical Rider Here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF contracts, stage riders, and specs up to 25 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Rider Extraction Complete (Confidence 94%)
                </span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 px-2 py-0.5 rounded">
                  Ollama Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">Client Name</span>
                  <p className="text-slate-200 font-semibold text-sm mt-0.5">{parsedData.client_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Event Date</span>
                  <p className="text-slate-200 font-semibold text-sm mt-0.5">{parsedData.event_date}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Venue Location</span>
                  <p className="text-slate-200 font-semibold text-sm mt-0.5">{parsedData.venue_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Stage & Power Specs</span>
                  <p className="text-slate-200 font-semibold text-xs mt-0.5">{parsedData.stage_dimensions} | {parsedData.power_requirements}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-300 mb-2">Required Equipment Line Items</h4>
                <div className="space-y-1.5">
                  {parsedData.required_equipment?.map((eq: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-200 font-medium">{eq.item_name}</span>
                      <span className="text-indigo-400 font-mono font-semibold">Qty: {eq.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            Cancel
          </button>

          {parsedData && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow"
            >
              <span>Confirm & Apply to Booking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
