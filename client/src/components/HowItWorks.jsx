import React from "react";

export default function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Search Service",
      desc: "Select a service and your city to find providers near you",
      icon: "bi-search",
      iconColor: "#EA580C",
      circleBg: "#FFF7ED",
      circleBorder: "#FDBA74"
    },
    {
      num: 2,
      title: "Contact Provider",
      desc: "Call or WhatsApp the provider directly — no middleman",
      icon: "bi-telephone-fill",
      iconColor: "#0284C7",
      circleBg: "#F0F9FF",
      circleBorder: "#7DD3FC"
    },
    {
      num: 3,
      title: "Get It Repaired",
      desc: "Get your device fixed by a trusted local technician",
      icon: "bi-shield-check",
      iconColor: "#10B981",
      circleBg: "#ECFDF5",
      circleBorder: "#6EE7B7"
    },
    {
      num: 4,
      title: "Rate & Review",
      desc: "Share your experience to help others find the best service",
      icon: "bi-people-fill",
      iconColor: "#F97316",
      circleBg: "#FFF7ED",
      circleBorder: "#FDBA74"
    }
  ];

  return (
    <section className="py-4" id="how-it-works" style={{ position: "relative" }}>
      <div className="container">
        <div
          className="p-4 p-md-5 rounded-4 how-it-works-box"
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            border: "1.5px solid rgba(226, 232, 240, 0.9)",
            boxShadow: "0 10px 35px rgba(0, 30, 43, 0.05), 0 1px 3px rgba(0, 30, 43, 0.02)"
          }}
        >
          {/* ─── Title & Tri-Color Accent Line ─── */}
          <div className="text-center mb-5">
            <h2
              style={{
                fontWeight: 900,
                color: "#001E2B",
                fontSize: "clamp(1.75rem, 3.2vw, 2.35rem)",
                letterSpacing: -0.5,
                margin: 0
              }}
            >
              How It Works
            </h2>
            {/* Indian Tri-Color Accent Bar */}
            <div
              style={{
                width: 52,
                height: 4,
                borderRadius: 4,
                margin: "10px auto 0",
                background:
                  "linear-gradient(90deg, #FF9933 33.3%, #FFFFFF 33.3%, #FFFFFF 66.6%, #138808 66.6%)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
              }}
            ></div>
          </div>

          {/* ─── 4 Steps Grid ─── */}
          <div className="row g-4 text-center">
            {steps.map((step) => (
              <div key={step.num} className="col-12 col-sm-6 col-lg-3">
                <div
                  className="h-100 d-flex flex-column align-items-center"
                  style={{
                    padding: "16px 12px",
                    borderRadius: 16,
                    transition: "transform 0.22s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Icon Circle */}
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      backgroundColor: step.circleBg,
                      border: `2px solid ${step.circleBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 18,
                      boxShadow: "0 8px 22px rgba(0, 30, 43, 0.12)"
                    }}
                  >
                    <i
                      className={`bi ${step.icon}`}
                      style={{
                        fontSize: 28,
                        color: step.iconColor
                      }}
                    ></i>
                  </div>

                  {/* Step Number + Title */}
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#001E2B",
                        border: "1.5px solid #FFFFFF",
                        color: "#FFFFFF",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {step.num}
                    </span>
                    <h5
                      style={{
                        fontWeight: 800,
                        color: "#001E2B",
                        fontSize: 16,
                        margin: 0,
                        letterSpacing: -0.2
                      }}
                    >
                      {step.title}
                    </h5>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "#003B36",
                      lineHeight: 1.5,
                      maxWidth: 240,
                      margin: 0,
                      fontWeight: 500
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
