import React, { useState } from 'react';

interface VehicleLoadProps {
  vehicleId?: string;
  vehicleName?: string;
  maxPayloadLbs?: number;
  maxVolumeCuft?: number;
  currentPayloadLbs?: number;
  currentVolumeCuft?: number;
}

export const LoadPlanning: React.FC<VehicleLoadProps> = ({
  vehicleId = 'VAN-01',
  vehicleName = 'Ford Transit 350 High Roof',
  maxPayloadLbs = 3200,
  maxVolumeCuft = 480,
  currentPayloadLbs = 2150,
  currentVolumeCuft = 340,
}) => {
  const [weight, setWeight] = useState(currentPayloadLbs);
  const [volume, setVolume] = useState(currentVolumeCuft);

  const weightPct = Math.min(100, Math.round((weight / maxPayloadLbs) * 100));
  const volumePct = Math.min(100, Math.round((volume / maxVolumeCuft) * 100));

  const isOverloadedWeight = weight > maxPayloadLbs;
  const isOverloadedVolume = volume > maxVolumeCuft;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{vehicleName}</h2>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            {vehicleId}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            isOverloadedWeight || isOverloadedVolume
              ? 'bg-rose-950 text-rose-400 border border-rose-800'
              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
          }`}>
            {isOverloadedWeight || isOverloadedVolume ? 'OVERLOAD WARNING' : 'Payload Safe'}
          </span>
        </div>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weight gauge */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400 font-medium">Weight Capacity</span>
            <span className="font-mono text-slate-200">{weight} / {maxPayloadLbs} lbs ({weightPct}%)</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverloadedWeight ? 'bg-rose-500' : weightPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, weightPct)}%` }}
            />
          </div>
        </div>

        {/* Volume gauge */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400 font-medium">Cubic Cargo Volume</span>
            <span className="font-mono text-slate-200">{volume} / {maxVolumeCuft} cu ft ({volumePct}%)</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverloadedVolume ? 'bg-rose-500' : volumePct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, volumePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Manifest item simulator */}
      <div className="border-t border-slate-800 pt-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Load Manifest Items</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-slate-800 rounded border border-slate-700/40 text-xs">
            <span className="font-medium text-slate-200">24ft Water Slide (Unrolled Roll)</span>
            <span className="text-slate-400">450 lbs | 64 cu ft</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-800 rounded border border-slate-700/40 text-xs">
            <span className="font-medium text-slate-200">2.0 HP Blower Motor x4</span>
            <span className="text-slate-400">140 lbs | 16 cu ft</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-800 rounded border border-slate-700/40 text-xs">
            <span className="font-medium text-slate-200">Heavy Duty Sandbag Ballasts x12</span>
            <span className="text-slate-400">600 lbs | 12 cu ft</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadPlanning;
