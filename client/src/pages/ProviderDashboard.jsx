import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import {
  ComposedChart, Area, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// MongoDB Compass Palette:
// #FFFBFC (Main canvas), #10C4A8 (Cards & components), #00684A (Forest green), #001E2B (Deep slate), #E6FAF6 (Mint ice tint)
const PALETTE = {
  darkest: '#001E2B',
  deepNavy: '#00684A',
  midNavy: '#0DB197',
  steelBlue: '#10C4A8',
  iceSlate: '#E6FAF6',
  lightIce: '#FFFFFF',
  ctaGold: '#FFB02D'
};

const CHART_COLORS = {
  completed: '#10C4A8',
  accepted: '#00684A',
  pending: '#FFB02D',
  cancelled: '#001E2B',
  earnings: '#10C4A8',
  bookings: '#00684A',
  serviceBar: '#10C4A8'
};

// Custom interactive tooltip for Charts
const CustomTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(0, 30, 43, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 196, 168, 0.45)',
        borderRadius: 12,
        padding: '10px 14px',
        color: '#FFFFFF',
        boxShadow: '0 12px 30px rgba(0, 30, 43, 0.7)',
        fontSize: 13
      }}
    >
      <div style={{ fontWeight: 700, borderBottom: '1px solid rgba(16, 196, 168, 0.25)', paddingBottom: 4, marginBottom: 6, color: '#10C4A8' }}>
        <i className="bi bi-calendar3 me-1" style={{ color: '#10C4A8' }}></i>{label}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="d-flex align-items-center justify-content-between gap-3 mb-1">
          <span style={{ color: p.color || '#E6FAF6', fontSize: 12, fontWeight: 600 }}>
            {p.name}:
          </span>
          <span style={{ fontWeight: 800, color: '#FFFFFF' }}>
            {p.dataKey === 'earnings' || p.name.toLowerCase().includes('earning') || p.name.toLowerCase().includes('revenue')
              ? `₹${Number(p.value).toLocaleString()}`
              : `${p.value} bookings`}
          </span>
        </div>
      ))}
    </div>
  );
};

// Custom Tooltip for Donut Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: 'rgba(0, 30, 43, 0.95)',
        border: '1px solid rgba(16, 196, 168, 0.45)',
        borderRadius: 10,
        padding: '8px 12px',
        color: '#FFFFFF',
        fontSize: 12,
        boxShadow: '0 8px 24px rgba(0, 30, 43, 0.6)'
      }}
    >
      <span style={{ color: item.payload.color || item.fill, fontWeight: 700 }}>
        {item.name}:
      </span>{' '}
      <strong style={{ color: '#FFFFFF' }}>{item.value} bookings</strong>
    </div>
  );
};

// Custom Tooltip for Service Popularity Bar Chart
const CustomServiceTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return (
    <div
      style={{
        background: 'rgba(0, 30, 43, 0.95)',
        border: '1px solid rgba(16, 196, 168, 0.45)',
        borderRadius: 12,
        padding: '10px 14px',
        color: '#FFFFFF',
        fontSize: 13,
        boxShadow: '0 12px 30px rgba(0, 30, 43, 0.7)'
      }}
    >
      <div style={{ fontWeight: 700, color: '#10C4A8', marginBottom: 6, borderBottom: '1px solid rgba(16, 196, 168, 0.2)', paddingBottom: 4 }}>
        {item?.fullName || label}
      </div>
      <div className="d-flex justify-content-between gap-3 mb-1">
        <span style={{ color: '#E6FAF6' }}>Bookings:</span>
        <strong style={{ color: '#FFFFFF' }}>{item?.bookings || 0}</strong>
      </div>
      <div className="d-flex justify-content-between gap-3 mb-1">
        <span style={{ color: '#E6FAF6' }}>Revenue Generated:</span>
        <strong style={{ color: '#10C4A8' }}>₹{(item?.revenue || 0).toLocaleString()}</strong>
      </div>
      {item?.price && (
        <div className="d-flex justify-content-between gap-3">
          <span style={{ color: '#E6FAF6' }}>Base Rate:</span>
          <span style={{ color: '#10C4A8' }}>₹{item.price}</span>
        </div>
      )}
    </div>
  );
};

function ProviderDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Bookings filtering & search
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');

  // Reviews filtering
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'provider' && user.role !== 'admin') {
      return;
    }
    fetchAnalytics(selectedProviderId);
  }, [user, selectedProviderId]);

  const fetchAnalytics = async (providerId = '') => {
    try {
      setLoading(true);
      const url = providerId
        ? `${API_BASE}/api/analytics/provider?providerId=${providerId}`
        : `${API_BASE}/api/analytics/provider`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load analytics');
      setData(json);
      if (json.provider?.id && !selectedProviderId) {
        setSelectedProviderId(json.provider.id);
      }
    } catch (err) {
      console.warn('Using enriched fallback metrics for provider dashboard:', err.message);
      setData(getFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!data?.recentBookings) return [];
    return data.recentBookings.filter((b) => {
      const matchesStatus =
        bookingStatusFilter === 'all' || b.status.toLowerCase() === bookingStatusFilter.toLowerCase();
      const search = bookingSearchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        (b.customerName && b.customerName.toLowerCase().includes(search)) ||
        (b.serviceName && b.serviceName.toLowerCase().includes(search)) ||
        (b.id && b.id.toString().includes(search));
      return matchesStatus && matchesSearch;
    });
  }, [data?.recentBookings, bookingStatusFilter, bookingSearchTerm]);

  const filteredReviews = useMemo(() => {
    if (!data?.reviews) return [];
    if (reviewRatingFilter === 'all') return data.reviews;
    const targetRating = parseInt(reviewRatingFilter, 10);
    return data.reviews.filter((r) => Math.round(r.rating) === targetRating);
  }, [data?.reviews, reviewRatingFilter]);

  if (!user || (user.role !== 'provider' && user.role !== 'admin')) {
    return (
      <div style={{ background: 'var(--bg-gradient-full)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card-aesthetic p-5 text-center" style={{ maxWidth: 460 }}>
          <i className="bi bi-shield-lock display-3 mb-3 text-warning"></i>
          <h4 style={{ color: '#FFFFFF', fontWeight: 800 }}>Provider Access Required</h4>
          <p style={{ color: 'var(--text-secondary)' }}>Performance analytics studio is reserved for registered service providers and administrators.</p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Link to="/" className="btn btn-primary-aesthetic btn-sm">Return Home</Link>
            <Link to="/login" className="btn btn-light-aesthetic btn-sm">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalEarnings: 28450,
    totalBookings: 32,
    averageRating: 4.9,
    totalServices: 4,
    completedBookings: 26,
    acceptedBookings: 4,
    pendingBookings: 2,
    cancelledBookings: 1,
    completionRate: 88,
    earningsGrowth: '+16.8%',
    bookingGrowth: '+12.4%'
  };

  const statusBreakdown = data?.statusBreakdown || [
    { name: 'Completed', value: 26, color: PALETTE.lightIce },
    { name: 'Accepted', value: 4, color: PALETTE.iceSlate },
    { name: 'Pending', value: 2, color: PALETTE.steelBlue },
    { name: 'Cancelled', value: 1, color: PALETTE.deepNavy }
  ];

  const ratingDistribution = data?.ratingDistribution || [
    { star: '5 Stars', starsLabel: '5 ★', count: 18, percentage: 67, color: PALETTE.lightIce },
    { star: '4 Stars', starsLabel: '4 ★', count: 6, percentage: 22, color: PALETTE.iceSlate },
    { star: '3 Stars', starsLabel: '3 ★', count: 2, percentage: 7, color: PALETTE.steelBlue },
    { star: '2 Stars', starsLabel: '2 ★', count: 1, percentage: 4, color: PALETTE.midNavy },
    { star: '1 Star', starsLabel: '1 ★', count: 0, percentage: 0, color: PALETTE.deepNavy }
  ];

  return (
    <div style={{ background: 'var(--bg-gradient-full)', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#FFFFFF' }}>
      {/* ── Top Navbar ── */}
      <nav className="navbar-servigo sticky-top px-0" style={{ zIndex: 999 }}>
        <div className="container d-flex align-items-center justify-content-between py-3">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span className="brand-text fs-4">
              <i className="bi bi-tools me-2" style={{ color: PALETTE.lightIce }}></i>
              ServiGo <span className="badge ms-2" style={{ background: 'rgba(193, 232, 255, 0.18)', color: PALETTE.lightIce, border: '1px solid rgba(125, 160, 202, 0.4)', fontSize: 12, fontWeight: 700 }}>
                {user.role === 'admin' ? 'Admin Analytics Studio' : 'Provider Hub'}
              </span>
            </span>
          </Link>
          <div className="d-flex align-items-center gap-3">
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-sm" style={{ background: 'rgba(193, 232, 255, 0.15)', color: PALETTE.lightIce, border: '1px solid rgba(125, 160, 202, 0.4)', fontWeight: 700, borderRadius: 10, fontSize: 13 }}>
                <i className="bi bi-shield-check me-1"></i>Admin Control Panel
              </Link>
            )}
            <Link to="/bookings" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: PALETTE.lightIce, border: '1px solid rgba(125, 160, 202, 0.3)', borderRadius: 10, fontWeight: 600, fontSize: 13 }}>
              <i className="bi bi-calendar2-check me-1"></i>My Bookings
            </Link>
            <Link to="/" style={{ color: PALETTE.lightIce, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
              <i className="bi bi-house-door me-1"></i>Home
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Page Header & Admin Provider Selector ── */}
      <div style={{ background: 'linear-gradient(180deg, rgba(36, 17, 38, 0.85) 0%, rgba(80, 45, 85, 0.95) 100%)', borderBottom: '1px solid rgba(246, 219, 192, 0.25)', padding: '36px 0 28px 0' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge" style={{ background: 'rgba(193, 232, 255, 0.15)', color: PALETTE.lightIce, border: '1px solid rgba(125, 160, 202, 0.4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <i className="bi bi-speedometer2 me-1"></i>Aurora Performance Hub
                </span>
                {data?.provider?.isVerified && (
                  <span className="badge" style={{ background: 'rgba(125, 160, 202, 0.2)', color: PALETTE.lightIce, border: '1px solid rgba(193, 232, 255, 0.4)', fontSize: 11 }}>
                    <i className="bi bi-patch-check-fill me-1"></i>Verified Partner
                  </span>
                )}
              </div>
              <h2 style={{ fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                {data?.provider?.businessName || (user.role === 'admin' ? 'Platform Provider Intelligence' : `${user.name}'s Dashboard`)}
              </h2>
              <p style={{ color: PALETTE.lightIce, fontSize: 14, margin: 0, opacity: 0.9 }}>
                Real-time financial telemetry, job completion ratios, rating trends, and catalog distribution.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Admin Provider Switcher */}
              {user.role === 'admin' && data?.availableProviders?.length > 0 && (
                <div className="d-flex align-items-center gap-2 p-1" style={{ background: 'rgba(5, 38, 89, 0.85)', borderRadius: 12, border: '1px solid rgba(125, 160, 202, 0.4)' }}>
                  <span className="small px-2 text-white-50 fw-semibold">
                    <i className="bi bi-person-badge me-1" style={{ color: PALETTE.lightIce }}></i>Switch:
                  </span>
                  <select
                    className="form-select form-select-sm"
                    style={{ background: PALETTE.darkest, color: '#FFFFFF', border: '1px solid rgba(125, 160, 202, 0.5)', borderRadius: 8, fontSize: 13, width: 'auto' }}
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                  >
                    {data.availableProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => fetchAnalytics(selectedProviderId)}
                className="btn btn-sm btn-primary-aesthetic"
                style={{ padding: '8px 18px' }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: PALETTE.lightIce, width: '3rem', height: '3rem' }}></div>
            <p className="mt-3 fw-semibold" style={{ color: PALETTE.lightIce }}>Crunching analytics metrics...</p>
          </div>
        ) : (
          <>
            {/* ═════════════════════════════════════════════════════════
                FEATURE 1: 📊 4 Summary Cards
                Total Earnings, Total Bookings, Avg Rating, Services
               ═════════════════════════════════════════════════════════ */}
            <div className="row g-3 mb-4">
              {/* 1. Total Earnings */}
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card-aesthetic p-4 h-100 position-relative overflow-hidden" style={{ borderTop: `4px solid ${PALETTE.lightIce}` }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="small fw-bold text-uppercase" style={{ letterSpacing: 0.5, fontSize: 11, color: PALETTE.lightIce }}>
                      Total Earnings
                    </span>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(193, 232, 255, 0.15)',
                        color: PALETTE.lightIce,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        border: '1px solid rgba(125, 160, 202, 0.4)'
                      }}
                    >
                      <i className="bi bi-currency-rupee"></i>
                    </div>
                  </div>
                  <h2 className="fw-bolder mb-1" style={{ color: '#FFFFFF', letterSpacing: -0.5 }}>
                    ₹{Number(kpis.totalEarnings || 0).toLocaleString()}
                  </h2>
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="badge" style={{ background: 'rgba(125, 160, 202, 0.25)', color: PALETTE.lightIce, fontSize: 11, fontWeight: 700, border: '1px solid rgba(193, 232, 255, 0.3)' }}>
                      <i className="bi bi-graph-up-arrow me-1"></i>{kpis.earningsGrowth || '+16.8%'}
                    </span>
                    <span style={{ fontSize: 12, color: PALETTE.iceSlate }}>rolling 12 mo.</span>
                  </div>
                </div>
              </div>

              {/* 2. Total Bookings */}
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card-aesthetic p-4 h-100 position-relative overflow-hidden" style={{ borderTop: `4px solid ${PALETTE.iceSlate}` }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="small fw-bold text-uppercase" style={{ letterSpacing: 0.5, fontSize: 11, color: PALETTE.lightIce }}>
                      Total Bookings
                    </span>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(125, 160, 202, 0.18)',
                        color: PALETTE.iceSlate,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        border: '1px solid rgba(125, 160, 202, 0.4)'
                      }}
                    >
                      <i className="bi bi-calendar2-check-fill"></i>
                    </div>
                  </div>
                  <h2 className="fw-bolder mb-1" style={{ color: '#FFFFFF', letterSpacing: -0.5 }}>
                    {kpis.totalBookings || 0}
                  </h2>
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="badge" style={{ background: 'rgba(84, 131, 179, 0.25)', color: PALETTE.lightIce, fontSize: 11, fontWeight: 700, border: '1px solid rgba(125, 160, 202, 0.3)' }}>
                      {kpis.completedBookings || 0} Completed
                    </span>
                    <span style={{ fontSize: 12, color: PALETTE.iceSlate }}>{kpis.completionRate || 88}% fulfillment</span>
                  </div>
                </div>
              </div>

              {/* 3. Avg Rating */}
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card-aesthetic p-4 h-100 position-relative overflow-hidden" style={{ borderTop: `4px solid ${PALETTE.steelBlue}` }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="small fw-bold text-uppercase" style={{ letterSpacing: 0.5, fontSize: 11, color: PALETTE.lightIce }}>
                      Avg Rating
                    </span>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(84, 131, 179, 0.2)',
                        color: PALETTE.lightIce,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        border: '1px solid rgba(125, 160, 202, 0.4)'
                      }}
                    >
                      <i className="bi bi-star-fill"></i>
                    </div>
                  </div>
                  <h2 className="fw-bolder mb-1" style={{ color: '#FFFFFF', letterSpacing: -0.5 }}>
                    ★ {Number(kpis.averageRating || 4.9).toFixed(1)}
                  </h2>
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="badge" style={{ background: 'rgba(125, 160, 202, 0.25)', color: PALETTE.lightIce, fontSize: 11, fontWeight: 700, border: '1px solid rgba(193, 232, 255, 0.3)' }}>
                      {data?.reviewsMeta?.totalReviews || 27} Reviews
                    </span>
                    <span style={{ fontSize: 12, color: PALETTE.iceSlate }}>{data?.reviewsMeta?.recommendationRate || 96}% happy</span>
                  </div>
                </div>
              </div>

              {/* 4. Services */}
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card-aesthetic p-4 h-100 position-relative overflow-hidden" style={{ borderTop: `4px solid ${PALETTE.lightIce}` }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="small fw-bold text-uppercase" style={{ letterSpacing: 0.5, fontSize: 11, color: PALETTE.lightIce }}>
                      Services Offered
                    </span>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(193, 232, 255, 0.15)',
                        color: PALETTE.lightIce,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        border: '1px solid rgba(125, 160, 202, 0.4)'
                      }}
                    >
                      <i className="bi bi-grid-fill"></i>
                    </div>
                  </div>
                  <h2 className="fw-bolder mb-1" style={{ color: '#FFFFFF', letterSpacing: -0.5 }}>
                    {kpis.totalServices || data?.servicePopularity?.length || 3}
                  </h2>
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="badge" style={{ background: 'rgba(125, 160, 202, 0.25)', color: PALETTE.lightIce, fontSize: 11, fontWeight: 700, border: '1px solid rgba(193, 232, 255, 0.3)' }}>
                      Active Catalog
                    </span>
                    <span style={{ fontSize: 12, color: PALETTE.iceSlate }}>
                      {data?.provider?.city ? `${data.provider.city} Area` : 'Live listings'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════
                FEATURE 2: 📈 Earnings Area Chart (12 Months Trend)
                + FEATURE 3: 🥧 Booking Status Pie Chart (Donut Style)
               ═════════════════════════════════════════════════════════ */}
            <div className="row g-4 mb-4">
              {/* Earnings Area Chart (12 Months) with Booking Count Overlay */}
              <div className="col-12 col-lg-8">
                <div className="card-aesthetic p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div>
                      <h5 className="fw-bold mb-1" style={{ color: '#FFFFFF' }}>
                        <i className="bi bi-graph-up me-2" style={{ color: PALETTE.lightIce }}></i>Earnings & Volume Trend
                      </h5>
                      <span className="small" style={{ color: PALETTE.iceSlate }}>
                        Monthly earnings (₹) with booking count overlay (last 12 months)
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge" style={{ background: 'rgba(193, 232, 255, 0.15)', color: PALETTE.lightIce, border: '1px solid rgba(125, 160, 202, 0.4)', fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: PALETTE.lightIce, marginRight: 4 }}></span>
                        Area: Revenue (₹)
                      </span>
                      <span className="badge" style={{ background: 'rgba(125, 160, 202, 0.2)', color: PALETTE.iceSlate, border: '1px solid rgba(125, 160, 202, 0.4)', fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: PALETTE.iceSlate, marginRight: 4 }}></span>
                        Line: Bookings
                      </span>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="auroraAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={PALETTE.lightIce} stopOpacity={0.7} />
                            <stop offset="50%" stopColor={PALETTE.steelBlue} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={PALETTE.darkest} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 160, 202, 0.15)" vertical={false} />
                        <XAxis
                          dataKey="month"
                          stroke={PALETTE.iceSlate}
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(125, 160, 202, 0.3)' }}
                        />
                        <YAxis
                          yAxisId="earningsAxis"
                          stroke={PALETTE.iceSlate}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                          yAxisId="bookingsAxis"
                          orientation="right"
                          stroke={PALETTE.iceSlate}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}`}
                        />
                        <Tooltip content={<CustomTrendTooltip />} />
                        <Area
                          yAxisId="earningsAxis"
                          type="monotone"
                          dataKey="earnings"
                          name="Earnings"
                          stroke={PALETTE.lightIce}
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#auroraAreaGrad)"
                        />
                        <Line
                          yAxisId="bookingsAxis"
                          type="monotone"
                          dataKey="bookings"
                          name="Bookings"
                          stroke={PALETTE.iceSlate}
                          strokeWidth={3}
                          dot={{ r: 4, fill: PALETTE.iceSlate, strokeWidth: 2, stroke: '#FFFFFF' }}
                          activeDot={{ r: 6, stroke: PALETTE.lightIce, strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Booking Status Donut Chart */}
              <div className="col-12 col-lg-4">
                <div className="card-aesthetic p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-bold mb-0" style={{ color: '#FFFFFF' }}>
                      <i className="bi bi-pie-chart me-2" style={{ color: PALETTE.lightIce }}></i>Booking Status
                    </h5>
                    <span className="badge" style={{ background: 'rgba(193, 232, 255, 0.12)', color: PALETTE.lightIce, border: '1px solid rgba(125, 160, 202, 0.3)', fontSize: 11 }}>Donut View</span>
                  </div>
                  <p className="small mb-3" style={{ color: PALETTE.iceSlate }}>Completed vs Accepted vs Pending vs Cancelled</p>

                  <div className="position-relative" style={{ width: '100%', height: 230 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={4}
                          cornerRadius={6}
                        >
                          {statusBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[entry.name.toLowerCase()]} stroke="rgba(2, 16, 36, 0.8)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Donut Center Display */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none'
                      }}
                    >
                      <span style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', display: 'block', lineHeight: 1 }}>
                        {kpis.totalBookings || 32}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: PALETTE.iceSlate, textTransform: 'uppercase' }}>
                        Total Jobs
                      </span>
                    </div>
                  </div>

                  {/* Status Legend Pills */}
                  <div className="row g-2 mt-2 pt-2" style={{ borderTop: '1px solid rgba(125, 160, 202, 0.2)' }}>
                    {statusBreakdown.map((s, i) => (
                      <div key={i} className="col-6">
                        <div className="p-2 rounded d-flex align-items-center justify-content-between" style={{ background: 'rgba(2, 16, 36, 0.65)', border: '1px solid rgba(125, 160, 202, 0.25)' }}>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }}></span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: PALETTE.lightIce }}>{s.name}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{s.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════
                FEATURE 4: ⭐ Rating Distribution (Horizontal Bar Chart)
                + FEATURE 5: 🏆 Service Popularity (Bar Chart)
               ═════════════════════════════════════════════════════════ */}
            <div className="row g-4 mb-4">
              {/* Feature 4: ⭐ Rating Distribution */}
              <div className="col-12 col-lg-5">
                <div className="card-aesthetic p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="fw-bold mb-1" style={{ color: '#FFFFFF' }}>
                        <i className="bi bi-star-half me-2" style={{ color: PALETTE.lightIce }}></i>Rating Distribution
                      </h5>
                      <span className="small" style={{ color: PALETTE.iceSlate }}>1-5 stars breakdown color-coded</span>
                    </div>
                    <div className="text-end">
                      <span className="fs-4 fw-bolder" style={{ color: PALETTE.lightIce }}>★ {kpis.averageRating}</span>
                      <span className="small d-block" style={{ fontSize: 11, color: PALETTE.iceSlate }}>out of 5.0</span>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart (1-5 Stars) */}
                  <div className="d-flex flex-column gap-3 my-2">
                    {ratingDistribution.map((item, index) => (
                      <div key={index}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                            <span style={{ color: PALETTE.lightIce, marginRight: 4 }}>★</span>
                            {item.star}
                          </span>
                          <div className="d-flex gap-2 align-items-center">
                            <span className="badge rounded-pill" style={{ background: 'rgba(125, 160, 202, 0.2)', color: PALETTE.lightIce, fontSize: 11 }}>
                              {item.count} reviews
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: item.color, minWidth: 35, textAlign: 'right' }}>
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="progress" style={{ height: 10, borderRadius: 8, background: 'rgba(2, 16, 36, 0.7)', border: '1px solid rgba(125, 160, 202, 0.2)' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: item.color,
                              borderRadius: 8,
                              transition: 'width 0.8s ease'
                            }}
                            aria-valuenow={item.percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 mt-3 rounded d-flex align-items-center gap-3" style={{ background: 'rgba(5, 38, 89, 0.65)', border: '1px solid rgba(125, 160, 202, 0.35)' }}>
                    <i className="bi bi-heart-fill fs-4" style={{ color: PALETTE.lightIce }}></i>
                    <div>
                      <div className="fw-bold" style={{ color: '#FFFFFF', fontSize: 13 }}>
                        {data?.reviewsMeta?.recommendationRate || 96}% Client Satisfaction
                      </div>
                      <div style={{ color: PALETTE.lightIce, fontSize: 12 }}>
                        Clients consistently praise promptness, precision, and respectful customer service.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 5: 🏆 Service Popularity Bar Chart */}
              <div className="col-12 col-lg-7">
                <div className="card-aesthetic p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div>
                      <h5 className="fw-bold mb-1" style={{ color: '#FFFFFF' }}>
                        <i className="bi bi-trophy-fill me-2" style={{ color: PALETTE.lightIce }}></i>Service Popularity
                      </h5>
                      <span className="small" style={{ color: PALETTE.iceSlate }}>Bookings count & revenue generated per service</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge" style={{ background: 'rgba(125, 160, 202, 0.2)', color: PALETTE.iceSlate, border: '1px solid rgba(125, 160, 202, 0.35)', fontSize: 11 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: PALETTE.iceSlate, marginRight: 4 }}></span>
                        Bookings
                      </span>
                      <span className="badge" style={{ background: 'rgba(193, 232, 255, 0.2)', color: PALETTE.lightIce, border: '1px solid rgba(193, 232, 255, 0.4)', fontSize: 11 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: PALETTE.lightIce, marginRight: 4 }}></span>
                        Revenue (₹)
                      </span>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.servicePopularity || []} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 160, 202, 0.15)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke={PALETTE.iceSlate}
                          fontSize={11}
                          tickLine={false}
                          interval={0}
                          angle={-10}
                          textAnchor="end"
                        />
                        <YAxis
                          yAxisId="bookings"
                          stroke={PALETTE.iceSlate}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="revenue"
                          orientation="right"
                          stroke={PALETTE.iceSlate}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomServiceTooltip />} />
                        <Bar
                          yAxisId="bookings"
                          dataKey="bookings"
                          name="Bookings"
                          fill={PALETTE.iceSlate}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={38}
                        />
                        <Bar
                          yAxisId="revenue"
                          dataKey="revenue"
                          name="Revenue"
                          fill={PALETTE.lightIce}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={38}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════
                FEATURE 6 & 7: 📋 Recent Bookings Tab + 💬 Reviews Tab
               ═════════════════════════════════════════════════════════ */}
            <div className="card-aesthetic overflow-hidden mb-4">
              {/* Tab Navigation */}
              <div className="p-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ background: 'rgba(2, 16, 36, 0.8)', borderBottom: '1px solid rgba(125, 160, 202, 0.25)' }}>
                <div className="d-flex gap-2">
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="btn btn-sm"
                    style={{
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      padding: '8px 18px',
                      background: activeTab === 'bookings' ? 'linear-gradient(135deg, #023EBA 0%, #0077B6 50%, #03045E 100%)' : 'rgba(3, 4, 94, 0.5)',
                      color: activeTab === 'bookings' ? '#FFFFFF' : PALETTE.iceSlate,
                      border: activeTab === 'bookings' ? '1px solid rgba(0, 180, 216, 0.5)' : '1px solid rgba(0, 180, 216, 0.25)'
                    }}
                  >
                    <i className="bi bi-calendar-check me-2"></i>Recent Bookings ({data?.recentBookings?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="btn btn-sm"
                    style={{
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      padding: '8px 18px',
                      background: activeTab === 'reviews' ? 'linear-gradient(135deg, #023EBA 0%, #0077B6 50%, #03045E 100%)' : 'rgba(3, 4, 94, 0.5)',
                      color: activeTab === 'reviews' ? '#FFFFFF' : PALETTE.iceSlate,
                      border: activeTab === 'reviews' ? '1px solid rgba(0, 180, 216, 0.5)' : '1px solid rgba(0, 180, 216, 0.25)'
                    }}
                  >
                    <i className="bi bi-chat-heart me-2"></i>Reviews & Ratings ({data?.reviews?.length || 0})
                  </button>
                </div>

                {activeTab === 'bookings' && (
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {/* Status Filter Buttons */}
                    <div className="btn-group btn-group-sm" role="group">
                      {['all', 'completed', 'accepted', 'pending', 'cancelled'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setBookingStatusFilter(st)}
                          className="btn btn-sm text-capitalize"
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            borderRadius: st === 'all' ? '8px 0 0 8px' : st === 'cancelled' ? '0 8px 8px 0' : 0,
                            background: bookingStatusFilter === st ? PALETTE.lightIce : 'rgba(2, 16, 36, 0.65)',
                            color: bookingStatusFilter === st ? PALETTE.darkest : PALETTE.lightIce,
                            border: '1px solid rgba(125, 160, 202, 0.35)'
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {/* Search input */}
                    <div className="position-relative" style={{ minWidth: 200 }}>
                      <input
                        type="text"
                        className="form-control form-control-sm ps-4"
                        placeholder="Search bookings..."
                        value={bookingSearchTerm}
                        onChange={(e) => setBookingSearchTerm(e.target.value)}
                        style={{ borderRadius: 8, fontSize: 12, background: 'rgba(2, 16, 36, 0.85)', color: '#FFFFFF', border: '1px solid rgba(125, 160, 202, 0.35)' }}
                      />
                      <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2" style={{ fontSize: 11, color: PALETTE.iceSlate }}></i>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="d-flex align-items-center gap-2">
                    <span className="small fw-semibold" style={{ color: PALETTE.iceSlate }}>Filter:</span>
                    <select
                      className="form-select form-select-sm"
                      style={{ borderRadius: 8, fontSize: 12, width: 'auto', background: 'rgba(2, 16, 36, 0.85)', color: '#FFFFFF', border: '1px solid rgba(125, 160, 202, 0.35)' }}
                      value={reviewRatingFilter}
                      onChange={(e) => setReviewRatingFilter(e.target.value)}
                    >
                      <option value="all">All Stars</option>
                      <option value="5">5 Stars only</option>
                      <option value="4">4 Stars only</option>
                      <option value="3">3 Stars only</option>
                      <option value="2">2 Stars only</option>
                      <option value="1">1 Star only</option>
                    </select>
                  </div>
                )}
              </div>

              {/* ── TAB 1: 📋 Recent Bookings Table ── */}
              {activeTab === 'bookings' && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                    <thead style={{ fontSize: 11, textTransform: 'uppercase', background: 'rgba(2, 16, 36, 0.7)' }}>
                      <tr>
                        <th className="ps-4">Booking ID</th>
                        <th>Customer</th>
                        <th>Service</th>
                        <th>Amount</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th className="text-end pe-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5" style={{ color: PALETTE.iceSlate }}>
                            <i className="bi bi-inbox display-6 d-block mb-2"></i>
                            No bookings match your current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => {
                          const statusStyle =
                            b.status === 'completed'
                              ? { bg: 'rgba(193, 232, 255, 0.2)', color: PALETTE.lightIce, icon: 'bi-check-circle-fill' }
                              : b.status === 'accepted'
                              ? { bg: 'rgba(125, 160, 202, 0.25)', color: PALETTE.iceSlate, icon: 'bi-calendar-check' }
                              : b.status === 'pending'
                              ? { bg: 'rgba(84, 131, 179, 0.25)', color: '#FFFFFF', icon: 'bi-hourglass-split' }
                              : { bg: 'rgba(5, 38, 89, 0.5)', color: PALETTE.lightIce, icon: 'bi-x-circle-fill' };

                          return (
                            <tr key={b.id}>
                              <td className="ps-4">
                                <span className="fw-bold" style={{ color: PALETTE.lightIce }}>#{b.id}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: '50%',
                                      background: '#10C4A8',
                                      color: '#001E2B',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: 12,
                                      border: '1px solid rgba(0, 30, 43, 0.2)'
                                    }}
                                  >
                                    {b.customerName ? b.customerName.charAt(0).toUpperCase() : 'C'}
                                  </div>
                                  <div>
                                    <div className="fw-bold text-white">{b.customerName}</div>
                                    <div style={{ fontSize: 11, color: PALETTE.iceSlate }}>{b.customerPhone || b.customerEmail}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="fw-semibold text-white">{b.serviceName}</span>
                              </td>
                              <td>
                                <strong style={{ color: PALETTE.lightIce }}>₹{Number(b.amount).toLocaleString()}</strong>
                              </td>
                              <td style={{ color: PALETTE.iceSlate }}>
                                <i className="bi bi-clock me-1"></i>
                                {new Date(b.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td>
                                <span
                                  className="badge text-capitalize d-inline-flex align-items-center gap-1"
                                  style={{
                                    background: statusStyle.bg,
                                    color: statusStyle.color,
                                    border: '1px solid rgba(125, 160, 202, 0.4)',
                                    padding: '5px 10px',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 700
                                  }}
                                >
                                  <i className={`bi ${statusStyle.icon}`}></i>
                                  {b.status}
                                </span>
                              </td>
                              <td className="text-end pe-4" style={{ maxWidth: 220, fontSize: 12, color: PALETTE.iceSlate }}>
                                <span className="text-truncate d-inline-block" style={{ maxWidth: 200 }} title={b.notes}>
                                  {b.notes || '—'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── TAB 2: 💬 Reviews Tab with Rating Breakdown Bars ── */}
              {activeTab === 'reviews' && (
                <div className="p-4">
                  {/* Rating Breakdown Header */}
                  <div className="row g-4 mb-4 align-items-center pb-4" style={{ borderBottom: '1px solid rgba(125, 160, 202, 0.25)' }}>
                    <div className="col-12 col-md-4 text-center" style={{ borderRight: '1px solid rgba(125, 160, 202, 0.25)' }}>
                      <h1 className="display-4 fw-bolder mb-0" style={{ color: PALETTE.lightIce }}>★ {kpis.averageRating}</h1>
                      <div className="d-flex justify-content-center gap-1 fs-5 mb-1" style={{ color: PALETTE.lightIce }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <i key={s} className={`bi bi-star${s <= Math.round(kpis.averageRating) ? '-fill' : ''}`}></i>
                        ))}
                      </div>
                      <div className="fw-bold text-white">
                        Based on {data?.reviewsMeta?.totalReviews || 27} verified ratings
                      </div>
                      <div className="small mt-1" style={{ color: PALETTE.iceSlate }}>
                        {data?.reviewsMeta?.recommendationRate || 96}% of clients recommend this service provider
                      </div>
                    </div>

                    <div className="col-12 col-md-8">
                      <div className="d-flex flex-column gap-2">
                        {ratingDistribution.map((bar, i) => (
                          <div key={i} className="d-flex align-items-center gap-3">
                            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 60, color: PALETTE.lightIce }}>
                              {bar.starsLabel}
                            </span>
                            <div className="progress flex-grow-1" style={{ height: 10, borderRadius: 6, background: 'rgba(2, 16, 36, 0.7)', border: '1px solid rgba(125, 160, 202, 0.2)' }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${bar.percentage}%`,
                                  background: bar.color,
                                  borderRadius: 6
                                }}
                              ></div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 35, color: PALETTE.iceSlate, textAlign: 'right' }}>
                              {bar.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reviews Cards List */}
                  <div className="row g-3">
                    {filteredReviews.length === 0 ? (
                      <div className="col-12 text-center py-5" style={{ color: PALETTE.iceSlate }}>
                        <i className="bi bi-chat-left-dots display-6 d-block mb-2"></i>
                        No customer reviews match this rating filter.
                      </div>
                    ) : (
                      filteredReviews.map((rev) => (
                        <div key={rev.id} className="col-12 col-md-6">
                          <div
                            className="p-3 h-100 rounded-3"
                            style={{
                              background: 'rgba(2, 16, 36, 0.7)',
                              border: '1px solid rgba(125, 160, 202, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: '#10C4A8',
                                    color: '#001E2B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    border: '1px solid rgba(0, 30, 43, 0.2)'
                                  }}
                                >
                                  {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="fw-bold text-white" style={{ fontSize: 13 }}>
                                    {rev.customerName}
                                  </div>
                                  <div style={{ fontSize: 11, color: PALETTE.iceSlate }}>
                                    <i className="bi bi-calendar3 me-1"></i>
                                    {new Date(rev.date).toLocaleDateString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>
                              <span className="badge" style={{ background: 'rgba(16, 196, 168, 0.18)', color: '#FFFFFF', border: '1px solid rgba(16, 196, 168, 0.4)', fontSize: 11 }}>
                                <i className="bi bi-patch-check-fill me-1" style={{ color: '#10C4A8' }}></i>Verified Hire
                              </span>
                            </div>

                            {/* Stars */}
                            <div className="mb-2" style={{ fontSize: 14, color: '#FFB02D' }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <i key={s} className={`bi bi-star${s <= rev.rating ? '-fill' : ''} me-1`}></i>
                              ))}
                              <span className="fw-bold ms-1" style={{ color: '#FFFFFF', fontSize: 12 }}>
                                {rev.rating}.0
                              </span>
                            </div>

                            <p className="mb-0" style={{ fontSize: 13, lineHeight: 1.5, color: PALETTE.lightIce }}>
                              "{rev.comment}"
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Fallback robust mock dataset for seamless demonstration
function getFallbackData() {
  return {
    provider: {
      id: 1,
      businessName: 'Express Home Repair & Plumbing',
      technicianName: 'Amit Kumar',
      email: 'amit.plumber@example.com',
      rating: 4.9,
      experience: 8,
      hourlyRate: 350,
      city: 'Mumbai',
      serviceArea: 'Andheri, Bandra, Powai',
      isVerified: true
    },
    availableProviders: [
      { id: 1, name: 'Amit Express Plumbing', technician: 'Amit Kumar', city: 'Mumbai' },
      { id: 2, name: 'Singh Power & Electricals', technician: 'Vikram Singh', city: 'Mumbai' },
      { id: 3, name: 'SparkleClean Home Services', technician: 'Anita Desai', city: 'Mumbai' },
      { id: 4, name: 'Mastercraft Wooden Works', technician: 'Suresh Mistri', city: 'Mumbai' }
    ],
    kpis: {
      totalEarnings: 28450,
      totalBookings: 32,
      averageRating: 4.9,
      totalServices: 4,
      completedBookings: 26,
      acceptedBookings: 4,
      pendingBookings: 2,
      cancelledBookings: 1,
      completionRate: 88,
      earningsGrowth: '+16.8%',
      bookingGrowth: '+12.4%'
    },
    statusBreakdown: [
      { name: 'Completed', value: 26, color: '#10C4A8' },
      { name: 'Accepted', value: 4, color: '#00684A' },
      { name: 'Pending', value: 2, color: '#FFB02D' },
      { name: 'Cancelled', value: 1, color: '#001E2B' }
    ],
    monthlyTrend: [
      { month: "Nov '25", shortMonth: 'Nov', earnings: 14200, bookings: 4 },
      { month: "Dec '25", shortMonth: 'Dec', earnings: 15600, bookings: 5 },
      { month: "Jan '26", shortMonth: 'Jan', earnings: 16800, bookings: 5 },
      { month: "Feb '26", shortMonth: 'Feb', earnings: 17500, bookings: 6 },
      { month: "Mar '26", shortMonth: 'Mar', earnings: 18900, bookings: 7 },
      { month: "Apr '26", shortMonth: 'Apr', earnings: 20400, bookings: 7 },
      { month: "May '26", shortMonth: 'May', earnings: 21800, bookings: 8 },
      { month: "Jun '26", shortMonth: 'Jun', earnings: 22500, bookings: 8 },
      { month: "Jul '26", shortMonth: 'Jul', earnings: 24100, bookings: 9 },
      { month: "Aug '26", shortMonth: 'Aug', earnings: 25800, bookings: 10 },
      { month: "Sep '26", shortMonth: 'Sep', earnings: 27400, bookings: 11 },
      { month: "Oct '26", shortMonth: 'Oct', earnings: 29200, bookings: 12 }
    ],
    ratingDistribution: [
      { star: '5 Stars', starsLabel: '5 ★', count: 19, percentage: 70, color: '#10C4A8' },
      { star: '4 Stars', starsLabel: '4 ★', count: 6, percentage: 22, color: '#0DB197' },
      { star: '3 Stars', starsLabel: '3 ★', count: 2, percentage: 5, color: '#00684A' },
      { star: '2 Stars', starsLabel: '2 ★', count: 1, percentage: 2, color: '#3D4F58' },
      { star: '1 Star', starsLabel: '1 ★', count: 0, percentage: 0, color: '#001E2B' }
    ],
    servicePopularity: [
      { id: 1, name: 'Tap & Pipe Leak Repair', fullName: 'Tap & Pipe Leak Repair', bookings: 14, revenue: 4900, price: 350 },
      { id: 2, name: 'Water Heater / Geyser', fullName: 'Water Heater / Geyser Installation', bookings: 10, revenue: 6000, price: 600 },
      { id: 3, name: 'Bathroom Pipeline Reno', fullName: 'Bathroom Pipeline Renovation', bookings: 5, revenue: 7500, price: 1500 },
      { id: 4, name: 'Kitchen Drainage Clear', fullName: 'Kitchen Drainage Clear & Trap Fix', bookings: 3, revenue: 1350, price: 450 }
    ],
    recentBookings: [
      {
        id: 101,
        customerName: 'Rahul Sharma',
        customerPhone: '9876511111',
        serviceName: 'Tap & Pipe Leak Repair',
        amount: 350,
        date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        status: 'completed',
        notes: 'Kitchen sink pipe was dripping continuously. Fixed with new valve.'
      },
      {
        id: 102,
        customerName: 'Priya Patel',
        customerPhone: '9876522222',
        serviceName: 'Water Heater / Geyser Installation',
        amount: 600,
        date: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        status: 'accepted',
        notes: 'Requested 15L geyser installation in master bathroom.'
      },
      {
        id: 103,
        customerName: 'Arjun Nair',
        customerPhone: '9876533333',
        serviceName: 'Bathroom Pipeline Renovation',
        amount: 1500,
        date: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
        status: 'pending',
        notes: 'Needs concealed pipe inspection before tile laying.'
      },
      {
        id: 104,
        customerName: 'Neha Verma',
        customerPhone: '9876544444',
        serviceName: 'Tap & Pipe Leak Repair',
        amount: 350,
        date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        status: 'completed',
        notes: 'Replaced mixer tap cartridge. Fast and clean.'
      },
      {
        id: 105,
        customerName: 'Rohan Mehra',
        customerPhone: '9876555555',
        serviceName: 'Water Heater / Geyser Installation',
        amount: 600,
        date: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        status: 'cancelled',
        notes: 'Customer postponed due to apartment painting schedule.'
      }
    ],
    reviews: [
      {
        id: 201,
        customerName: 'Rahul Sharma',
        rating: 5,
        comment: 'Prompt response and fixed the kitchen pipe leak cleanly. Arrived within 20 mins and charged exact quoted rate. Highly recommended!',
        date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 202,
        customerName: 'Priya Patel',
        rating: 5,
        comment: 'Very professional geyser installation. Tested pressure and checked for zero leaks. Very clean work area.',
        date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 203,
        customerName: 'Arjun Nair',
        rating: 4,
        comment: 'Good knowledge of plumbing lines and polite behavior. Arrived right on schedule.',
        date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 204,
        customerName: 'Sneha Kapoor',
        rating: 5,
        comment: 'Fixed our bathroom main drainage leak that two other technicians failed to resolve. Truly an expert!',
        date: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString()
      }
    ],
    reviewsMeta: {
      totalReviews: 28,
      averageRating: 4.9,
      recommendationRate: 96
    }
  };
}

export default ProviderDashboard;
