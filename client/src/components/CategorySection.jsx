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
              background: "rgba(0, 180, 216, 0.2)",
              color: "#00B4D8",
              borderRadius: 30,
              padding: "5px 18px",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 10,
              letterSpacing: 0.5,
              border: "1px solid rgba(0, 180, 216, 0.35)"
            }}
          >
            ⚡ QUICK SERVICE DISCOVERY
          </span>
          <h2
            style={{
              fontWeight: 800,
              color: "#FFFFFF",
              fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)",
              letterSpacing: -0.5,
              textShadow: "0 2px 14px rgba(1, 10, 26, 0.7)"
            }}
          >
            Explore Services by Category
          </h2>
          <p
            style={{
              color: "rgba(202, 240, 248, 0.85)",
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
                  ? "linear-gradient(135deg, #00B4D8 0%, #023EBA 100%)"
                  : "rgba(2, 62, 186, 0.45)",
              color: "#FFFFFF",
              border:
                activeTab === "all"
                  ? "1.5px solid #00B4D8"
                  : "1px solid rgba(0, 180, 216, 0.3)",
              boxShadow:
                activeTab === "all"
                  ? "0 4px 15px rgba(0, 180, 216, 0.4)"
                  : "none",
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
                    ? `linear-gradient(135deg, ${cat.accentColor} 0%, #023EBA 100%)`
                    : "rgba(2, 62, 186, 0.45)",
                  color: isTabActive ? "#FFFFFF" : "#CAF0F8",
                  border: isTabActive
                    ? `1.5px solid ${cat.accentColor}`
                    : "1px solid rgba(0, 180, 216, 0.25)",
                  boxShadow: isTabActive
                    ? `0 4px 15px rgba(1, 10, 26, 0.5)`
                    : "none",
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
            className="p-3 mb-4 rounded-4 subcategory-drawer-box"
            style={{
              background: "linear-gradient(135deg, rgba(4, 20, 54, 0.92) 0%, rgba(2, 12, 36, 0.98) 100%)",
              border: `1.5px solid ${selectedSubCategory.accentColor || "#00B4D8"}`,
              boxShadow: "0 12px 35px rgba(1, 10, 26, 0.6), 0 0 20px rgba(0, 180, 216, 0.25)"
            }}
          >
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: `${selectedSubCategory.accentColor}25`,
                    border: `1.5px solid ${selectedSubCategory.accentColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: selectedSubCategory.accentColor || "#00B4D8",
                    fontSize: 18
                  }}
                >
                  <i className={"bi " + selectedSubCategory.icon}></i>
                </span>
                <div>
                  <div style={{ fontSize: 12, color: "#00B4D8", fontWeight: 600 }}>
                    {selectedSubCategory.categoryName} &gt; Selected Subcategory
                  </div>
                  <h4 style={{ margin: 0, color: "#FFFFFF", fontWeight: 800, fontSize: 18 }}>
                    {selectedSubCategory.name} Services
                  </h4>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span
                  className="badge px-3 py-2"
                  style={{
                    background: "rgba(0, 180, 216, 0.2)",
                    color: "#CAF0F8",
                    border: "1px solid rgba(0, 180, 216, 0.3)",
                    fontSize: 12,
                    borderRadius: 20
                  }}
                >
                  {activeSubcategoryServices.length} direct options
                </span>
                <button
                  onClick={() => onSelectSubCategory(null)}
                  className="btn btn-sm"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "#FFFFFF",
                    borderRadius: 12,
                    fontSize: 12,
                    padding: "4px 12px",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
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
                className="text-center py-4 rounded-3"
                style={{ background: "rgba(3, 4, 94, 0.45)", border: "1px dashed rgba(0, 180, 216, 0.25)" }}
              >
                <i className="bi bi-info-circle fs-4 d-block mb-1" style={{ color: "#00B4D8" }}></i>
                <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600 }}>
                  Showing all available professionals for {selectedSubCategory.name}
                </div>
                <small style={{ color: "#CAF0F8", opacity: 0.85 }}>
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
                className="p-4 rounded-4 category-block-card"
                style={{
                  background: "linear-gradient(145deg, rgba(4, 18, 48, 0.85) 0%, rgba(2, 10, 32, 0.94) 100%)",
                  backdropFilter: "blur(12px)",
                  border: isCategorySelected
                    ? `2px solid ${category.accentColor}`
                    : "1.5px solid rgba(0, 180, 216, 0.28)",
                  boxShadow: "0 10px 30px rgba(1, 10, 26, 0.45)",
                  transition: "all 0.3s ease"
                }}
              >
                {/* Section Header with Vertical Accent Bar (Exact reference screenshot design) */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <div className="category-section-title mb-0">
                    {/* Vertical Accent Bar */}
                    <div
                      className="category-accent-bar"
                      style={{
                        backgroundColor: category.accentColor,
                        boxShadow: `0 0 12px ${category.accentColor}80`
                      }}
                    ></div>
                    <h3
                      style={{
                        fontSize: "clamp(1.2rem, 2.5vw, 1.45rem)",
                        fontWeight: 700,
                        color: "#FFFFFF",
                        margin: 0,
                        letterSpacing: -0.3
                      }}
                    >
                      {category.name}
                    </h3>
                  </div>

                  {/* Subcategory counter badge */}
                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        fontSize: 12,
                        color: "#CAF0F8",
                        background: "rgba(0, 180, 216, 0.15)",
                        padding: "3px 12px",
                        borderRadius: 20,
                        border: "1px solid rgba(0, 180, 216, 0.25)",
                        fontWeight: 600
                      }}
                    >
                      {category.subcategories.length} subcategories
                    </span>
                    <button
                      onClick={() => {
                        onSelectCategory(
                          selectedCategory === category.dbCategory ? "" : category.dbCategory
                        );
                        onSelectSubCategory(null);
                      }}
                      className="btn btn-sm p-0 text-decoration-none"
                      style={{
                        color: category.accentColor,
                        fontSize: 13,
                        fontWeight: 600,
                        marginLeft: 6
                      }}
                    >
                      {selectedCategory === category.dbCategory
                        ? "Show All Categories"
                        : "Filter Providers →"}
                    </button>
                  </div>
                </div>

                {/* Subcategory Cards Grid */}
                <div className="subcategory-grid">
                  {category.subcategories.map((sub) => {
                    const isSubActive = selectedSubCategory?.id === sub.id;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => handleSubCategoryClick(category, sub)}
                        className={`subcategory-card ${isSubActive ? "is-active" : ""}`}
                        style={{
                          borderColor: isSubActive ? category.accentColor : "#E2E8F0"
                        }}
                      >
                        {/* Selected Indicator Badge */}
                        {isSubActive && (
                          <span
                            style={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              background: category.accentColor,
                              color: "#FFFFFF",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 800,
                              boxShadow: `0 2px 8px ${category.accentColor}60`
                            }}
                          >
                            ✓
                          </span>
                        )}

                        {/* Circular Icon Container (Exact match to reference image) */}
                        <div
                          className="subcategory-icon-circle"
                          style={{
                            backgroundColor: category.iconBg,
                            border: `1.5px solid ${category.iconBorder}`,
                            color: category.accentColor
                          }}
                        >
                          <i className={"bi " + sub.icon}></i>
                        </div>

                        {/* Subcategory Label */}
                        <h6 className="subcategory-title">{sub.name}</h6>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
