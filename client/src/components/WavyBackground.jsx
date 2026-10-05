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

// Ocean Royale Color Palette:
//   #03045E  Primary background (Midnight Oceanic Navy)
//   #023EBA  Main brand color (Royal / Sapphire Blue)
//   #00B4D8  Highlights (Radiant Aqua Glow)
//   #CAF0F8  Background / Cards (Ice Blue)
//   #FBB02D  CTA Buttons (Vibrant Amber / Gold)

const GRADIENT =
  "radial-gradient(140% 120% at 50% 0%, rgba(0, 180, 216, 0.35) 0%, rgba(2, 62, 186, 0.45) 30%, #03045E 65%, #010A1A 100%)";


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
