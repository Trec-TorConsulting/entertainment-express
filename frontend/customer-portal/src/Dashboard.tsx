import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { create } from 'zustand';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AppShell, DataTable, EmptyState, Card, CardHeader, CardTitle, 
  CardContent, Badge, Button, Skeleton, Dialog, DialogContent, 
  DialogHeader, DialogTitle, Tabs, TabsList, TabsTrigger, TabsContent
} from '../../portal-kit/src';
import { 
  Calendar, MapPin, Clock, CreditCard, PenTool, MessageSquare, 
  CheckCircle2, AlertCircle, Sparkles, Navigation
} from 'lucide-react';
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

// ── Animations ────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

// ── Components ────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const { customer } = useAuthStore();
  const [selectedFilter, setSelectedFilter] = useState<string>('upcoming');

  const { data: bookings, isLoading, error } = useQuery(
    ['bookings', selectedFilter],
    async () => {
      const params = selectedFilter !== 'all' ? { status: selectedFilter } : {};
      const res = await api.get('/customer/bookings', { params });
      return res.data;
    },
    { staleTime: 60000 }
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <Skeleton height="8rem" className="rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} height="12rem" className="rounded-2xl" />)}
          </div>
        </div>
      );
    }

    if (error) {
      return <EmptyState title="Oops!" description="We couldn't load your events right now." actionLabel="Try Again" onAction={() => window.location.reload()} />;
    }

    if (!bookings?.data?.length) {
      return (
        <Card className="p-12 border-dashed bg-transparent mt-8">
          <EmptyState 
            title="No events scheduled" 
            description="You don't have any upcoming entertainment booked. Ready to plan an unforgettable event?" 
            actionLabel="Start a Booking" 
            onAction={() => window.location.href = '/book'} 
          />
        </Card>
      );
    }

    return (
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {bookings.data.map((booking: any) => (
          <motion.div variants={itemVariants} key={booking.name}>
            <BookingCard booking={booking} />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <AppShell title="Client Portal" portal="client" density="consumer">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Glassmorphic Hero */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 glass shadow-ee-xl border border-[var(--ee-border)] bg-gradient-to-br from-[var(--ee-brand-soft)] to-transparent"
        >
          <div className="relative z-10 max-w-2xl space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--ee-text)]">
              Hello, {customer?.name?.split(' ')[0] || 'there'}! <Sparkles className="inline-block w-8 h-8 text-[var(--ee-brand)] ml-2 mb-2" />
            </h1>
            <p className="text-lg text-[var(--ee-muted)]">
              Welcome to your personal event dashboard. Track your bookings, message your coordinator, and manage your entertainment seamlessy.
            </p>
          </div>
          {/* Decorative blur blob */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[var(--ee-brand)] opacity-10 rounded-full blur-3xl pointer-events-none" />
        </motion.div>

        {/* Filters */}
        <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-full">
          <TabsList className="bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] p-1 rounded-xl">
            <TabsTrigger value="upcoming" className="rounded-lg px-6 py-2.5">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past" className="rounded-lg px-6 py-2.5">Past Events</TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg px-6 py-2.5">All Bookings</TabsTrigger>
          </TabsList>
        </Tabs>

        {renderContent()}

      </div>
    </AppShell>
  );
};

const BookingCard: React.FC<{ booking: any }> = ({ booking }) => {
  const isConfirmed = booking.status === 'Confirmed';
  const isCompleted = booking.status === 'Completed';
  
  return (
    <Card interactive className="flex flex-col h-full glass-panel overflow-hidden border-t-4 border-t-[var(--ee-brand)]">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-xl line-clamp-2">{booking.event_name || booking.name}</CardTitle>
          <Badge variant={isConfirmed ? "success" : isCompleted ? "default" : "brand"}>
            {booking.status || 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2 text-sm text-[var(--ee-muted)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="font-medium text-[var(--ee-text)]">{booking.event_date || 'TBD'}</span>
          </div>
          {booking.start_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{booking.start_time} - {booking.end_time || 'TBD'}</span>
            </div>
          )}
          {booking.venue_address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="line-clamp-2 leading-tight">{booking.venue_address}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <div className="p-5 pt-0 mt-auto">
        <Button variant="primary" density="consumer" className="w-full">
          Manage Event
        </Button>
      </div>
    </Card>
  );
};

export const BookingDetail: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const { data: booking, isLoading } = useQuery(
    ['booking', bookingId],
    async () => {
      const res = await api.get(`/customer/booking/${bookingId}`);
      return res.data.data;
    }
  );

  if (isLoading) return <AppShell title="Event Details" portal="client"><div className="p-8"><Skeleton height="300px" /></div></AppShell>;
  if (!booking) return <AppShell title="Event Details" portal="client"><EmptyState title="Not Found" description="Booking details unavailable." /></AppShell>;

  return (
    <AppShell title={booking.event_name || 'Event Details'} portal="client" density="consumer">
      <motion.div 
        className="max-w-5xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--ee-border)] pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{booking.event_name}</h1>
              <p className="text-[var(--ee-muted)] mt-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {booking.event_date}
              </p>
            </div>
            <Badge variant="brand" className="text-sm px-3 py-1 self-start sm:self-auto">
              {booking.status}
            </Badge>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <BookingTimeline booking={booking} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div variants={itemVariants} className="space-y-8">
            <PaymentSection booking={booking} />
            <ContractSection bookingId={bookingId} />
          </motion.div>
          <motion.div variants={itemVariants} className="space-y-8">
            <CrewTrackingMap bookingId={bookingId} />
            <MessagingSection bookingId={bookingId} />
          </motion.div>
        </div>
      </motion.div>
    </AppShell>
  );
};

const BookingTimeline: React.FC<{ booking: any }> = ({ booking }) => {
  const steps = [
    { label: 'Booking Request', status: 'completed' },
    { label: 'Contract Signed', status: booking.status === 'draft' ? 'pending' : 'completed' },
    { label: 'Deposit Paid', status: booking.status === 'confirmed' ? 'completed' : 'pending' },
    { label: 'Crew Assigned', status: booking.status === 'confirmed' ? 'completed' : 'pending' },
    { label: 'Event Day', status: booking.status === 'completed' ? 'completed' : 'pending' },
  ];

  return (
    <Card className="p-8 glass-panel border-[var(--ee-border)]">
      <h2 className="text-xl font-bold mb-8">Event Progress</h2>
      <div className="relative flex flex-col sm:flex-row justify-between w-full">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-[var(--ee-border)] -translate-y-1/2 hidden sm:block z-0" />
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          return (
            <div key={idx} className="relative z-10 flex sm:flex-col items-center gap-4 sm:gap-3 mb-6 sm:mb-0">
              <motion.div 
                initial={false}
                animate={{ 
                  backgroundColor: isCompleted ? 'var(--ee-brand)' : 'var(--ee-surface-raised)',
                  borderColor: isCompleted ? 'var(--ee-brand)' : 'var(--ee-border-strong)',
                  color: isCompleted ? '#ffffff' : 'var(--ee-muted)'
                }}
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-lg shadow-sm"
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : (idx + 1)}
              </motion.div>
              <span className={`font-medium text-sm sm:text-center max-w-[90px] ${isCompleted ? 'text-[var(--ee-text)]' : 'text-[var(--ee-muted)]'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const CrewTrackingMap: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const { data: crewStatus, isLoading } = useQuery(
    ['crewStatus', bookingId],
    async () => {
      const res = await api.get(`/customer/booking/${bookingId}/crew-status`);
      return res.data.data.crew;
    },
    { refetchInterval: 30000 }
  );

  return (
    <Card className="overflow-hidden glass-panel">
      <CardHeader className="bg-[var(--ee-surface-inset)] border-b border-[var(--ee-border)]">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Navigation className="w-5 h-5 text-[var(--ee-brand)]" />
          Crew Tracking
        </CardTitle>
      </CardHeader>
      <div className="relative h-64 bg-blue-50/50">
        {/* Placeholder Map Pattern */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(var(--ee-brand) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="absolute inset-0 flex items-center justify-center p-4">
           {isLoading ? (
             <Skeleton className="w-full max-w-sm h-16 rounded-xl" />
           ) : crewStatus?.length ? (
             <div className="w-full max-w-sm space-y-3">
               <AnimatePresence>
                 {crewStatus.map((crew: any, idx: number) => (
                   <motion.div 
                     key={crew.crew_member || idx}
                     initial={{ opacity: 0, scale: 0.9, y: 10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     className="glass p-3 rounded-xl flex items-center justify-between shadow-ee-md"
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-[var(--ee-brand)] flex items-center justify-center text-white font-bold">
                         {crew.crew_member?.charAt(0) || '?'}
                       </div>
                       <div>
                         <p className="font-bold text-[var(--ee-text)] text-sm leading-tight">{crew.crew_member}</p>
                         <p className="text-xs text-[var(--ee-muted)]">{crew.role || 'Staff'}</p>
                       </div>
                     </div>
                     <Badge variant={crew.status === 'En Route' ? 'warning' : 'success'}>
                       {crew.status || 'Assigned'}
                     </Badge>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
           ) : (
             <div className="text-center bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-[var(--ee-border)]">
                <p className="text-[var(--ee-muted)] font-medium">Crew will be visible on event day.</p>
             </div>
           )}
        </div>
      </div>
    </Card>
  );
};

const ContractSection: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  return (
    <Card className="p-6 glass-panel flex flex-col items-center text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-[var(--ee-brand-soft)] flex items-center justify-center">
        <PenTool className="w-6 h-6 text-[var(--ee-brand)]" />
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">Event Contract</h3>
        <p className="text-sm text-[var(--ee-muted)] max-w-[250px] mx-auto">Please review and sign the final agreement to secure your booking.</p>
      </div>
      <Button variant="outline" density="consumer" className="w-full mt-2">
        Review & Sign
      </Button>
    </Card>
  );
};

const PaymentSection: React.FC<{ booking: any }> = ({ booking }) => {
  return (
    <Card className="p-6 glass-panel border-[var(--ee-brand-border)] bg-gradient-to-br from-white to-[var(--ee-brand-soft)]/30">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[var(--ee-brand)]" />
            Payment Due
          </h3>
          <p className="text-sm text-[var(--ee-muted)]">Remaining deposit</p>
        </div>
        <Badge variant="brand" className="text-lg px-3 py-1 font-mono">
          $250.00
        </Badge>
      </div>
      <Button variant="primary" density="consumer" className="w-full shadow-ee-md">
        Pay Securely Now
      </Button>
    </Card>
  );
};

const MessagingSection: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  return (
    <Card className="p-6 glass-panel">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[var(--ee-text)]" />
        Message Coordinator
      </h3>
      <textarea
        placeholder="Have a question about the playlist or setup?"
        className="w-full border border-[var(--ee-border)] rounded-xl p-4 min-h-[120px] bg-[var(--ee-surface-inset)] focus:bg-[var(--ee-surface-raised)] focus:ring-2 focus:ring-[var(--ee-brand)] focus:border-transparent transition-all outline-none resize-none text-sm"
      />
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" density="ops">Send Message</Button>
      </div>
    </Card>
  );
};

export default Dashboard;
