import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import BookingModal from '../components/BookingModal';
import { API_BASE } from '../config/api';

function ProviderDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { addConversation, setActiveConversation } = useSocket();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState('');

  const handleStartChat = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ providerId: id })
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
    fetchProvider();
  }, [id]);

  const fetchProvider = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/providers/` + id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Provider not found');
      setProvider(data.provider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    setActiveBooking(null);
    setBookingSuccess('Booking confirmed! Track its status in My Bookings.');
    setTimeout(() => setBookingSuccess(''), 5000);
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2">Loading provider profile...</p>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="container py-5 text-center">
        <div className="card-aesthetic p-5 max-w-md mx-auto">
          <i className="bi bi-exclamation-circle text-warning display-4 mb-3"></i>
          <h4>Provider Not Found</h4>
          <p className="text-muted">{error || 'The requested service provider could not be found.'}</p>
          <Link to="/" className="btn-primary-aesthetic btn btn-sm mt-2">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar-servigo sticky-top px-0" style={{ zIndex: 999 }}>
        <div className="container d-flex align-items-center justify-content-between py-3">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span className="brand-text fs-4">
              <i className="bi bi-tools me-2" style={{ color: '#023eba' }}></i>
              ServiGo
            </span>
          </Link>
          <div className="d-flex align-items-center gap-3">
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>
              <i className="bi bi-arrow-left me-1"></i>Back to Home
            </Link>
            {user ? (
              <Link to="/bookings" className="btn btn-light-aesthetic btn-sm">
                <i className="bi bi-calendar-check me-1"></i>My Bookings
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary-aesthetic btn-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {bookingSuccess && (
        <div style={{ background: '#dcfce7', borderBottom: '1px solid #86efac', padding: '12px 0', textAlign: 'center', color: '#15803d', fontWeight: 600 }}>
          <i className="bi bi-check-circle-fill me-2"></i>{bookingSuccess}
        </div>
      )}

      <div className="container py-5">
        <div className="row g-4">
          {/* Left Column: Profile Card */}
          <div className="col-lg-4">
            <div className="card-aesthetic p-4 sticky-top" style={{ top: 90 }}>
              <div className="text-center pb-3 border-bottom mb-3">
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0, 180, 216, 0.15)', color: '#00B4D8', border: '1.5px solid rgba(0, 180, 216, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 12px' }}>
                  <i className="bi bi-person-fill"></i>
                </div>
                <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {provider.businessName || provider.user.name}
                </h4>
                {user && user.id !== provider.userId && user.role === 'customer' && (
                <button
                  onClick={handleStartChat}
                  className="btn btn-primary-aesthetic w-100 mb-2"
                  style={{
                    padding: '10px',
                    fontWeight: 700
                  }}
                >
                  <i className="bi bi-chat-dots-fill me-2"></i>Message Provider
                </button>
              )}
              {provider.isVerified && (
                <span className="badge" style={{ background: 'rgba(0, 180, 216, 0.15)', color: '#FFFFFF', border: '1px solid rgba(0, 180, 216, 0.35)', fontWeight: 600 }}>
                  <i className="bi bi-patch-check-fill me-1" style={{ color: '#00B4D8' }}></i>Verified Specialist
                </span>
              )}
              </div>

              <div className="d-flex justify-content-around text-center py-2 mb-3 rounded-3" style={{ background: 'rgba(0, 180, 216, 0.12)', border: '1px solid rgba(0, 180, 216, 0.28)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#FBB02D' }}>
                    ★ {provider.rating}
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>{provider.reviewCount} reviews</small>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-light)' }}></div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
                    {provider.experience} yrs
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>Experience</small>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-light)' }}></div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#00B4D8' }}>
                    ₹{provider.hourlyRate}
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>per hr base</small>
                </div>
              </div>

              <div className="mb-3">
                <h6 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5 }}>About</h6>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{provider.bio}</p>
              </div>

              <div className="mb-2">
                <h6 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5 }}>Location & Coverage</h6>
                <div className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  <i className="bi bi-geo-alt-fill text-danger"></i>
                  <span><strong>City:</strong> {provider.city}</span>
                </div>
                <div className="d-flex align-items-center gap-2" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  <i className="bi bi-map-fill" style={{ color: '#00B4D8' }}></i>
                  <span><strong>Service Areas:</strong> {provider.serviceArea}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Services & Reviews */}
          <div className="col-lg-8">
            {/* Services List */}
            <div className="card-aesthetic p-4 mb-4">
              <h5 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                Services Offered ({provider.services?.length || 0})
              </h5>

              <div className="d-flex flex-column gap-3">
                {provider.services && provider.services.map((s) => (
                  <div key={s.id} className="p-3 rounded-3" style={{ background: 'rgba(0, 180, 216, 0.12)', border: '1px solid rgba(0, 180, 216, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge" style={{ background: 'rgba(0, 180, 216, 0.22)', color: '#FFFFFF', border: '1px solid rgba(0, 180, 216, 0.35)' }}>
                          {s.category?.name || 'General'}
                        </span>
                        <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{s.title}</h6>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{s.description}</p>
                    </div>

                    <div className="d-flex align-items-center gap-3 ms-auto">
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#00B4D8' }}>₹{s.price}</span>
                      <button
                        onClick={() => setActiveBooking({ service: s, provider })}
                        className="btn-primary-aesthetic btn btn-sm"
                        style={{ padding: '7px 18px' }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="card-aesthetic p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 style={{ fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Customer Reviews ({provider.reviews?.length || 0})
                </h5>
                <span className="badge" style={{ background: '#fef9c3', color: '#92400e', fontSize: 13 }}>
                  ★ {provider.rating} Average
                </span>
              </div>

              {provider.reviews && provider.reviews.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {provider.reviews.map((r) => (
                    <div key={r.id} className="p-3 rounded-3" style={{ background: 'rgba(0, 180, 216, 0.10)', border: '1px solid rgba(0, 180, 216, 0.22)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>
                            {r.customer?.name || 'Verified Customer'}
                          </strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span style={{ color: '#FBB02D', fontWeight: 700 }}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                        "{r.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>No reviews yet for this provider.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {activeBooking && (
        <BookingModal
          service={activeBooking.service}
          provider={activeBooking.provider}
          onClose={() => setActiveBooking(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}

export default ProviderDetail;
