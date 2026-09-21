import React, { useState } from 'react';

interface B2BPosting {
  id: string;
  partnerCompany: string;
  roleNeeded: string;
  date: string;
  rate: number;
  location: string;
}

export const SubcontractorExchangeTab: React.FC = () => {
  const [postings, setPostings] = useState<B2BPosting[]>([
    {
      id: 'B2B-101',
      partnerCompany: 'Capital Events & Audio',
      roleNeeded: 'Photo Booth Attendant & Gear',
      date: '2026-09-26',
      rate: 350,
      location: 'Austin TX',
    },
    {
      id: 'B2B-102',
      partnerCompany: 'Lone Star Bounce Co',
      roleNeeded: '24ft Water Slide Heavy Rig',
      date: '2026-09-27',
      rate: 450,
      location: 'Round Rock TX',
    },
  ]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-4xl mx-auto space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🤝</span> B2B Subcontractor & Gear Exchange
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Broadcast overflow bookings or sub-rent equipment to verified peer operators in your region.
          </p>
        </div>
        <button
          onClick={() => alert('New B2B Exchange Posting Created!')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-4 rounded-lg transition-colors"
        >
          + Post Overflow Booking
        </button>
      </div>

      <div className="space-y-3">
        {postings.map((post) => (
          <div
            key={post.id}
            className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between text-xs"
          >
            <div>
              <span className="font-bold text-white text-sm">{post.roleNeeded}</span>
              <div className="text-slate-400 mt-1 font-mono">
                {post.partnerCompany} • {post.location} • {post.date}
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-mono font-bold text-emerald-400 block">${post.rate}</span>
              <button
                onClick={() => alert(`Accepted B2B job ${post.id}!`)}
                className="mt-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
              >
                Accept B2B Job
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubcontractorExchangeTab;
