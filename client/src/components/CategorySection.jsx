import React, { useState, useMemo } from "react";
import { MAIN_CATEGORIES } from "../data/categoriesCatalog";

export default function CategorySection({
  selectedCategory,
  selectedSubCategory,
  onSelectCategory,
  onSelectSubCategory,
  onBookService,
  providers = []
}) {
  const [activeTab, setActiveTab] = useState("all"); // "all" or specific category ID
  const [hoveredCard, setHoveredCard] = useState(null);

  // Collect all services from all providers with provider details attached
  const allServicesWithProvider = useMemo(() => {
    const list = [];
    providers.forEach((prov) => {
      if (prov.services && Array.isArray(prov.services)) {
        prov.services.forEach((srv) => {
          list.push({
            ...srv,
            provider: prov,
            categoryName: srv.category?.name || prov.services[0]?.category?.name || ""
          });
        });
      }
    });
    return list;
  }, [providers]);

  // Filter services matching current selected subcategory
  const activeSubcategoryServices = useMemo(() => {
    if (!selectedSubCategory) return [];

    // Find subcategory definition across all categories
    let subDef = null;
    let parentCat = null;
    for (const cat of MAIN_CATEGORIES) {
      const match = cat.subcategories.find((s) => s.id === selectedSubCategory.id);
      if (match) {
        subDef = match;
        parentCat = cat;
        break;
      }
    }

    if (!subDef) return [];

    const queryLower = (subDef.query || subDef.name).toLowerCase();
    const subNameLower = subDef.name.toLowerCase();

    // Find services in DB that match the subcategory keyword or parent category
    const matched = allServicesWithProvider.filter((s) => {
      const titleLower = (s.title || "").toLowerCase();
      const descLower = (s.description || "").toLowerCase();
      const catLower = (s.categoryName || "").toLowerCase();

      const matchesKeyword =
        titleLower.includes(queryLower) ||
        descLower.includes(queryLower) ||
        titleLower.includes(subNameLower) ||
        (queryLower === "ac" && (titleLower.includes("ac ") || titleLower.includes("air cond")));

      const matchesCat = parentCat
        ? catLower.includes(parentCat.dbCategory.toLowerCase()) ||
          catLower.includes(parentCat.name.toLowerCase())
        : true;

      return matchesKeyword || (matchesCat && titleLower.includes(subNameLower));
    });

    // If specific services matched, return them; otherwise return all services under this provider/category
    if (matched.length > 0) return matched;

    return allServicesWithProvider.filter((s) => {
      const catLower = (s.categoryName || "").toLowerCase();
      return (
        parentCat &&
        (catLower.includes(parentCat.dbCategory.toLowerCase()) ||
          catLower.includes(parentCat.name.toLowerCase()))
      );
    });
  }, [selectedSubCategory, allServicesWithProvider]);

  // Handle clicking a subcategory card
  const handleSubCategoryClick = (cat, sub) => {
    if (selectedSubCategory?.id === sub.id) {
      // Toggle off
      onSelectSubCategory(null);
    } else {
      onSelectCategory(cat.dbCategory);
      onSelectSubCategory({
        ...sub,
        categoryName: cat.name,
        categoryDb: cat.dbCategory,
        accentColor: cat.accentColor
      });

      // Smooth scroll to services drawer
      setTimeout(() => {
        const el = document.getElementById("subcategory-services-drawer");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  };

  // Categories to render based on tab filter
  const displayedCategories = useMemo(() => {
    if (activeTab === "all") return MAIN_CATEGORIES;
    return MAIN_CATEGORIES.filter((c) => c.id === activeTab);
  }, [activeTab]);

  return (
    <section className="py-5" id="categories" style={{ position: "relative" }}>
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-4">
          <span
            style={{
              display: "inline-block",
              background: "#E6FAF6",
              color: "#00684A",
              borderRadius: 30,
              padding: "5px 18px",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 10,
              letterSpacing: 0.5,
              border: "1.5px solid #10C4A8"
            }}
          >
            ⚡ QUICK SERVICE DISCOVERY
          </span>
          <h2
            style={{
              fontWeight: 800,
              color: "#001E2B",
              fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)",
              letterSpacing: -0.5,
            }}
          >
            Explore Services by Category
          </h2>
          <p
            style={{
              color: "#3D4F58",
              maxWidth: 620,
              margin: "0 auto",
              fontSize: 15
            }}
          >
            Select any category or subcategory to instantly view verified professionals and book directly.
          </p>
        </div>

        {/* ─── Main Category Tabs / Quick Filter Pills ─── */}
        <div
          className="d-flex align-items-center gap-2 mb-4 pb-2"
          style={{
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          <button
            onClick={() => {
              setActiveTab("all");
              onSelectCategory("");
              onSelectSubCategory(null);
            }}
            className="btn btn-sm"
            style={{
              whiteSpace: "nowrap",
              borderRadius: 24,
              padding: "7px 18px",
              fontSize: 13,
              fontWeight: 700,
              background:
                activeTab === "all"
                  ? "linear-gradient(135deg, #10C4A8 0%, #0DB197 100%)"
                  : "#FFFFFF",
              color: activeTab === "all" ? "#001E2B" : "#001E2B",
              border:
                activeTab === "all"
                  ? "1.5px solid #001E2B"
                  : "1px solid rgba(0, 30, 43, 0.15)",
              boxShadow:
                activeTab === "all"
                  ? "0 4px 15px rgba(16, 196, 168, 0.35)"
                  : "0 2px 6px rgba(0, 30, 43, 0.05)",
              transition: "all 0.2s ease"
            }}
          >
            <i className="bi bi-grid-3x3-gap-fill me-1"></i> All Categories (8)
          </button>

          {MAIN_CATEGORIES.map((cat) => {
            const isTabActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id);
                  onSelectCategory(cat.dbCategory);
                }}
                className="btn btn-sm"
                style={{
                  whiteSpace: "nowrap",
                  borderRadius: 24,
                  padding: "7px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  background: isTabActive
                    ? "#001E2B"
                    : "#FFFFFF",
                  color: isTabActive ? "#FFFFFF" : "#001E2B",
                  border: isTabActive
                    ? "1.5px solid #001E2B"
                    : "1px solid rgba(0, 30, 43, 0.15)",
                  boxShadow: isTabActive
                    ? "0 4px 15px rgba(0, 30, 43, 0.25)"
                    : "0 2px 6px rgba(0, 30, 43, 0.05)",
                  transition: "all 0.2s ease"
                }}
              >
                <i className={"bi " + cat.icon + " me-1"}></i>
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* ─── Active Subcategory Floating Bar / Breadcrumb ─── */}
        {selectedSubCategory && (
          <div
            id="subcategory-services-drawer"
            className="p-4 mb-4 rounded-4 subcategory-drawer-box"
            style={{
              background: "#FFFFFF",
              border: "2px solid #10C4A8",
              borderRadius: 24,
              boxShadow: "0 14px 40px rgba(16, 196, 168, 0.15)"
            }}
          >
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="d-flex align-items-center gap-3">
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: selectedSubCategory.squircleBg || "#E6FAF6",
                    color: selectedSubCategory.squircleColor || "#00684A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    boxShadow: `0 2px 8px ${selectedSubCategory.squircleBg || "#E6FAF6"}`
                  }}
                >
                  <i className={"bi " + selectedSubCategory.icon}></i>
                </span>
                <div>
                  <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>
                    {selectedSubCategory.categoryName} &gt; Selected Subcategory
                  </div>
                  <h4 style={{ margin: 0, color: "#001E2B", fontWeight: 800, fontSize: 19 }}>
                    {selectedSubCategory.name} Services
                  </h4>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span
                  className="badge px-3 py-2"
                  style={{
                    background: "#E6FAF6",
                    color: "#00684A",
                    border: "1px solid rgba(16, 196, 168, 0.3)",
                    fontSize: 12,
                    borderRadius: 20,
                    fontWeight: 700
                  }}
                >
                  {activeSubcategoryServices.length} direct options
                </span>
                <button
                  onClick={() => onSelectSubCategory(null)}
                  className="btn btn-sm"
                  style={{
                    background: "#001E2B",
                    color: "#FFFFFF",
                    borderRadius: 12,
                    fontSize: 12,
                    padding: "4px 12px",
                    fontWeight: 700,
                    border: "none"
                  }}
                >
                  <i className="bi bi-x me-1"></i> Close
                </button>
              </div>
            </div>

            {/* Direct Bookable Services Cards */}
            {activeSubcategoryServices.length > 0 ? (
              <div className="row g-3">
                {activeSubcategoryServices.map((srv) => (
                  <div key={srv.id} className="col-12 col-md-6 col-lg-4">
                    <div className="service-direct-card h-100 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                          <h6
                            style={{
                              fontWeight: 700,
                              color: "#0F172A",
                              fontSize: 15,
                              marginBottom: 0
                            }}
                          >
                            {srv.title}
                          </h6>
                          <span
                            style={{
                              background: "#DCFCE7",
                              color: "#166534",
                              fontWeight: 800,
                              fontSize: 14,
                              padding: "2px 8px",
                              borderRadius: 8,
                              whiteSpace: "nowrap"
                            }}
                          >
                            ₹{srv.price}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#64748B",
                            lineHeight: 1.4,
                            marginBottom: 10,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}
                        >
                          {srv.description}
                        </p>
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid #E2E8F0",
                          paddingTop: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <div style={{ fontSize: 12 }}>
                          <span style={{ fontWeight: 600, color: "#1E293B" }}>
                            {srv.provider?.businessName || srv.provider?.user?.name || "Verified Pro"}
                          </span>
                          {srv.provider?.isVerified && (
                            <i
                              className="bi bi-patch-check-fill ms-1"
                              style={{ color: "#0284C7", fontSize: 13 }}
                              title="Verified"
                            ></i>
                          )}
                          <div style={{ color: "#F59E0B", fontSize: 11 }}>
                            ★ {srv.provider?.rating || "5.0"}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            onBookService({
                              service: srv,
                              provider: srv.provider
                            })
                          }
                          className="btn-primary-aesthetic btn btn-sm py-1 px-3"
                          style={{ fontSize: 13, borderRadius: 8 }}
                        >
                          <i className="bi bi-calendar-plus me-1"></i> Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="text-center py-4 rounded-3 shadow-sm"
                style={{ background: "#FFFFFF", border: "1px dashed rgba(0, 30, 43, 0.25)" }}
              >
                <i className="bi bi-info-circle fs-4 d-block mb-1" style={{ color: "#10C4A8" }}></i>
                <div style={{ color: "#001E2B", fontSize: 14, fontWeight: 700 }}>
                  Showing all available professionals for {selectedSubCategory.name}
                </div>
                <small style={{ color: "#3D4F58" }}>
                  Browse provider profiles below or contact directly to schedule custom work.
                </small>
              </div>
            )}
          </div>
        )}

        {/* ─── Stacked Categories & Subcategory Grids (Matching User Reference) ─── */}
        <div className="d-flex flex-column gap-5">
          {displayedCategories.map((category) => {
            const isCategorySelected = selectedCategory === category.dbCategory;

            return (
              <div
                key={category.id}
                className="p-4 p-md-5 rounded-4 category-block-card position-relative"
                style={{
                  background: "#FFFFFF",
                  border: isCategorySelected
                    ? "2px solid #10C4A8"
                    : "1.5px solid rgba(226, 232, 240, 0.9)",
                  boxShadow: isCategorySelected
                    ? "0 14px 40px rgba(16, 196, 168, 0.18)"
                    : "0 10px 35px rgba(0, 30, 43, 0.05), 0 1px 3px rgba(0, 30, 43, 0.02)",
                  borderRadius: 24,
                  overflow: "hidden",
                  transition: "all 0.3s ease"
                }}
              >
                {/* Header matching user reference image */}
                <div
                  className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 position-relative"
                  style={{ zIndex: 1 }}
                >
                  {/* Left: Squircle Icon Box + Category Name + Subtitle + Accent underline */}
                  <div className="d-flex align-items-start gap-3">
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: category.headerIconBg || "#EDE9FE",
                        color: category.headerIconColor || "#4F46E5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        flexShrink: 0,
                        boxShadow: `0 4px 14px ${category.headerIconBg || "rgba(0,0,0,0.06)"}`
                      }}
                    >
                      <i className={`bi ${category.headerIcon || category.icon || "bi-grid-fill"}`}></i>
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: "clamp(1.35rem, 2.5vw, 1.65rem)",
                          fontWeight: 800,
                          color: "#001E2B",
                          margin: 0,
                          letterSpacing: -0.4,
                          lineHeight: 1.2
                        }}
                      >
                        {category.name}
                      </h3>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#475569",
                          margin: "4px 0 6px 0",
                          fontWeight: 500,
                          maxWidth: 580
                        }}
                      >
                        {category.tagline}
                      </p>
                      {/* Accent underline pill bar matching reference */}
                      <div
                        style={{
                          width: 28,
                          height: 3.5,
                          borderRadius: 4,
                          backgroundColor: category.accentLineColor || category.accentColor || "#3B82F6"
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Right: Subcategories Count Pill & Filter Providers Button */}
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span
                      className="badge rounded-pill d-flex align-items-center gap-1.5"
                      style={{
                        background: "#EFF6FF",
                        color: "#2563EB",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "7px 14px",
                        border: "1px solid rgba(37, 99, 235, 0.2)"
                      }}
                    >
                      <i className="bi bi-grid-3x3-gap-fill me-1"></i>
                      <span>{category.subcategories.length} Subcategories</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory(
                          selectedCategory === category.dbCategory ? "" : category.dbCategory
                        );
                        onSelectSubCategory(null);
                      }}
                      className="btn rounded-pill px-3 py-1.5 shadow-sm d-flex align-items-center gap-2"
                      style={{
                        background: isCategorySelected ? "#10C4A8" : "#FFFFFF",
                        color: "#001E2B",
                        border: isCategorySelected ? "1.5px solid #10C4A8" : "1.5px solid #CBD5E1",
                        fontWeight: 700,
                        fontSize: 13,
                        transition: "all 0.2s ease"
                      }}
                    >
                      <i className="bi bi-funnel" style={{ fontSize: 13, color: "#001E2B" }}></i>
                      <span>{isCategorySelected ? "Show All Categories" : "Filter Providers"}</span>
                      <i
                        className={`bi ${isCategorySelected ? "bi-x" : "bi-chevron-down"}`}
                        style={{ fontSize: 12 }}
                      ></i>
                    </button>
                  </div>
                </div>

                {/* Subcategory Cards Grid */}
                <div
                  className="subcategory-grid position-relative"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
                    gap: "14px",
                    zIndex: 1
                  }}
                >
                  {category.subcategories.map((sub) => {
                    const isSubActive = selectedSubCategory?.id === sub.id;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => handleSubCategoryClick(category, sub)}
                        className={`subcategory-card ${isSubActive ? "is-active" : ""}`}
                        style={{
                          background: sub.cardBg || "linear-gradient(145deg, #F8FAFC 0%, #F1F5F9 100%)",
                          border: isSubActive
                            ? "2px solid #10C4A8"
                            : "1px solid rgba(0, 0, 0, 0.06)",
                          borderRadius: 18,
                          padding: 16,
                          minHeight: 142,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                          boxShadow: isSubActive
                            ? "0 8px 24px rgba(16, 196, 168, 0.25)"
                            : "0 2px 8px rgba(0, 30, 43, 0.04)"
                        }}
                      >
                        {/* Top: Squircle Icon Box */}
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div
                            className="subcategory-icon-squircle"
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              background: sub.squircleBg || "#DBEAFE",
                              color: sub.squircleColor || "#2563EB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 19,
                              boxShadow: `0 2px 6px ${sub.squircleBg || "#DBEAFE"}`
                            }}
                          >
                            <i className={`bi ${sub.icon}`}></i>
                          </div>

                          {isSubActive && (
                            <span
                              className="badge rounded-pill"
                              style={{
                                background: "#10C4A8",
                                color: "#001E2B",
                                fontSize: 10,
                                fontWeight: 800,
                                padding: "3px 8px"
                              }}
                            >
                              ✓ Selected
                            </span>
                          )}
                        </div>

                        {/* Middle: Title & Subtitle */}
                        <div className="text-start mb-2">
                          <div
                            className="subcategory-title"
                            style={{
                              fontWeight: 800,
                              fontSize: 13.5,
                              color: "#001E2B",
                              lineHeight: 1.25,
                              marginBottom: 3
                            }}
                          >
                            {sub.name}
                          </div>
                          <div
                            className="subcategory-desc"
                            style={{
                              fontSize: 11,
                              color: "#64748B",
                              lineHeight: 1.35
                            }}
                          >
                            {sub.desc}
                          </div>
                        </div>

                        {/* Bottom: Circular Action Arrow */}
                        <div className="d-flex justify-content-end align-items-center pt-1 mt-auto">
                          <div
                            className="subcategory-action-arrow"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: isSubActive ? "#10C4A8" : sub.arrowBg || "#EFF6FF",
                              color: isSubActive ? "#FFFFFF" : sub.arrowColor || "#2563EB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 800,
                              transition: "all 0.2s ease"
                            }}
                          >
                            <i className="bi bi-arrow-right"></i>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Decorative watermark devices/tech illustration on bottom-right (exact match to user screenshot) */}
                <div
                  className="position-absolute end-0 bottom-0 pointer-events-none d-none d-md-block"
                  style={{
                    opacity: 0.18,
                    transform: "translate(15px, 20px)",
                    zIndex: 0,
                    pointerEvents: "none"
                  }}
                >
                  <svg width="220" height="150" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="40" width="130" height="85" rx="8" stroke={category.accentLineColor || "#3B82F6"} strokeWidth="2.5" />
                    <path d="M10 125H160C163 125 165 127 165 130V132H5V130C5 127 7 125 10 125Z" fill={category.accentLineColor || "#3B82F6"} fillOpacity="0.15" stroke={category.accentLineColor || "#3B82F6"} strokeWidth="2" />
                    <line x1="75" y1="125" x2="95" y2="125" stroke={category.accentLineColor || "#3B82F6"} strokeWidth="3" strokeLinecap="round" />
                    <rect x="135" y="55" width="55" height="90" rx="10" fill="#FFFFFF" stroke={category.accentLineColor || "#3B82F6"} strokeWidth="2.5" />
                    <rect x="145" y="65" width="35" height="68" rx="4" fill={category.accentLineColor || "#3B82F6"} fillOpacity="0.08" />
                    <line x1="155" y1="60" x2="170" y2="60" stroke={category.accentLineColor || "#3B82F6"} strokeWidth="2" strokeLinecap="round" />
                    <circle cx="162" cy="139" r="3" fill={category.accentLineColor || "#3B82F6"} />
                    <path d="M190 28C198 36 198 48 190 56" stroke={category.accentLineColor || "#3B82F6"} strokeWidth="2" strokeLinecap="round" />
                    <path d="M198 20C210 32 210 52 198 64" stroke={category.accentLineColor || "#3B82F6"} strokeWidth="2" strokeLinecap="round" />
                    <circle cx="182" cy="42" r="2.5" fill={category.accentLineColor || "#3B82F6"} />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
