import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
  registerServiceWorker,
  showPushNotification,
  requestNotificationPermission,
  getNotificationPermission
} from '../utils/notificationService';
import { API_BASE, SOCKET_URL } from '../config/api';

const SocketContext = createContext(null);

const SERVER_URL = SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [notificationPermission, setNotificationPermission] = useState(() => getNotificationPermission());
  const [lastBookingNotification, setLastBookingNotification] = useState(null);

  useEffect(() => {
    // Automatically register Service Worker on mount
    registerServiceWorker();
    setNotificationPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setConnected(false);
    });

    // ── Listen for new booking request notifications ──
    newSocket.on('new:booking', (data) => {
      console.log('🔔 Received new booking notification:', data);
      setLastBookingNotification(data);

      // Trigger Service Worker push notification
      showPushNotification({
        title: `📅 New Booking: ${data.serviceTitle || 'Service Request'}`,
        body: `${data.customerName || 'A customer'} booked "${data.serviceTitle || 'a service'}" for ₹${data.totalAmount || ''}!`,
        data: {
          url: '/bookings',
          bookingId: data.bookingId,
          conversationId: data.conversationId
        },
        tag: `booking-${data.bookingId || Date.now()}`
      });

      // If message is attached, update conversation messages
      if (data.message) {
        setMessages(prev => ({
          ...prev,
          [data.message.conversationId]: [...(prev[data.message.conversationId] || []), data.message]
        }));
        setUnreadCounts(prev => ({
          ...prev,
          [data.message.conversationId]: (prev[data.message.conversationId] || 0) + 1
        }));
      }
    });

    newSocket.on('new:message', (data) => {
      const { message } = data;
      setMessages(prev => ({
        ...prev,
        [message.conversationId]: [...(prev[message.conversationId] || []), message]
      }));

      if (activeConversation?.id !== message.conversationId) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.conversationId]: (prev[message.conversationId] || 0) + 1
        }));

        // Trigger Service Worker push notification for messages sent to current user
        if (message.senderId !== user.id) {
          showPushNotification({
            title: `💬 ${message.senderName || 'New Message'}`,
            body: message.content || 'Sent you a message.',
            data: {
              url: '/bookings',
              conversationId: message.conversationId
            },
            tag: `msg-${message.id || Date.now()}`
          });
        }
      }
    });

    newSocket.on('messages:read', (data) => {
      setMessages(prev => {
        const convMessages = prev[data.conversationId] || [];
        return {
          ...prev,
          [data.conversationId]: convMessages.map(m =>
            m.senderId !== data.readBy ? { ...m, read: true } : m
          )
        };
      });
    });

    newSocket.on('conversation:updated', async (data) => {
      setConversations(prev => {
        const exists = prev.some(c => c.id === data.conversationId);
        if (exists) {
          return prev.map(c =>
            c.id === data.conversationId
              ? { ...c, lastMessage: data.lastMessage, lastMessageAt: data.lastMessageAt }
              : c
          );
        }
        return prev;
      });

      // If conversation is new or not in local state, fetch fresh list
      try {
        const res = await fetch(`${API_BASE}/api/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await res.json();
        if (d.conversations) {
          setConversations(d.conversations);
        }
      } catch (err) {
        // silent fallback
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user]);

  const joinConversation = useCallback((conversationId) => {
    if (socket?.connected) {
      socket.emit('join:conversation', conversationId);
    }
  }, [socket]);

  const leaveConversation = useCallback((conversationId) => {
    if (socket?.connected) {
      socket.emit('leave:conversation', conversationId);
    }
  }, [socket]);

  const sendMessage = useCallback((conversationId, content) => {
    if (socket?.connected) {
      socket.emit('send:message', { conversationId, content });
    }
  }, [socket]);

  const markAsRead = useCallback((conversationId) => {
    if (socket?.connected) {
      socket.emit('mark:read', conversationId);
      setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
    }
  }, [socket]);

  const setMessagesForConversation = useCallback((conversationId, msgs) => {
    setMessages(prev => ({ ...prev, [conversationId]: msgs }));
    setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
  }, []);

  const addConversation = useCallback((conversation) => {
    setConversations(prev => {
      if (prev.find(c => c.id === conversation.id)) return prev;
      return [conversation, ...prev].sort((a, b) =>
        new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
      );
    });
  }, []);

  const updateConversation = useCallback((conversationId, updates) => {
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, ...updates } : c
    ));
  }, []);

  const requestPushPermission = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    return perm;
  }, []);

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      conversations,
      setConversations,
      addConversation,
      updateConversation,
      activeConversation,
      setActiveConversation,
      messages,
      setMessagesForConversation,
      unreadCounts,
      joinConversation,
      leaveConversation,
      sendMessage,
      markAsRead,
      notificationPermission,
      requestPushPermission,
      lastBookingNotification
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}