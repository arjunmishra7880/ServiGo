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
            background: 'linear-gradient(135deg, rgba(3, 14, 40, 0.98) 0%, rgba(0, 119, 182, 0.95) 100%)',
            border: '2px solid #00B4D8',
            borderRadius: 16,
            padding: '14px 18px',
            boxShadow: '0 12px 35px rgba(0, 180, 216, 0.45)',
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
                  background: 'rgba(0, 180, 216, 0.25)',
                  border: '1.5px solid #00B4D8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00B4D8',
                  fontSize: 16
                }}
              >
                <i className="bi bi-bell-fill"></i>
              </span>
              <div>
                <strong style={{ fontSize: 14, color: '#CAF0F8' }}>New Booking Request!</strong>
                <div style={{ fontSize: 11, color: 'rgba(202, 240, 248, 0.75)' }}>Instant doorstep service</div>
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

          <div className="p-2 mb-2 rounded-3" style={{ background: 'rgba(3, 4, 94, 0.65)', border: '1px solid rgba(0, 180, 216, 0.25)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
              {inAppToast.serviceTitle || 'Booked Service'}
            </div>
            <div style={{ fontSize: 12, color: '#CAF0F8' }}>
              Customer: <strong>{inAppToast.customerName || 'A customer'}</strong>
            </div>
            {inAppToast.totalAmount && (
              <div style={{ fontSize: 12, color: '#FBB02D', fontWeight: 700 }}>
                Total: ₹{inAppToast.totalAmount}
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <a
              href="/bookings"
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                color: '#FFFFFF',
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
            background: 'linear-gradient(145deg, rgba(3, 14, 40, 0.98) 0%, rgba(5, 24, 56, 0.98) 100%)',
            border: '1.5px solid rgba(0, 180, 216, 0.45)',
            borderRadius: 16,
            padding: '14px 18px',
            boxShadow: '0 10px 30px rgba(1, 10, 26, 0.65), 0 0 16px rgba(0, 180, 216, 0.25)',
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
                background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.25) 0%, rgba(2, 62, 186, 0.45) 100%)',
                border: '1.5px solid #00B4D8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00B4D8',
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
              <p style={{ color: '#CAF0F8', fontSize: 12, lineHeight: 1.4, margin: '0 0 10px', opacity: 0.9 }}>
                Get instant desktop & mobile push notifications via Service Worker when a user books or messages you.
              </p>
              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={handleEnableNotifications}
                  className="btn btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #FBB02D 0%, #E59F24 100%)',
                    color: '#03045E',
                    fontWeight: 700,
                    borderRadius: 10,
                    fontSize: 12,
                    padding: '5px 14px',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(251, 176, 45, 0.35)'
                  }}
                >
                  <i className="bi bi-check2-circle me-1"></i>Enable Alerts
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="btn btn-sm"
                  style={{
                    background: 'transparent',
                    color: '#CAF0F8',
                    border: '1px solid rgba(202, 240, 248, 0.25)',
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
