import React, { useState } from 'react';

interface SiteFitQuestionnaireProps {
  bookingId?: string;
  onSave?: (data: any) => void;
}

export const SiteFitQuestionnaire: React.FC<SiteFitQuestionnaireProps> = ({ bookingId, onSave }) => {
  const [gateWidth, setGateWidth] = useState<number>(36);
  const [stairCount, setStairCount] = useState<number>(0);
  const [surfaceType, setSurfaceType] = useState<string>('Grass');
  const [powerDistance, setPowerDistance] = useState<string>('Dedicated 20A Within 50ft');
  const [gateCode, setGateCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      bookingId,
      gateWidth,
      stairCount,
      surfaceType,
      powerDistance,
      gateCode,
      notes,
    };
    if (onSave) onSave(data);
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-xl max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-emerald-400 mb-2">Venue Site & Logistics Intake</h2>
      <p className="text-sm text-slate-400 mb-6">
        Please specify pathway clearances, surface composition, and power availability to ensure zero-delay setup on event day.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Minimum Gate/Doorway Width (Inches)
          </label>
          <input
            type="number"
            value={gateWidth}
            onChange={(e) => setGateWidth(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            min="20"
            max="200"
            required
          />
          <p className="text-xs text-slate-500 mt-1">Standard inflatables and commercial gear require at least 36" clearance.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Stair Count / Elevation Impediments
          </label>
          <input
            type="number"
            value={stairCount}
            onChange={(e) => setStairCount(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            min="0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Surface Type (Anchoring Clearance)
          </label>
          <select
            value={surfaceType}
            onChange={(e) => setSurfaceType(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="Grass">Grass (Ground Stake Anchoring)</option>
            <option value="Asphalt">Asphalt (Sandbag Ballasts Mandated)</option>
            <option value="Concrete">Concrete / Pavement (Sandbag Ballasts Mandated)</option>
            <option value="Artificial Turf">Artificial Turf (Sandbag Ballasts Mandated)</option>
            <option value="Indoor Gymnasium">Indoor Gymnasium (Rubber Matting & Ballasts)</option>
            <option value="Dirt/Gravel">Dirt / Gravel</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Power Source Reach
          </label>
          <select
            value={powerDistance}
            onChange={(e) => setPowerDistance(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="Dedicated 20A Within 50ft">Dedicated 20A Outlet within 50ft</option>
            <option value="Standard Outlet Within 100ft">Standard Outlet within 100ft</option>
            <option value="No Power - Generator Required">No Power - Quiet Generator Required</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Access Gate Code / PIN
            </label>
            <input
              type="text"
              value={gateCode}
              onChange={(e) => setGateCode(e.target.value)}
              placeholder="e.g. #4829"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Parking & Unloading Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Back driveway entrance"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors mt-4"
        >
          Confirm Site Specifications
        </button>
      </form>
    </div>
  );
};

export default SiteFitQuestionnaire;
