/**
 * WebSocket Service for Dispatch Portal Real-Time Updates
 * Handles crew location tracking, shift updates, at-risk alerts
 */

import React from 'react';
import io, { Socket } from 'socket.io-client';

interface CrewLocation {
  crew_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  status: 'checked_in' | 'checked_out' | 'on_route';
}

interface ShiftUpdate {
  assignment_id: string;
  booking_id: string;
  status: 'offered' | 'accepted' | 'declined' | 'checked_in' | 'completed';
  crew_member: string;
  timestamp: string;
}

interface AtRiskAlert {
  booking_id: string;
  event_name: string;
  event_date: string;
  start_time: string;
  crew_count: number;
  status: 'no_crew' | 'understaffed' | 'last_minute';
  recommendation: string;
}

class DispatchWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Initialize WebSocket connection
   */
  connect(token: string, wsUrl: string = 'wss://api.entertainmentexpress.com'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(wsUrl, {
          path: '/socket.io/',
          transports: ['websocket'],
          auth: {
            token,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
        });

        // Connection events
        this.socket.on('connect', () => {
          console.log('[WebSocket] Connected to dispatch server');
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('[WebSocket] Connection error:', error);
          this.emit('connection_error', error);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(error);
          }
          this.reconnectAttempts++;
        });

        this.socket.on('disconnect', (reason: string) => {
          console.warn('[WebSocket] Disconnected:', reason);
          this.emit('disconnected', reason);
        });

        // Subscribe to dispatch events
        this.subscribeToEvents();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to all dispatch events
   */
  private subscribeToEvents(): void {
    if (!this.socket) return;

    // Crew location updates (real-time GPS tracking)
    this.socket.on('crew_location_update', (data: CrewLocation) => {
      console.log('[WebSocket] Crew location update:', data.crew_id);
      this.emit('crew_location_update', data);
    });

    // Shift status changes
    this.socket.on('shift_status_update', (data: ShiftUpdate) => {
      console.log('[WebSocket] Shift status update:', data.assignment_id);
      this.emit('shift_status_update', data);
    });

    // At-risk alerts for bookings
    this.socket.on('at_risk_alert', (data: AtRiskAlert) => {
      console.error('[WebSocket] At-risk alert:', data.event_name);
      this.emit('at_risk_alert', data);
      
      // Send browser notification
      this.sendNotification(
        '⚠️ Booking At Risk',
        `${data.event_name} on ${data.event_date} - ${data.recommendation}`
      );
    });

    // Run sheet updates
    this.socket.on('runsheet_update', (data: any) => {
      console.log('[WebSocket] Run sheet update:', data.booking_id);
      this.emit('runsheet_update', data);
    });

    // Messaging
    this.socket.on('new_message', (data: any) => {
      console.log('[WebSocket] New message from', data.sender);
      this.emit('new_message', data);
    });

    // Booking status changes
    this.socket.on('booking_status_change', (data: any) => {
      console.log('[WebSocket] Booking status change:', data.booking_id);
      this.emit('booking_status_change', data);
    });
  }

  /**
   * Subscribe to a specific booking's updates
   */
  subscribeToBooking(bookingId: string): void {
    if (!this.socket) throw new Error('WebSocket not connected');
    this.socket.emit('subscribe_booking', { booking_id: bookingId });
    console.log('[WebSocket] Subscribed to booking:', bookingId);
  }

  /**
   * Unsubscribe from booking updates
   */
  unsubscribeFromBooking(bookingId: string): void {
    if (!this.socket) return;
    this.socket.emit('unsubscribe_booking', { booking_id: bookingId });
    console.log('[WebSocket] Unsubscribed from booking:', bookingId);
  }

  /**
   * Subscribe to crew location updates
   */
  subscribeToCrew(crewId: string): void {
    if (!this.socket) throw new Error('WebSocket not connected');
    this.socket.emit('subscribe_crew', { crew_id: crewId });
    console.log('[WebSocket] Subscribed to crew:', crewId);
  }

  /**
   * Subscribe to multiple bookings (for dispatch day view)
   */
  subscribeToDayView(eventDate: string): void {
    if (!this.socket) throw new Error('WebSocket not connected');
    this.socket.emit('subscribe_day_view', { event_date: eventDate });
    console.log('[WebSocket] Subscribed to day view:', eventDate);
  }

  /**
   * Emit action to server (e.g., update shift status)
   */
  emitAction(action: string, data: any): void {
    if (!this.socket) throw new Error('WebSocket not connected');
    this.socket.emit(action, data);
    console.log('[WebSocket] Emitted action:', action, data);
  }

  /**
   * Register event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to local listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Send browser notification
   */
  private sendNotification(title: string, message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/logo.png',
        badge: '/badge.png',
        tag: 'dispatch-alert',
        requireInteraction: true,
      });
    }
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Reconnect manually
   */
  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const dispatchWebSocket = new DispatchWebSocketService();

/**
 * Hook for using WebSocket in React components
 */
export function useDispatchWebSocket() {
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    const handleError = (err: Error) => setError(err);

    dispatchWebSocket.on('connected', handleConnected);
    dispatchWebSocket.on('disconnected', handleDisconnected);
    dispatchWebSocket.on('connection_error', handleError);

    return () => {
      dispatchWebSocket.off('connected', handleConnected);
      dispatchWebSocket.off('disconnected', handleDisconnected);
      dispatchWebSocket.off('connection_error', handleError);
    };
  }, []);

  return {
    isConnected,
    error,
    subscribe: dispatchWebSocket.subscribeToBooking.bind(dispatchWebSocket),
    unsubscribe: dispatchWebSocket.unsubscribeFromBooking.bind(dispatchWebSocket),
    subscribeDay: dispatchWebSocket.subscribeToDayView.bind(dispatchWebSocket),
    on: dispatchWebSocket.on.bind(dispatchWebSocket),
    off: dispatchWebSocket.off.bind(dispatchWebSocket),
  };
}

export default dispatchWebSocket;
