'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  type: string;
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

interface UseTeamNotificationsReturn {
  isConnected: boolean;
  notifications: Notification[];
  subscribe: (teamId: string) => void;
  unsubscribe: (teamId: string) => void;
  clearNotifications: () => void;
}

/**
 * Hook for WebSocket notifications
 * Connects to real-time team activity events
 */
export function useTeamNotifications(): UseTeamNotificationsReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const maxNotifications = 10;

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      socketRef.current = io(
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        {
          namespace: 'notifications',
          auth: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        }
      );

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        console.log('[WebSocket] Connected');
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
        console.log('[WebSocket] Disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error);
      });

      // Real-time event handlers
      socketRef.current.on('approval:submitted', (data) => {
        addNotification('approval:submitted', data.message, data);
      });

      socketRef.current.on('approval:responded', (data) => {
        addNotification('approval:responded', data.message, data);
      });

      socketRef.current.on('member:added', (data) => {
        addNotification('member:added', data.message, data);
      });

      socketRef.current.on('member:removed', (data) => {
        addNotification('member:removed', data.message, data);
      });

      socketRef.current.on('member:role_updated', (data) => {
        addNotification('member:role_updated', data.message, data);
      });

      socketRef.current.on('team:subscribed', (data) => {
        console.log('[WebSocket] Subscribed to team:', data.teamId);
      });

      socketRef.current.on('team:unsubscribed', (data) => {
        console.log('[WebSocket] Unsubscribed from team:', data.teamId);
      });

      return () => {
        if (socketRef.current?.connected) {
          socketRef.current.disconnect();
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to initialize:', error);
    }
  }, []);

  const addNotification = useCallback((type: string, message: string, data?: Record<string, any>) => {
    const notification: Notification = {
      type,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    setNotifications((prev) => {
      const updated = [notification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.timestamp !== notification.timestamp));
    }, 5000);
  }, []);

  const subscribe = useCallback((teamId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('team:subscribe', { teamId });
    }
  }, []);

  const unsubscribe = useCallback((teamId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('team:unsubscribe', { teamId });
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    isConnected,
    notifications,
    subscribe,
    unsubscribe,
    clearNotifications,
  };
}
