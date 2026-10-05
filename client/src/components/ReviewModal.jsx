import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

function ReviewModal({ booking, onClose, onSuccess }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const providerId = booking.service?.provider?.id;
  const providerName = booking.service?.provider?.businessName || booking.service?.provider?.user?.name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!providerId) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          providerId,
          rating,
          comment
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      onSuccess();
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
              <i className="bi bi-star-fill me-2" style={{ color: '#10C4A8' }}></i>Rate & Review Service
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ backgroundColor: '#FFFBFC', color: '#001E2B' }}>
              {error && (
                <div className="alert alert-danger py-2 small mb-3">{error}</div>
              )}

              <div className="text-center mb-3">
                <h6 className="fw-bold mb-1" style={{ color: '#001E2B' }}>{providerName}</h6>
                <p className="text-muted small mb-3">{booking.service?.title}</p>

                {/* Interactive Star Rating */}
                <div className="d-flex justify-content-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 28,
                        color: star <= rating ? '#10C4A8' : '#D0E6E2',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <small className="fw-bold" style={{ color: '#00684A' }}>
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Average'}
                  {rating === 2 && 'Poor'}
                  {rating === 1 && 'Terrible'}
                </small>
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold small" style={{ color: '#001E2B' }}>Your Experience / Feedback</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="How was the service? Was the technician on time and professional?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  style={{ borderRadius: 10, fontSize: 14, borderColor: 'rgba(16, 196, 168, 0.4)' }}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer border-0 py-2" style={{ background: '#F0FAF8', borderTop: '1px solid rgba(16, 196, 168, 0.2)' }}>
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm px-4 fw-semibold rounded-pill text-white shadow-sm" style={{ background: '#10C4A8', border: 'none' }} disabled={loading}>
                {loading ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReviewModal;
