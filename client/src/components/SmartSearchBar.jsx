import React, { useState, useRef, useEffect, useMemo } from "react";
import { MAIN_CATEGORIES } from "../data/categoriesCatalog";

export default function SmartSearchBar({
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Collect all services from providers
  const allServices = useMemo(() => {
    const list = [];
    providers.forEach((p) => {
      (p.services || []).forEach((s) => {
        list.push({
          ...s,
          provider: p,
          categoryName: s.category?.name || p.services[0]?.category?.name || "Service"
        });
      });
    });
    return list;
  }, [providers]);

  // Generate predictive hints based on search query
  const suggestions = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();

    // If query is empty, return popular / trending searches
    if (!q) {
      return {
        categories: MAIN_CATEGORIES.slice(0, 4).map((c) => ({
          type: "category",
          title: c.name,
          icon: c.icon,
          accentColor: c.accentColor,
          dbCategory: c.dbCategory,
          badge: `${c.subcategories.length} subcategories`
        })),
        subcategories: [
          {
            type: "subcategory",
            title: "Laptop",
            icon: "bi-laptop",
            parentName: "IT & Electronics",
            parentCat: MAIN_CATEGORIES.find((c) => c.id === "it-electronics"),
            subObj: MAIN_CATEGORIES.find((c) => c.id === "it-electronics")?.subcategories.find((s) => s.id === "laptop")
          },
          {
            type: "subcategory",
            title: "AC",
            icon: "bi-snow",
            parentName: "Home Appliances",
            parentCat: MAIN_CATEGORIES.find((c) => c.id === "home-appliances"),
            subObj: MAIN_CATEGORIES.find((c) => c.id === "home-appliances")?.subcategories.find((s) => s.id === "ac")
          },
          {
            type: "subcategory",
            title: "Tap & Leak Repair",
            icon: "bi-droplet",
            parentName: "Plumbing",
            parentCat: MAIN_CATEGORIES.find((c) => c.id === "plumbing"),
            subObj: MAIN_CATEGORIES.find((c) => c.id === "plumbing")?.subcategories.find((s) => s.id === "tap-leak")
          },
          {
            type: "subcategory",
            title: "Full Home Deep Clean",
            icon: "bi-house-heart",
            parentName: "Home Cleaning",
            parentCat: MAIN_CATEGORIES.find((c) => c.id === "home-cleaning"),
            subObj: MAIN_CATEGORIES.find((c) => c.id === "home-cleaning")?.subcategories.find((s) => s.id === "full-home-clean")
          }
        ],
        services: allServices.slice(0, 3).map((s) => ({
          type: "service",
          title: s.title,
          price: s.price,
          providerName: s.provider?.businessName || s.provider?.user?.name,
          serviceObj: s
        })),
        isTrending: true
      };
    }

    // 1. Filter Categories (Prefix matches first, then contains)
    const categoryMatches = [];
    MAIN_CATEGORIES.forEach((c) => {
      const nameLower = c.name.toLowerCase();
      if (nameLower.startsWith(q)) {
        categoryMatches.push({
          type: "category",
          title: c.name,
          icon: c.icon,
          accentColor: c.accentColor,
          dbCategory: c.dbCategory,
          badge: `${c.subcategories.length} subcategories`,
          score: 100 // exact prefix
        });
      } else if (nameLower.includes(q)) {
        categoryMatches.push({
          type: "category",
          title: c.name,
          icon: c.icon,
          accentColor: c.accentColor,
          dbCategory: c.dbCategory,
          badge: `${c.subcategories.length} subcategories`,
          score: 50 // substring
        });
      }
    });

    // 2. Filter Subcategories (Prefix matches first, then contains)
    const subcategoryMatches = [];
    MAIN_CATEGORIES.forEach((c) => {
      c.subcategories.forEach((sub) => {
        const subLower = sub.name.toLowerCase();
        const queryLower = (sub.query || "").toLowerCase();

        if (subLower.startsWith(q) || queryLower.startsWith(q)) {
          subcategoryMatches.push({
            type: "subcategory",
            title: sub.name,
            icon: sub.icon,
            parentName: c.name,
            parentCat: c,
            subObj: sub,
            score: 90
          });
        } else if (subLower.includes(q) || queryLower.includes(q)) {
          subcategoryMatches.push({
            type: "subcategory",
            title: sub.name,
            icon: sub.icon,
            parentName: c.name,
            parentCat: c,
            subObj: sub,
            score: 40
          });
        }
      });
    });

    // 3. Filter Direct Services
    const serviceMatches = [];
    allServices.forEach((s) => {
      const titleLower = s.title.toLowerCase();
      const descLower = (s.description || "").toLowerCase();

      if (titleLower.startsWith(q)) {
        serviceMatches.push({
          type: "service",
          title: s.title,
          price: s.price,
          providerName: s.provider?.businessName || s.provider?.user?.name,
          serviceObj: s,
          score: 85
        });
      } else if (titleLower.includes(q) || descLower.includes(q)) {
        serviceMatches.push({
          type: "service",
          title: s.title,
          price: s.price,
          providerName: s.provider?.businessName || s.provider?.user?.name,
          serviceObj: s,
          score: 35
        });
      }
    });

    // Sort by score
    categoryMatches.sort((a, b) => b.score - a.score);
    subcategoryMatches.sort((a, b) => b.score - a.score);
    serviceMatches.sort((a, b) => b.score - a.score);

    return {
      categories: categoryMatches.slice(0, 3),
      subcategories: subcategoryMatches.slice(0, 5),
      services: serviceMatches.slice(0, 4),
      isTrending: false
    };
  }, [searchQuery, allServices]);

  // Flatten suggestions for keyboard indexing
  const flatSuggestions = useMemo(() => {
    return [
      ...suggestions.categories,
      ...suggestions.subcategories,
      ...suggestions.services
    ];
  }, [suggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < flatSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : flatSuggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatSuggestions.length) {
        handleSelectSuggestion(flatSuggestions[selectedIndex]);
      } else {
        setIsOpen(false);
        onSearchSubmit(e);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = (item) => {
    setIsOpen(false);
    setSelectedIndex(-1);

    if (item.type === "category") {
      onSelectCategory(item.dbCategory);
      onSearchChange(item.title);
      const el = document.getElementById("categories");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (item.type === "subcategory") {
      onSelectCategory(item.parentCat.dbCategory);
      onSelectSubCategory({
        ...item.subObj,
        categoryName: item.parentName,
        categoryDb: item.parentCat.dbCategory,
        accentColor: item.parentCat.accentColor
      });
      onSearchChange(item.title);
      const el = document.getElementById("categories");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (item.type === "service") {
      onBookService({
        service: item.serviceObj,
        provider: item.serviceObj.provider
      });
    }
  };

  // Helper to highlight matching text
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const qLower = query.toLowerCase();
    const idx = text.toLowerCase().indexOf(qLower);
    if (idx === -1) return text;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);

    return (
      <span>
        {before}
        <span
          style={{
            color: "#FBB02D",
            fontWeight: 800,
            textDecoration: "underline",
            textUnderlineOffset: 2
          }}
        >
          {match}
        </span>
        {after}
      </span>
    );
  };

  const hasAnyResults =
    suggestions.categories.length > 0 ||
    suggestions.subcategories.length > 0 ||
    suggestions.services.length > 0;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        maxWidth: 720,
        margin: "0 auto",
        zIndex: 50
      }}
    >
      {/* ─── Search Console Box ─── */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(4, 20, 54, 0.92) 0%, rgba(2, 12, 38, 0.98) 100%)",
          borderRadius: 20,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: isOpen
            ? "0 18px 45px rgba(0, 180, 216, 0.35)"
            : "0 16px 40px rgba(1, 10, 26, 0.75)",
          border: isOpen
            ? "2px solid #00B4D8"
            : "1.5px solid rgba(0, 180, 216, 0.45)",
          transition: "all 0.25s ease"
        }}
      >
        {/* City Location Indicator */}
        <div
          onClick={onDetectLocation}
          title="Click to detect nearest providers"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(0, 180, 216, 0.2)",
            border: "1px solid rgba(0, 180, 216, 0.30)",
            borderRadius: 14,
            padding: "8px 14px",
            color: "#00B4D8",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease"
          }}
        >
          <i className="bi bi-geo-alt-fill text-danger"></i>
          <span>{userLocation ? "Near You" : "Mumbai"}</span>
          <i className="bi bi-crosshair" style={{ fontSize: 11, color: "#00B4D8" }}></i>
        </div>

        {/* Search Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsOpen(false);
            onSearchSubmit(e);
          }}
          style={{ display: "flex", alignItems: "center", flex: 1, gap: 8 }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingLeft: 4
            }}
          >
            <i className="bi bi-search" style={{ color: "#00B4D8", fontSize: 16 }}></i>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search service e.g. 'Laptop', 'AC', 'Electrician'..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsOpen(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 15,
                color: "#FFFFFF",
                width: "100%",
                fontWeight: 500
              }}
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onReset();
                inputRef.current?.focus();
              }}
              style={{
                background: "none",
                border: "none",
                color: "#CAF0F8",
                cursor: "pointer",
                fontSize: 18,
                padding: "0 6px"
              }}
              title="Clear search"
            >
              ×
            </button>
          )}

          <button
            type="submit"
            className="btn-primary-aesthetic btn"
            style={{
              borderRadius: 12,
              whiteSpace: "nowrap",
              padding: "9px 22px",
              fontSize: 14,
              fontWeight: 700
            }}
          >
            Find Pros
          </button>
        </form>
      </div>

      {/* ─── Predictive Autocomplete Hints Dropdown ─── */}
      {isOpen && (
        <div
          className="search-hints-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background:
              "linear-gradient(155deg, rgba(4, 18, 48, 0.98) 0%, rgba(2, 10, 32, 0.99) 100%)",
            backdropFilter: "blur(18px)",
            border: "1.5px solid rgba(0, 180, 216, 0.45)",
            borderRadius: 18,
            boxShadow: "0 22px 50px rgba(1, 10, 26, 0.85), 0 0 25px rgba(0, 180, 216, 0.2)",
            padding: "12px 14px",
            maxHeight: 420,
            overflowY: "auto",
            zIndex: 1000,
            textAlign: "left"
          }}
        >
          {suggestions.isTrending && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px 10px",
                borderBottom: "1px solid rgba(0, 180, 216, 0.2)",
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 700,
                color: "#00B4D8",
                letterSpacing: 0.5
              }}
            >
              <i className="bi bi-fire"></i> TRENDING & POPULAR SEARCHES
            </div>
          )}


          {!hasAnyResults && searchQuery && (
            <div className="p-4 text-center">
              <i
                className="bi bi-search"
                style={{ fontSize: 28, color: "#00B4D8", opacity: 0.7 }}
              ></i>
              <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 600, marginTop: 8 }}>
                No direct hint matching "{searchQuery}"
              </div>
              <small style={{ color: "rgba(202, 240, 248, 0.75)" }}>
                Press <strong>Enter</strong> to search all provider profiles and bios.
              </small>
            </div>
          )}

          {/* Group 1: Main Categories */}
          {suggestions.categories.length > 0 && (
            <div className="mb-2">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#00B4D8",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  padding: "4px 8px"
                }}
              >
                📁 Categories
              </div>
              {suggestions.categories.map((cat, i) => {
                const globalIdx = i;
                const isSelected = selectedIndex === globalIdx;

                return (
                  <div
                    key={cat.title}
                    onClick={() => handleSelectSuggestion(cat)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: isSelected
                        ? "rgba(0, 180, 216, 0.3)"
                        : "transparent",
                      border: isSelected
                        ? "1px solid #00B4D8"
                        : "1px solid transparent",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: `${cat.accentColor}25`,
                          color: cat.accentColor || "#00B4D8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14
                        }}
                      >
                        <i className={"bi " + cat.icon}></i>
                      </span>
                      <span
                        style={{
                          color: "#FFFFFF",
                          fontSize: 14,
                          fontWeight: 600
                        }}
                      >
                        {highlightMatch(cat.title, searchQuery)}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#00B4D8",
                        background: "rgba(0, 180, 216, 0.15)",
                        padding: "2px 8px",
                        borderRadius: 12
                      }}
                    >
                      {cat.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group 2: Subcategories */}
          {suggestions.subcategories.length > 0 && (
            <div className="mb-2">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#00B4D8",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  padding: "4px 8px"
                }}
              >
                🛠️ Subcategories
              </div>
              {suggestions.subcategories.map((sub, i) => {
                const globalIdx = suggestions.categories.length + i;
                const isSelected = selectedIndex === globalIdx;

                return (
                  <div
                    key={sub.title + i}
                    onClick={() => handleSelectSuggestion(sub)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: isSelected
                        ? "rgba(0, 180, 216, 0.3)"
                        : "transparent",
                      border: isSelected
                        ? "1px solid #00B4D8"
                        : "1px solid transparent",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "rgba(0, 180, 216, 0.15)",
                          color: "#00B4D8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13
                        }}
                      >
                        <i className={"bi " + sub.icon}></i>
                      </span>
                      <div>
                        <span
                          style={{
                            color: "#FFFFFF",
                            fontSize: 14,
                            fontWeight: 600
                          }}
                        >
                          {highlightMatch(sub.title, searchQuery)}
                        </span>
                        <small
                          style={{
                            color: "#CAF0F8",
                            marginLeft: 8,
                            fontSize: 11,
                            opacity: 0.8
                          }}
                        >
                          in {sub.parentName}
                        </small>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#00B4D8",
                        fontWeight: 600
                      }}
                    >
                      View Options →
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group 3: Direct Services */}
          {suggestions.services.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#00B4D8",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  padding: "4px 8px"
                }}
              >
                ⚡ Instant Bookable Services
              </div>
              {suggestions.services.map((srv, i) => {
                const globalIdx =
                  suggestions.categories.length +
                  suggestions.subcategories.length +
                  i;
                const isSelected = selectedIndex === globalIdx;

                return (
                  <div
                    key={srv.title + i}
                    onClick={() => handleSelectSuggestion(srv)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: isSelected
                        ? "rgba(0, 180, 216, 0.3)"
                        : "transparent",
                      border: isSelected
                        ? "1px solid #00B4D8"
                        : "1px solid transparent",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: "rgba(0, 180, 216, 0.2)",
                          color: "#00B4D8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13
                        }}
                      >
                        <i className="bi bi-calendar-check"></i>
                      </span>
                      <div>
                        <span
                          style={{
                            color: "#FFFFFF",
                            fontSize: 13,
                            fontWeight: 600
                          }}
                        >
                          {highlightMatch(srv.title, searchQuery)}
                        </span>
                        <div style={{ color: "#CAF0F8", fontSize: 11, opacity: 0.8 }}>
                          by {srv.providerName || "Verified Professional"}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          background: "rgba(0, 180, 216, 0.2)",
                          color: "#CAF0F8",
                          padding: "2px 8px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          border: "1px solid rgba(0, 180, 216, 0.3)"
                        }}
                      >
                        ₹{srv.price}
                      </span>
                      <span
                        className="badge btn-primary-aesthetic"
                        style={{ fontSize: 11, padding: "4px 8px" }}
                      >
                        Book
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Tip */}
          <div
            style={{
              borderTop: "1px solid rgba(0, 180, 216, 0.2)",
              paddingTop: 8,
              marginTop: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11,
              color: "rgba(202, 240, 248, 0.7)"
            }}
          >
            <span>
              Use <kbd style={{ background: "#03045E", color: "#FFFFFF", padding: "1px 5px", borderRadius: 4, border: "1px solid rgba(0, 180, 216, 0.3)" }}>↑</kbd> <kbd style={{ background: "#03045E", color: "#FFFFFF", padding: "1px 5px", borderRadius: 4, border: "1px solid rgba(0, 180, 216, 0.3)" }}>↓</kbd> to navigate, <kbd style={{ background: "#03045E", color: "#FFFFFF", padding: "1px 5px", borderRadius: 4, border: "1px solid rgba(0, 180, 216, 0.3)" }}>Enter</kbd> to select
            </span>
            <span>ESC to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
