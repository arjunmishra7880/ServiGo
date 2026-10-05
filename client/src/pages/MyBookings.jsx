import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ReviewModal from '../components/ReviewModal';
import { API_BASE } from '../config/api';

function MyBookings() {
  const { user, token } = useAuth();
  const { addConversation, setActiveConversation } = useSocket();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [reviewBooking, setReviewBooking] = useState(null);

  const handleStartChat = async (otherUserId, otherUserRole) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      let providerId;
      if (user.role === 'provider' && otherUserRole === 'customer') {
        // Provider wants to chat with customer - find the provider profile
        const res = await fetch(`${API_BASE}/api/providers/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.provider) {
          providerId = data.provider.id;
        }
      } else if (user.role === 'customer' && otherUserRole === 'provider') {
        // Customer wants to chat with provider - the booking has the provider info
        providerId = otherUserId;
      }

      if (!providerId) return;

      const res = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ providerId })
      });
      const data = await res.json();
      if (data.conversation) {
        addConversation(data.conversation);
        setActiveConversation(data.conversation);
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/bookings/my`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load bookings');
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/` + bookingId + '/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status update failed');
      setActionMessage('Booking updated to ' + newStatus);
      setTimeout(() => setActionMessage(''), 3500);
      fetchBookings();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="badge" style={{ background: '#dbeafe', color: '#1e40af' }}>Accepted</span>;
      case 'completed':
        return <span className="badge" style={{ background: '#dcfce7', color: '#15803d' }}>Completed</span>;
      case 'cancelled':
        return <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Cancelled</span>;
      default:
        return <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>Pending</span>;
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar-servigo sticky-top px-0" style={{ zIndex: 999 }}>
        <div className="container d-flex align-items-center justify-content-between py-3">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span className="brand-text fs-4">
              <i className="bi bi-tools me-2" style={{ color: '#10C4A8' }}></i>
              ServiGo
            </span>
          </Link>
          <div className="d-flex align-items-center gap-3">
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>
              <i className="bi bi-house-door me-1"></i>Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>My Bookings</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>
              {user?.role === 'provider' ? 'Customer appointments requested for your services' : 'Your scheduled appointments with local experts'}
            </p>
          </div>
          <button onClick={fetchBookings} className="btn btn-light-aesthetic btn-sm">
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>

        {actionMessage && (
          <div className="alert alert-success py-2 small mb-3" style={{ borderRadius: 10 }}>
            <i className="bi bi-check-circle me-1"></i>{actionMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius: 10 }}>{error}</div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#10C4A8' }}></div>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="card-aesthetic p-5 text-center">
            <i className="bi bi-calendar-x display-4 text-muted mb-3"></i>
            <h5>No bookings found</h5>
            <p className="text-muted mb-4">You have not scheduled any service appointments yet.</p>
            <div>
              <Link to="/" className="btn-primary-aesthetic btn btn-sm px-4">
                Explore Services
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {bookings.map((b) => (
              <div key={b.id} className="col-md-6 col-lg-4">
                <div className="card-aesthetic p-4 h-100 d-flex flex-column shadow-sm" style={{ border: '1px solid rgba(0, 30, 43, 0.12)' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge shadow-sm" style={{ background: '#FFFFFF', color: '#001E2B', border: '1px solid rgba(0, 30, 43, 0.1)', fontWeight: 600 }}>
                      {b.service?.category?.name || 'Service'}
                    </span>
                    {getStatusBadge(b.status)}
                  </div>

                  <h6 style={{ fontWeight: 800, color: '#001E2B', marginBottom: 4 }}>{b.service?.title}</h6>

                  <div style={{ fontSize: 13, color: '#001E2B', opacity: 0.85, marginBottom: 8 }}>
                    {user?.role === 'provider' ? (
                      <div><i className="bi bi-person me-1"></i>Customer: <strong style={{ color: '#001E2B' }}>{b.customer?.name}</strong> ({b.customer?.phone || 'No phone'})</div>
                    ) : (
                      <div><i className="bi bi-person-badge me-1"></i>Provider: <strong style={{ color: '#001E2B' }}>{b.service?.provider?.user?.name}</strong></div>
                    )}
                  </div>

                  <div style={{ fontSize: 13, color: '#001E2B', opacity: 0.85, marginBottom: 4 }}>
                    <i className="bi bi-clock me-1"></i>{new Date(b.bookingDate).toLocaleString()}
                  </div>

                  <div style={{ fontSize: 13, color: '#001E2B', opacity: 0.85, marginBottom: 8 }}>
                    <i className="bi bi-geo-alt me-1"></i>{b.address}
                  </div>

                  {b.notes && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.55)', border: '1px solid rgba(0, 30, 43, 0.15)', padding: 8, borderRadius: 8, fontSize: 12, color: '#001E2B', marginBottom: 12 }}>
                      <em>Note: {b.notes}</em>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-auto" style={{ borderColor: 'rgba(0, 30, 43, 0.15)' }}>
                    <span style={{ fontWeight: 800, color: '#001E2B', fontSize: 17 }}>₹{b.totalAmount}</span>

                    <div className="d-flex gap-1">
                      {/* Provider Actions */}
                      {user?.role === 'provider' && b.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(b.id, 'accepted')}
                            className="btn btn-sm btn-dark"
                            style={{ borderRadius: 8, background: '#001E2B', borderColor: '#001E2B' }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusChange(b.id, 'cancelled')}
                            className="btn btn-sm btn-outline-danger bg-white"
                            style={{ borderRadius: 8 }}
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {user?.role === 'provider' && b.status === 'accepted' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'completed')}
                          className="btn btn-sm text-white"
                          style={{ borderRadius: 8, padding: '4px 12px', fontSize: 13, background: '#00684A', border: 'none' }}
                        >
                          Mark Done
                        </button>
                      )}

                      {/* Customer Actions */}
                      {user?.role === 'customer' && b.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'cancelled')}
                          className="btn btn-sm btn-outline-danger bg-white"
                          style={{ borderRadius: 8 }}
                        >
                          Cancel
                        </button>
                      )}

                      {/* Customer Review Button after Completed */}
                      {user?.role === 'customer' && b.status === 'completed' && (
                        <button
                          onClick={() => setReviewBooking(b)}
                          className="btn btn-sm bg-white"
                          style={{ color: '#001E2B', fontWeight: 700, borderRadius: 8, border: '1px solid rgba(0, 30, 43, 0.2)' }}
                        >
                          <i className="bi bi-star-fill me-1 text-warning"></i>Review
                        </button>
                      )}

                      {/* Chat Button */}
                      {((user?.role === 'provider' && b.status !== 'cancelled') ||
                        (user?.role === 'customer' && ['accepted', 'completed'].includes(b.status))) && (
                        <button
                          onClick={() => handleStartChat(
                            user.role === 'provider' ? b.customer?.id : b.service?.provider?.user?.id,
                            user.role === 'provider' ? 'customer' : 'provider'
                          )}
                          className="btn btn-sm text-white"
                          style={{
                            background: '#001E2B',
                            fontWeight: 600,
                            borderRadius: 8,
                            border: 'none'
                          }}
                          title="Message"
                        >
                          <i className="bi bi-chat-dots-fill me-1"></i>Chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            setActionMessage('Thank you for submitting your review!');
            setTimeout(() => setActionMessage(''), 4000);
          }}
        />
      )}
    </div>
  );
}

export default MyBookings;
