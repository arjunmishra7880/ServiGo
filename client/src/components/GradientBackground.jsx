import React from "react";

// Simplified background component (no animation) to keep the same API
// as before so Home / Login / Register keep working:
//   fixed — full-viewport layer pinned behind the page while it scrolls
//   className / style — passed to the wrapper
//   children — content rendered above the background (non-fixed mode)

export default function GradientBackground({
  children,
  className = "",
  style = {},
  fixed = false,
  overlay = false,
  overlayOpacity = 0.3,
}) {
  const hasOverlay = Boolean(overlay);
  const overlayAlpha = typeof overlay === "number" ? overlay : overlayOpacity;

  const wrapperStyle = fixed
    ? {
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        backgroundColor: "#03045E", // Ocean Royale Primary Background
        ...style,
      }
    : {
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "#03045E", // Ocean Royale Primary Background
        ...style,
      };

  return (
    <div className={className} style={wrapperStyle}>
      {/* Optional dark overlay to keep white text readable if needed */}
      {hasOverlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000",
            opacity: overlayAlpha,
          }}
        />
      )}

      {/* Content wrapper */}
      {children && (
        <div
          style={{
            position: "relative",
            minHeight: "100vh",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}