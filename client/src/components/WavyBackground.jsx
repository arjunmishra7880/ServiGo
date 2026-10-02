import React from "react";

// Static background: black at top-center fading to purple at the edges.
// (Adapted from a Tailwind snippet — the gradient is plain CSS, so no
// Tailwind needed. Same component API as the previous animated version,
// so Home / Login / Register keep working without any changes.)
//
// Props:
//   fixed — full-viewport layer pinned behind the page while it scrolls
//   className / style — passed to the wrapper
//   children — content rendered above the background (non-fixed mode)
//   overlay — accepted for compatibility with existing usage; not needed
//     for this gradient (it's already dark), so it is ignored.

const GRADIENT =
  "radial-gradient(125% 125% at 50% 10%, #000 40%, #6633ee 100%)";

export default function WavyBackground({
  children,
  className = "",
  style = {},
  overlay = 0, // eslint-disable-line no-unused-vars — kept for API compatibility
  fixed = false,
}) {
  const wrapperStyle = fixed
    ? {
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        background: GRADIENT,
        ...style,
      }
    : {
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: GRADIENT,
        ...style,
      };

  return (
    <div className={className} style={wrapperStyle}>
      {children && (
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      )}
    </div>
  );
}
