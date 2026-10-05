// Complete 2-tier Category & Subcategory Catalog
// Tailored with exact subcategories matching user specifications and reference designs

export const MAIN_CATEGORIES = [
  {
    id: "it-electronics",
    name: "IT & Electronics",
    dbCategory: "IT & Electronics",
    accentColor: "#F97316", // Vibrant orange from reference
    iconBg: "rgba(249, 115, 22, 0.12)",
    iconBorder: "rgba(249, 115, 22, 0.28)",
    icon: "bi-laptop",
    tagline: "Computers, laptops, mobile phones, printers & network solutions",
    subcategories: [
      { id: "laptop", name: "Laptop", icon: "bi-laptop", query: "laptop" },
      { id: "desktop", name: "Desktop", icon: "bi-display", query: "desktop" },
      { id: "printer", name: "Printer", icon: "bi-printer", query: "printer" },
      { id: "mobile-phone", name: "Mobile Phone", icon: "bi-phone", query: "mobile" },
      { id: "tablet-ipad", name: "Tablet / iPad", icon: "bi-tablet", query: "tablet" },
      { id: "gaming-console", name: "Gaming Console", icon: "bi-controller", query: "gaming" },
      { id: "data-recovery", name: "Data Recovery", icon: "bi-hdd-network", query: "data recovery" },
      { id: "software-installation", name: "Software Installation", icon: "bi-download", query: "software" },
      { id: "wifi-network", name: "WiFi / Network", icon: "bi-wifi", query: "wifi" }
    ]
  },
  {
    id: "home-appliances",
    name: "Home Appliances",
    dbCategory: "Home Appliances",
    accentColor: "#0284C7", // Cool ocean blue from reference
    iconBg: "rgba(2, 132, 199, 0.12)",
    iconBorder: "rgba(2, 132, 199, 0.28)",
    icon: "bi-tv",
    tagline: "Air conditioners, refrigerators, washing machines, TVs & ovens",
    subcategories: [
      { id: "ac", name: "AC", icon: "bi-snow", query: "ac" },
      { id: "washing-machine", name: "Washing Machine", icon: "bi-arrow-repeat", query: "washing machine" },
      { id: "refrigerator", name: "Refrigerator", icon: "bi-door-closed", query: "refrigerator" },
      { id: "microwave-oven", name: "Microwave / Oven", icon: "bi-hdd-stack", query: "microwave" },
      { id: "tv", name: "TV", icon: "bi-tv", query: "tv" },
      { id: "chimney-hob", name: "Chimney / Hob", icon: "bi-wind", query: "chimney" },
      { id: "water-purifier", name: "Water Purifier (RO)", icon: "bi-droplet-half", query: "water purifier" },
      { id: "geyser-appliance", name: "Geyser", icon: "bi-thermometer-high", query: "geyser" }
    ]
  },
  {
    id: "plumbing",
    name: "Plumbing",
    dbCategory: "Plumbing",
    accentColor: "#0EA5E9",
    iconBg: "rgba(14, 165, 233, 0.12)",
    iconBorder: "rgba(14, 165, 233, 0.28)",
    icon: "bi-wrench-adjustable",
    tagline: "Tap repairs, leaks, geysers, pipe fittings & drain cleaning",
    subcategories: [
      { id: "tap-leak", name: "Tap & Leak Repair", icon: "bi-droplet", query: "tap" },
      { id: "geyser-install", name: "Geyser Installation", icon: "bi-thermometer-sun", query: "geyser" },
      { id: "drain-cleaning", name: "Drain & Pipe Clogging", icon: "bi-funnel-fill", query: "drain" },
      { id: "bathroom-pipeline", name: "Bathroom Pipeline", icon: "bi-diagram-3", query: "pipeline" },
      { id: "sanitary-fittings", name: "Sanitary & Toilet Fix", icon: "bi-shield-check", query: "sanitary" },
      { id: "water-tank", name: "Water Tank Cleaning", icon: "bi-moisture", query: "tank" }
    ]
  },
  {
    id: "electrician",
    name: "Electrician",
    dbCategory: "Electrician",
    accentColor: "#F59E0B",
    iconBg: "rgba(245, 158, 11, 0.12)",
    iconBorder: "rgba(245, 158, 11, 0.28)",
    icon: "bi-lightning-charge",
    tagline: "Short circuit fixing, fans, switchboards, wiring & inverters",
    subcategories: [
      { id: "short-circuit", name: "Short Circuit & MCB", icon: "bi-lightning", query: "circuit" },
      { id: "fan-lights", name: "Fan & Light Setup", icon: "bi-fan", query: "fan" },
      { id: "house-wiring", name: "House Wiring Inspection", icon: "bi-hdd-rack", query: "wiring" },
      { id: "switchboard", name: "Switchboard & Sockets", icon: "bi-toggles", query: "switchboard" },
      { id: "inverter-ups", name: "Inverter & UPS Setup", icon: "bi-battery-charging", query: "inverter" },
      { id: "appliance-wiring", name: "Heavy Appliance Wiring", icon: "bi-plug", query: "wiring" }
    ]
  },
  {
    id: "home-cleaning",
    name: "Home Cleaning",
    dbCategory: "Home Cleaning",
    accentColor: "#10B981",
    iconBg: "rgba(16, 185, 129, 0.12)",
    iconBorder: "rgba(16, 185, 129, 0.28)",
    icon: "bi-stars",
    tagline: "Deep house cleaning, kitchen scrubbing, bathroom sanitization",
    subcategories: [
      { id: "full-home-clean", name: "Full Home Deep Clean", icon: "bi-house-heart", query: "deep cleaning" },
      { id: "kitchen-scrub", name: "Kitchen Degreasing", icon: "bi-cup-hot", query: "kitchen" },
      { id: "bathroom-sanitization", name: "Bathroom Sanitization", icon: "bi-droplet-fill", query: "bathroom" },
      { id: "sofa-carpet", name: "Sofa & Carpet Shampoo", icon: "bi-layers", query: "sofa" },
      { id: "window-balcony", name: "Balcony & Window Clean", icon: "bi-window", query: "window" },
      { id: "floor-buffing", name: "Floor Scrubbing & Shine", icon: "bi-brush", query: "floor" }
    ]
  },
  {
    id: "carpentry",
    name: "Carpentry",
    dbCategory: "Carpentry",
    accentColor: "#D97706",
    iconBg: "rgba(217, 119, 6, 0.12)",
    iconBorder: "rgba(217, 119, 6, 0.28)",
    icon: "bi-hammer",
    tagline: "Door locks, furniture repair, cupboards & custom woodwork",
    subcategories: [
      { id: "door-locks", name: "Door Lock & Handle", icon: "bi-key", query: "lock" },
      { id: "furniture-assembly", name: "Furniture Assembly", icon: "bi-tools", query: "furniture" },
      { id: "custom-cupboard", name: "Cupboard & Wardrobe", icon: "bi-box", query: "cupboard" },
      { id: "bed-table-fix", name: "Bed & Table Repair", icon: "bi-distribute-vertical", query: "bed" },
      { id: "wood-polishing", name: "Wood Polishing & Varnish", icon: "bi-paint-bucket", query: "polish" }
    ]
  },
  {
    id: "painting",
    name: "Painting",
    dbCategory: "Painting",
    accentColor: "#8B5CF6",
    iconBg: "rgba(139, 92, 246, 0.12)",
    iconBorder: "rgba(139, 92, 246, 0.28)",
    icon: "bi-paint-bucket",
    tagline: "Full house interior & exterior painting, texture & waterproofing",
    subcategories: [
      { id: "interior-painting", name: "Interior Wall Painting", icon: "bi-brush-fill", query: "interior" },
      { id: "waterproofing-damp", name: "Waterproofing & Damp", icon: "bi-shield-shaded", query: "waterproof" },
      { id: "wall-textures", name: "Wall Textures & Accent", icon: "bi-palette", query: "texture" },
      { id: "exterior-coating", name: "Exterior Weather Shield", icon: "bi-building", query: "exterior" },
      { id: "rental-touchup", name: "Rental Wall Touch-up", icon: "bi-check-all", query: "touchup" }
    ]
  },
  {
    id: "pest-control",
    name: "Pest Control",
    dbCategory: "Pest Control",
    accentColor: "#EC4899",
    iconBg: "rgba(236, 72, 153, 0.12)",
    iconBorder: "rgba(236, 72, 153, 0.28)",
    icon: "bi-shield-shaded",
    tagline: "Herbal cockroach gel, anti-termite shield & mosquito control",
    subcategories: [
      { id: "cockroach-ants", name: "Cockroach & Ant Gel", icon: "bi-bug", query: "cockroach" },
      { id: "termite-treatment", name: "Termite Drill & Fill", icon: "bi-shield-fill-check", query: "termite" },
      { id: "bedbug-spray", name: "Bed Bug Eradication", icon: "bi-dash-circle-fill", query: "bed bug" },
      { id: "mosquito-fogging", name: "Mosquito Fogging", icon: "bi-cloud-fog2", query: "mosquito" },
      { id: "rodent-proofing", name: "Rodent & Rat Control", icon: "bi-crosshair", query: "rodent" }
    ]
  }
];
