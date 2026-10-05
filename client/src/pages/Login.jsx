import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GradientBackground from "../components/GradientBackground";
import { API_BASE } from "../config/api";

const DEMO_ACCOUNTS = [
  {
    id: "admin",
    name: "System Admin",
    role: "admin",
    badge: "Admin",
    email: "admin@localservice.com",
    password: "admin123",
    icon: "bi-shield-check",
    squircleBg: "#EDE9FE",
    squircleColor: "#7C3AED",
    cardBg: "linear-gradient(135deg, rgba(245, 243, 255, 0.95) 0%, rgba(237, 233, 254, 0.5) 100%)",
    arrowBg: "#EDE9FE",
    arrowColor: "#7C3AED",
    desc: "Platform telemetry, verification & user management"
  },
  {
    id: "plumber",
    name: "Amit Kumar",
    role: "provider",
    badge: "Plumber",
    email: "amit.plumber@example.com",
    password: "password123",
    icon: "bi-wrench-adjustable",
    squircleBg: "#CFFAFE",
    squircleColor: "#0891B2",
    cardBg: "linear-gradient(135deg, rgba(236, 254, 255, 0.95) 0%, rgba(207, 250, 254, 0.5) 100%)",
    arrowBg: "#CFFAFE",
    arrowColor: "#0891B2",
    desc: "Amit Express Plumbing • 8 yrs field exp"
  },
  {
    id: "electrician",
    name: "Vikram Singh",
    role: "provider",
    badge: "Electrician",
    email: "vikram.electrician@example.com",
    password: "password123",
    icon: "bi-lightning-charge-fill",
    squircleBg: "#FEF3C7",
    squircleColor: "#D97706",
    cardBg: "linear-gradient(135deg, rgba(255, 251, 235, 0.95) 0%, rgba(254, 243, 199, 0.5) 100%)",
    arrowBg: "#FEF3C7",
    arrowColor: "#D97706",
    desc: "Singh Power & Electricals • 6 yrs exp"
  },
  {
    id: "cleaning",
    name: "Anita Desai",
    role: "provider",
    badge: "Cleaning",
    email: "anita.cleaning@example.com",
    password: "password123",
    icon: "bi-stars",
    squircleBg: "#D1FAE5",
    squircleColor: "#059669",
    cardBg: "linear-gradient(135deg, rgba(240, 253, 244, 0.95) 0%, rgba(209, 250, 229, 0.5) 100%)",
    arrowBg: "#D1FAE5",
    arrowColor: "#059669",
    desc: "SparkleClean Home Services • 5 yrs exp"
  },
  {
    id: "carpenter",
    name: "Suresh Mistri",
    role: "provider",
    badge: "Carpenter",
    email: "suresh.carpentry@example.com",
    password: "password123",
    icon: "bi-hammer",
    squircleBg: "#FFEDD5",
    squircleColor: "#EA580C",
    cardBg: "linear-gradient(135deg, rgba(255, 247, 237, 0.95) 0%, rgba(255, 237, 213, 0.5) 100%)",
    arrowBg: "#FFEDD5",
    arrowColor: "#EA580C",
    desc: "Mastercraft Wooden Works • 10 yrs exp"
  },
  {
    id: "techfix",
    name: "Rohit Sen",
    role: "provider",
    badge: "IT & Tech",
    email: "rohit.techfix@example.com",
    password: "password123",
    icon: "bi-laptop",
    squircleBg: "#DBEAFE",
    squircleColor: "#2563EB",
    cardBg: "linear-gradient(135deg, rgba(239, 246, 255, 0.95) 0%, rgba(219, 234, 254, 0.5) 100%)",
    arrowBg: "#DBEAFE",
    arrowColor: "#2563EB",
    desc: "TechFix Laptop & Computer Repair"
  },
  {
    id: "customer1",
    name: "Rahul Sharma",
    role: "customer",
    badge: "Customer",
    email: "rahul.sharma@example.com",
    password: "password123",
    icon: "bi-person-fill",
    squircleBg: "#E0F2FE",
    squircleColor: "#0284C7",
    cardBg: "linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(224, 242, 254, 0.5) 100%)",
    arrowBg: "#E0F2FE",
    arrowColor: "#0284C7",
    desc: "Active customer bookings in Mumbai"
  },
  {
    id: "customer2",
    name: "Priya Patel",
    role: "customer",
    badge: "Customer",
    email: "priya.patel@example.com",
    password: "password123",
    icon: "bi-phone",
    squircleBg: "#FFE4E6",
    squircleColor: "#E11D48",
    cardBg: "linear-gradient(135deg, rgba(255, 241, 242, 0.95) 0%, rgba(255, 228, 230, 0.5) 100%)",
    arrowBg: "#FFE4E6",
    arrowColor: "#E11D48",
    desc: "Customer profile (Bandra West)"
  },
  {
    id: "customer3",
    name: "Arjun Nair",
    role: "customer",
    badge: "Customer",
    email: "arjun.nair@example.com",
    password: "password123",
    icon: "bi-person",
    squircleBg: "#CCFBF1",
    squircleColor: "#0D9488",
    cardBg: "linear-gradient(135deg, rgba(240, 253, 250, 0.95) 0%, rgba(204, 251, 241, 0.5) 100%)",
    arrowBg: "#CCFBF1",
    arrowColor: "#0D9488",
    desc: "Customer profile (Powai)"
  }
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [activeRoleFilter, setActiveRoleFilter] = useState("all");
  const dropdownRef = useRef(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      login(data.user, data.token);
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedDemo(acc);
    setDropdownOpen(false);
  };

  const filteredAccounts = DEMO_ACCOUNTS.filter((acc) => {
    if (activeRoleFilter === "all") return true;
    return acc.role === activeRoleFilter;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      {/* Full-page animated gradient background */}
      <GradientBackground fixed overlay={0.3} />

      <div
        style={{
          maxWidth: 520,
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="text-center mb-4">
          <Link to="/" style={{ textDecoration: "none" }}>
            <span
              className="brand-text fs-2"
              style={{
                color: "#001E2B",
              }}
            >
              <i className="bi bi-tools me-2" style={{ color: "#10C4A8" }}></i>
              ServiGo
            </span>
          </Link>
          <p
            style={{
              color: "#3D4F58",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Welcome back! Sign in to your account
          </p>
        </div>

        <div className="card-aesthetic p-4">
          {error && (
            <div
              className="alert alert-danger py-2 small mb-3"
              style={{ borderRadius: 10 }}
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label
                className="form-label small fw-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Email Address
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-light border-end-0 text-muted"
                  style={{ borderRadius: "10px 0 0 10px" }}
                >
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control border-start-0"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ borderRadius: "0 10px 10px 0", fontSize: 14 }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                className="form-label small fw-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-light border-end-0 text-muted"
                  style={{ borderRadius: "10px 0 0 10px" }}
                >
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control border-start-0"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ borderRadius: "0 10px 10px 0", fontSize: 14 }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-aesthetic btn w-100 py-2"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Quick Demo Accounts Dropdown for College Viva */}
          <div className="mt-4 pt-3 border-top position-relative" ref={dropdownRef}>
            <style>{`
              .demo-subcat-card {
                transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
              }
              .demo-subcat-card:hover {
                transform: translateY(-3px);
                border-color: #10C4A8 !important;
                box-shadow: 0 8px 24px rgba(16, 196, 168, 0.18) !important;
              }
              .demo-subcat-card:hover .demo-action-arrow {
                background: #10C4A8 !important;
                color: #FFFFFF !important;
                transform: translateX(2px);
              }
            `}</style>

            {/* Header row matching screenshot top bar */}
            <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="badge rounded-pill"
                  style={{
                    background: "#E6FAF6",
                    color: "#00684A",
                    fontSize: 11,
                    fontWeight: 700,
                    border: "1px solid rgba(16, 196, 168, 0.4)",
                    padding: "5px 12px"
                  }}
                >
                  <i className="bi bi-grid-3x3-gap-fill me-1"></i>9 Demo Accounts
                </span>
                {selectedDemo && (
                  <span
                    className="badge rounded-pill text-truncate"
                    style={{
                      background: "#10C4A8",
                      color: "#001E2B",
                      fontSize: 11,
                      fontWeight: 700,
                      maxWidth: 160
                    }}
                  >
                    <i className="bi bi-check-circle-fill me-1"></i>{selectedDemo.name}
                  </span>
                )}
              </div>

              {/* Dropdown Toggle Button (Matching "Filter Providers ∨" pill in screenshot) */}
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="btn rounded-pill px-3 py-1 shadow-sm d-flex align-items-center gap-2"
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid #10C4A8",
                  color: "#001E2B",
                  fontWeight: 700,
                  fontSize: 12,
                  transition: "all 0.2s ease"
                }}
                aria-expanded={dropdownOpen}
              >
                <i className="bi bi-funnel-fill" style={{ color: "#10C4A8", fontSize: 13 }}></i>
                <span>{selectedDemo ? "Switch Demo" : "Select Demo Account"}</span>
                <i
                  className="bi bi-chevron-down ms-1"
                  style={{
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    fontSize: 11
                  }}
                ></i>
              </button>
            </div>

            {/* Dropdown Menu Popup styled exactly as the Cards in user reference image */}
            {dropdownOpen && (
              <div
                className="shadow-lg position-absolute w-100"
                style={{
                  top: "calc(100% + 8px)",
                  left: 0,
                  background: "#FFFFFF",
                  border: "1.5px solid rgba(16, 196, 168, 0.4)",
                  borderRadius: 20,
                  maxHeight: 380,
                  overflowY: "auto",
                  zIndex: 1050,
                  padding: "14px",
                  boxShadow: "0 14px 40px rgba(0, 30, 43, 0.18)"
                }}
              >
                {/* Category Filter Pills */}
                <div className="d-flex align-items-center gap-1 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {[
                    { key: "all", label: "All (9)" },
                    { key: "admin", label: "🛡️ Admin (1)" },
                    { key: "provider", label: "🔧 Providers (5)" },
                    { key: "customer", label: "👤 Customers (3)" }
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRoleFilter(f.key);
                      }}
                      className="btn btn-sm rounded-pill py-1 px-2 text-nowrap"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: activeRoleFilter === f.key ? "#10C4A8" : "#F1F5F9",
                        color: activeRoleFilter === f.key ? "#001E2B" : "#475569",
                        border: activeRoleFilter === f.key ? "1px solid #10C4A8" : "1px solid transparent"
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Subcategory-style Cards Grid matching the screenshot */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "10px"
                  }}
                >
                  {filteredAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => handleSelectDemo(acc)}
                      className="demo-subcat-card position-relative d-flex flex-column justify-content-between p-3"
                      style={{
                        background: acc.cardBg,
                        border: selectedDemo?.email === acc.email
                          ? "2px solid #10C4A8"
                          : "1px solid rgba(0, 0, 0, 0.08)",
                        borderRadius: 18,
                        cursor: "pointer",
                        boxShadow: selectedDemo?.email === acc.email
                          ? "0 4px 14px rgba(16, 196, 168, 0.25)"
                          : "0 2px 8px rgba(0, 30, 43, 0.04)",
                        minHeight: 124,
                        textDecoration: "none"
                      }}
                    >
                      {/* Top: Squircle Icon Box */}
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: acc.squircleBg,
                            color: acc.squircleColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            boxShadow: `0 2px 6px ${acc.squircleBg}`
                          }}
                        >
                          <i className={`bi ${acc.icon}`}></i>
                        </div>
                        <span
                          className="badge rounded-pill"
                          style={{
                            background: acc.squircleBg,
                            color: acc.squircleColor,
                            fontSize: 10,
                            fontWeight: 700,
                            border: `1px solid ${acc.squircleColor}33`,
                            padding: "3px 8px"
                          }}
                        >
                          {acc.badge}
                        </span>
                      </div>

                      {/* Middle: Title & Subtitle */}
                      <div className="mb-2 text-start">
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#001E2B",
                            lineHeight: 1.25,
                            marginBottom: 2
                          }}
                        >
                          {acc.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#64748B",
                            lineHeight: 1.3
                          }}
                        >
                          {acc.desc}
                        </div>
                      </div>

                      {/* Bottom: Email hint & Circular Action Arrow Button */}
                      <div className="d-flex justify-content-between align-items-center pt-1 mt-auto">
                        <small style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>
                          {acc.email.split("@")[0]}
                        </small>
                        <div
                          className="demo-action-arrow d-flex align-items-center justify-content-center"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: selectedDemo?.email === acc.email ? "#10C4A8" : acc.arrowBg,
                            color: selectedDemo?.email === acc.email ? "#FFFFFF" : acc.arrowColor,
                            fontSize: 11,
                            fontWeight: 800,
                            transition: "all 0.2s ease"
                          }}
                        >
                          <i className="bi bi-arrow-right"></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-3">
            <small style={{ color: "var(--text-secondary)" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  color: "#001E2B",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Register here
              </Link>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
