// ═══════════════════════════════════════════════════════════════
// ServiGo Notification & Service Worker Service
// ═══════════════════════════════════════════════════════════════

let swRegistration = null;

/**
 * Register Service Worker for push notifications
 */
export async function registerServiceWorker() {
  if (typeof window === 'undefined') return null;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker && (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      swRegistration = reg;
      console.log('✅ ServiGo Service Worker registered:', reg.scope);

      // Listen for notification clicks sent back from the worker
      if (navigator.serviceWorker.addEventListener) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'NOTIFICATION_CLICKED') {
            const url = event.data.data?.url || '/bookings';
            if (window.location.pathname !== url) {
              window.location.href = url;
            }
          }
        });
      }

      return reg;
    }
  } catch (err) {
    console.warn('⚠️ Service Worker registration skipped or failed:', err);
  }
  return null;
}

/**
 * Check if notifications & service workers are supported
 */
export function isNotificationSupported() {
  try {
    return typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
  } catch (e) {
    return false;
  }
}

/**
 * Get current notification permission
 */
export function getNotificationPermission() {
  try {
    if (typeof window === 'undefined' || !('Notification' in window) || typeof Notification === 'undefined') {
      return 'unsupported';
    }
    return Notification.permission || 'default';
  } catch (e) {
    return 'unsupported';
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Ensure service worker is registered
      if (!swRegistration) {
        await registerServiceWorker();
      }
      playNotificationChime();
    }
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
}

/**
 * Play a pleasant glass chime using Web Audio API (Zero external assets needed)
 */
export function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // First tone (E6 ~ 1318.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.45);

    // Second tone (B6 ~ 1975.5 Hz)
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.18);

        gain2.gain.setValueAtTime(0.22, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.55);
      } catch (e) {}
    }, 120);
  } catch (err) {
    // AudioContext blocked or not allowed yet
  }
}

/**
 * Display a push notification via the Service Worker
 */
export async function showPushNotification({
  title = 'ServiGo Notification',
  body = 'You have a new update.',
  icon = '/favicon.svg',
  data = {},
  tag = 'servigo-notification'
}) {
  if (!isNotificationSupported()) return false;

  // Play chime for incoming notification
  playNotificationChime();

  // If permission is not granted, skip native system notification
  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Check for active service worker registration
    const reg = swRegistration || (await navigator.serviceWorker.ready);

    if (reg && reg.showNotification) {
      await reg.showNotification(title, {
        body,
        icon,
        badge: icon,
        tag,
        renotify: true,
        data: {
          url: data.url || '/bookings',
          ...data
        },
        actions: [
          { action: 'view', title: '👀 View Booking' },
          { action: 'close', title: 'Dismiss' }
        ]
      });
      return true;
    } else if (reg && reg.active) {
      reg.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        icon,
        data,
        tag
      });
      return true;
    }
  } catch (err) {
    console.warn('Service Worker notification failed, falling back to Notification API:', err);
  }

  // Fallback to standard Notification API
  try {
    const n = new Notification(title, {
      body,
      icon,
      tag,
      data
    });
    n.onclick = () => {
      window.focus();
      if (data.url && window.location.pathname !== data.url) {
        window.location.href = data.url;
      }
      n.close();
    };
    return true;
  } catch (err) {
    console.error('Native notification fallback failed:', err);
    return false;
  }
}
