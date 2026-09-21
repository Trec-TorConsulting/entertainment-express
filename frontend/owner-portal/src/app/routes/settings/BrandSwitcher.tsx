import React, { useState } from 'react';

export interface BrandOption {
  name: string;
  brand_name: string;
  is_default?: boolean;
}

interface BrandSwitcherProps {
  brands?: BrandOption[];
  activeBrand?: string;
  onSelectBrand?: (brandName: string) => void;
}

export const BrandSwitcher: React.FC<BrandSwitcherProps> = ({
  brands = [
    { name: 'b1', brand_name: 'Main Events LLC', is_default: true },
    { name: 'b2', brand_name: 'Austin Inflatables & Games', is_default: false },
    { name: 'b3', brand_name: 'Vip DJ & Photo Booths', is_default: false },
  ],
  activeBrand = 'Main Events LLC',
  onSelectBrand,
}) => {
  const [selected, setSelected] = useState(activeBrand);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (bName: string) => {
    setSelected(bName);
    setIsOpen(false);
    if (onSelectBrand) onSelectBrand(bName);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>{selected}</span>
        <span className="text-slate-400 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50">
          <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-semibold text-slate-400">
            Switch Operating Brand
          </div>
          {brands.map((b) => (
            <button
              key={b.name}
              onClick={() => handleSelect(b.brand_name)}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                selected === b.brand_name ? 'text-emerald-400 font-semibold bg-slate-800/40' : 'text-slate-300'
              }`}
            >
              <span>{b.brand_name}</span>
              {b.is_default && (
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                  Default
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandSwitcher;
