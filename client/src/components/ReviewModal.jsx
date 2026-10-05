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
        <div className="modal-content border-0 shadow" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="modal-header bg-primary-aesthetic text-white border-0 py-3">
            <h5 className="modal-title fw-bold fs-6">
              <i className="bi bi-star-fill me-2 text-warning"></i>Rate & Review Service
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small mb-3">{error}</div>
              )}

              <div className="text-center mb-3">
                <h6 className="fw-bold mb-1">{providerName}</h6>
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
                        color: star <= rating ? '#FBB02D' : 'rgba(202, 240, 248, 0.35)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <small className="text-muted fw-semibold">
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Average'}
                  {rating === 2 && 'Poor'}
                  {rating === 1 && 'Terrible'}
                </small>
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold small text-muted">Your Experience / Feedback</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="How was the service? Was the technician on time and professional?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  style={{ borderRadius: 10, fontSize: 14 }}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer border-0 py-2" style={{ background: "rgba(3, 14, 40, 0.7)", borderTop: "1px solid rgba(0, 180, 216, 0.25)" }}>
              <button type="button" className="btn btn-light-aesthetic btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary-aesthetic btn btn-sm" disabled={loading}>
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
