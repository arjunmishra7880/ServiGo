import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('providers');
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch providers
      const resP = await fetch(`${API_BASE}/api/providers`);
      const dataP = await resP.json();
      setProviders(dataP.providers || []);

      // 2. Fetch users
      const resU = await fetch(`${API_BASE}/api/auth/users`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const dataU = await resU.json();
      setUsers(dataU.users || []);

      // 3. Fetch all bookings
      const resB = await fetch(`${API_BASE}/api/bookings/my`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const dataB = await resB.json();
      setBookings(dataB.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerify = async (providerId) => {
    try {
      const res = await fetch(`${API_BASE}/api/providers/` + providerId + '/verify', {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update verification');

      setMessage('Verification status updated!');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container py-5 text-center">
        <div className="card-aesthetic p-5 mx-auto" style={{ maxWidth: 450 }}>
          <i className="bi bi-shield-slash text-danger display-4 mb-3"></i>
          <h4>Admin Access Required</h4>
          <p className="text-muted">You must be logged in as an Administrator to view this control panel.</p>
          <div className="d-flex gap-2 justify-content-center">
            <Link to="/login" className="btn-primary-aesthetic btn btn-sm">Login as Admin</Link>
            <Link to="/" className="btn-light-aesthetic btn btn-sm">Back to Home</Link>
          </div>
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
              <i className="bi bi-tools me-2" style={{ color: '#10C4A8' }}></i>
              ServiGo <span className="badge ms-2" style={{ background: '#E6FAF6', color: '#00684A', border: '1px solid rgba(16, 196, 168, 0.4)', fontSize: 12 }}>Admin Panel</span>
            </span>
          </Link>
          <div className="d-flex align-items-center gap-3">
            <Link to="/dashboard" className="btn btn-sm btn-primary-aesthetic" style={{ borderRadius: 10, fontSize: 13 }}>
              <i className="bi bi-graph-up-arrow me-1"></i>Analytics Studio
            </Link>
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>
              <i className="bi bi-house-door me-1"></i>View Site
            </Link>
            <span className="badge p-2" style={{ background: '#E6FAF6', color: '#00684A', border: '1px solid rgba(16, 196, 168, 0.35)' }}>
              <i className="bi bi-shield-check me-1" style={{ color: '#10C4A8' }}></i>{user.name}
            </span>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>System Overview</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>Manage platform users, provider verification, bookings, and performance telemetry</p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/dashboard" className="btn btn-sm btn-light-aesthetic" style={{ fontWeight: 700, borderRadius: 10, fontSize: 13 }}>
              <i className="bi bi-speedometer2 me-1"></i>Provider Performance
            </Link>
            <button onClick={loadData} className="btn btn-light-aesthetic btn-sm">
              <i className="bi bi-arrow-clockwise me-1"></i>Refresh Data
            </button>
          </div>
        </div>

        {message && (
          <div className="alert alert-success py-2 small mb-3" style={{ borderRadius: 10 }}>
            <i className="bi bi-check-circle me-1"></i>{message}
          </div>
        )}

        {/* Stats Row in MongoDB #10C4A8 cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card-aesthetic p-3 d-flex align-items-center gap-3 shadow-sm" style={{ border: '1px solid rgba(0, 30, 43, 0.12)' }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: '#FFFFFF', color: '#001E2B', border: '1px solid rgba(0, 30, 43, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <i className="bi bi-people-fill"></i>
              </div>
              <div>
                <h4 style={{ fontWeight: 800, margin: 0, color: '#001E2B' }}>{users.length}</h4>
                <small style={{ color: '#001E2B', opacity: 0.85 }}>Registered Accounts</small>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card-aesthetic p-3 d-flex align-items-center gap-3 shadow-sm" style={{ border: '1px solid rgba(0, 30, 43, 0.12)' }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: '#FFFFFF', color: '#00684A', border: '1px solid rgba(0, 30, 43, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <i className="bi bi-patch-check-fill"></i>
              </div>
              <div>
                <h4 style={{ fontWeight: 800, margin: 0, color: '#001E2B' }}>{providers.length}</h4>
                <small style={{ color: '#001E2B', opacity: 0.85 }}>Service Providers</small>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card-aesthetic p-3 d-flex align-items-center gap-3 shadow-sm" style={{ border: '1px solid rgba(0, 30, 43, 0.12)' }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: '#FFFFFF', color: '#10C4A8', border: '1px solid rgba(0, 30, 43, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <i className="bi bi-calendar2-check-fill"></i>
              </div>
              <div>
                <h4 style={{ fontWeight: 800, margin: 0, color: '#001E2B' }}>{bookings.length}</h4>
                <small style={{ color: '#001E2B', opacity: 0.85 }}>Total Appointments</small>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="d-flex gap-2 mb-4 border-bottom pb-2">
          <button
            onClick={() => setActiveTab('providers')}
            className={'btn btn-sm ' + (activeTab === 'providers' ? 'btn-primary-aesthetic' : 'btn-light-aesthetic')}
          >
            <i className="bi bi-briefcase me-1"></i>Providers ({providers.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={'btn btn-sm ' + (activeTab === 'users' ? 'btn-primary-aesthetic' : 'btn-light-aesthetic')}
          >
            <i className="bi bi-people me-1"></i>Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={'btn btn-sm ' + (activeTab === 'bookings' ? 'btn-primary-aesthetic' : 'btn-light-aesthetic')}
          >
            <i className="bi bi-calendar-check me-1"></i>Bookings ({bookings.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#10C4A8' }}></div>
            <p className="text-muted mt-2">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Providers Table */}
            {activeTab === 'providers' && (
              <div className="card-aesthetic p-3 shadow-sm" style={{ border: '1px solid rgba(0, 30, 43, 0.12)' }}>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
                    <thead className="text-muted" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                      <tr>
                        <th>Provider / Agency</th>
                        <th>Lead Technician</th>
                        <th>City / Area</th>
                        <th>Rating</th>
                        <th>Hourly Rate</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.businessName || p.user.name}</strong>
                          </td>
                          <td>{p.user.name}</td>
                          <td>{p.city} ({p.serviceArea})</td>
                          <td>★ {p.rating} ({p.reviewCount})</td>
                          <td>₹{p.hourlyRate}/hr</td>
                          <td>
                            {p.isVerified ? (
                              <span className="badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                                Verified
                              </span>
                            ) : (
                              <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                                Unverified
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleVerify(p.id)}
                              className="btn btn-sm"
                              style={{
                                borderRadius: 8,
                                fontSize: 12,
                                background: p.isVerified ? '#fee2e2' : '#dcfce7',
                                color: p.isVerified ? '#b91c1c' : '#15803d',
                                border: 'none',
                                fontWeight: 600
                              }}
                            >
                              {p.isVerified ? 'Revoke' : 'Approve'}
                            </button>
                            <Link
                              to="/dashboard"
                              className="btn btn-sm ms-1 text-white"
                              style={{
                                borderRadius: 8,
                                fontSize: 12,
                                background: '#001E2B',
                                border: 'none',
                                fontWeight: 600
                              }}
                              title="View Provider Analytics"
                            >
                              <i className="bi bi-bar-chart-fill me-1"></i>Metrics
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Table */}
            {activeTab === 'users' && (
              <div className="card-aesthetic p-3 shadow-sm" style={{ border: '1px solid rgba(0, 30, 43, 0.12)' }}>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
                    <thead className="text-muted" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                      <tr>
                        <th>ID</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Registered Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>#{u.id}</td>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td>{u.phone || '—'}</td>
                          <td>
                            <span className="badge text-capitalize shadow-sm" style={{
                              background: u.role === 'admin' ? '#001E2B' : u.role === 'provider' ? '#00684A' : '#FFFFFF',
                              color: u.role === 'admin' ? '#FFFFFF' : u.role === 'provider' ? '#FFFFFF' : '#001E2B',
                              border: '1px solid rgba(0, 30, 43, 0.15)'
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bookings Table */}
            {activeTab === 'bookings' && (
              <div className="card-aesthetic p-3">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
                    <thead className="text-muted" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                      <tr>
                        <th>Booking ID</th>
                        <th>Service</th>
                        <th>Customer</th>
                        <th>Provider</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id}>
                          <td>#{b.id}</td>
                          <td><strong>{b.service?.title}</strong></td>
                          <td>{b.customer?.name} ({b.customer?.phone || 'No phone'})</td>
                          <td>{b.service?.provider?.user?.name}</td>
                          <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
                          <td className="fw-bold text-success">₹{b.totalAmount}</td>
                          <td>
                            <span className="badge text-capitalize" style={{
                              background: b.status === 'completed' ? '#dcfce7' : b.status === 'accepted' ? '#dbeafe' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                              color: b.status === 'completed' ? '#15803d' : b.status === 'accepted' ? '#1e40af' : b.status === 'cancelled' ? '#b91c1c' : '#92400e'
                            }}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
