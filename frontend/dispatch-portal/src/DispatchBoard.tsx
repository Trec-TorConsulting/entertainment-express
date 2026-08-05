/**
 * Dispatch Portal - Entertainment Express
 * Real-time crew assignment, drag-drop scheduler, run sheets, analytics
 */

import React, { useState, useEffect, useRef, DragEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('jwt_token') || ''}`,
  },
});

async function callMethod(method: string, params: Record<string, any> = {}) {
  const res = await api.get(`/method/${method}`, { params });
  return res.data.message ?? res.data.data ?? res.data;
}

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

type MainTab = 'board' | 'scheduler' | 'analytics';

export const DispatchBoard: React.FC = () => {
  const { selectedDate, activeBooking, setSelectedDate, setActiveBooking } = useDispatchStore();
  const socketRef = useRef<Socket | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>('board');
  const [atRiskAlert, setAtRiskAlert] = useState<string | null>(null);

  useEffect(() => {
    socketRef.current = io('/', {
      path: '/socket.io',
      auth: { token: localStorage.getItem('jwt_token') },
    });

    socketRef.current.on('at_risk_alert', (booking: any) => {
      setAtRiskAlert(booking?.event_name || booking?.booking_id || 'Booking at risk');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const { data: dayView, isLoading, refetch } = useQuery(
    ['dispatchDay', selectedDate],
    async () => callMethod('entertainment_express.api.dispatch.get_dispatch_board', { date: selectedDate }),
    { refetchInterval: 60000 }
  );

  const bookings = Array.isArray(dayView) ? dayView : dayView?.bookings || [];
  const atRisk = bookings.filter((b: any) => b.at_risk).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dispatch Board</h1>
            <p className="text-gray-400 mt-1">
              {bookings.length} bookings • {atRisk} at-risk
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded"
            />
            <button
              onClick={() => refetch()}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-4 flex gap-2">
          {(['board', 'scheduler', 'analytics'] as MainTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`px-4 py-2 rounded capitalize ${
                mainTab === tab ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {atRiskAlert && (
          <div className="max-w-7xl mx-auto mt-3 bg-red-900/60 border border-red-500 text-red-100 px-4 py-2 rounded flex justify-between">
            <span>⚠️ At-risk: {atRiskAlert}</span>
            <button onClick={() => setAtRiskAlert(null)} className="text-sm underline">
              dismiss
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {isLoading && <div className="p-8 text-center text-gray-400">Loading dispatch board...</div>}
        {!isLoading && mainTab === 'board' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto">
              {bookings.map((booking: any) => (
                <BookingCard
                  key={booking.name}
                  booking={booking}
                  selected={activeBooking === booking.name}
                  onClick={() => setActiveBooking(booking.name)}
                />
              ))}
            </div>
            {activeBooking ? (
              <BookingDetail bookingId={activeBooking} />
            ) : (
              <div className="lg:col-span-2 bg-gray-800 rounded-lg p-8 flex items-center justify-center min-h-[280px]">
                <div className="text-center text-gray-400">Select a booking to view details</div>
              </div>
            )}
          </div>
        )}
        {!isLoading && mainTab === 'scheduler' && (
          <CrewScheduler bookings={bookings} selectedDate={selectedDate} />
        )}
        {!isLoading && mainTab === 'analytics' && <AnalyticsPanel />}
      </div>
    </div>
  );
};

const BookingCard: React.FC<{ booking: any; selected: boolean; onClick: () => void }> = ({
  booking,
  selected,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-lg border ${
      selected ? 'border-blue-500 bg-gray-700' : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
    }`}
  >
    <div className="flex justify-between gap-2">
      <div className="font-semibold truncate">{booking.event_name || booking.name}</div>
      {booking.at_risk && <span className="text-xs bg-red-600 px-2 py-0.5 rounded">AT RISK</span>}
    </div>
    <div className="text-sm text-gray-400 mt-1">
      {booking.start_time} · {booking.crew_assignments?.length || booking.crew_count || 0} crew
    </div>
  </button>
);

const BookingDetail: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [activeTab, setActiveTab] = useState<'crew' | 'runsheet' | 'messages'>('crew');
  const { data: dayView } = useQuery(['dispatchDay', useDispatchStore.getState().selectedDate], async () =>
    callMethod('entertainment_express.api.dispatch.get_dispatch_board', {
      date: useDispatchStore.getState().selectedDate,
    })
  );
  const bookings = Array.isArray(dayView) ? dayView : [];
  const booking = bookings.find((b: any) => b.name === bookingId);

  if (!booking) return <div className="lg:col-span-2 text-center py-8 text-gray-400">Booking not found</div>;

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">{booking.event_name || booking.name}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
          <div>📅 {booking.event_date}</div>
          <div>
            ⏰ {booking.start_time} - {booking.end_time}
          </div>
          <div>📍 {booking.venue_address || '—'}</div>
          <div>👥 {(booking.crew_assignments || []).length} crew</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg">
        <div className="flex border-b border-gray-700">
          {(['crew', 'runsheet', 'messages'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 font-medium capitalize ${
                activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === 'crew' && <CrewAssignmentPanel booking={booking} />}
          {activeTab === 'runsheet' && <RunSheetPanel bookingId={bookingId} />}
          {activeTab === 'messages' && <MessagesPanel bookingId={bookingId} />}
        </div>
      </div>
    </div>
  );
};

const CrewAssignmentPanel: React.FC<{ booking: any }> = ({ booking }) => {
  const assignments = booking.crew_assignments || [];
  return (
    <div className="space-y-2">
      {assignments.length === 0 && <p className="text-gray-400 text-sm">No crew assigned yet. Use the Scheduler tab to drag crew onto this booking.</p>}
      {assignments.map((assign: any) => (
        <div key={assign.name} className="flex justify-between bg-gray-700 rounded p-3">
          <div>
            <div className="font-medium">{assign.crew_member}</div>
            <div className="text-sm text-gray-400">{assign.role}</div>
          </div>
          <span className="text-xs uppercase tracking-wide text-blue-300">{assign.status}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Drag-drop crew scheduler: drag available crew onto booking drop zones.
 */
const CrewScheduler: React.FC<{ bookings: any[]; selectedDate: string }> = ({ bookings, selectedDate }) => {
  const queryClient = useQueryClient();
  const [dragOverBooking, setDragOverBooking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');

  const { data: availableCrew = [], isLoading } = useQuery(
    ['availableCrew', selectedDate, roleFilter],
    async () =>
      callMethod('entertainment_express.api.dispatch.list_available_crew', {
        event_date: selectedDate,
        role_name: roleFilter || undefined,
      })
  );

  const assignMutation = useMutation(
    async (payload: { booking: string; employee: string; role: string; pay_rate: number; pay_basis: string }) =>
      callMethod('entertainment_express.api.dispatch.assign_crew', {
        booking_name: payload.booking,
        employee_name: payload.employee,
        role_name: payload.role,
        pay_rate: payload.pay_rate,
        pay_basis: payload.pay_basis,
      }),
    {
      onSuccess: () => {
        setError(null);
        queryClient.invalidateQueries(['dispatchDay']);
        queryClient.invalidateQueries(['availableCrew']);
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || err?.message || 'Assignment failed (possible conflict)');
      },
    }
  );

  const onDragStart = (e: DragEvent, crew: any) => {
    e.dataTransfer.setData(
      'application/ee-crew',
      JSON.stringify({
        employee: crew.employee,
        employee_name: crew.employee_name,
        role: (crew.roles && crew.roles[0]) || 'DJ',
        pay_rate: crew.pay_rate || 0,
        pay_basis: crew.pay_basis || 'per_event',
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDrop = (e: DragEvent, bookingName: string) => {
    e.preventDefault();
    setDragOverBooking(null);
    try {
      const raw = e.dataTransfer.getData('application/ee-crew');
      if (!raw) return;
      const crew = JSON.parse(raw);
      assignMutation.mutate({
        booking: bookingName,
        employee: crew.employee,
        role: crew.role,
        pay_rate: crew.pay_rate,
        pay_basis: crew.pay_basis,
      });
    } catch (err: any) {
      setError(err?.message || 'Invalid drop payload');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="bg-gray-800 rounded-lg p-4 lg:col-span-1">
        <h2 className="font-bold mb-3">Available Crew</h2>
        <input
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          placeholder="Filter role (e.g. DJ)"
          className="w-full mb-3 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
        />
        {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {(availableCrew as any[]).map((crew) => (
            <div
              key={crew.employee}
              draggable
              onDragStart={(e) => onDragStart(e, crew)}
              className="cursor-grab active:cursor-grabbing bg-gray-700 hover:bg-gray-600 rounded p-3"
            >
              <div className="font-medium">{crew.employee_name}</div>
              <div className="text-xs text-gray-400">{(crew.roles || []).join(', ') || 'No roles'}</div>
            </div>
          ))}
          {!isLoading && (availableCrew as any[]).length === 0 && (
            <p className="text-gray-500 text-sm">No available crew for this date.</p>
          )}
        </div>
      </div>

      <div className="lg:col-span-3 space-y-3">
        <p className="text-sm text-gray-400">Drag a crew member onto a booking slot to assign and send an offer.</p>
        {error && <div className="bg-red-900/50 border border-red-500 text-red-100 px-3 py-2 rounded text-sm">{error}</div>}
        {bookings.map((booking: any) => (
          <div
            key={booking.name}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverBooking(booking.name);
            }}
            onDragLeave={() => setDragOverBooking(null)}
            onDrop={(e) => onDrop(e, booking.name)}
            className={`rounded-lg border p-4 transition ${
              dragOverBooking === booking.name
                ? 'border-blue-400 bg-blue-950/40'
                : 'border-gray-700 bg-gray-800'
            }`}
          >
            <div className="flex justify-between gap-2 mb-2">
              <div>
                <div className="font-semibold">{booking.event_name || booking.name}</div>
                <div className="text-sm text-gray-400">
                  {booking.start_time} – {booking.end_time} · {booking.venue_address || 'TBD'}
                </div>
              </div>
              {booking.at_risk && <span className="text-xs bg-red-600 px-2 py-1 rounded h-fit">AT RISK</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {(booking.crew_assignments || []).map((a: any) => (
                <span key={a.name} className="text-xs bg-gray-700 px-2 py-1 rounded">
                  {a.crew_member} · {a.status}
                </span>
              ))}
              {(booking.crew_assignments || []).length === 0 && (
                <span className="text-xs text-gray-500">Drop crew here</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RunSheetPanel: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const generateMutation = useMutation(async () =>
    callMethod('entertainment_express.api.dispatch.generate_run_sheet', { booking_name: bookingId })
  );
  const publishMutation = useMutation(async () =>
    callMethod('entertainment_express.api.dispatch.publish_run_sheet', { booking_name: bookingId })
  );
  const { data: runsheet, refetch } = useQuery(['runsheet', bookingId], async () =>
    callMethod('entertainment_express.api.dispatch.get_run_sheet', { booking_name: bookingId })
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
              <div key={item.name || idx} className="flex items-center p-2 bg-gray-700 rounded">
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
          {runsheet.published === 1 && <p className="text-green-400 text-sm">Published to assigned crew</p>}
        </div>
      )}
    </div>
  );
};

const MessagesPanel: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [message, setMessage] = useState('');
  return (
    <div className="space-y-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={`Message crew for ${bookingId}…`}
        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-3 h-24"
      />
      <button
        disabled={!message.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-600"
        onClick={() => setMessage('')}
      >
        Send Message
      </button>
    </div>
  );
};

const AnalyticsPanel: React.FC = () => {
  const { data, isLoading } = useQuery(['dispatchAnalytics'], async () =>
    callMethod('entertainment_express.api.dispatch.get_dispatch_analytics', { days: 30 })
  );

  const exportCsv = () => {
    if (!data?.crew) return;
    const rows = [
      ['employee', 'accepted', 'completed', 'declined'],
      ...data.crew.map((c: any) => [c.employee_name || c.crew_member, c.accepted, c.completed, c.declined]),
    ];
    const csv = rows.map((r: any[]) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispatch-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="text-gray-400 p-8 text-center">Loading analytics…</div>;
  if (!data) return <div className="text-gray-400 p-8 text-center">No analytics data</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Last {data.window_days} days</h2>
        <button onClick={exportCsv} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
          Export CSV
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Utilization" value={`${data.utilization_pct}%`} />
        <Stat label="Accept rate" value={`${data.accept_rate_pct}%`} />
        <Stat label="Reliability" value={`${data.reliability_pct}%`} />
        <Stat label="Repeat customers" value={String(data.repeat_booking_customers)} />
      </div>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-left">
            <tr>
              <th className="p-3">Crew</th>
              <th className="p-3">Accepted</th>
              <th className="p-3">Completed</th>
              <th className="p-3">Declined</th>
            </tr>
          </thead>
          <tbody>
            {(data.crew || []).map((c: any) => (
              <tr key={c.crew_member} className="border-t border-gray-700">
                <td className="p-3">{c.employee_name || c.crew_member}</td>
                <td className="p-3">{c.accepted}</td>
                <td className="p-3">{c.completed}</td>
                <td className="p-3">{c.declined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-gray-800 rounded-lg p-4">
    <div className="text-gray-400 text-xs uppercase tracking-wide">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </div>
);

export default DispatchBoard;
