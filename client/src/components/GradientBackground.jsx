import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function GradientBackground({
  children,
  className = "",
  style = {},
  fixed = false,
  overlay = false,
  overlayOpacity = 0.3,
}) {
  let isLight = false;
  try {
    const { theme } = useTheme();
    isLight = theme === 'light';
  } catch (e) {
    // Fallback if rendered outside ThemeProvider
  }

  const hasOverlay = Boolean(overlay) && !isLight;
  const overlayAlpha = typeof overlay === "number" ? overlay : overlayOpacity;

  const bgGradient = "radial-gradient(130% 90% at 50% 0%, rgba(16, 196, 168, 0.12) 0%, rgba(230, 250, 246, 0.40) 30%, #FFFBFC 65%, #FFFBFC 100%)";

  const wrapperStyle = fixed
    ? {
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: bgGradient,
        transition: "background 0.3s ease",
        ...style,
      }
    : {
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        overflow: "hidden",
        background: bgGradient,
        transition: "background 0.3s ease",
        ...style,
      };

  return (
    <div className={className} style={wrapperStyle}>
      {/* Optional dark overlay to keep white text readable if needed in dark mode */}
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