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
                  style={{ color: "#00B4D8" }}
                ></i>
                ServiGo
              </span>
            </Link>

            <div className="d-flex align-items-center gap-3">
              {/* ── Top compact search bar with magnifying glass icon ── */}
              <div
                className="d-flex align-items-center"
                style={{
                  background: "rgba(3, 4, 94, 0.75)",
                  border: "1px solid rgba(0, 180, 216, 0.35)",
                  borderRadius: 20,
                  padding: "4px 12px",
                  gap: 8,
                  transition: "all 0.25s ease",
                }}
              >
                <i
                  className="bi bi-search"
                  style={{ color: "#00B4D8", fontSize: 13, cursor: "pointer" }}
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
                    color: "#FFFFFF",
                    fontSize: 13,
                    width: 135,
                    transition: "width 0.25s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.width = "185px";
                    e.target.parentElement.style.borderColor = "#00B4D8";
                    e.target.parentElement.style.boxShadow = "0 0 12px rgba(0, 180, 216, 0.4)";
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.style.width = "135px";
                    e.target.parentElement.style.borderColor = "rgba(0, 180, 216, 0.35)";
                    e.target.parentElement.style.boxShadow = "none";
                  }}
                />
              </div>

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
                        background: "linear-gradient(135deg, #FBB02D 0%, #E59F24 100%)",
                        color: "#03045E",
                        fontWeight: 700,
                        borderRadius: 10,
                        border: "1px solid #FBB02D",
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
                        background: "rgba(0, 180, 216, 0.18)",
                        color: "#CAF0F8",
                        fontWeight: 600,
                        borderRadius: 10,
                        border: "1px solid rgba(0, 180, 216, 0.35)",
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
                <div className="spinner-border me-2" style={{ color: "#00B4D8" }} role="status"></div>
                <span style={{ color: "#CAF0F8" }}>Loading 3D world...</span>
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
            borderTop: "1px solid rgba(0, 180, 216, 0.2)",
            borderBottom: "1px solid rgba(0, 180, 216, 0.2)",
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
                  color: "#00B4D8",
                },
                {
                  label: "Service Categories",
                  value: "6",
                  icon: "bi-grid-fill",
                  color: "#FBB02D",
                },
                {
                  label: "Bookings Made",
                  value: "3+",
                  icon: "bi-calendar-check-fill",
                  color: "#00B4D8",
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
                      color: "#FFFFFF",
                      marginTop: 4,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{ fontSize: 13, color: "rgba(202, 240, 248, 0.75)" }}
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
                    color: "#FFFFFF",
                    textShadow: "0 2px 14px rgba(1, 10, 26, 0.7)",
                    marginBottom: 2,
                  }}
                >
                  {selectedSubCategory ? (
                    <>
                      <span style={{ opacity: 0.85, fontSize: 20 }}>
                        {selectedSubCategory.categoryName} &gt;{" "}
                      </span>
                      <span style={{ color: selectedSubCategory.accentColor || "#00B4D8" }}>
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
                    color: "rgba(202, 240, 248, 0.78)",
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
                    background: "linear-gradient(135deg, #00B4D8 0%, #023EBA 100%)",
                    color: "#FFFFFF",
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
                {selectedSubCategory && (
                  <button
                    onClick={() => setSelectedSubCategory(null)}
                    style={{
                      background: "rgba(0, 180, 216, 0.18)",
                      border: `1.5px solid ${selectedSubCategory.accentColor || "#00B4D8"}`,
                      borderRadius: 10,
                      padding: "4px 12px",
                      fontSize: 13,
                      cursor: "pointer",
                      color: "#FFFFFF",
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
                      background: "rgba(202, 240, 248, 0.12)",
                      border: "1px solid rgba(0, 180, 216, 0.35)",
                      borderRadius: 10,
                      padding: "4px 12px",
                      fontSize: 13,
                      cursor: "pointer",
                      color: "#CAF0F8",
                    }}
                  >
                    Clear All ×
                  </button>
                )}
              </div>
            </div>

            {/* ─── Filter & Sorting Toolbar ─── */}
            <div
              className="p-3 mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(4, 20, 54, 0.90) 0%, rgba(2, 12, 38, 0.96) 100%)",
                backdropFilter: "blur(16px)",
                border: "1.5px solid rgba(0, 180, 216, 0.35)",
                borderRadius: 18,
                boxShadow: "0 10px 30px rgba(1, 10, 26, 0.55), 0 0 20px rgba(0, 180, 216, 0.15)",
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
                        color: "#00B4D8",
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
                        background: "rgba(0, 180, 216, 0.15)",
                        color: "#FFFFFF",
                        borderColor: "rgba(0, 180, 216, 0.35)",
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <option value="recommended" style={{ background: "#051838", color: "#fff" }}>⚡ Recommended</option>
                      <option value="rating_desc" style={{ background: "#051838", color: "#fff" }}>⭐ Top Rated (5.0 → 1.0)</option>
                      <option value="price_asc" style={{ background: "#051838", color: "#fff" }}>💰 Price: Low to High</option>
                      <option value="price_desc" style={{ background: "#051838", color: "#fff" }}>💎 Price: High to Low</option>
                      <option value="exp_desc" style={{ background: "#051838", color: "#fff" }}>🏆 Most Experienced</option>
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
                        ? "linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)"
                        : "rgba(0, 180, 216, 0.12)",
                      color: "#FFFFFF",
                      border: verifiedOnly
                        ? "1.5px solid #00B4D8"
                        : "1px solid rgba(0, 180, 216, 0.3)",
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
                        color: "#00B4D8",
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
                              : "rgba(0, 180, 216, 0.12)",
                            color: isSelected ? "#03045E" : "#CAF0F8",
                            border: isSelected
                              ? "1px solid #FBB02D"
                              : "1px solid rgba(0, 180, 216, 0.25)",
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
                            color: "#00B4D8",
                            fontWeight: 600,
                          }}
                        >
                          Max Rate:
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#FFFFFF",
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
                    borderTop: "1px solid rgba(0, 180, 216, 0.2)",
                  }}
                >
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <span style={{ fontSize: 12, color: "rgba(202, 240, 248, 0.7)" }}>
                      Active:
                    </span>
                    {minRating > 0 && (
                      <span
                        className="badge d-flex align-items-center gap-1"
                        style={{
                          background: "rgba(0, 180, 216, 0.2)",
                          color: "#FFFFFF",
                          borderRadius: 12,
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                          border: "1px solid rgba(0, 180, 216, 0.35)",
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
                        className="badge d-flex align-items-center gap-1"
                        style={{
                          background: selectedSubCategory.accentColor || "#00B4D8",
                          color: "#FFFFFF",
                          borderRadius: 12,
                          padding: "4px 10px",
                          fontSize: 11,
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                        onClick={() => setSelectedSubCategory(null)}
                        title="Click to remove"
                      >
                        <i className={"bi " + selectedSubCategory.icon + " me-1"}></i>
                        Sub: {selectedSubCategory.name}
                        <i className="bi bi-x-circle-fill text-white ms-1"></i>
                      </span>
                    )}
                    {verifiedOnly && (
                      <span
                        className="badge d-flex align-items-center gap-1"
                        style={{
                          background: "rgba(0, 180, 216, 0.2)",
                          color: "#FFFFFF",
                          borderRadius: 12,
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                          border: "1px solid rgba(0, 180, 216, 0.35)",
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
                          background: "rgba(0, 180, 216, 0.2)",
                          color: "#FFFFFF",
                          borderRadius: 12,
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                          border: "1px solid rgba(0, 180, 216, 0.35)",
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
                          background: "rgba(0, 180, 216, 0.2)",
                          color: "#FFFFFF",
                          borderRadius: 12,
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                          border: "1px solid rgba(0, 180, 216, 0.35)",
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
                      color: "#00B4D8",
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
                  style={{ color: "#00B4D8" }}
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
                                style={{ color: "#00B4D8", fontSize: 14 }}
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
                              background: "rgba(0, 180, 216, 0.2)",
                              color: "#CAF0F8",
                              borderRadius: 20,
                              padding: "3px 10px",
                              fontWeight: 700,
                              fontSize: 14,
                              border: "1px solid rgba(0, 180, 216, 0.35)",
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
                            background: "rgba(0, 180, 216, 0.16)",
                            color: "#CAF0F8",
                            borderRadius: 8,
                            padding: "3px 10px",
                            fontSize: 12,
                            border: "1px solid rgba(0, 180, 216, 0.30)",
                          }}
                        >
                          <i className="bi bi-geo-alt me-1 text-danger"></i>
                          {p.city}
                        </span>
                        <span
                          style={{
                            background: "rgba(0, 180, 216, 0.16)",
                            color: "#CAF0F8",
                            borderRadius: 8,
                            padding: "3px 10px",
                            fontSize: 12,
                            border: "1px solid rgba(0, 180, 216, 0.30)",
                          }}
                        >
                          <i className="bi bi-cash me-1" style={{ color: "#00B4D8" }}></i>From ₹
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
                            color: "#00B4D8",
                            marginBottom: 8,
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
                                    background: isMatch
                                      ? "linear-gradient(135deg, rgba(0, 180, 216, 0.35) 0%, rgba(0, 119, 182, 0.6) 100%)"
                                      : "rgba(0, 180, 216, 0.08)",
                                    border: isMatch
                                      ? `1.5px solid ${selectedSubCategory.accentColor || "#00B4D8"}`
                                      : "1px solid rgba(0, 180, 216, 0.22)",
                                    borderRadius: 10,
                                    padding: "8px 12px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    transition: "all 0.2s ease",
                                    boxShadow: isMatch
                                      ? "0 4px 14px rgba(0, 180, 216, 0.35)"
                                      : "none",
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        fontSize: 13,
                                        color: "var(--text-primary)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                      }}
                                    >
                                      {s.title}
                                      {isMatch && (
                                        <span
                                          style={{
                                            background: selectedSubCategory.accentColor || "#00B4D8",
                                            color: "#fff",
                                            fontSize: 10,
                                            padding: "1px 7px",
                                            borderRadius: 10,
                                            fontWeight: 700,
                                          }}
                                        >
                                          Matched
                                        </span>
                                      )}
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
                                        color: "#00B4D8",
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
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

        {/* ─── Footer ─── */}
        <footer
          style={{
            background: "rgba(3, 4, 94, 0.96)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(0, 180, 216, 0.2)",
            color: "#CAF0F8",
            padding: "36px 0",
            textAlign: "center",
          }}
        >
          <div className="container">
            <span style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 20 }}>
              ServiGo
            </span>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, color: "rgba(202, 240, 248, 0.75)" }}>
              Your Trusted Local Services Platform &copy; 2026
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home;
