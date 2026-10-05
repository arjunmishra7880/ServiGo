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
        <div className="modal-content border-0 shadow" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="modal-header bg-primary-aesthetic text-white border-0 py-3">
            <h5 className="modal-title fw-bold fs-6">
              <i className="bi bi-calendar-check me-2" style={{ color: '#00B4D8' }}></i>Book Service
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small">{error}</div>
              )}

              {/* Service Summary Card */}
              <div className="p-3 mb-3" style={{ background: 'rgba(0, 180, 216, 0.15)', border: '1px solid rgba(0, 180, 216, 0.35)', borderRadius: 12 }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold mb-1" style={{ color: '#FFFFFF' }}>{service.title}</h6>
                    <small style={{ color: '#CAF0F8', opacity: 0.9 }}>
                      Provider: <strong style={{ color: '#FFFFFF' }}>{provider.businessName || provider.user?.name}</strong>
                    </small>
                  </div>
                  <span className="badge fs-6 px-3 py-2" style={{ background: 'linear-gradient(135deg, #FBB02D 0%, #E59F24 100%)', color: '#03045E', fontWeight: 800 }}>
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
                <label className="form-label fw-semibold small">Preferred Appointment Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Service Location / Address</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Flat number, building, street, area, city..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold small">Special Instructions / Issue Details (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Please bring extra 1/2 inch PVC pipe connectors"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer border-0 py-2" style={{ background: 'rgba(3, 14, 40, 0.7)', borderTop: '1px solid rgba(0, 180, 216, 0.25)' }}>
              <button type="button" className="btn btn-light-aesthetic btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary-aesthetic btn btn-sm px-4 fw-semibold" disabled={loading}>
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