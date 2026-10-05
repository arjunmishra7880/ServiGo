import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GradientBackground from "../components/GradientBackground";
import { API_BASE } from "../config/api";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer",
    businessName: "",
    bio: "",
    experience: 2,
    hourlyRate: 350,
    serviceArea: "Andheri, Bandra",
    city: "Mumbai",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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
          maxWidth: 540,
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
            Create an account to hire or offer services
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
            {/* Account Type Selection */}
            <div className="mb-3">
              <label
                className="form-label small fw-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                I want to:
              </label>
              <div className="d-flex gap-2">
                <div
                  onClick={() => setFormData({ ...formData, role: "customer" })}
                  className={
                    "p-2 rounded-3 text-center flex-grow-1 border cursor-pointer " +
                    (formData.role === "customer"
                      ? "border-primary bg-light"
                      : "")
                  }
                  style={{
                    cursor: "pointer",
                    outline:
                      formData.role === "customer"
                        ? "2px solid #00B4D8"
                        : "none",
                  }}
                >
                  <i className="bi bi-person text-primary me-1"></i>
                  <span className="fw-semibold small">Hire Services</span>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, role: "provider" })}
                  className={
                    "p-2 rounded-3 text-center flex-grow-1 border cursor-pointer " +
                    (formData.role === "provider"
                      ? "border-primary bg-light"
                      : "")
                  }
                  style={{
                    cursor: "pointer",
                    outline:
                      formData.role === "provider"
                        ? "2px solid #00B4D8"
                        : "none",
                  }}
                >
                  <i className="bi bi-briefcase text-success me-1"></i>
                  <span className="fw-semibold small">Offer Services</span>
                </div>
              </div>
            </div>

            {/* Basic details */}
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label
                  className="form-label small fw-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="e.g. Ramesh Patil"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: 10, fontSize: 14 }}
                />
              </div>
              <div className="col-md-6">
                <label
                  className="form-label small fw-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ borderRadius: 10, fontSize: 14 }}
                />
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label
                  className="form-label small fw-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: 10, fontSize: 14 }}
                />
              </div>
              <div className="col-md-6">
                <label
                  className="form-label small fw-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: 10, fontSize: 14 }}
                />
              </div>
            </div>

            {/* Provider fields */}
            {formData.role === "provider" && (
              <div
                className="p-3 rounded-3 mb-3"
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--border-light)",
                }}
              >
                <h6 className="fw-bold mb-3 small" style={{ color: "#059669" }}>
                  <i className="bi bi-patch-check me-1"></i>Service Provider
                  Details
                </h6>

                <div className="mb-2">
                  <label className="form-label small fw-semibold text-muted">
                    Business / Agency Name
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    className="form-control"
                    placeholder="e.g. Patil Plumbing Works"
                    value={formData.businessName}
                    onChange={handleChange}
                    style={{ borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-muted">
                      Experience (Yrs)
                    </label>
                    <input
                      type="number"
                      name="experience"
                      className="form-control"
                      min="0"
                      value={formData.experience}
                      onChange={handleChange}
                      style={{ borderRadius: 8, fontSize: 13 }}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-muted">
                      Hourly Rate (₹)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      className="form-control"
                      min="50"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      style={{ borderRadius: 8, fontSize: 13 }}
                    />
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-muted">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      value={formData.city}
                      onChange={handleChange}
                      style={{ borderRadius: 8, fontSize: 13 }}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-muted">
                      Service Areas
                    </label>
                    <input
                      type="text"
                      name="serviceArea"
                      className="form-control"
                      placeholder="e.g. Dadar, Kurla"
                      value={formData.serviceArea}
                      onChange={handleChange}
                      style={{ borderRadius: 8, fontSize: 13 }}
                    />
                  </div>
                </div>

                <div className="mb-1">
                  <label className="form-label small fw-semibold text-muted">
                    Short Bio
                  </label>
                  <textarea
                    name="bio"
                    className="form-control"
                    rows="2"
                    placeholder="Describe your service expertise..."
                    value={formData.bio}
                    onChange={handleChange}
                    style={{ borderRadius: 8, fontSize: 13 }}
                  ></textarea>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary-aesthetic btn w-100 py-2 mt-2"
              disabled={submitting}
            >
              {submitting ? "Creating Account..." : "Complete Registration"}
            </button>
          </form>

          <div className="text-center mt-3">
            <small style={{ color: "var(--text-secondary)" }}>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: "#00B4D8",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Sign In
              </Link>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
