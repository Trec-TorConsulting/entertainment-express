import React, { useState } from 'react';

interface BrandRecord {
  name: string;
  brand_name: string;
  slug: string;
  is_default: boolean;
  primary_color: string;
  secondary_color: string;
  custom_host: string;
  email_from: string;
  twilio_phone_number: string;
  statement_descriptor: string;
  active: boolean;
}

export const BrandSettingsView: React.FC = () => {
  const [brands, setBrands] = useState<BrandRecord[]>([
    {
      name: 'b-default',
      brand_name: 'Entertainment Express Main',
      slug: 'default',
      is_default: true,
      primary_color: '#059669',
      secondary_color: '#10b981',
      custom_host: 'entx.app',
      email_from: 'events@entx.app',
      twilio_phone_number: '+18005550199',
      statement_descriptor: 'ENTERTAINMENT EXPR',
      active: true,
    },
    {
      name: 'b-inflatables',
      brand_name: 'Austin Bounce & Party',
      slug: 'austin-bounce',
      is_default: false,
      primary_color: '#3b82f6',
      secondary_color: '#60a5fa',
      custom_host: 'austinbounce.com',
      email_from: 'bookings@austinbounce.com',
      twilio_phone_number: '+15125550144',
      statement_descriptor: 'AUSTIN BOUNCE PARTY',
      active: true,
    },
  ]);

  const [editingBrand, setEditingBrand] = useState<Partial<BrandRecord> | null>(null);

  const handleSave = () => {
    if (!editingBrand || !editingBrand.brand_name) return;
    if (editingBrand.name) {
      setBrands(brands.map((b) => (b.name === editingBrand.name ? ({ ...b, ...editingBrand } as BrandRecord) : b)));
    } else {
      const newB: BrandRecord = {
        name: `b-${Date.now()}`,
        brand_name: editingBrand.brand_name || 'New Brand',
        slug: editingBrand.slug || 'new-brand',
        is_default: false,
        primary_color: editingBrand.primary_color || '#059669',
        secondary_color: editingBrand.secondary_color || '#10b981',
        custom_host: editingBrand.custom_host || '',
        email_from: editingBrand.email_from || '',
        twilio_phone_number: editingBrand.twilio_phone_number || '',
        statement_descriptor: editingBrand.statement_descriptor || 'BRAND DESCRIPTOR',
        active: true,
      };
      setBrands([...brands, newB]);
    }
    setEditingBrand(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Multi-Brand Umbrella Configuration</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage multiple business identities, custom domains, communications senders, and Stripe charge descriptors under one roof.
          </p>
        </div>
        <button
          onClick={() => setEditingBrand({ brand_name: '', slug: '', primary_color: '#059669', active: true })}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-4 rounded-lg transition-colors"
        >
          + Add New Brand
        </button>
      </div>

      {/* Brand List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brands.map((b) => (
          <div key={b.name} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-slate-600" style={{ backgroundColor: b.primary_color }}></span>
                <span className="font-bold text-white text-sm">{b.brand_name}</span>
              </div>
              {b.is_default && (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                  Default Brand
                </span>
              )}
            </div>

            <div className="text-xs space-y-1 text-slate-300 font-mono">
              <div><span className="text-slate-500 font-sans">Slug:</span> {b.slug}</div>
              <div><span className="text-slate-500 font-sans">Domain:</span> {b.custom_host || 'Default tenant host'}</div>
              <div><span className="text-slate-500 font-sans">Email From:</span> {b.email_from}</div>
              <div><span className="text-slate-500 font-sans">Stripe Descriptor:</span> {b.statement_descriptor}</div>
            </div>

            <div className="pt-2 border-t border-slate-700/40 flex justify-end">
              <button
                onClick={() => setEditingBrand(b)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Edit Brand Config →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingBrand && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingBrand.name ? `Edit Brand: ${editingBrand.brand_name}` : 'Create New Brand'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Brand Name</label>
                <input
                  type="text"
                  value={editingBrand.brand_name || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, brand_name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    value={editingBrand.slug || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, slug: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Custom Host / Domain</label>
                  <input
                    type="text"
                    value={editingBrand.custom_host || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, custom_host: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Primary Color (Hex)</label>
                  <input
                    type="text"
                    value={editingBrand.primary_color || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, primary_color: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email From Address</label>
                  <input
                    type="text"
                    value={editingBrand.email_from || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, email_from: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Stripe Statement Descriptor (Max 22 chars)</label>
                <input
                  type="text"
                  maxLength={22}
                  value={editingBrand.statement_descriptor || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, statement_descriptor: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingBrand(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded"
              >
                Save Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandSettingsView;
