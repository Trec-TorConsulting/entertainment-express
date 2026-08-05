/**
 * Dispatch Portal - Entertainment Express
 * Real-time crew assignment, dispatch board, run sheet management
 * 
 * Tech: React 18 + TypeScript + Tailwind CSS + Socket.IO + Mapbox
 */

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { create } from 'zustand';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';

// ── API Client ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api/v2',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
  },
});

// ── Store (Zustand) ───────────────────────────────────────────────────────

interface DispatchState {
  selectedDate: string;
  activeBooking: string | null;
  crewLocations: Record<string, { lat: number; lng: number; timestamp: string }>;
  setSelectedDate: (date: string) => void;
  setActiveBooking: (id: string | null) => void;
  updateCrewLocation: (crewId: string, lat: number, lng: number) => void;
}

export const useDispatchStore = create<DispatchState>((set) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  activeBooking: null,
  crewLocations: {},
  setSelectedDate: (date) => set({ selectedDate: date }),
  setActiveBooking: (id) => set({ activeBooking: id }),
  updateCrewLocation: (crewId, lat, lng) =>
    set((state) => ({
      crewLocations: {
        ...state.crewLocations,
        [crewId]: { lat, lng, timestamp: new Date().toISOString() },
      },
    })),
}));

// ── Components ────────────────────────────────────────────────────────────

/**
 * DispatchBoard - Main dispatcher dashboard with real-time updates
 */
export const DispatchBoard: React.FC = () => {
  const { selectedDate, activeBooking, setSelectedDate, setActiveBooking } = useDispatchStore();
  const socketRef = useRef<Socket | null>(null);
  const [atRiskCount, setAtRiskCount] = useState(0);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    socketRef.current = io('/dispatch', {
      auth: { token: localStorage.getItem('jwt_token') },
    });

    socketRef.current.on('crew_location_update', (data) => {
      // Update crew location in store
    });

    socketRef.current.on('at_risk_alert', (booking) => {
      // Show alert for at-risk booking
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const { data: dayView, isLoading } = useQuery(
    ['dispatchDay', selectedDate],
    async () => {
      const res = await api.get('/dispatch/day-view', { params: { event_date: selectedDate } });
      return res.data.data;
    },
    { refetchInterval: 60000 } // Update every minute
  );

  if (isLoading) return <div className="p-8 text-center">Loading dispatch board...</div>;

  const bookings = dayView?.bookings || [];
  const atRisk = bookings.filter((b: any) => b.at_risk).length;
  setAtRiskCount(atRisk);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dispatch Board</h1>
            <p className="text-gray-400 mt-1">
              {bookings.length} bookings • {atRisk} at-risk
            </p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bookings List */}
        <div className="lg:col-span-1 space-y-3 max-h-96 overflow-y-auto">
          {bookings.map((booking: any) => (
            <BookingCard
              key={booking.name}
              booking={booking}
              selected={activeBooking === booking.name}
              onClick={() => setActiveBooking(booking.name)}
            />
          ))}
        </div>

        {/* Main View */}
        {activeBooking ? (
          <BookingDetail bookingId={activeBooking} />
        ) : (
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-8 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <div>Select a booking to view details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * BookingDetail - Show crew assignments, run sheets, messaging
 */
const BookingDetail: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [activeTab, setActiveTab] = useState<'crew' | 'runsheet' | 'messages'>('crew');

  const { data: booking, isLoading } = useQuery(
    ['booking', bookingId],
    async () => {
      const res = await api.get(`/dispatch/booking/${bookingId}`);
      return res.data.data;
    }
  );

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (!booking) return <div className="text-center py-8">Booking not found</div>;

  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Info Card */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">{booking.event_name}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
          <div>📅 {booking.date}</div>
          <div>⏰ {booking.start_time} - {booking.end_time}</div>
          <div>📍 {booking.venue}</div>
          <div>👥 {booking.crew_count} crew</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg">
        <div className="flex border-b border-gray-700">
          {(['crew', 'runsheet', 'messages'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'crew' && <CrewAssignmentPanel bookingId={bookingId} />}
          {activeTab === 'runsheet' && <RunSheetPanel bookingId={bookingId} />}
          {activeTab === 'messages' && <MessagesPanel bookingId={bookingId} />}
        </div>
      </div>
    </div>
  );
};

/**
 * CrewAssignmentPanel - Assign crew, view status
 */
const CrewAssignmentPanel: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [showAssignForm, setShowAssignForm] = useState(false);

  const { data: assignments = [] } = useQuery(
    ['crewAssignments', bookingId],
    async () => {
      const res = await api.get(`/dispatch/crew-assignments?booking=${bookingId}`);
      return res.data.data || [];
    }
  );

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAssignForm(!showAssignForm)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        + Assign Crew
      </button>

      {showAssignForm && (
        <AssignCrewForm bookingId={bookingId} onClose={() => setShowAssignForm(false)} />
      )}

      <div className="space-y-2">
        {assignments.map((assign: any) => (
          <CrewAssignmentRow key={assign.name} assignment={assign} />
        ))}
      </div>
    </div>
  );
};

/**
 * RunSheetPanel - Generate, publish, track completion
 */
const RunSheetPanel: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const generateMutation = useMutation(async () => {
    await api.post('/method/entertainment_express.api.dispatch.generate_run_sheet', null, {
      params: { booking_name: bookingId },
    });
  });

  const publishMutation = useMutation(async () => {
    await api.post('/method/entertainment_express.api.dispatch.publish_run_sheet', null, {
      params: { booking_name: bookingId },
    });
  });

  const { data: runsheet, refetch } = useQuery(
    ['runsheet', bookingId],
    async () => {
      const res = await api.get('/method/entertainment_express.api.dispatch.get_run_sheet', {
        params: { booking_name: bookingId },
      });
      return res.data.message || res.data.data || res.data;
    }
  );

  const checklist = runsheet?.checklist_items || runsheet?.checklist || [];
  const doneCount = checklist.filter((i: any) => i.done || i.status === 'completed').length;
  const completion = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {!runsheet ? (
        <button
          onClick={async () => {
            await generateMutation.mutateAsync();
            await refetch();
          }}
          disabled={generateMutation.isPending}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-600"
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate Run Sheet'}
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Equipment Checklist</h3>
            <span className="text-sm text-gray-300">{completion}% complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded h-2 mb-4">
            <div className="bg-green-500 h-2 rounded" style={{ width: `${completion}%` }} />
          </div>
          <div className="space-y-2 mb-4">
            {checklist.map((item: any, idx: number) => (
              <div
                key={item.name || idx}
                className="flex items-center p-2 bg-gray-700 rounded"
              >
                <input
                  type="checkbox"
                  checked={Boolean(item.done) || item.status === 'completed'}
                  readOnly
                  className="mr-3"
                />
                <span className="text-gray-300">{item.description || item.item || item.asset_name}</span>
              </div>
            ))}
          </div>
          {!runsheet.published && (
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-600"
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish to Crew'}
            </button>
          )}
          {runsheet.published === 1 && (
            <p className="text-green-400 text-sm">Published to assigned crew</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * MessagesPanel - Dispatcher messaging
 */
const MessagesPanel: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [message, setMessage] = useState('');
  const sendMutation = useMutation(async () => {
    await api.post(`/dispatch/message`, { booking_id: bookingId, message });
    setMessage('');
  });

  return (
    <div className="space-y-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Send message to crew..."
        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-3 h-24"
      />
      <button
        onClick={() => sendMutation.mutate()}
        disabled={!message.trim() || sendMutation.isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-600"
      >
        Send Message
      </button>
    </div>
  );
};

// ── Utility Components ────────────────────────────────────────────────────

interface BookingCardProps {
  booking: any;
  selected: boolean;
  onClick: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, selected, onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-lg p-3 cursor-pointer transition ${
      selected
        ? 'bg-blue-600 border-2 border-blue-400'
        : 'bg-gray-800 border border-gray-700 hover:bg-gray-750'
    }`}
  >
    <div className="font-medium text-sm truncate">{booking.event_name}</div>
    <div className="text-xs text-gray-400 mt-1">{booking.start_time}</div>
    <div className="flex justify-between items-center mt-2">
      <span className="text-xs">👥 {booking.crew_count}</span>
      {booking.at_risk && (
        <span className="text-xs bg-red-600 px-2 py-1 rounded">At Risk</span>
      )}
    </div>
  </div>
);

const CrewAssignmentRow: React.FC<{ assignment: any }> = ({ assignment }) => (
  <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
    <div>
      <div className="font-medium">{assignment.crew_member}</div>
      <div className="text-sm text-gray-400">{assignment.role}</div>
    </div>
    <span
      className={`px-3 py-1 rounded text-xs font-medium ${
        assignment.status === 'accepted'
          ? 'bg-green-600'
          : assignment.status === 'offered'
          ? 'bg-yellow-600'
          : 'bg-gray-600'
      }`}
    >
      {assignment.status}
    </span>
  </div>
);

const AssignCrewForm: React.FC<{ bookingId: string; onClose: () => void }> = ({
  bookingId,
  onClose,
}) => {
  const [selectedCrew, setSelectedCrew] = useState('');
  const [role, setRole] = useState('');

  const assignMutation = useMutation(async () => {
    await api.post(`/dispatch/assign-crew`, {
      booking: bookingId,
      employee: selectedCrew,
      role,
    });
    onClose();
  });

  return (
    <div className="bg-gray-700 p-4 rounded space-y-3">
      <select
        value={selectedCrew}
        onChange={(e) => setSelectedCrew(e.target.value)}
        className="w-full bg-gray-600 border border-gray-500 text-white rounded px-3 py-2"
      >
        <option value="">Select crew...</option>
        <option value="crew1">Crew Member 1</option>
        <option value="crew2">Crew Member 2</option>
      </select>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full bg-gray-600 border border-gray-500 text-white rounded px-3 py-2"
      >
        <option value="">Select role...</option>
        <option value="DJ">DJ</option>
        <option value="MC">MC</option>
        <option value="Dancer">Dancer</option>
      </select>
      <div className="flex gap-2">
        <button
          onClick={() => {
            assignMutation.mutate();
          }}
          disabled={!selectedCrew || !role || assignMutation.isPending}
          className="flex-1 bg-green-600 text-white rounded px-3 py-2 hover:bg-green-700 disabled:bg-gray-600"
        >
          Assign
        </button>
        <button
          onClick={onClose}
          className="flex-1 border border-gray-500 rounded px-3 py-2 hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DispatchBoard;
