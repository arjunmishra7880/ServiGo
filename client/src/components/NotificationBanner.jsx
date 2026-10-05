import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { showPushNotification } from '../utils/notificationService';

export default function NotificationBanner() {
  const { user } = useAuth();
  const { notificationPermission, requestPushPermission, lastBookingNotification } = useSocket();
  const [dismissed, setDismissed] = useState(false);
  const [inAppToast, setInAppToast] = useState(null);

  // Show in-app toast when a booking notification arrives
  React.useEffect(() => {
    if (lastBookingNotification) {
      setInAppToast(lastBookingNotification);
      const timer = setTimeout(() => {
        setInAppToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [lastBookingNotification]);

  if (!user) return null;

  const handleEnableNotifications = async () => {
    const result = await requestPushPermission();
    if (result === 'granted') {
      showPushNotification({
        title: '🔔 Notifications Active!',
        body: 'You will now receive instant alerts whenever a customer books your service.',
        data: { url: '/bookings' },
        tag: 'welcome-notification'
      });
    }
  };

  const isPermissionNeeded =
    notificationPermission === 'default' && !dismissed && (user.role === 'provider' || user.role === 'admin' || user.role === 'customer');

  return (
    <>
      {/* ── Floating In-App Live Booking Toast (Top Right) ── */}
      {inAppToast && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 80,
            right: 20,
            zIndex: 9999,
            maxWidth: 380,
            width: 'calc(100% - 40px)',
            background: '#001E2B',
            border: '2px solid #10C4A8',
            borderRadius: 16,
            padding: '14px 18px',
            boxShadow: '0 12px 35px rgba(0, 30, 43, 0.45)',
            color: '#FFFFFF',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div className="d-flex align-items-center gap-2">
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(16, 196, 168, 0.25)',
                  border: '1.5px solid #10C4A8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10C4A8',
                  fontSize: 16
                }}
              >
                <i className="bi bi-bell-fill"></i>
              </span>
              <div>
                <strong style={{ fontSize: 14, color: '#FFFFFF' }}>New Booking Request!</strong>
                <div style={{ fontSize: 11, color: '#E6FAF6' }}>Instant doorstep service</div>
              </div>
            </div>
            <button
              onClick={() => setInAppToast(null)}
              className="btn btn-sm p-0 text-white"
              style={{ opacity: 0.7, fontSize: 18, lineHeight: 1 }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="p-2 mb-2 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(16, 196, 168, 0.3)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
              {inAppToast.serviceTitle || 'Booked Service'}
            </div>
            <div style={{ fontSize: 12, color: '#E6FAF6' }}>
              Customer: <strong>{inAppToast.customerName || 'A customer'}</strong>
            </div>
            {inAppToast.totalAmount && (
              <div style={{ fontSize: 12, color: '#10C4A8', fontWeight: 800 }}>
                Total: ₹{inAppToast.totalAmount}
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <a
              href="/bookings"
              className="btn btn-sm"
              style={{
                background: '#10C4A8',
                color: '#001E2B',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 14px',
                border: 'none',
                textDecoration: 'none'
              }}
            >
              <i className="bi bi-calendar2-check me-1"></i>View Booking
            </a>
          </div>
        </div>
      )}

      {/* ── Prompt Banner to Enable Service Worker Notifications ── */}
      {isPermissionNeeded && (
        <div
          role="region"
          aria-label="Notification prompt"
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: 9998,
            maxWidth: 390,
            width: 'calc(100% - 48px)',
            background: '#001E2B',
            border: '1.5px solid #10C4A8',
            borderRadius: 16,
            padding: '14px 18px',
            boxShadow: '0 10px 30px rgba(0, 30, 43, 0.45)',
            backdropFilter: 'blur(12px)',
            animation: 'fadeInUp 0.3s ease-out'
          }}
        >
          <div className="d-flex align-items-start gap-3">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(16, 196, 168, 0.25)',
                border: '1.5px solid #10C4A8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10C4A8',
                fontSize: 18,
                flexShrink: 0
              }}
            >
              <i className="bi bi-bell-fill"></i>
            </div>
            <div className="flex-grow-1">
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                {user.role === 'provider' ? 'Enable Booking Alerts' : 'Stay Updated'}
              </div>
              <p style={{ color: '#E6FAF6', fontSize: 12, lineHeight: 1.4, margin: '0 0 10px', opacity: 0.9 }}>
                Get instant desktop & mobile push notifications via Service Worker when a user books or messages you.
              </p>
              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={handleEnableNotifications}
                  className="btn btn-sm"
                  style={{
                    background: '#10C4A8',
                    color: '#001E2B',
                    fontWeight: 700,
                    borderRadius: 10,
                    fontSize: 12,
                    padding: '5px 14px',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(16, 196, 168, 0.35)'
                  }}
                >
                  <i className="bi bi-check2-circle me-1"></i>Enable Alerts
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="btn btn-sm"
                  style={{
                    background: 'transparent',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: 10,
                    fontSize: 12,
                    padding: '5px 12px'
                  }}
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
