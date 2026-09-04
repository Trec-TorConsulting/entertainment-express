import React, { useState, useEffect, useRef, DragEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AppShell, Card, CardHeader, CardTitle, CardContent, Badge, Button,
  Tabs, StatGrid, MetricCard, EmptyState, Skeleton
} from '../../portal-kit/src';
import { Calendar, Search, MapPin, AlertTriangle, Users, ClipboardList, MessageSquare, Download, CheckCircle2, Navigation } from 'lucide-react';
import '../../portal-kit/src/tokens.css';

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

export const DispatchBoard: React.FC = () => {
  const { selectedDate, activeBooking, setSelectedDate, setActiveBooking } = useDispatchStore();
  const socketRef = useRef<Socket | null>(null);
  const [mainTab, setMainTab] = useState<string>('board');
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
    <AppShell title="Dispatch Operations" portal="dispatch" density="ops">
      {/* Ops Header */}
      <div className="bg-[var(--ee-surface-raised)] border-b border-[var(--ee-border)] px-4 py-3 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[var(--ee-text)] tracking-tight">Dispatch Board</h1>
          <div className="flex items-center gap-2 border-l border-[var(--ee-border)] pl-4">
            <Badge variant="default" className="text-xs bg-[var(--ee-surface-inset)]">{bookings.length} Bookings</Badge>
            {atRisk > 0 && <Badge variant="warning" dot className="text-xs">{atRisk} At Risk</Badge>}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] rounded-md px-2 py-1">
            <Calendar className="w-4 h-4 text-[var(--ee-muted)] mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-[var(--ee-text)] text-sm outline-none focus:ring-0 p-0 border-none w-32"
            />
          </div>
          <Button variant="secondary" density="ops" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {atRiskAlert && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-950/40 border-b border-red-500/50 px-4 py-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical: {atRiskAlert} needs immediate attention</span>
            </div>
            <button onClick={() => setAtRiskAlert(null)} className="text-red-400 hover:text-red-300 text-xs underline">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 h-[calc(100vh-100px)] flex flex-col gap-4">
        <Tabs 
          value={mainTab} 
          onValueChange={setMainTab} 
          className="w-full"
          listClassName="bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] px-4"
          tabs={[
            { id: 'board', label: 'Live Board', content: null },
            { id: 'scheduler', label: 'Scheduler', content: null },
            { id: 'analytics', label: 'Analytics', content: null }
          ]}
        />

        <div className="flex-1 overflow-hidden">
          {isLoading && <div className="p-8 text-center"><Skeleton height="300px" /></div>}
          
          {!isLoading && mainTab === 'board' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
              {/* Sidebar List */}
              <div className="lg:col-span-3 bg-[var(--ee-surface-raised)] rounded-xl border border-[var(--ee-border)] flex flex-col overflow-hidden h-full">
                <div className="p-3 border-b border-[var(--ee-border)] flex items-center bg-[var(--ee-surface-base)]">
                  <Search className="w-4 h-4 text-[var(--ee-muted)] mr-2" />
                  <input placeholder="Filter bookings..." className="bg-transparent text-sm text-[var(--ee-text)] outline-none w-full" />
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                  {bookings.map((booking: any) => (
                    <BookingListItem
                      key={booking.name}
                      booking={booking}
                      selected={activeBooking === booking.name}
                      onClick={() => setActiveBooking(booking.name)}
                    />
                  ))}
                  {bookings.length === 0 && (
                    <div className="p-4 text-center text-[var(--ee-muted)] text-sm">No bookings for {selectedDate}</div>
                  )}
                </div>
              </div>

              {/* Detail Pane */}
              <div className="lg:col-span-9 h-full bg-[var(--ee-surface-raised)] rounded-xl border border-[var(--ee-border)] overflow-hidden">
                {activeBooking ? (
                  <BookingDetail bookingId={activeBooking} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-50">
                    <Navigation className="w-12 h-12 text-[var(--ee-muted)] mb-4" />
                    <p className="text-[var(--ee-text)] font-medium">Select a booking to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoading && mainTab === 'scheduler' && <CrewScheduler bookings={bookings} selectedDate={selectedDate} />}
          {!isLoading && mainTab === 'analytics' && <AnalyticsPanel />}
        </div>
      </div>
    </AppShell>
  );
};

const BookingListItem: React.FC<{ booking: any; selected: boolean; onClick: () => void }> = ({ booking, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-3 rounded-lg border transition-all ${
      selected 
        ? 'border-[var(--ee-brand)] bg-[var(--ee-brand-soft)]/10 shadow-sm' 
        : 'border-transparent hover:bg-[var(--ee-surface-inset)] hover:border-[var(--ee-border)]'
    }`}
  >
    <div className="flex justify-between items-start gap-2 mb-1">
      <div className={`font-semibold text-sm line-clamp-1 ${selected ? 'text-[var(--ee-brand-text)]' : 'text-[var(--ee-text)]'}`}>
        {booking.event_name || booking.name}
      </div>
      {booking.at_risk && <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />}
    </div>
    <div className="text-xs text-[var(--ee-muted)] flex items-center justify-between">
      <span>{booking.start_time || 'TBD'}</span>
      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {booking.crew_assignments?.length || 0}</span>
    </div>
  </button>
);

const BookingDetail: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [activeTab, setActiveTab] = useState<string>('crew');
  const { data: dayView } = useQuery(['dispatchDay', useDispatchStore.getState().selectedDate], async () =>
    callMethod('entertainment_express.api.dispatch.get_dispatch_board', { date: useDispatchStore.getState().selectedDate })
  );
  
  const bookings = Array.isArray(dayView) ? dayView : dayView?.bookings || [];
  const booking = bookings.find((b: any) => b.name === bookingId);

  if (!booking) return <div className="h-full flex items-center justify-center text-[var(--ee-muted)]">Booking not found</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-[var(--ee-border)] bg-[var(--ee-surface-base)]">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-2xl font-bold text-[var(--ee-text)]">{booking.event_name || booking.name}</h2>
          {booking.at_risk && <Badge variant="warning">At Risk</Badge>}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--ee-muted)]">
          <span className="flex items-center gap-1.5 bg-[var(--ee-surface-inset)] px-2 py-1 rounded-md"><Calendar className="w-4 h-4" /> {booking.event_date}</span>
          <span className="flex items-center gap-1.5 bg-[var(--ee-surface-inset)] px-2 py-1 rounded-md"><Clock className="w-4 h-4" /> {booking.start_time} - {booking.end_time || 'TBD'}</span>
          <span className="flex items-center gap-1.5 bg-[var(--ee-surface-inset)] px-2 py-1 rounded-md max-w-xs truncate"><MapPin className="w-4 h-4 shrink-0" /> {booking.venue_address || 'No venue'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--ee-surface-raised)]">
        <div className="px-5 pt-3 border-b border-[var(--ee-border)]">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            listClassName="bg-transparent border-none gap-0 px-2"
            tabs={[
              { id: 'crew', label: 'Crew & Tracking', content: null },
              { id: 'runsheet', label: 'Run Sheet', content: null },
              { id: 'messages', label: 'Messages', content: null }
            ]}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'crew' && <CrewAssignmentPanel booking={booking} />}
              {activeTab === 'runsheet' && <RunSheetPanel bookingId={bookingId} />}
              {activeTab === 'messages' && <MessagesPanel bookingId={bookingId} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const CrewAssignmentPanel: React.FC<{ booking: any }> = ({ booking }) => {
  const assignments = booking.crew_assignments || [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-[var(--ee-text)]">Assigned Personnel</h3>
        <span className="text-sm text-[var(--ee-muted)]">{assignments.length} total</span>
      </div>
      
      {assignments.length === 0 ? (
        <div className="border border-dashed border-[var(--ee-border)] rounded-xl p-8 flex flex-col items-center text-center">
          <Users className="w-8 h-8 text-[var(--ee-muted)] mb-2" />
          <p className="text-[var(--ee-text)] font-medium">No crew assigned</p>
          <p className="text-[var(--ee-muted)] text-sm">Use the Scheduler tab to assign staff.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assignments.map((assign: any) => (
            <Card key={assign.name} className="p-3 bg-[var(--ee-surface-base)] flex items-center justify-between border-[var(--ee-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--ee-brand-soft)] text-[var(--ee-brand-text)] flex items-center justify-center font-bold text-xs">
                  {assign.crew_member?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-medium text-[var(--ee-text)] text-sm">{assign.crew_member}</div>
                  <div className="text-xs text-[var(--ee-muted)]">{assign.role}</div>
                </div>
              </div>
              <Badge variant={assign.status === 'Accepted' || assign.status === 'Checked In' ? 'success' : assign.status === 'Pending' ? 'warning' : 'default'} size="sm">
                {assign.status}
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const CrewScheduler: React.FC<{ bookings: any[]; selectedDate: string }> = ({ bookings, selectedDate }) => {
  const queryClient = useQueryClient();
  const [dragOverBooking, setDragOverBooking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');

  const { data: availableCrew = [], isLoading } = useQuery(
    ['availableCrew', selectedDate, roleFilter],
    async () => callMethod('entertainment_express.api.dispatch.list_available_crew', { event_date: selectedDate, role_name: roleFilter || undefined })
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
      onError: (err: any) => setError(err?.response?.data?.message || err?.message || 'Assignment failed (possible conflict)'),
    }
  );

  const onDragStart = (e: DragEvent, crew: any) => {
    e.dataTransfer.setData('application/ee-crew', JSON.stringify({
      employee: crew.employee, employee_name: crew.employee_name,
      role: (crew.roles && crew.roles[0]) || 'DJ', pay_rate: crew.pay_rate || 0, pay_basis: crew.pay_basis || 'per_event',
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDrop = (e: DragEvent, bookingName: string) => {
    e.preventDefault();
    setDragOverBooking(null);
    try {
      const raw = e.dataTransfer.getData('application/ee-crew');
      if (!raw) return;
      const crew = JSON.parse(raw);
      assignMutation.mutate({ booking: bookingName, ...crew });
    } catch (err: any) { setError('Invalid drop payload'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
      <div className="bg-[var(--ee-surface-raised)] rounded-xl border border-[var(--ee-border)] p-4 lg:col-span-1 flex flex-col h-full">
        <h2 className="font-bold text-[var(--ee-text)] mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-[var(--ee-brand)]"/> Available Roster</h2>
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ee-muted)]" />
          <input
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            placeholder="Filter by role..."
            className="w-full bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] text-[var(--ee-text)] text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:border-[var(--ee-brand)]"
          />
        </div>
        {isLoading && <Skeleton height="200px" />}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {(availableCrew as any[]).map((crew) => (
            <motion.div
              layout
              key={crew.employee}
              draggable
              onDragStart={(e) => onDragStart(e as any, crew)}
              className="cursor-grab active:cursor-grabbing bg-[var(--ee-surface-base)] border border-[var(--ee-border)] hover:border-[var(--ee-brand)] hover:shadow-ee-sm rounded-lg p-3 transition-colors"
            >
              <div className="font-medium text-sm text-[var(--ee-text)]">{crew.employee_name}</div>
              <div className="text-xs text-[var(--ee-muted)] mt-1 flex gap-1 flex-wrap">
                {(crew.roles || []).map((r: string) => <span key={r} className="bg-[var(--ee-surface-raised)] px-1.5 py-0.5 rounded">{r}</span>)}
              </div>
            </motion.div>
          ))}
          {!isLoading && (availableCrew as any[]).length === 0 && (
            <div className="text-center py-8 text-[var(--ee-muted)] text-sm">No available crew found.</div>
          )}
        </div>
      </div>

      <div className="lg:col-span-3 space-y-3 overflow-y-auto h-full pr-2">
        <div className="bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] rounded-lg p-3 flex items-center gap-3 text-sm text-[var(--ee-text)]">
          <AlertTriangle className="w-4 h-4 text-[var(--ee-brand)]" />
          Drag a crew member from the roster and drop them onto a booking slot below.
        </div>
        
        {error && (
          <div className="bg-red-950/40 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bookings.map((booking: any) => (
            <motion.div
              layout
              key={booking.name}
              onDragOver={(e) => { e.preventDefault(); setDragOverBooking(booking.name); }}
              onDragLeave={() => setDragOverBooking(null)}
              onDrop={(e) => onDrop(e as any, booking.name)}
              className={`rounded-xl border transition-all flex flex-col ${
                dragOverBooking === booking.name
                  ? 'border-[var(--ee-brand)] bg-[var(--ee-brand-soft)]/20 scale-[1.02] shadow-ee-md'
                  : 'border-[var(--ee-border)] bg-[var(--ee-surface-raised)] hover:border-[var(--ee-border-strong)]'
              }`}
            >
              <div className="p-4 border-b border-[var(--ee-border)] bg-[var(--ee-surface-base)] rounded-t-xl">
                <div className="font-bold text-[var(--ee-text)] line-clamp-1 mb-1">{booking.event_name || booking.name}</div>
                <div className="text-xs text-[var(--ee-muted)] flex items-center gap-1.5"><Clock className="w-3 h-3"/> {booking.start_time} - {booking.end_time}</div>
                {booking.at_risk && <Badge variant="warning" className="mt-2 text-[10px]">Attention Needed</Badge>}
              </div>
              
              <div className="p-3 flex-1 flex flex-col gap-2 min-h-[100px] bg-[var(--ee-surface-inset)]/50 rounded-b-xl">
                {(booking.crew_assignments || []).map((a: any) => (
                  <div key={a.name} className="text-xs bg-[var(--ee-surface-base)] border border-[var(--ee-border)] px-2.5 py-1.5 rounded-md flex justify-between items-center shadow-sm">
                    <span className="font-medium text-[var(--ee-text)]">{a.crew_member}</span>
                    <span className="text-[var(--ee-muted)]">{a.role}</span>
                  </div>
                ))}
                {(booking.crew_assignments || []).length === 0 && (
                  <div className="flex-1 border-2 border-dashed border-[var(--ee-border)] rounded-lg flex items-center justify-center text-xs text-[var(--ee-muted)] font-medium">
                    Drop Crew Here
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RunSheetPanel: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const generateMutation = useMutation(async () => callMethod('entertainment_express.api.dispatch.generate_run_sheet', { booking_name: bookingId }));
  const publishMutation = useMutation(async () => callMethod('entertainment_express.api.dispatch.publish_run_sheet', { booking_name: bookingId }));
  const { data: runsheet, refetch } = useQuery(['runsheet', bookingId], async () => callMethod('entertainment_express.api.dispatch.get_run_sheet', { booking_name: bookingId }));

  const checklist = runsheet?.checklist_items || runsheet?.checklist || [];
  const doneCount = checklist.filter((i: any) => i.done || i.status === 'completed').length;
  const completion = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {!runsheet ? (
        <EmptyState 
          title="No Run Sheet Generated" 
          description="Create a logistics run sheet for the crew based on the contract requirements." 
          actionLabel={generateMutation.isPending ? 'Generating...' : 'Generate Run Sheet'} 
          onAction={async () => { await generateMutation.mutateAsync(); await refetch(); }} 
        />
      ) : (
        <Card className="p-5 bg-[var(--ee-surface-base)] border-[var(--ee-border)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--ee-text)] flex items-center gap-2"><ClipboardList className="w-5 h-5 text-[var(--ee-brand)]"/> Equipment & Tasks</h3>
            <span className="text-sm font-medium text-[var(--ee-brand)]">{completion}% Complete</span>
          </div>
          
          <div className="w-full bg-[var(--ee-surface-inset)] rounded-full h-2.5 mb-6 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${completion}%` }} className="bg-[var(--ee-brand)] h-full rounded-full transition-all" />
          </div>
          
          <div className="space-y-2 mb-6">
            {checklist.map((item: any, idx: number) => {
              const isDone = Boolean(item.done) || item.status === 'completed';
              return (
                <div key={item.name || idx} className={`flex items-center p-3 rounded-lg border ${isDone ? 'bg-[var(--ee-success-soft)]/10 border-[var(--ee-success-border)]' : 'bg-[var(--ee-surface-inset)] border-[var(--ee-border)]'}`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5 text-[var(--ee-success)] mr-3 shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-[var(--ee-border-strong)] mr-3 shrink-0" />}
                  <span className={`text-sm ${isDone ? 'text-[var(--ee-text)] opacity-60 line-through' : 'text-[var(--ee-text)] font-medium'}`}>{item.description || item.item || item.asset_name}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between border-t border-[var(--ee-border)] pt-4">
            {!runsheet.published ? (
              <Button variant="primary" density="ops" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                {publishMutation.isPending ? 'Publishing...' : 'Publish to Crew App'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-[var(--ee-success)] text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Published to assigned crew
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const MessagesPanel: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [message, setMessage] = useState('');
  return (
    <Card className="p-5 bg-[var(--ee-surface-base)] border-[var(--ee-border)] h-full flex flex-col">
      <div className="flex-1 bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] rounded-xl mb-4 p-4 flex items-center justify-center">
        <p className="text-[var(--ee-muted)] text-sm">Select a crew member to view chat history.</p>
      </div>
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Send a dispatch note..."
          className="flex-1 bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] rounded-lg px-4 py-2 text-[var(--ee-text)] text-sm outline-none focus:border-[var(--ee-brand)]"
        />
        <Button variant="primary" density="ops" disabled={!message.trim()} onClick={() => setMessage('')}>
          Send
        </Button>
      </div>
    </Card>
  );
};

const AnalyticsPanel: React.FC = () => {
  const { data, isLoading } = useQuery(['dispatchAnalytics'], async () => callMethod('entertainment_express.api.dispatch.get_dispatch_analytics', { days: 30 }));

  if (isLoading) return <div className="p-8 text-center"><Skeleton height="400px" /></div>;
  if (!data) return <EmptyState title="No Data" description="No dispatch analytics data available yet." />;

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-center bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] p-4 rounded-xl">
        <h2 className="text-xl font-bold text-[var(--ee-text)]">30-Day Dispatch Performance</h2>
        <Button variant="secondary" density="ops" onClick={() => {}} leftIcon={<Download className="w-4 h-4" />}>
          Export CSV
        </Button>
      </div>
      
      <StatGrid columns={4}>
        <MetricCard title="Utilization Rate" value={`${data.utilization_pct || 0}%`} />
        <MetricCard title="Acceptance Rate" value={`${data.accept_rate_pct || 0}%`} />
        <MetricCard title="Reliability Score" value={`${data.reliability_pct || 0}%`} />
        <MetricCard title="Repeat Customers" value={String(data.repeat_booking_customers || 0)} />
      </StatGrid>
      
      <Card className="overflow-hidden bg-[var(--ee-surface-base)] border-[var(--ee-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] text-left">
            <tr>
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Crew Member</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Accepted</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Completed</th>
              <th className="p-4 font-medium uppercase text-xs tracking-wider">Declined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ee-border)]">
            {(data.crew || []).map((c: any) => (
              <tr key={c.crew_member} className="hover:bg-[var(--ee-surface-raised)] transition-colors">
                <td className="p-4 font-medium text-[var(--ee-text)]">{c.employee_name || c.crew_member}</td>
                <td className="p-4 text-[var(--ee-success)] font-medium">{c.accepted}</td>
                <td className="p-4 text-[var(--ee-text)]">{c.completed}</td>
                <td className="p-4 text-red-400 font-medium">{c.declined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default DispatchBoard;
