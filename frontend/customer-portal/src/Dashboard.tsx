/**
 * Customer Portal - Entertainment Express
 * Booking management, contract signing, crew tracking, messaging
 * 
 * Tech: React 18 + TypeScript + Tailwind CSS + React Query + Zustand
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { create } from 'zustand';
import axios from 'axios';
import { AppShell, DataTable, EmptyState } from '../../portal-kit/src';
import '../../portal-kit/src/tokens.css';

// ── API Client ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v2',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
  },
});

// ── Store (Zustand) ───────────────────────────────────────────────────────

interface AuthState {
  token: string | null;
  customer: any | null;
  setAuth: (token: string, customer: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('jwt_token'),
  customer: localStorage.getItem('customer') ? JSON.parse(localStorage.getItem('customer')!) : null,
  setAuth: (token, customer) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('customer', JSON.stringify(customer));
    set({ token, customer });
  },
  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('customer');
    set({ token: null, customer: null });
  },
}));

// ── Components ────────────────────────────────────────────────────────────

/**
 * Dashboard - Main customer view
 */
export const Dashboard: React.FC = () => {
  const { customer } = useAuthStore();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const { data: bookings, isLoading, error } = useQuery(
    ['bookings', selectedFilter],
    async () => {
      const params = selectedFilter !== 'all' ? { status: selectedFilter } : {};
      const res = await api.get('/customer/bookings', { params });
      return res.data;
    },
    { staleTime: 60000 }
  );

  if (isLoading) return <AppShell title="Client Portal"><EmptyState title="Loading" message="Loading bookings..." /></AppShell>;
  if (error) return <AppShell title="Client Portal"><EmptyState title="Error" message="Error loading bookings" /></AppShell>;

  return (
    <AppShell title="Client Portal">
      <div className="max-w-6xl mx-auto px-4" style={{ display: 'grid', gap: '1rem' }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome, {customer?.name || 'Customer'}
          </h1>
          <p className="mt-2 text-gray-600">Manage your entertainment events</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Upcoming Events" value="3" />
          <StatCard label="Total Bookings" value="12" />
          <StatCard label="Crew Assigned" value="18" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {['all', 'draft', 'confirmed', 'completed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 font-medium capitalize ${
                selectedFilter === filter
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {bookings?.data?.length ? (
          <DataTable
            id="client-bookings"
            columns={[
              { key: 'name', label: 'Booking' },
              { key: 'status', label: 'Status' },
              { key: 'event_date', label: 'Date' },
              { key: 'venue_address', label: 'Venue' },
            ]}
            rows={bookings.data}
          />
        ) : (
          <EmptyState title="No Bookings Yet" message="Your upcoming events will appear here." />
        )}
      </div>
    </AppShell>
  );
};

/**
 * BookingDetail - Full booking lifecycle view
 */
export const BookingDetail: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const { data: booking, isLoading } = useQuery(
    ['booking', bookingId],
    async () => {
      const res = await api.get(`/customer/booking/${bookingId}`);
      return res.data.data;
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (!booking) return <div>Booking not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Timeline */}
        <BookingTimeline booking={booking} />

        {/* Crew Tracking */}
        <CrewTrackingMap bookingId={bookingId} />

        {/* Contract Section */}
        <ContractSection bookingId={bookingId} />

        {/* Payment Section */}
        <PaymentSection booking={booking} />

        {/* Messaging */}
        <MessagingSection bookingId={bookingId} />
      </div>
    </div>
  );
};

/**
 * BookingTimeline - Show quote → contract → payment → crew → completion
 */
const BookingTimeline: React.FC<{ booking: any }> = ({ booking }) => {
  const steps = [
    { label: 'Quote', status: 'completed' },
    { label: 'Contract', status: booking.status === 'draft' ? 'pending' : 'completed' },
    { label: 'Payment', status: booking.status === 'confirmed' ? 'completed' : 'pending' },
    { label: 'Crew Assigned', status: booking.status === 'confirmed' ? 'completed' : 'pending' },
    { label: 'Event', status: booking.status === 'completed' ? 'completed' : 'pending' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Booking Timeline</h2>
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <TimelineStep
            key={step.label}
            label={step.label}
            status={step.status}
            isLast={idx === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * CrewTrackingMap - Show real-time crew locations
 */
const CrewTrackingMap: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const { data: crewStatus, isLoading } = useQuery(
    ['crewStatus', bookingId],
    async () => {
      const res = await api.get(`/customer/booking/${bookingId}/crew-status`);
      return res.data.data.crew;
    },
    { refetchInterval: 30000 } // Update every 30s
  );

  if (isLoading) return <div>Loading crew locations...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Crew Tracking</h2>
      <div className="bg-gray-100 rounded h-64 flex items-center justify-center">
        {/* Mapbox or Google Maps would go here */}
        <div className="text-center">
          <div className="text-2xl mb-2">📍</div>
          <div className="text-gray-600">
            {crewStatus?.filter((c: { latitude?: number }) => c.latitude)?.length || 0} crew checked in
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {crewStatus?.map((crew: any) => (
          <CrewStatusItem key={crew.crew_member} crew={crew} />
        ))}
      </div>
    </div>
  );
};

/**
 * ContractSection - Sign contract
 */
const ContractSection: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [showSigning, setShowSigning] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Contract</h2>
      {showSigning ? (
        <ContractSigningModal bookingId={bookingId} onClose={() => setShowSigning(false)} />
      ) : (
        <button
          onClick={() => setShowSigning(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Review & Sign Contract
        </button>
      )}
    </div>
  );
};

/**
 * PaymentSection - Show deposit payment link
 */
const PaymentSection: React.FC<{ booking: any }> = ({ booking }) => {
  const depositDue = booking.total * 0.25; // 25% deposit

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Payment</h2>
      <div className="bg-blue-50 p-4 rounded mb-4">
        <div className="text-sm text-gray-600">Deposit Due</div>
        <div className="text-3xl font-bold text-blue-600">${depositDue.toFixed(2)}</div>
      </div>
      <button className="w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-medium">
        Pay Deposit Now
      </button>
    </div>
  );
};

/**
 * MessagingSection - Send notes to coordinator
 */
const MessagingSection: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [message, setMessage] = useState('');
  const sendMutation = useMutation(async () => {
    await api.post(`/customer/booking/${bookingId}/message`, { message });
    setMessage('');
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Message Coordinator</h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Any questions or special requests?"
        className="w-full border rounded p-3 mb-3 h-24"
      />
      <button
        onClick={() => sendMutation.mutate()}
        disabled={!message.trim()}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        Send
      </button>
    </div>
  );
};

// ── Utility Components ────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="text-gray-600 text-sm">{label}</div>
    <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
  </div>
);

const BookingCard: React.FC<{ booking: any }> = ({ booking }) => (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-lg font-bold text-gray-900">{booking.event_name}</h3>
      <span className={`px-3 py-1 rounded text-xs font-medium ${
        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {booking.status}
      </span>
    </div>
    <div className="text-gray-600 text-sm mb-2">
      📅 {booking.event_date} at {booking.start_time}
    </div>
    <div className="text-gray-900 font-semibold">${booking.grand_total}</div>
  </div>
);

const TimelineStep: React.FC<{ label: string; status: string; isLast: boolean }> = ({
  label,
  status,
  isLast,
}) => (
  <div className="flex">
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
        status === 'completed' ? 'bg-green-600' :
        status === 'pending' ? 'bg-gray-400' :
        'bg-blue-600'
      }`}>
        {status === 'completed' ? '✓' : '○'}
      </div>
      {!isLast && <div className="w-1 h-12 bg-gray-300 mt-1" />}
    </div>
    <div className="ml-4 mb-4">
      <div className="font-medium text-gray-900">{label}</div>
    </div>
  </div>
);

const CrewStatusItem: React.FC<{ crew: any }> = ({ crew }) => (
  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
    <div>
      <div className="font-medium text-gray-900">{crew.crew_member}</div>
      <div className="text-sm text-gray-600">{crew.role}</div>
    </div>
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      crew.status === 'checked_in' ? 'bg-green-100 text-green-800' :
      crew.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
      'bg-gray-100 text-gray-800'
    }`}>
      {crew.status}
    </span>
  </div>
);

const ContractSigningModal: React.FC<{ bookingId: string; onClose: () => void }> = ({
  bookingId,
  onClose,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
      <h2 className="text-2xl font-bold mb-6">Sign Your Contract</h2>
      <div className="bg-gray-50 p-6 rounded mb-6 h-96 overflow-y-auto">
        {/* Contract HTML would be rendered here */}
        <div className="text-gray-600">Contract content...</div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onClose}
          className="flex-1 border rounded px-4 py-2 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button className="flex-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
          I Agree & Sign
        </button>
      </div>
    </div>
  </div>
);

// ── Export ────────────────────────────────────────────────────────────────

export default Dashboard;
