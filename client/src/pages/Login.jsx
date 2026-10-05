import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GradientBackground from "../components/GradientBackground";
import { API_BASE } from "../config/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

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
          maxWidth: 420,
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
                color: "#fff",
                textShadow: "0 2px 14px rgba(3,4,94,0.5)",
              }}
            >
              <i className="bi bi-tools me-2" style={{ color: "#FBB02D" }}></i>
              ServiGo
            </span>
          </Link>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
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

          {/* Quick Demo Login Fill Buttons for College Viva */}
          <div className="mt-4 pt-3 border-top text-center">
            <p
              className="small mb-2 fw-semibold"
              style={{ color: "var(--text-muted)", fontSize: 12 }}
            >
              1-Click Demo Accounts (Viva Presentation):
            </p>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin("rahul.sharma@example.com", "password123")
                }
                className="btn btn-light-aesthetic btn-sm py-1 px-2"
                style={{ fontSize: 12 }}
              >
                <i className="bi bi-person me-1"></i>Customer
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin("amit.plumber@example.com", "password123")
                }
                className="btn btn-light-aesthetic btn-sm py-1 px-2"
                style={{ fontSize: 12 }}
              >
                <i className="bi bi-wrench me-1"></i>Plumber
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin("admin@localservice.com", "admin123")
                }
                className="btn btn-light-aesthetic btn-sm py-1 px-2"
                style={{ fontSize: 12 }}
              >
                <i className="bi bi-shield-check me-1"></i>Admin
              </button>
            </div>
          </div>

          <div className="text-center mt-3">
            <small style={{ color: "var(--text-secondary)" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  color: "#00B4D8",
                  fontWeight: 700,
                  textDecoration: "none",
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
