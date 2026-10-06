import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BookingModal from "../components/BookingModal";
import GradientBackground from "../components/GradientBackground";
import CategorySection from "../components/CategorySection";
import SmartSearchBar from "../components/SmartSearchBar";
import NearbyServicesMap from "../components/NearbyServicesMap";
import HowItWorks from "../components/HowItWorks";
import { useTheme } from "../context/ThemeContext";
import { API_BASE } from "../config/api";
import L from "leaflet";

const OrbitDeliveryHero = React.lazy(() => import("../components/ui/orbit-delivery-hero"));

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function Home() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const [categories, setCategories] = useState([]);


  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
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

  useEffect(() => {
    fetchCategories();
    fetchProviders();
  }, []);

  // Filtered & Sorted Providers computation
  const filteredProviders = useMemo(() => {
    return providers
      .filter((p) => {
        // Subcategory filter if active
        if (selectedSubCategory) {
          const q = (selectedSubCategory.query || selectedSubCategory.name).toLowerCase();
          const hasMatchingService = (p.services || []).some((s) => {
            const t = (s.title || "").toLowerCase();
            const d = (s.description || "").toLowerCase();
            const c = (s.category?.name || "").toLowerCase();
            return (
              t.includes(q) ||
              d.includes(q) ||
              (q === "ac" && (t.includes("ac ") || t.includes("air cond"))) ||
              (selectedSubCategory.categoryDb &&
                c.includes(selectedSubCategory.categoryDb.toLowerCase()))
            );
          });
          if (!hasMatchingService) return false;
        }

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
  }, [providers, minRating, verifiedOnly, maxPrice, sortBy, selectedSubCategory]);

  const hasActiveFilters =
    minRating > 0 ||
    verifiedOnly ||
    maxPrice < 1500 ||
    sortBy !== "recommended" ||
    Boolean(selectedSubCategory);

  const handleResetFilters = () => {
    setMinRating(0);
    setVerifiedOnly(false);
    setMaxPrice(1500);
    setSortBy("recommended");
    setSelectedSubCategory(null);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
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
        `${API_BASE}/api/providers?` + params.toString(),
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
    if (!newCat) setSelectedSubCategory(null);
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
    setSelectedSubCategory(null);
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
            <Link
              to="/"
              style={{ textDecoration: "none", cursor: "pointer" }}
              onClick={(e) => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              title="Click to scroll to top"
            >
              <span className="brand-text fs-4">
                <i
                  className="bi bi-tools me-2"
                  style={{ color: "#10C4A8" }}
                ></i>
                ServiGo
              </span>
            </Link>

            <div className="d-flex align-items-center gap-3">
              {/* ── Top compact search bar with magnifying glass icon ── */}
              <div
                className="d-flex align-items-center"
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid #10C4A8",
                  borderRadius: 20,
                  padding: "4px 12px",
                  gap: 8,
                  transition: "all 0.25s ease",
                  boxShadow: "0 2px 8px rgba(16, 196, 168, 0.15)",
                }}
              >
                <i
                  className="bi bi-search"
                  style={{ color: "#00684A", fontSize: 13, cursor: "pointer" }}
                  onClick={() => {
                    const el = document.getElementById("smart-search-input") || document.querySelector("input[placeholder*='Search service']");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                      setTimeout(() => el.focus(), 250);
                    }
                  }}
                ></i>
                <input
                  type="text"
                  placeholder="Search service..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchProviders(e.target.value, selectedCategory);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const el = document.getElementById("providers");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#001E2B",
                    fontSize: 13,
                    width: 135,
                    transition: "width 0.25s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.width = "185px";
                    e.target.parentElement.style.borderColor = "#001E2B";
                    e.target.parentElement.style.boxShadow = "0 0 12px rgba(16, 196, 168, 0.4)";
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.style.width = "135px";
                    e.target.parentElement.style.borderColor = "#10C4A8";
                    e.target.parentElement.style.boxShadow = "none";
                  }}
                />
              </div>

              <a
                href="#categories"
                style={{
                  color: "#001E2B",
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Services
              </a>
              <a
                href="#map-section"
                style={{
                  color: "#001E2B",
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: 600,
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
                        background: "linear-gradient(135deg, #FFB02D 0%, #E59E24 100%)",
                        color: "#001E2B",
                        fontWeight: 700,
                        borderRadius: 10,
                        border: "1px solid #FFB02D",
                      }}
                    >
                      <i className="bi bi-shield-check me-1"></i>Admin
                    </Link>
                  )}
                  {user.role === "provider" && (
                    <Link
                      to="/dashboard"
                      className="btn btn-sm"
                      style={{
                        background: "#E6FAF6",
                        color: "#00684A",
                        fontWeight: 600,
                        borderRadius: 10,
                        border: "1px solid #10C4A8",
                      }}
                    >
                      <i className="bi bi-graph-up-arrow me-1"></i>Analytics
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
                      color: "#001E2B",
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

        {/* ─── 3D Orbit Delivery Hero with Local Service Tagline & Smart Search Bar ─── */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            margin: "0 0 24px",
            borderBottom: "1px solid rgba(246, 219, 192, 0.22)",
          }}
        >
          <Suspense
            fallback={
              <div
                className="d-flex align-items-center justify-content-center text-white"
                style={{ minHeight: "680px" }}
              >
                <div className="spinner-border me-2" style={{ color: "#10C4A8" }} role="status"></div>
                <span style={{ color: "#001E2B" }}>Loading 3D world...</span>
              </div>
            }
          >
            <OrbitDeliveryHero
              theme={theme}
              hideHeader={true}
              eyebrow="Verified Local Experts, on their way"
              title={
                <>
                  Local Services.
                  <br />
                  Delivered
                  <br />
                  <em>with care.</em>
                </>
              }
              description="Expert doorstep help in 30 minutes."
              footerLeft={
                <>
                  Small repairs
                  <br />
                  Big peace of mind
                </>
              }
              footerRight={
                <>
                  Right at your
                  <br />
                  doorstep
                </>
              }
              searchComponent={
                <div style={{ marginTop: 20, maxWidth: 580, pointerEvents: "auto" }}>
                  <SmartSearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSearchSubmit={handleSearch}
                    onSelectCategory={(catName) => {
                      handleCategorySelect(catName);
                    }}
                    onSelectSubCategory={(sub) => {
                      setSelectedSubCategory(sub);
                    }}
                    onBookService={({ service, provider }) => {
                      setActiveBooking({ service, provider });
                    }}
                    providers={providers}
                    userLocation={userLocation}
                    onDetectLocation={detectLocation}
                    onReset={handleReset}
                  />
                </div>
              }
            />
          </Suspense>
        </section>



        {/* ─── Stats Row ─── */}
        <section
          style={{
            borderTop: "1px solid rgba(16, 196, 168, 0.2)",
            borderBottom: "1px solid rgba(16, 196, 168, 0.2)",
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
                  color: "#10C4A8",
                },
                {
                  label: "Service Categories",
                  value: "6",
                  icon: "bi-grid-fill",
                  color: "#FFB02D",
                },
                {
                  label: "Bookings Made",
                  value: "3+",
                  icon: "bi-calendar-check-fill",
                  color: "#00684A",
                },
                {
                  label: "5-Star Reviews",
                  value: "100%",
                  icon: "bi-star-fill",
                  color: "#FFB02D",
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
                      color: "#001E2B",
                      marginTop: 4,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#3D4F58" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works (4 Step Visual Guide) ─── */}
        <HowItWorks />

        {/* ─── 2-Tier Service Categories & Subcategories (Matching User Reference) ─── */}
        <CategorySection
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
          onSelectCategory={(catName) => {
            setSelectedCategory(catName);
            fetchProviders(searchQuery, catName);
          }}
          onSelectSubCategory={(sub) => {
            setSelectedSubCategory(sub);
          }}
          onBookService={({ service, provider }) => {
            setActiveBooking({ service, provider });
          }}
          providers={providers}
        />

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
                    color: "#001E2B",
                    marginBottom: 2,
                  }}
                >
                  {selectedSubCategory ? (
                    <>
                      <span style={{ opacity: 0.85, fontSize: 20 }}>
                        {selectedSubCategory.categoryName} &gt;{" "}
                      </span>
                      <span style={{ color: "#00684A" }}>
                        {selectedSubCategory.name}
                      </span>{" "}
                      Providers
                    </>
                  ) : selectedCategory ? (
                    selectedCategory + " Providers"
                  ) : (
                    "All Providers"
                  )}
                </h2>
                <p
                  style={{
                    color: "#3D4F58",
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  {selectedSubCategory
                    ? `Showing verified professionals offering ${selectedSubCategory.name} services`
                    : "Verified & background-checked professionals in your area"}
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    background: "linear-gradient(135deg, #10C4A8 0%, #0DB197 100%)",
                    color: "#001E2B",
                    borderRadius: 20,
                    padding: "5px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: "0 2px 10px rgba(16, 196, 168, 0.25)",
                  }}
                >
                  {filteredProviders.length === providers.length
                    ? `${providers.length} available`
                    : `Showing ${filteredProviders.length} of ${providers.length}`}
                </span>
                {selectedSubCategory && (
                  <button
                    onClick={() => setSelectedSubCategory(null)}
                    style={{
                      background: "#E6FAF6",
                      border: "1.5px solid #10C4A8",
                      borderRadius: 10,
                      padding: "4px 12px",
                      fontSize: 13,
                      cursor: "pointer",
                      color: "#00684A",
                      fontWeight: 600,
                    }}
                  >
                    Clear {selectedSubCategory.name} ×
                  </button>
                )}
                {selectedCategory && (
                  <button
                    onClick={handleReset}
                    style={{
                      background: "#E6FAF6",
                      border: "1px solid #10C4A8",
                      borderRadius: 10,
                      padding: "4px 12px",
                      fontSize: 13,
                      cursor: "pointer",
                      color: "#00684A",
                      fontWeight: 600,
                    }}
                  >
                    Clear All ×
                  </button>
                )}
              </div>
            </div>

            {/* ─── Filter & Sorting Toolbar ─── */}
            <div
              className="p-3 p-md-4 mb-4"
              style={{
                background: "#FFFFFF",
                border: "1.5px solid rgba(226, 232, 240, 0.9)",
                borderRadius: 20,
                boxShadow: "0 8px 30px rgba(0, 30, 43, 0.04), 0 1px 3px rgba(0, 30, 43, 0.02)",
              }}
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                {/* Left Controls: Sort By + Verified Toggle */}
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#001E2B",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      <i className="bi bi-arrow-down-up me-1" style={{ color: "#10C4A8" }}></i>
                      Sort:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="form-select form-select-sm"
                      style={{
                        width: "auto",
                        background: "#FFFFFF",
                        color: "#001E2B",
                        borderColor: "#CBD5E1",
                        borderRadius: 12,
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
                    className="btn btn-sm rounded-pill px-3"
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      transition: "all 0.2s ease",
                      background: verifiedOnly ? "#10C4A8" : "#FFFFFF",
                      color: "#001E2B",
                      border: verifiedOnly ? "1.5px solid #10C4A8" : "1.5px solid #CBD5E1",
                      boxShadow: verifiedOnly ? "0 2px 8px rgba(16, 196, 168, 0.3)" : "none",
                    }}
                  >
                    <i
                      className={
                        verifiedOnly
                          ? "bi bi-patch-check-fill me-1 text-dark"
                          : "bi bi-patch-check me-1"
                      }
                      style={{
                        color: verifiedOnly ? "#001E2B" : "#10C4A8",
                      }}
                    ></i>
                    Verified Only
                  </button>
                </div>

                {/* Right Controls: Rating Pills & Max Rate Slider */}
                <div className="d-flex flex-wrap align-items-center gap-3">
                  {/* Rating Selector */}
                  <div className="d-flex align-items-center gap-1.5">
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#001E2B",
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
                          className="btn btn-sm py-1 px-2.5 rounded-pill"
                          style={{
                            fontSize: 12,
                            fontWeight: isSelected ? 800 : 600,
                            background: isSelected ? "#001E2B" : "#FFFFFF",
                            color: isSelected ? "#FFFFFF" : "#475569",
                            border: isSelected ? "1px solid #001E2B" : "1px solid #CBD5E1",
                            boxShadow: isSelected ? "0 2px 8px rgba(0, 30, 43, 0.2)" : "none",
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
                            color: "#64748B",
                            fontWeight: 700,
                          }}
                        >
                          Max Rate:
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#001E2B",
                            fontWeight: 800,
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
                          accentColor: "#10C4A8",
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
                  className="d-flex align-items-center justify-content-between pt-3 mt-3 flex-wrap gap-2"
                  style={{
                    borderTop: "1px solid rgba(0, 30, 43, 0.08)",
                  }}
                >
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <span style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>
                      Active:
                    </span>
                    {minRating > 0 && (
                      <span
                        className="badge rounded-pill d-flex align-items-center gap-1"
                        style={{
                          background: "#FFFBEB",
                          color: "#B45309",
                          padding: "5px 10px",
                          fontSize: 11,
                          cursor: "pointer",
                          border: "1px solid #FDE68A",
                          fontWeight: 700,
                        }}
                        onClick={() => setMinRating(0)}
                        title="Click to remove"
                      >
                        ⭐ {minRating}+ Stars
                        <i className="bi bi-x-circle-fill text-muted ms-1"></i>
                      </span>
                    )}
                    {selectedSubCategory && (
                      <span
                        className="badge rounded-pill d-flex align-items-center gap-1"
                        style={{
                          background: "#E6FAF6",
                          color: "#00684A",
                          padding: "5px 12px",
                          fontSize: 11,
                          cursor: "pointer",
                          fontWeight: 700,
                          border: "1px solid rgba(16, 196, 168, 0.3)"
                        }}
                        onClick={() => setSelectedSubCategory(null)}
                        title="Click to remove"
                      >
                        <i className={"bi " + selectedSubCategory.icon + " me-1"}></i>
                        Sub: {selectedSubCategory.name}
                        <i className="bi bi-x-circle-fill text-muted ms-1"></i>
                      </span>
                    )}
                    {verifiedOnly && (
                      <span
                        className="badge rounded-pill d-flex align-items-center gap-1"
                        style={{
                          background: "#EFF6FF",
                          color: "#2563EB",
                          padding: "5px 10px",
                          fontSize: 11,
                          cursor: "pointer",
                          border: "1px solid rgba(37, 99, 235, 0.2)",
                          fontWeight: 700,
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
                        className="badge rounded-pill d-flex align-items-center gap-1"
                        style={{
                          background: "#F1F5F9",
                          color: "#001E2B",
                          padding: "5px 10px",
                          fontSize: 11,
                          cursor: "pointer",
                          border: "1px solid #CBD5E1",
                          fontWeight: 700,
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
                        className="badge rounded-pill d-flex align-items-center gap-1"
                        style={{
                          background: "#F1F5F9",
                          color: "#001E2B",
                          padding: "5px 10px",
                          fontSize: 11,
                          cursor: "pointer",
                          border: "1px solid #CBD5E1",
                          fontWeight: 700,
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
                      color: "#00684A",
                      fontWeight: 800,
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
                  style={{ color: "#10C4A8" }}
                ></div>
                <p style={{ color: "#001E2B", marginTop: 12 }}>
                  Finding providers...
                </p>
              </div>
            ) : providers.length === 0 ? (
              <div
                className="p-5 text-center rounded-4 shadow-sm"
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid rgba(226, 232, 240, 0.9)",
                  borderRadius: 22
                }}
              >
                <i
                  className="bi bi-search"
                  style={{ fontSize: 40, color: "#94A3B8" }}
                ></i>
                <h5 style={{ marginTop: 16, color: "#001E2B", fontWeight: 800 }}>
                  No providers found
                </h5>
                <p style={{ color: "#64748B", marginBottom: 20 }}>
                  Try a different keyword or reset the filter.
                </p>
                <button
                  onClick={handleReset}
                  className="btn btn-sm px-4 rounded-pill"
                  style={{
                    background: "#10C4A8",
                    color: "#001E2B",
                    fontWeight: 700,
                    border: "none"
                  }}
                >
                  Reset Search
                </button>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div
                className="p-5 text-center rounded-4 shadow-sm"
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid rgba(226, 232, 240, 0.9)",
                  borderRadius: 22
                }}
              >
                <i
                  className="bi bi-funnel"
                  style={{ fontSize: 40, color: "#94A3B8" }}
                ></i>
                <h5 style={{ marginTop: 16, color: "#001E2B", fontWeight: 800 }}>
                  No providers match your filters
                </h5>
                <p style={{ color: "#64748B", marginBottom: 20 }}>
                  Try loosening your rating or price constraints.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn btn-sm px-4 rounded-pill"
                  style={{
                    background: "#10C4A8",
                    color: "#001E2B",
                    fontWeight: 700,
                    border: "none"
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="row g-4">
                {filteredProviders.map((p) => {
                  const primaryService = p.services?.[0];
                  const catName = primaryService?.category?.name || "General";
                  
                  return (
                    <div key={p.id} className="col-12 col-lg-6">
                      <div className="p-4 rounded-4 h-100 position-relative d-flex flex-column justify-content-between provider-profile-card">
                        {/* Provider Header */}
                        <div>
                          <div className="d-flex align-items-start justify-content-between mb-3 gap-2">
                            <div className="d-flex align-items-center gap-3">
                              {/* Squircle Avatar / Category Icon */}
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 14,
                                  background: "#E6FAF6",
                                  color: "#00684A",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 22,
                                  fontWeight: 800,
                                  flexShrink: 0,
                                  boxShadow: "0 2px 8px rgba(16, 196, 168, 0.2)"
                                }}
                              >
                                <i className={`bi ${catName.includes("IT") ? "bi-laptop" : catName.includes("Electric") ? "bi-lightning-charge-fill" : catName.includes("Plumb") ? "bi-wrench-adjustable" : catName.includes("Clean") ? "bi-stars" : "bi-tools"}`}></i>
                              </div>

                              <div>
                                <h5
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 17,
                                    marginBottom: 2,
                                    lineHeight: 1.3
                                  }}
                                >
                                  <Link
                                    to={"/providers/" + p.id}
                                    style={{
                                      color: "#001E2B",
                                      textDecoration: "none"
                                    }}
                                    className="hover-primary"
                                  >
                                    {p.businessName || p.user?.name}
                                  </Link>
                                  {p.isVerified && (
                                    <i
                                      className="bi bi-patch-check-fill ms-2 text-success"
                                      style={{ fontSize: 15 }}
                                      title="Verified Professional"
                                    ></i>
                                  )}
                                </h5>
                                <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
                                  <i className="bi bi-person me-1"></i>
                                  {p.user?.name}
                                  <span className="mx-2">·</span>
                                  <i className="bi bi-briefcase me-1"></i>
                                  {p.experience} yrs exp
                                </div>
                              </div>
                            </div>

                            <div className="text-end flex-shrink-0">
                              <span
                                className="badge rounded-pill"
                                style={{
                                  background: "#FFFBEB",
                                  color: "#B45309",
                                  border: "1px solid #FDE68A",
                                  borderRadius: 20,
                                  padding: "4px 10px",
                                  fontWeight: 800,
                                  fontSize: 13
                                }}
                              >
                                ★ {p.rating}
                              </span>
                              <div
                                style={{
                                  fontSize: 11.5,
                                  color: "#94A3B8",
                                  marginTop: 3,
                                  fontWeight: 600
                                }}
                              >
                                {p.reviewCount} review{p.reviewCount !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>

                          <p
                            style={{
                              color: "#475569",
                              fontSize: 13,
                              marginBottom: 14,
                              lineHeight: 1.45
                            }}
                          >
                            {p.bio}
                          </p>

                          {/* Info Tags */}
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            <span
                              className="badge rounded-pill"
                              style={{
                                background: "#F1F5F9",
                                color: "#475569",
                                padding: "5px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                border: "1px solid #E2E8F0"
                              }}
                            >
                              <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
                              {p.city}
                            </span>
                            <span
                              className="badge rounded-pill"
                              style={{
                                background: "#E6FAF6",
                                color: "#00684A",
                                padding: "5px 12px",
                                fontSize: 12,
                                fontWeight: 700,
                                border: "1px solid rgba(16, 196, 168, 0.3)"
                              }}
                            >
                              <i className="bi bi-cash me-1 text-success"></i>From ₹{p.hourlyRate}/hr
                            </span>
                            <span
                              className="badge rounded-pill"
                              style={{
                                background: "#EFF6FF",
                                color: "#2563EB",
                                padding: "5px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                border: "1px solid rgba(37, 99, 235, 0.2)"
                              }}
                            >
                              <i className="bi bi-shield-check me-1"></i>Verified Pro
                            </span>
                          </div>
                        </div>

                        {/* Services Offered */}
                        <div
                          style={{
                            borderTop: "1px solid rgba(0, 30, 43, 0.08)",
                            paddingTop: 14,
                            marginTop: 10
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              color: "#64748B",
                              marginBottom: 10,
                            }}
                          >
                            Services Offered
                          </div>
                          <div className="d-flex flex-column gap-2">
                            {p.services &&
                              p.services.map((s) => {
                                const queryStr = selectedSubCategory
                                  ? (selectedSubCategory.query || selectedSubCategory.name).toLowerCase()
                                  : "";
                                const isMatch = Boolean(
                                  selectedSubCategory &&
                                    ((s.title || "").toLowerCase().includes(queryStr) ||
                                      (s.description || "").toLowerCase().includes(queryStr) ||
                                      (queryStr === "ac" &&
                                        ((s.title || "").toLowerCase().includes("ac ") ||
                                          (s.title || "").toLowerCase().includes("air cond"))))
                                );

                                return (
                                  <div
                                    key={s.id}
                                    style={{
                                      background: isMatch ? "#E6FAF6" : "#F8FAFC",
                                      border: isMatch
                                        ? "1.5px solid #10C4A8"
                                        : "1px solid #E2E8F0",
                                      borderRadius: 14,
                                      padding: "10px 14px",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      transition: "all 0.2s ease",
                                      boxShadow: isMatch
                                        ? "0 4px 14px rgba(16, 196, 168, 0.15)"
                                        : "none",
                                    }}
                                  >
                                    <div>
                                      <div
                                        style={{
                                          fontWeight: 700,
                                          fontSize: 13.5,
                                          color: "#001E2B",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 6,
                                        }}
                                      >
                                        {s.title}
                                        {isMatch && (
                                          <span
                                            className="badge rounded-pill"
                                            style={{
                                              background: "#10C4A8",
                                              color: "#001E2B",
                                              fontSize: 10,
                                              fontWeight: 800,
                                              padding: "2px 8px"
                                            }}
                                          >
                                            Matched
                                          </span>
                                        )}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "#64748B",
                                          maxWidth: 260,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          marginTop: 2
                                        }}
                                      >
                                        {s.description}
                                      </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      <span
                                        style={{
                                          fontWeight: 800,
                                          color: "#001E2B",
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
                                        className="btn btn-sm rounded-pill"
                                        style={{
                                          background: "#10C4A8",
                                          color: "#001E2B",
                                          fontWeight: 700,
                                          padding: "5px 14px",
                                          fontSize: 12,
                                          border: "none",
                                          boxShadow: "0 2px 8px rgba(16, 196, 168, 0.25)"
                                        }}
                                      >
                                        Book
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          <div className="d-flex justify-content-between align-items-center mt-3 pt-2">
                            <Link
                              to={"/providers/" + p.id}
                              style={{
                                color: "#00684A",
                                fontWeight: 700,
                                fontSize: 13,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              View Profile &amp; Reviews <i className="bi bi-arrow-right"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ─── Interactive Lollipop Stick Nearby Services Radar Map ─── */}
        <NearbyServicesMap
          providers={filteredProviders}
          userLocation={userLocation}
          onDetectLocation={detectLocation}
          locationError={locationError}
          onBookService={({ service, provider }) => {
            setActiveBooking({ service, provider });
          }}
          selectedCategory={selectedCategory}
        />

        {/* ─── Booking Modal ─── */}
        {activeBooking && (
          <BookingModal
            service={activeBooking.service}
            provider={activeBooking.provider}
            onClose={() => setActiveBooking(null)}
            onSuccess={handleBookingSuccess}
          />
        )}

        {/* ─── Footer: MongoDB Compass Slate ─── */}
        <footer
          style={{
            background: "#001E2B",
            borderTop: "2px solid #10C4A8",
            color: "#FFFFFF",
            padding: "36px 0",
            textAlign: "center",
          }}
        >
          <div className="container">
            <span style={{ color: "#10C4A8", fontWeight: 800, fontSize: 20 }}>
              ServiGo
            </span>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, color: "#94A3B8" }}>
              Your Trusted Local Services Platform &copy; 2026
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home;
