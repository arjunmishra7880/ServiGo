import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

function BookingModal({ service, provider, onClose, onSuccess }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [bookingDate, setBookingDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!service || !provider) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          serviceId: service.id,
          bookingDate,
          address,
          notes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place booking.');
      }

      onSuccess(data.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFBFC', border: '1px solid rgba(16, 196, 168, 0.3)' }}>
          <div className="modal-header border-0 py-3" style={{ background: '#001E2B', color: '#FFFFFF' }}>
            <h5 className="modal-title fw-bold fs-6">
              <i className="bi bi-calendar-check me-2" style={{ color: '#10C4A8' }}></i>Book Service
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ backgroundColor: '#FFFBFC', color: '#001E2B' }}>
              {error && (
                <div className="alert alert-danger py-2 small">{error}</div>
              )}

              {/* Service Summary Card in MongoDB mint #10C4A8 */}
              <div className="p-3 mb-3 shadow-sm" style={{ background: 'linear-gradient(135deg, #10C4A8 0%, #0DB197 100%)', border: '1px solid rgba(0, 30, 43, 0.1)', borderRadius: 12, color: '#001E2B' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold mb-1" style={{ color: '#001E2B', fontSize: 16 }}>{service.title}</h6>
                    <small style={{ color: '#001E2B', opacity: 0.9 }}>
                      Provider: <strong style={{ color: '#001E2B' }}>{provider.businessName || provider.user?.name}</strong>
                    </small>
                  </div>
                  <span className="badge fs-6 px-3 py-2 shadow-sm" style={{ background: '#FFFFFF', color: '#001E2B', fontWeight: 800 }}>
                    ₹{service.price}
                  </span>
                </div>
              </div>

              {!user && (
                <div className="alert alert-warning small">
                  <i className="bi bi-info-circle me-1"></i> You need to be logged in to book this service. Clicking submit will take you to Login.
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold small" style={{ color: '#001E2B' }}>Preferred Appointment Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  style={{ borderColor: 'rgba(16, 196, 168, 0.4)', borderRadius: 8 }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small" style={{ color: '#001E2B' }}>Service Location / Address</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Flat number, building, street, area, city..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  style={{ borderColor: 'rgba(16, 196, 168, 0.4)', borderRadius: 8 }}
                ></textarea>
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold small" style={{ color: '#001E2B' }}>Special Instructions / Issue Details (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Please bring extra 1/2 inch PVC pipe connectors"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ borderColor: 'rgba(16, 196, 168, 0.4)', borderRadius: 8 }}
                />
              </div>
            </div>

            <div className="modal-footer border-0 py-2" style={{ background: '#F0FAF8', borderTop: '1px solid rgba(16, 196, 168, 0.2)' }}>
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm px-4 fw-semibold rounded-pill text-white shadow-sm" style={{ background: '#10C4A8', border: 'none' }} disabled={loading}>
                {loading ? 'Booking...' : (user ? 'Confirm Booking' : 'Proceed to Login')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;