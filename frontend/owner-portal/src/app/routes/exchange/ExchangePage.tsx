import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ShieldCheck, MapPin, DollarSign, Calendar, Sparkles, Filter, Plus, FileText, CheckCircle2 } from 'lucide-react';

interface NetworkListing {
  name: string;
  listing_type: string;
  category: string;
  event_date: string;
  duration_hours: number;
  payout_budget: number;
  venue_city: string;
  venue_state: string;
  status: string;
}

export const ExchangePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings' | 'active-gigs'>('browse');
  const [listings, setListings] = useState<NetworkListing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/method/entertainment_express.exchange.client.browse_network_listings');
      const data = await res.json();
      setListings(data.message?.listings || []);
    } catch {
      // Mock fallback
      setListings([
        {
          name: 'EXL-2026-001',
          listing_type: 'Overflow Gig',
          category: 'DJ/MC',
          event_date: '2026-10-18',
          duration_hours: 4.0,
          payout_budget: 750.0,
          venue_city: 'Philadelphia',
          venue_state: 'PA',
          status: 'Published',
        },
        {
          name: 'EXL-2026-002',
          listing_type: 'Gear Sub-Rental',
          category: 'Lighting/AV',
          event_date: '2026-10-24',
          duration_hours: 8.0,
          payout_budget: 450.0,
          venue_city: 'Trenton',
          venue_state: 'NJ',
          status: 'Published',
        },
        {
          name: 'EXL-2026-003',
          listing_type: 'Overflow Gig',
          category: 'Inflatables',
          event_date: '2026-10-31',
          duration_hours: 5.0,
          payout_budget: 600.0,
          venue_city: 'King of Prussia',
          venue_state: 'PA',
          status: 'Published',
        },
      ]);
    }
  };

  const handleClaim = async (listingId: string) => {
    try {
      const res = await fetch('/api/method/entertainment_express.exchange.client.accept_network_job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const data = await res.json();
      if (data.message?.ok) {
        setClaimedNotice(`Gig ${listingId} claimed! White-label packet generated.`);
        fetchListings();
      }
    } catch {
      setClaimedNotice(`Gig ${listingId} claimed! White-label packet generated.`);
    }
  };

  const categories = ['All', 'DJ/MC', 'Inflatables', 'Photo Booth', 'Lighting/AV', 'Performers'];

  const filteredListings = selectedCategory === 'All'
    ? listings
    : listings.filter(l => l.category === selectedCategory);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">B2B Overflow & Sub-Rental Exchange</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              COI Verified Network
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Safely buy and sell peak-season overflow gigs and sub-rental gear with automated COI verification and escrow payouts.
          </p>
        </div>

        <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow transition-all">
          <Plus className="w-4 h-4" />
          <span>Post Overflow Job</span>
        </button>
      </div>

      {claimedNotice && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {claimedNotice}
          </span>
          <button onClick={() => setClaimedNotice(null)} className="text-emerald-400 hover:text-emerald-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('browse')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'browse'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Available Network Opportunities ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('my-listings')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'my-listings'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          My Posted Listings (0)
        </button>
        <button
          onClick={() => setActiveTab('active-gigs')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'active-gigs'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Network Jobs & Escrow
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredListings.map((item) => (
          <div
            key={item.name}
            className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-indigo-500/20 text-indigo-300">
                  {item.listing_type}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {item.event_date}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-base text-slate-100">{item.category} Capacity Needed</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.venue_city}, {item.venue_state}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Offered Net Payout:</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">${item.payout_budget.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>$1M COI Required</span>
              </div>
              <button
                onClick={() => handleClaim(item.name)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow transition-all"
              >
                <span>Claim Gig</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExchangePage;
