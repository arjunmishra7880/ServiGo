import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BookingModal from "../components/BookingModal";
import GradientBackground from "../components/GradientBackground";
import L from "leaflet";

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Category color scheme — Ocean Royale palette
const categoryColors = {
  Plumbing:         { bg: "#CAF0F8", icon: "#023E8A" },
  Electrician:      { bg: "#FEF3C7", icon: "#D97706" },
  "Home Cleaning":  { bg: "#E0F2FE", icon: "#00B4D8" },
  Carpentry:        { bg: "#DBEAFE", icon: "#1D4ED8" },
  Painting:         { bg: "#EDE9FE", icon: "#7C3AED" },
  "Appliance Repair": { bg: "#CCFBF1", icon: "#0F766E" },
};

function Home() {
  const { user, logout } = useAuth();

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState("");

  // Filter & Sorting state
  const [sortBy, setSortBy] = useState("recommended"); // 'recommended', 'rating_desc', 'price_asc', 'price_desc', 'exp_desc'
  const [minRating, setMinRating] = useState(0); // 0, 4, 4.5
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1500);

  // Map state
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const providerMarkersRef = useRef([]);

  useEffect(() => {
    fetchCategories();
    fetchProviders();
  }, []);

  // Filtered & Sorted Providers computation
  const filteredProviders = useMemo(() => {
    return providers
      .filter((p) => {
        // Rating filter
        const rating = parseFloat(p.rating || 5);
        if (minRating > 0 && rating < minRating) return false;

        // Verified only filter
        if (verifiedOnly && !p.isVerified) return false;

        // Price filter
        const rate = p.hourlyRate || 0;
        if (rate > maxPrice) return false;

        return true;
      })
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating || 5);
        const ratingB = parseFloat(b.rating || 5);
        const priceA = a.hourlyRate || 0;
        const priceB = b.hourlyRate || 0;
        const expA = a.experience || 0;
        const expB = b.experience || 0;

        if (sortBy === "rating_desc") return ratingB - ratingA;
        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        if (sortBy === "exp_desc") return expB - expA;
        return 0; // recommended
      });
  }, [providers, minRating, verifiedOnly, maxPrice, sortBy]);

  const hasActiveFilters =
    minRating > 0 ||
    verifiedOnly ||
    maxPrice < 1500 ||
    sortBy !== "recommended";

  const handleResetFilters = () => {
    setMinRating(0);
    setVerifiedOnly(false);
    setMaxPrice(1500);
    setSortBy("recommended");
  };

  // Initialize map with user location
  useEffect(() => {
    if (!userLocation) return;
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapRef.current).setView(
      [userLocation.lat, userLocation.lng],
      14,
    );
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // User location marker (cyan dot)
    const userIcon = L.divIcon({
      html: '<div style="width:14px;height:14px;background:#00B4D8;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup("<strong>Your Location</strong>")
      .openPopup();
  }, [userLocation]);

  // Sync provider markers on the map whenever filteredProviders or userLocation updates
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    const map = mapInstanceRef.current;

    // Remove old provider markers
    providerMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    providerMarkersRef.current = [];

    const providerOffsets = [
      { lat: 0.004, lng: 0.006 },
      { lat: -0.005, lng: 0.008 },
      { lat: 0.007, lng: -0.005 },
      { lat: -0.003, lng: -0.007 },
    ];

    filteredProviders.forEach((p, i) => {
      const offset = providerOffsets[i % providerOffsets.length];
      const lat = userLocation.lat + offset.lat;
      const lng = userLocation.lng + offset.lng;

      const pinIcon = L.divIcon({
        html: '<div style="width:32px;height:32px;background:#023E8A;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>',
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const rating = p.rating || 5;
      const popupContent = [
        '<div style="font-family:sans-serif;min-width:180px;">',
        '<strong style="font-size:14px;color:#03045E;">' +
          (p.businessName || p.user.name) +
          "</strong>",
        '<br/><span style="color:#FBB02D;font-size:12px;">&#9733; ' +
          rating +
          " rating</span>",
        '<br/><span style="color:#023E8A;font-size:12px;">&#128205; ' +
          p.serviceArea +
          "</span>",
        '<br/><span style="color:#0077B6;font-size:13px;font-weight:600;">From &#8377;' +
          p.hourlyRate +
          "/hr</span>",
        "</div>",
      ].join("");

      const marker = L.marker([lat, lng], { icon: pinIcon })
        .addTo(map)
        .bindPopup(popupContent);
      providerMarkersRef.current.push(marker);
    });
  }, [userLocation, filteredProviders]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProviders = async (query, cat) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("search", query);
      if (cat) params.append("category", cat);
      const res = await fetch(
        "http://localhost:5000/api/providers?" + params.toString(),
      );
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // Demo fallback — Mumbai coordinates
        setUserLocation({ lat: 19.076, lng: 72.8777 });
      },
    );
  };

  const handleCategorySelect = (catName) => {
    const newCat = selectedCategory === catName ? "" : catName;
    setSelectedCategory(newCat);
    fetchProviders(searchQuery, newCat);
    const el = document.getElementById("providers");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProviders(searchQuery, selectedCategory);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("");
    fetchProviders("", "");
  };

  const handleBookingSuccess = () => {
    setActiveBooking(null);
    setBookingSuccess("Appointment booked! View it in My Bookings.");
    setTimeout(() => setBookingSuccess(""), 4000);
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* ─── Full-page animated gradient background (fixed while scrolling) ─── */}
      <GradientBackground fixed overlay={0.3} />

      {/* All page content stacks above the fixed background layer */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ─── Navbar ─── */}
        <nav className="navbar-servigo sticky-top px-0" style={{ zIndex: 999 }}>
          <div className="container d-flex align-items-center justify-content-between py-3">
            <Link to="/" style={{ textDecoration: "none" }}>
              <span className="brand-text fs-4">
                <i
                  className="bi bi-tools me-2"
                  style={{ color: "#00B4D8" }}
                ></i>
                ServiGo
              </span>
            </Link>

            <div className="d-flex align-items-center gap-3">
              <a
                href="#categories"
                style={{
                  color: "#CAF0F8",
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                Services
              </a>
              <a
                href="#map-section"
                style={{
                  color: "#CAF0F8",
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                Nearby
              </a>
              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="btn btn-sm"
                      style={{
                        background: "#CAF0F8",
                        color: "#03045E",
                        fontWeight: 600,
                        borderRadius: 10,
                        border: "1px solid #00B4D8",
                      }}
                    >
                      <i className="bi bi-shield-check me-1"></i>Admin
                    </Link>
                  )}
                  <Link
                    to="/bookings"
                    className="btn btn-light-aesthetic btn-sm"
                  >
                    <i className="bi bi-calendar2-check me-1"></i>Bookings
                  </Link>
                  <span
                    style={{
                      fontSize: 14,
                      color: "#CAF0F8",
                      fontWeight: 600,
                    }}
                  >
                    Hi, {user.name.split(" ")[0]}
                  </span>
                  <button
                    onClick={logout}
                    className="btn btn-sm"
                    style={{
                      color: "#ef4444",
                      border: "1px solid #fecaca",
                      borderRadius: 10,
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-light-aesthetic btn-sm">
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary-aesthetic btn-sm"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ─── Booking Success Alert ─── */}
        {bookingSuccess && (
          <div
            style={{
              background: "#dcfce7",
              borderBottom: "1px solid #86efac",
              padding: "10px 0",
              textAlign: "center",
              color: "#15803d",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <i className="bi bi-check-circle-fill me-2"></i>
            {bookingSuccess}
          </div>
        )}

        {/* ─── Hero Section ─── */}
        <section className="py-5 text-center" style={{ minHeight: 560 }}>
          <div className="container py-4">
            <span
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                borderRadius: 30,
                padding: "5px 18px",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 18,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              🏡 Trusted Local Services
            </span>
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: -1,
                marginBottom: 16,
              }}
            >
              Find the Right Expert
              <br />
              <span style={{ color: "#FBB02D" }}>Near Your Doorstep</span>
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 18,
                maxWidth: 500,
                margin: "0 auto 32px",
              }}
            >
              Verified plumbers, electricians, cleaners & more — book in
              minutes.
            </p>

            {/* Search Bar */}
            <div
              style={{
                maxWidth: 600,
                margin: "0 auto",
                background: "#fff",
                borderRadius: 16,
                padding: 8,
                display: "flex",
                gap: 8,
                boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                border: "1px solid var(--border-light)",
              }}
            >
              <form
                onSubmit={handleSearch}
                style={{ display: "flex", gap: 8, width: "100%" }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 12,
                    gap: 8,
                  }}
                >
                  <i
                    className="bi bi-search"
                    style={{ color: "var(--text-muted)" }}
                  ></i>
                  <input
                    type="text"
                    placeholder="Search service (plumbing, cleaning, repair...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: 15,
                      color: "var(--text-primary)",
                      width: "100%",
                    }}
                  />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#52708a",
                      cursor: "pointer",
                      fontSize: 18,
                      padding: "0 4px",
                    }}
                  >
                    ×
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-primary-aesthetic btn"
                  style={{ borderRadius: 10, whiteSpace: "nowrap" }}
                >
                  Search
                </button>
              </form>
            </div>

            <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
              <a
                href="#categories"
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 14,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Browse categories ↓
              </a>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
              <button
                onClick={detectLocation}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FBB02D",
                  fontSize: 14,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <i className="bi bi-geo-alt-fill me-1"></i>Find nearest
                providers
              </button>
            </div>
          </div>
        </section>

        {/* ─── Stats Row ─── */}
        <section
          style={{
            borderTop: "1px solid rgba(255,255,255,0.15)",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            padding: "20px 0",
          }}
        >
          <div className="container">
            <div className="row text-center">
              {[
                {
                  label: "Verified Providers",
                  value: "4+",
                  icon: "bi-patch-check-fill",
                  color: "#FBB02D",
                },
                {
                  label: "Service Categories",
                  value: "6",
                  icon: "bi-grid-fill",
                  color: "#00B4D8",
                },
                {
                  label: "Bookings Made",
                  value: "3+",
                  icon: "bi-calendar-check-fill",
                  color: "#90E0EF",
                },
                {
                  label: "5-Star Reviews",
                  value: "100%",
                  icon: "bi-star-fill",
                  color: "#FBB02D",
                },
              ].map((stat) => (
                <div key={stat.label} className="col-6 col-md-3 py-2">
                  <i
                    className={"bi " + stat.icon}
                    style={{ fontSize: 22, color: stat.color }}
                  ></i>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#fff",
                      marginTop: 4,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Service Categories ─── */}
        <section className="py-5" id="categories">
          <div className="container">
            <div className="text-center mb-4">
              <h2
                style={{
                  fontWeight: 800,
                  color: "#fff",
                  fontSize: 28,
                  textShadow: "0 2px 14px rgba(3,4,94,0.5)",
                }}
              >
                What do you need help with?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 0 }}>
                Tap a category to see available professionals
              </p>
            </div>
            <div className="row g-3 justify-content-center">
              {categories.map((cat) => {
                const colors = categoryColors[cat.name] || {
                  bg: "#CAF0F8",
                  icon: "#023E8A",
                };
                const isActive = selectedCategory === cat.name;
                return (
                  <div key={cat.id} className="col-6 col-md-4 col-lg-2">
                    <div
                      onClick={() => handleCategorySelect(cat.name)}
                      className="card-aesthetic text-center p-3"
                      style={{
                        cursor: "pointer",
                        outline: isActive ? "2px solid #00B4D8" : "none",
                        position: "relative",
                      }}
                    >
                      {isActive && (
                        <span
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "#023E8A",
                            color: "#fff",
                            borderRadius: 20,
                            padding: "1px 8px",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          Active
                        </span>
                      )}
                      <div
                        className="category-bubble"
                        style={{ background: colors.bg }}
                      >
                        <i
                          className={"bi " + (cat.icon || "bi-gear")}
                          style={{ color: colors.icon }}
                        ></i>
                      </div>
                      <h6
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          marginBottom: 2,
                          color: "var(--text-primary)",
                        }}
                      >
                        {cat.name}
                      </h6>
                      <small style={{ color: "var(--text-muted)" }}>
                        {cat._count?.services || 0} services
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Providers List ─── */}
        <section
          style={{
            paddingTop: "24px",
            paddingBottom: "56px",
          }}
          id="providers"
        >
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h2
                  style={{
                    fontWeight: 800,
                    fontSize: 24,
                    color: "#fff",
                    textShadow: "0 2px 14px rgba(3,4,94,0.5)",
                    marginBottom: 2,
                  }}
                >
                  {selectedCategory
                    ? selectedCategory + " Providers"
                    : "All Providers"}
                </h2>
                <p
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  Verified & background-checked professionals in your area
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    background: "#CAF0F8",
                    color: "#03045E",
                    borderRadius: 20,
                    padding: "5px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {filteredProviders.length === providers.length
                    ? `${providers.length} available`
                    : `Showing ${filteredProviders.length} of ${providers.length}`}
                </span>
                {selectedCategory && (
                  <button
                    onClick={handleReset}
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.35)",
                      borderRadius: 10,
                      padding: "4px 12px",
                      fontSize: 13,
                      cursor: "pointer",
                      color: "#fff",
                    }}
                  >
                    Clear category ×
                  </button>
                )}
              </div>
            </div>

            {/* ─── Filter & Sorting Toolbar ─── */}
            <div
              className="p-3 mb-4"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(202, 240, 248, 0.22)",
                borderRadius: 18,
                boxShadow: "0 8px 30px rgba(3, 4, 94, 0.3)",
              }}
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                {/* Left Controls: Sort By + Verified Toggle */}
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#CAF0F8",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      <i className="bi bi-arrow-down-up me-1" style={{ color: "#00B4D8" }}></i>
                      Sort:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="form-select form-select-sm"
                      style={{
                        width: "auto",
                        background: "#03045E",
                        color: "#CAF0F8",
                        borderColor: "rgba(202, 240, 248, 0.4)",
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <option value="recommended">⚡ Recommended</option>
                      <option value="rating_desc">⭐ Top Rated (5.0 → 1.0)</option>
                      <option value="price_asc">💰 Price: Low to High</option>
                      <option value="price_desc">💎 Price: High to Low</option>
                      <option value="exp_desc">🏆 Most Experienced</option>
                    </select>
                  </div>

                  {/* Verified Only Toggle */}
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className="btn btn-sm"
                    style={{
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 13,
                      transition: "all 0.2s ease",
                      background: verifiedOnly
                        ? "linear-gradient(135deg, #023E8A 0%, #00B4D8 100%)"
                        : "rgba(255, 255, 255, 0.1)",
                      color: verifiedOnly ? "#FFFFFF" : "#CAF0F8",
                      border: verifiedOnly
                        ? "1px solid #00B4D8"
                        : "1px solid rgba(202, 240, 248, 0.25)",
                      boxShadow: verifiedOnly
                        ? "0 3px 12px rgba(0, 180, 216, 0.4)"
                        : "none",
                    }}
                  >
                    <i
                      className={
                        verifiedOnly
                          ? "bi bi-patch-check-fill me-1"
                          : "bi bi-patch-check me-1"
                      }
                      style={{
                        color: verifiedOnly ? "#FFFFFF" : "#00B4D8",
                      }}
                    ></i>
                    Verified Only
                  </button>
                </div>

                {/* Right Controls: Rating Pills & Max Rate Slider */}
                <div className="d-flex flex-wrap align-items-center gap-3">
                  {/* Rating Selector */}
                  <div className="d-flex align-items-center gap-1">
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#CAF0F8",
                        marginRight: 4,
                      }}
                    >
                      Rating:
                    </span>
                    {[
                      { label: "All", val: 0 },
                      { label: "4.0+ ★", val: 4.0 },
                      { label: "4.5+ ★", val: 4.5 },
                    ].map((r) => {
                      const isSelected = minRating === r.val;
                      return (
                        <button
                          key={r.label}
                          onClick={() => setMinRating(r.val)}
                          className="btn btn-sm py-1 px-2"
                          style={{
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: isSelected ? 700 : 500,
                            background: isSelected
                              ? "#FBB02D"
                              : "rgba(255, 255, 255, 0.08)",
                            color: isSelected ? "#03045E" : "#CAF0F8",
                            border: isSelected
                              ? "1px solid #FBB02D"
                              : "1px solid rgba(202, 240, 248, 0.25)",
                            boxShadow: isSelected
                              ? "0 2px 8px rgba(251, 176, 45, 0.4)"
                              : "none",
                          }}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Hourly Rate Slider */}
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ minWidth: 190 }}
                  >
                    <div className="d-flex flex-column w-100">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span
                          style={{
                            fontSize: 12,
                            color: "#CAF0F8",
                            fontWeight: 600,
                          }}
                        >
                          Max Rate:
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#FBB02D",
                            fontWeight: 700,
                          }}
                        >
                          {maxPrice >= 1500 ? "Any Budget" : `≤ ₹${maxPrice}/hr`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="250"
                        max="1500"
                        step="50"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        style={{
                          accentColor: "#00B4D8",
                          cursor: "pointer",
                          height: 5,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips */}
              {hasActiveFilters && (
                <div
                  className="d-flex align-items-center justify-content-between pt-2 mt-2 flex-wrap gap-2"
                  style={{
                    borderTop: "1px solid rgba(202, 240, 248, 0.15)",
                  }}
                >
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)" }}>
                      Active:
                    </span>
                    {minRating > 0 && (
                      <span
                        className="badge d-flex align-items-center gap-1"
                        style={{
                          background: "#CAF0F8",
                          color: "#03045E",
                          borderRadius: 12,
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                        onClick={() => setMinRating(0)}
                        title="Click to remove"
                      >
                        ⭐ {minRating}+ Stars
                        <i className="bi bi-x-circle-fill text-muted ms-1"></i>
                      </span>
                    )}
                    {verifiedOnly && (
                      <span
                        className="badge d-flex align-items-center gap-1"
                        style={{
                          background: "#CAF0F8",
                          color: "#03045E",
                          borderRadius: 12,
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                        onClick={() => setVerifiedOnly(false)}
                        title="Click to remove"
                      >
                        ✓ Verified Only
                        <i className="bi bi-x-circle-fill text-muted ms-1"></i>
                      </span>
                    )}
                    {maxPrice < 1500 && (
                      <span
                        className="badge d-flex align-items-center gap-1"
                        style={{
                          background: "#CAF0F8",
                          color: "#03045E",
                          borderRadius: 12,
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                        onClick={() => setMaxPrice(1500)}
                        title="Click to remove"
                      >
                        ₹ ≤ {maxPrice}/hr
                        <i className="bi bi-x-circle-fill text-muted ms-1"></i>
                      </span>
                    )}
                    {sortBy !== "recommended" && (
                      <span
                        className="badge d-flex align-items-center gap-1"
                        style={{
                          background: "#CAF0F8",
                          color: "#03045E",
                          borderRadius: 12,
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                        onClick={() => setSortBy("recommended")}
                        title="Click to remove"
                      >
                        Sort: {sortBy.replace("_", " ")}
                        <i className="bi bi-x-circle-fill text-muted ms-1"></i>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleResetFilters}
                    className="btn btn-link p-0 text-decoration-none"
                    style={{
                      fontSize: 12,
                      color: "#FBB02D",
                      fontWeight: 600,
                    }}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>Reset All Filters
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border"
                  style={{ color: "#00b4d8" }}
                ></div>
                <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 12 }}>
                  Finding providers...
                </p>
              </div>
            ) : providers.length === 0 ? (
              <div className="card-aesthetic p-5 text-center">
                <i
                  className="bi bi-search"
                  style={{ fontSize: 40, color: "var(--text-muted)" }}
                ></i>
                <h5 style={{ marginTop: 16, color: "var(--text-secondary)" }}>
                  No providers found
                </h5>
                <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
                  Try a different keyword or reset the filter.
                </p>
                <button
                  onClick={handleReset}
                  className="btn-primary-aesthetic btn btn-sm px-4"
                >
                  Reset Search
                </button>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="card-aesthetic p-5 text-center">
                <i
                  className="bi bi-funnel"
                  style={{ fontSize: 40, color: "var(--text-muted)" }}
                ></i>
                <h5 style={{ marginTop: 16, color: "var(--text-secondary)" }}>
                  No providers match your filters
                </h5>
                <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
                  Try loosening your rating or price constraints.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn-primary-aesthetic btn btn-sm px-4"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="row g-4">
                {filteredProviders.map((p) => (
                  <div key={p.id} className="col-md-6">
                    <div className="card-aesthetic p-4 h-100">
                      {/* Provider Header */}
                      <div className="d-flex align-items-start justify-content-between mb-2">
                        <div>
                          <h5
                            style={{
                              fontWeight: 700,
                              fontSize: 17,
                              marginBottom: 2,
                            }}
                          >
                            <Link
                              to={"/providers/" + p.id}
                              style={{
                                color: "var(--text-primary)",
                                textDecoration: "none",
                              }}
                              className="hover-primary"
                            >
                              {p.businessName || p.user.name}
                            </Link>
                            {p.isVerified && (
                              <i
                                className="bi bi-patch-check-fill ms-2"
                                style={{ color: "#00b4d8", fontSize: 14 }}
                                title="Verified"
                              ></i>
                            )}
                          </h5>
                          <div
                            style={{ fontSize: 13, color: "var(--text-muted)" }}
                          >
                            <i className="bi bi-person me-1"></i>
                            {p.user.name}
                            <span className="mx-2">·</span>
                            <i className="bi bi-briefcase me-1"></i>
                            {p.experience} yrs exp
                          </div>
                        </div>
                        <div className="text-end">
                          <span
                            style={{
                              background: "#fef9c3",
                              color: "#92400e",
                              borderRadius: 20,
                              padding: "3px 10px",
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            ★ {p.rating}
                          </span>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--text-muted)",
                              marginTop: 2,
                            }}
                          >
                            {p.reviewCount} review
                            {p.reviewCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>

                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: 13,
                          marginBottom: 12,
                        }}
                      >
                        {p.bio}
                      </p>

                      {/* Info Tags */}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span
                          style={{
                            background: "#CAF0F8",
                            color: "#023E8A",
                            borderRadius: 8,
                            padding: "3px 10px",
                            fontSize: 12,
                          }}
                        >
                          <i className="bi bi-geo-alt me-1 text-danger"></i>
                          {p.city}
                        </span>
                        <span
                          style={{
                            background: "#CAF0F8",
                            color: "#023E8A",
                            borderRadius: 8,
                            padding: "3px 10px",
                            fontSize: 12,
                          }}
                        >
                          <i className="bi bi-cash me-1 text-success"></i>From ₹
                          {p.hourlyRate}/hr
                        </span>
                      </div>

                      {/* Services */}
                      <div
                        style={{
                          borderTop: "1px solid var(--border-light)",
                          paddingTop: 12,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "var(--text-muted)",
                            marginBottom: 8,
                          }}
                        >
                          Services Offered
                        </div>
                        <div className="d-flex flex-column gap-2">
                          {p.services &&
                            p.services.map((s) => (
                              <div
                                key={s.id}
                                style={{
                                  background: "#ffffff",
                                  borderRadius: 10,
                                  padding: "8px 12px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      fontSize: 13,
                                      color: "var(--text-primary)",
                                    }}
                                  >
                                    {s.title}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "var(--text-muted)",
                                      maxWidth: 260,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {s.description}
                                  </div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      color: "#059669",
                                      fontSize: 14,
                                    }}
                                  >
                                    ₹{s.price}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setActiveBooking({
                                        service: s,
                                        provider: p,
                                      })
                                    }
                                    className="btn-primary-aesthetic btn btn-sm"
                                    style={{
                                      padding: "5px 14px",
                                      fontSize: 13,
                                    }}
                                  >
                                    Book
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── Map Section ─── */}
        <section
          id="map-section"
          style={{
            padding: "56px 0",
            borderTop: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div className="container">
            <div className="text-center mb-4">
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 28,
                  color: "#fff",
                  textShadow: "0 2px 14px rgba(3,4,94,0.5)",
                }}
              >
                Nearby Service Providers
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 20 }}>
                Find verified professionals on the map near your location
              </p>
              {!userLocation && (
                <button
                  onClick={detectLocation}
                  className="btn-primary-aesthetic btn px-4 mb-3"
                >
                  <i className="bi bi-geo-alt-fill me-2"></i>Detect My Location
                </button>
              )}
              {locationError && (
                <p style={{ color: "#ef4444", fontSize: 13 }}>
                  {locationError}
                </p>
              )}
              {userLocation && !mapInstanceRef.current && (
                <p style={{ color: "#059669", fontSize: 14, fontWeight: 500 }}>
                  <i className="bi bi-check-circle-fill me-1"></i>Location
                  detected! Loading map...
                </p>
              )}
            </div>

            {userLocation ? (
              <div ref={mapRef} className="map-container"></div>
            ) : (
              <div
                style={{
                  height: 300,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 18,
                  border: "2px dashed rgba(255,255,255,0.3)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <i
                  className="bi bi-map"
                  style={{ fontSize: 48, color: "rgba(255,255,255,0.7)" }}
                ></i>
                <p
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 15,
                    margin: 0,
                  }}
                >
                  Click "Detect My Location" to see providers near you on the
                  map
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ─── Booking Modal ─── */}
        {activeBooking && (
          <BookingModal
            service={activeBooking.service}
            provider={activeBooking.provider}
            onClose={() => setActiveBooking(null)}
            onSuccess={handleBookingSuccess}
          />
        )}

        {/* ─── Footer ─── */}
        <footer
          style={{
            background: "rgba(3,4,94,0.55)",
            backdropFilter: "blur(6px)",
            color: "#caf0f8",
            padding: "32px 0",
            textAlign: "center",
          }}
        >
          <div className="container">
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>
              ServiGo
            </span>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>
              Your Trusted Local Services Platform &copy; 2026
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home;
