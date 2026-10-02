import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card-aesthetic p-5 text-center" style={{ maxWidth: 460 }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#023eba', lineHeight: 1, marginBottom: 12 }}>404</div>
        <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Page Not Found</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link to="/" className="btn-primary-aesthetic btn px-4">
          <i className="bi bi-house-door me-2"></i>Return Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
