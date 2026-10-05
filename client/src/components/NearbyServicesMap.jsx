import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import { Link } from "react-router-dom";

// Category colors and icons mapping
const CATEGORY_MAP = {
  "IT & Electronics": { color: "#F97316", icon: "bi-laptop", label: "IT & Tech" },
  "Home Appliances":  { color: "#10C4A8", icon: "bi-tv", label: "Appliances" },
  "Plumbing":         { color: "#00684A", icon: "bi-wrench-adjustable", label: "Plumbing" },
  "Electrician":      { color: "#FFB02D", icon: "bi-lightning-charge", label: "Electrician" },
  "Home Cleaning":    { color: "#10C4A8", icon: "bi-stars", label: "Cleaning" },
  "Carpentry":        { color: "#F59E0B", icon: "bi-hammer", label: "Carpentry" },
  "Painting":         { color: "#A855F7", icon: "bi-paint-bucket", label: "Painting" },
  "Pest Control":     { color: "#EC4899", icon: "bi-shield-shaded", label: "Pest Control" }
};

// Preset realistic coordinates in Mumbai
const DEFAULT_LOCATIONS = [
  { lat: 19.1136, lng: 72.8697, area: "Andheri West" },
  { lat: 19.0596, lng: 72.8295, area: "Bandra West" },
  { lat: 19.1176, lng: 72.9056, area: "Powai" },
  { lat: 19.0178, lng: 72.8478, area: "Dadar" },
  { lat: 19.0726, lng: 72.8845, area: "Kurla" },
  { lat: 19.2307, lng: 72.8567, area: "Borivali West" },
  { lat: 19.1726, lng: 72.9565, area: "Thane / Mulund" },
  { lat: 19.0886, lng: 72.8987, area: "Ghatkopar" }
];

export default function NearbyServicesMap({
  providers = [],
  userLocation,
  onDetectLocation,
  locationError,
  onBookService,
  selectedCategory
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Sync category filter if changed from parent
  useEffect(() => {
    if (selectedCategory) {
      setActiveCategoryFilter(selectedCategory);
    }
  }, [selectedCategory]);

  // Compute provider coordinates and details
  const providersWithCoords = useMemo(() => {
    const baseCenter = userLocation || { lat: 19.0760, lng: 72.8777 };

    return providers.map((p, idx) => {
      // Find category config
      const primaryCat =
        p.services?.[0]?.category?.name ||
        p.services?.[0]?.categoryName ||
        "Plumbing";
      const catConfig = CATEGORY_MAP[primaryCat] || {
        color: "#10C4A8",
        icon: "bi-tools",
        label: primaryCat
      };

      // Assign position
      const preset = DEFAULT_LOCATIONS[idx % DEFAULT_LOCATIONS.length];
      const offsetLat = (idx % 2 === 0 ? 1 : -1) * (0.008 + (idx * 0.004));
      const offsetLng = (idx % 3 === 0 ? 1 : -1) * (0.009 + (idx * 0.005));

      const lat = userLocation ? baseCenter.lat + offsetLat : preset.lat;
      const lng = userLocation ? baseCenter.lng + offsetLng : preset.lng;

      // Estimate distance in km
      const distance = (1.2 + (idx * 0.7)).toFixed(1);

      return {
        ...p,
        lat,
        lng,
        distance,
        primaryCat,
        catConfig
      };
    });
  }, [providers, userLocation]);

  // Filter providers by category
  const filteredMapProviders = useMemo(() => {
    if (activeCategoryFilter === "all") return providersWithCoords;
    return providersWithCoords.filter(
      (p) =>
        p.primaryCat?.toLowerCase() === activeCategoryFilter.toLowerCase() ||
        p.services?.some((s) =>
          (s.category?.name || "").toLowerCase() === activeCategoryFilter.toLowerCase()
        )
    );
  }, [providersWithCoords, activeCategoryFilter]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [19.0760, 72.8777];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: userLocation ? 13 : 12,
      scrollWheelZoom: false,
      zoomControl: false
    });

    mapInstanceRef.current = map;

    // Add Zoom Control to bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Free OpenStreetMap tiles (100% free, NO API key required)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
      className: "map-tiles-modern"
    }).addTo(map);

    markersGroupRef.current = L.featureGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location Marker (Radar Pulse)
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }

    const radarIcon = L.divIcon({
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;">
          <div class="user-radar-pulse"></div>
        </div>
      `,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: radarIcon,
      zIndexOffset: 2000
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-weight:700;color:#03045E;padding:4px 6px;">📍 You are here</div>`
      );

    userMarkerRef.current = userMarker;

    map.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 1.2 });
  }, [userLocation]);

  // Render Lollipop Stick Markers on the Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    filteredMapProviders.forEach((p) => {
      const { catConfig } = p;
      const hourlyRate = p.hourlyRate || 350;
      const providerName = p.businessName || p.user?.name || "Service Pro";

      // ─── Custom Lollipop Stick Marker HTML ───
      const lollipopHtml = `
        <div class="lollipop-marker-container" style="--marker-color: ${catConfig.color};">
          <div class="lollipop-head">
            <i class="bi ${catConfig.icon}"></i>
            <span class="lollipop-text">₹${hourlyRate}/hr</span>
          </div>
          <div class="lollipop-stick"></div>
          <div class="lollipop-dot"></div>
        </div>
      `;

      const lollipopIcon = L.divIcon({
        html: lollipopHtml,
        className: "",
        iconSize: [120, 52],
        iconAnchor: [60, 52],
        popupAnchor: [0, -56]
      });

      // ─── Rich Glassmorphic Popup Card HTML ───
      const topServices = (p.services || []).slice(0, 2);
      const servicesHtml = topServices
        .map(
          (s) => `
          <div class="popup-service-item">
            <div style="font-size:12px;font-weight:600;color:#001E2B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">
              ${s.title}
            </div>
            <div style="font-weight:800;color:#00684A;font-size:12px;">₹${s.price}</div>
          </div>
        `
        )
        .join("");

      const popupHtml = `
        <div class="map-provider-popup">
          <div class="popup-header">
            <div>
              <div style="font-size:11px;font-weight:700;color:${catConfig.color};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">
                <i class="bi ${catConfig.icon} me-1"></i>${catConfig.label} · ${p.distance} km away
              </div>
              <h5 class="popup-title">
                ${providerName}
                ${p.isVerified ? '<i class="bi bi-patch-check-fill ms-1" style="color:#10C4A8;font-size:13px;"></i>' : ""}
              </h5>
            </div>
            <span class="popup-badge" style="background:#E6FAF6;color:#00684A;border:1px solid #10C4A8;">
              ★ ${p.rating || "5.0"}
            </span>
          </div>

          <div style="font-size:12px;color:#3D4F58;margin-bottom:8px;">
            <i class="bi bi-geo-alt me-1 text-danger"></i>${p.serviceArea || p.city || "Mumbai"}
            <span class="mx-1">·</span>
            <i class="bi bi-briefcase me-1"></i>${p.experience || 5} yrs exp
          </div>

          ${
            topServices.length > 0
              ? `
            <div style="font-size:11px;font-weight:700;color:#00684A;text-transform:uppercase;margin-bottom:4px;">
              Top Services:
            </div>
            ${servicesHtml}
          `
              : ""
          }

          <div style="display:flex;gap:8px;margin-top:10px;">
            <button
              id="map-book-btn-${p.id}"
              class="btn-primary-aesthetic btn btn-sm w-100"
              style="padding:6px 12px;font-size:12px;border-radius:10px;font-weight:700;"
            >
              <i class="bi bi-calendar-check me-1"></i> Book Now
            </button>
            <a
              href="/providers/${p.id}"
              class="btn btn-light-aesthetic btn-sm"
              style="padding:6px 10px;font-size:12px;border-radius:10px;white-space:nowrap;"
            >
              Profile →
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([p.lat, p.lng], { icon: lollipopIcon }).addTo(
        markersGroup
      );

      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        className: "custom-leaflet-popup"
      });

      marker.on("click", () => {
        setSelectedProvider(p);
      });

      // Attach booking click listener when popup opens
      marker.on("popupopen", () => {
        setTimeout(() => {
          const btn = document.getElementById(`map-book-btn-${p.id}`);
          if (btn) {
            btn.onclick = () => {
              const serviceToBook = p.services?.[0] || {
                id: 1,
                title: `${catConfig.label} Consultation`,
                price: p.hourlyRate || 400
              };
              onBookService({ service: serviceToBook, provider: p });
            };
          }
        }, 50);
      });
    });
  }, [filteredMapProviders, onBookService]);

  // Pan to selected provider from carousel
  const handleSelectProviderCard = (p) => {
    setSelectedProvider(p);
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([p.lat, p.lng], 14, { duration: 1 });
  };

  return (
    <section
      id="map-section"
      style={{
        padding: "50px 0 60px",
        position: "relative"
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#E6FAF6",
                color: "#00684A",
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                border: "1.5px solid #10C4A8",
                marginBottom: 8
              }}
            >
              <i className="bi bi-geo-alt-fill text-warning"></i> LIVE RADAR MAP
            </div>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                color: "#001E2B",
                margin: 0
              }}
            >
              Nearby Service Providers
            </h2>
            <p style={{ color: "#3D4F58", fontSize: 14, margin: "4px 0 0" }}>
              Click any <strong>Lollipop Pin</strong> on the map to see instant prices and book verified professionals nearby.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={onDetectLocation}
              className="btn btn-sm"
              style={{
                background: userLocation
                  ? "linear-gradient(135deg, #00684A 0%, #001E2B 100%)"
                  : "linear-gradient(135deg, #10C4A8 0%, #0DB197 100%)",
                color: userLocation ? "#FFFFFF" : "#001E2B",
                border: "1px solid #10C4A8",
                borderRadius: 12,
                fontWeight: 700,
                padding: "8px 16px",
                boxShadow: "0 4px 15px rgba(16, 196, 168, 0.25)"
              }}
            >
              <i
                className={
                  userLocation ? "bi bi-check-circle-fill me-1" : "bi bi-crosshair me-1"
                }
              ></i>
              {userLocation ? "Location Synced" : "Detect My Location"}
            </button>
          </div>
        </div>

        {locationError && (
          <div
            className="alert alert-danger py-2 px-3 small rounded-3 mb-3"
            style={{ maxWidth: 500 }}
          >
            <i className="bi bi-exclamation-triangle-fill me-1"></i> {locationError}
          </div>
        )}

        {/* ─── Category Filter Pills on Top of Map ─── */}
        <div
          className="d-flex align-items-center gap-2 mb-3 pb-1"
          style={{
            overflowX: "auto",
            scrollbarWidth: "none"
          }}
        >
          <button
            onClick={() => setActiveCategoryFilter("all")}
            className="btn btn-sm"
            style={{
              whiteSpace: "nowrap",
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 700,
              background:
                activeCategoryFilter === "all"
                  ? "#001E2B"
                  : "#FFFFFF",
              color: activeCategoryFilter === "all" ? "#FFFFFF" : "#001E2B",
              border:
                activeCategoryFilter === "all"
                  ? "1px solid #001E2B"
                  : "1px solid rgba(0, 30, 43, 0.15)",
              boxShadow:
                activeCategoryFilter === "all"
                  ? "0 4px 12px rgba(0, 30, 43, 0.25)"
                  : "none"
            }}
          >
            All Pins ({providersWithCoords.length})
          </button>

          {Object.entries(CATEGORY_MAP).map(([catKey, conf]) => {
            const isSelected =
              activeCategoryFilter.toLowerCase() === catKey.toLowerCase();
            return (
              <button
                key={catKey}
                onClick={() => setActiveCategoryFilter(catKey)}
                className="btn btn-sm"
                style={{
                  whiteSpace: "nowrap",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: isSelected
                    ? "#001E2B"
                    : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "#001E2B",
                  border: isSelected
                    ? "1.5px solid #001E2B"
                    : "1px solid rgba(0, 30, 43, 0.15)",
                  boxShadow: isSelected
                    ? "0 4px 12px rgba(0, 30, 43, 0.25)"
                    : "none"
                }}
              >
                <i className={"bi " + conf.icon + " me-1"}></i>
                {conf.label}
              </button>
            );
          })}
        </div>

        {/* ─── Map Card Wrapper ─── */}
        <div
          className="rounded-4 overflow-hidden"
          style={{
            border: "2px solid #10C4A8",
            boxShadow: "0 18px 45px rgba(16, 196, 168, 0.18), 0 4px 16px rgba(0, 30, 43, 0.08)",
            background: "#FFFFFF",
            position: "relative"
          }}
        >
          {/* Leaflet Map Canvas */}
          <div
            ref={mapContainerRef}
            style={{
              height: 460,
              width: "100%",
              zIndex: 1
            }}
          ></div>

          {/* Floating Map Legend Indicator */}
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              zIndex: 500,
              background: "#001E2B",
              border: "1.5px solid #10C4A8",
              borderRadius: 12,
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#FFFFFF",
              boxShadow: "0 4px 14px rgba(0, 30, 43, 0.3)"
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10C4A8",
                boxShadow: "0 0 6px #10C4A8"
              }}
            ></span>
            <span>
              Showing <strong>{filteredMapProviders.length}</strong> verified pros
            </span>
          </div>
        </div>

        {/* ─── Horizontal Provider Strip below the Map ─── */}
        <div className="mt-3">
          <div
            className="d-flex align-items-center gap-3 py-2"
            style={{
              overflowX: "auto",
              scrollbarWidth: "none"
            }}
          >
            {filteredMapProviders.map((p) => {
              const isSelected = selectedProvider?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProviderCard(p)}
                  className="position-relative d-flex flex-column justify-content-between"
                  style={{
                    minWidth: 260,
                    maxWidth: 280,
                    background: "#FFFFFF",
                    border: isSelected
                      ? "2px solid #10C4A8"
                      : "1.5px solid rgba(226, 232, 240, 0.9)",
                    borderRadius: 18,
                    padding: "16px",
                    cursor: "pointer",
                    transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: isSelected
                      ? "0 8px 24px rgba(16, 196, 168, 0.25)"
                      : "0 4px 15px rgba(0, 30, 43, 0.05)"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#10C4A8";
                      e.currentTarget.style.transform = "translateY(-3px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.9)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: "#E6FAF6",
                          color: "#00684A",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16
                        }}
                      >
                        <i className={"bi " + p.catConfig.icon}></i>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#00684A",
                          fontWeight: 800,
                          textTransform: "uppercase"
                        }}
                      >
                        {p.catConfig.label}
                      </span>
                    </div>

                    <span
                      className="badge rounded-pill"
                      style={{
                        background: "#FFFBEB",
                        color: "#B45309",
                        border: "1px solid #FDE68A",
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 8px"
                      }}
                    >
                      ★ {p.rating || "5.0"}
                    </span>
                  </div>

                  <h6
                    style={{
                      fontSize: 14.5,
                      fontWeight: 800,
                      color: "#001E2B",
                      margin: "0 0 6px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {p.businessName || p.user?.name}
                  </h6>

                  <div className="d-flex justify-content-between align-items-center pt-2 mt-auto border-top border-light">
                    <div style={{ fontSize: 12 }}>
                      <div style={{ color: "#64748B", fontSize: 11 }}>
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                        {p.distance} km away
                      </div>
                      <strong style={{ color: "#001E2B", fontSize: 13 }}>
                        ₹{p.hourlyRate}/hr
                      </strong>
                    </div>

                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: isSelected ? "#10C4A8" : "#E6FAF6",
                        color: isSelected ? "#FFFFFF" : "#00684A",
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
        </div>
      </div>
    </section>
  );
}
