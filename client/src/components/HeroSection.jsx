import React, { useState, useEffect } from "react";
import SmartSearchBar from "./SmartSearchBar";

const ROTATING_SERVICES = [
  { text: "Laptop & Computer Repair", icon: "bi-laptop", color: "#F97316" },
  { text: "AC Deep Cleaning & Gas Refill", icon: "bi-snow", color: "#00B4D8" },
  { text: "Emergency Pipe Leak & Tap Fix", icon: "bi-wrench-adjustable", color: "#38BDF8" },
  { text: "Short Circuit & Electrical Repair", icon: "bi-lightning-charge", color: "#FBB02D" },
  { text: "Full Home Deep Cleaning", icon: "bi-stars", color: "#10B981" },
  { text: "Door Lock & Furniture Carpentry", icon: "bi-hammer", color: "#F59E0B" },
  { text: "Wall Painting & Waterproofing", icon: "bi-paint-bucket", color: "#A855F7" },
  { text: "Odorless Herbal Pest Control", icon: "bi-shield-shaded", color: "#EC4899" }
];

export default function HeroSection({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSelectCategory,
  onSelectSubCategory,
  onBookService,
  providers = [],
  userLocation,
  onDetectLocation,
  onReset
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeAnim, setFadeAnim] = useState(true);

  // Rotating text timer
  useEffect(() => {
    const timer = setInterval(() => {
      setFadeAnim(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ROTATING_SERVICES.length);
        setFadeAnim(true);
      }, 250);
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  const activeService = ROTATING_SERVICES[currentIndex];

  const popularShortcuts = [
    { label: "Laptop Fix", icon: "bi-laptop", cat: "IT & Electronics", subId: "laptop" },
    { label: "AC Repair", icon: "bi-snow", cat: "Home Appliances", subId: "ac" },
    { label: "Plumber", icon: "bi-wrench-adjustable", cat: "Plumbing", subId: "tap-leak" },
    { label: "Electrician", icon: "bi-lightning-charge", cat: "Electrician", subId: "short-circuit" },
    { label: "Deep Clean", icon: "bi-stars", cat: "Home Cleaning", subId: "full-home-clean" },
    { label: "Pest Control", icon: "bi-shield-shaded", cat: "Pest Control", subId: "cockroach-ants" }
  ];

  return (
    <section
      className="text-center"
      style={{
        paddingTop: "60px",
        paddingBottom: "48px",
        position: "relative"
      }}
    >
      <div className="container">
        {/* ─── Top Trust Pill Badge ─── */}
        <div className="d-flex justify-content-center mb-3">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0, 180, 216, 0.18)",
              border: "1px solid rgba(0, 180, 216, 0.45)",
              borderRadius: 30,
              padding: "6px 18px",
              color: "#CAF0F8",
              fontSize: 13,
              fontWeight: 700,
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 15px rgba(0, 180, 216, 0.25)"
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 8px #10B981"
              }}
            ></span>
            <span>⚡ OVER 100+ VERIFIED LOCAL PROS AVAILABLE NOW</span>
          </div>
        </div>

        {/* ─── Main Hero Title ─── */}
        <h1
          style={{
            fontSize: "clamp(2.2rem, 5.2vw, 3.8rem)",
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: -1,
            lineHeight: 1.15,
            marginBottom: 16,
            textShadow: "0 4px 20px rgba(3, 4, 94, 0.8)"
          }}
        >
          Book Verified Experts For
          <br />
          {/* Animated Rotating Service Line */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              color: activeService.color,
              transition: "opacity 0.25s ease, transform 0.25s ease",
              opacity: fadeAnim ? 1 : 0,
              transform: fadeAnim ? "translateY(0)" : "translateY(8px)"
            }}
          >
            <i className={"bi " + activeService.icon}></i>
            <span
              style={{
                background: `linear-gradient(135deg, ${activeService.color} 0%, #CAF0F8 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                borderBottom: `2.5px solid ${activeService.color}55`,
                paddingBottom: 2
              }}
            >
              {activeService.text}
            </span>
          </span>
        </h1>

        {/* Subtitle with Value Propositions */}
        <p
          style={{
            color: "rgba(202, 240, 248, 0.9)",
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            maxWidth: 640,
            margin: "0 auto 30px",
            lineHeight: 1.5,
            fontWeight: 400
          }}
        >
          Instant doorstep service in <strong>30 minutes</strong>. Transparent upfront pricing, background-checked specialists, and satisfaction guaranteed.
        </p>

        {/* ─── Smart Predictive Search Console ─── */}
        <SmartSearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSearchSubmit={onSearchSubmit}
          onSelectCategory={onSelectCategory}
          onSelectSubCategory={onSelectSubCategory}
          onBookService={onBookService}
          providers={providers}
          userLocation={userLocation}
          onDetectLocation={onDetectLocation}
          onReset={onReset}
        />

        {/* ─── Quick Popular Category Shortcuts ─── */}
        <div
          className="d-flex align-items-center justify-content-center gap-2 mt-4 flex-wrap"
          style={{ maxWidth: 760, margin: "20px auto 0" }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#00B4D8",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginRight: 4
            }}
          >
            Popular:
          </span>

          {popularShortcuts.map((sc) => (
            <button
              key={sc.label}
              onClick={() => {
                onSelectCategory(sc.cat);
                const el = document.getElementById("categories");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn btn-sm"
              style={{
                background: "rgba(0, 180, 216, 0.15)",
                border: "1px solid rgba(0, 180, 216, 0.35)",
                borderRadius: 20,
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 13px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 180, 216, 0.30)";
                e.currentTarget.style.borderColor = "#00B4D8";
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 180, 216, 0.15)";
                e.currentTarget.style.borderColor = "rgba(0, 180, 216, 0.35)";
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <i className={"bi " + sc.icon + " me-1"}></i>
              {sc.label}
            </button>
          ))}
        </div>

        {/* ─── Four Trust Pillars Strip ─── */}
        <div
          className="d-flex justify-content-center align-items-center gap-4 mt-5 flex-wrap"
          style={{
            borderTop: "1px solid rgba(0, 180, 216, 0.2)",
            paddingTop: 24
          }}
        >
          {[
            { icon: "bi-patch-check-fill", title: "100% Verified", desc: "Background-checked Pros", color: "#00B4D8" },
            { icon: "bi-stopwatch-fill", title: "30-Min Arrival", desc: "Prompt doorstep service", color: "#FBB02D" },
            { icon: "bi-tag-fill", title: "Fixed Pricing", desc: "No hidden charges ever", color: "#10B981" },
            { icon: "bi-shield-fill-check", title: "Service Warranty", desc: "30-Day guarantee", color: "#A855F7" }
          ].map((item) => (
            <div
              key={item.title}
              className="d-flex align-items-center gap-2 text-start"
              style={{
                background: "linear-gradient(135deg, rgba(4, 20, 54, 0.85) 0%, rgba(2, 12, 38, 0.95) 100%)",
                padding: "8px 16px",
                borderRadius: 14,
                border: "1px solid rgba(0, 180, 216, 0.28)",
                boxShadow: "0 4px 14px rgba(1, 10, 26, 0.35)"
              }}
            >
              <i
                className={"bi " + item.icon}
                style={{ fontSize: 20, color: item.color }}
              ></i>
              <div>
                <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                  {item.title}
                </div>
                <div style={{ color: "#CAF0F8", fontSize: 11 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
