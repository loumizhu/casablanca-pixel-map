/**
 * Casablanca Pixel Art Map - Frontend Isometric Projection Module
 * Mathematical parity with scripts/projection.py
 */

export const PROJECTION_CONFIG = {
  anchorLat: 33.5938,
  anchorLon: -7.6158,
  cameraPitchDeg: 45.0,
  cameraHeadingDeg: 15.0,
  pixelScale: 0.35, // meters per pixel
  canvasWidth: 5632,
  canvasHeight: 4096,
  earthRadius: 6378137.0
};

export const LANDMARKS = [
  {
    id: "place_des_nations_unies",
    name: "Place des Nations Unies",
    nameAr: "ساحة الأمم المتحدة",
    lat: 33.5950,
    lon: -7.6187,
    type: "plaza",
    icon: "🏛️",
    desc: "Iconic central square with the white Koubba dome, Casablanca Tramway intersection, and lively palm promenades.",
    year: "1915 / modern 2012",
    features: ["Casablanca Tramway T1 Line", "Koubba Dome", "Hyatt Regency", "Gateway to Old Medina"]
  },
  {
    id: "tour_de_l_horloge",
    name: "Tour de l'Horloge",
    nameAr: "برج الساعة القديمة",
    lat: 33.5969,
    lon: -7.6173,
    type: "tower",
    icon: "🕰️",
    desc: "Historic 1908 stone clock tower standing proud at the entrance of the Ancienne Médina and Place des Nations Unies.",
    year: "1908 (rebuilt 1993)",
    features: ["Neo-Moorish stone masonry", "Historic gateway clock", "Medina Rampart junction"]
  },
  {
    id: "place_mohammed_v",
    name: "Place Mohammed V",
    nameAr: "ساحة محمد الخامس",
    lat: 33.5916,
    lon: -7.6198,
    type: "plaza",
    icon: "⛲",
    desc: "Monumental administrative and civic square featuring the grand dancing fountain, pigeon plazas, and French consulate.",
    year: "1920s",
    features: ["Illuminated dancing fountain", "Grand civic open plaza", "Colonial administrative arcades"]
  },
  {
    id: "wilaya_clock_tower",
    name: "Wilaya & Municipal Clock Tower",
    nameAr: "ولاية جهة الدار البيضاء",
    lat: 33.5898,
    lon: -7.6191,
    type: "civic",
    icon: "🏰",
    desc: "Monumental Neo-Moorish administrative palace with its iconic 50-meter clock tower overlooking Place Mohammed V.",
    year: "1937",
    features: ["50m Minaret-inspired Clock Tower", "Green glazed ceramic tile roofing", "Majestic inner courtyards"]
  },
  {
    id: "grand_theatre",
    name: "Grand Théâtre de Casablanca",
    nameAr: "المسرح الكبير للدار البيضاء",
    lat: 33.5905,
    lon: -7.6171,
    type: "culture",
    icon: "🎭",
    desc: "Architectural masterpiece designed by Christian de Portzamparc, glowing with sculptured white curved sails.",
    year: "2020s",
    features: ["Sculptural white resin and concrete pavilion", "1,800-seat grand auditorium", "Public urban cultural promenade"]
  },
  {
    id: "bab_marrakech",
    name: "Bab Marrakech (Medina Gate)",
    nameAr: "باب مراكش",
    lat: 33.5982,
    lon: -7.6215,
    type: "gate",
    icon: "🚪",
    desc: "Historic fortress gateway in the ancient city ramparts leading into the bustling alleys and souks of the Medina.",
    year: "Historic (Pre-colonial)",
    features: ["Ancient whitewashed defensive battlements", "Horseshoe arch entryway", "Artisanal souks & spice markets"]
  },
  {
    id: "marche_central",
    name: "Marché Central",
    nameAr: "السوق المركزي",
    lat: 33.5938,
    lon: -7.6134,
    type: "market",
    icon: "🏪",
    desc: "Famous colonial Art Deco covered food and fish market on Boulevard Mohammed V, framed by horseshoe arches.",
    year: "1917",
    features: ["Art Deco covered arcades", "Traditional Moroccan seafood grills", "Fresh produce & flower rotunda"]
  },
  {
    id: "boulevard_mohammed_v",
    name: "Boulevard Mohammed V",
    nameAr: "شارع محمد الخامس",
    lat: 33.5933,
    lon: -7.6185,
    type: "boulevard",
    icon: "🚋",
    desc: "Grand arterial avenue celebrated for its 1920s Art Deco and Neo-Mauresque architecture and modern tramway line.",
    year: "1915-1930s",
    features: ["Modern Citadis tramway line", "Art Deco balconies & zellige motifs", "Date palm trees lining both sides"]
  }
];

export function latLonToScreen(lat, lon, heightM = 0) {
  const { anchorLat, anchorLon, cameraPitchDeg, cameraHeadingDeg, pixelScale, canvasWidth, canvasHeight, earthRadius } = PROJECTION_CONFIG;
  const anchorLatRad = (anchorLat * Math.PI) / 180.0;
  
  const dLonRad = ((lon - anchorLon) * Math.PI) / 180.0;
  const dLatRad = ((lat - anchorLat) * Math.PI) / 180.0;
  
  const eastM = dLonRad * earthRadius * Math.cos(anchorLatRad);
  const northM = dLatRad * earthRadius;
  
  const headingRad = (cameraHeadingDeg * Math.PI) / 180.0;
  const pitchRad = (cameraPitchDeg * Math.PI) / 180.0;
  
  const u = eastM * Math.cos(headingRad) - northM * Math.sin(headingRad);
  const v = eastM * Math.sin(headingRad) + northM * Math.cos(headingRad);
  
  const centerX = canvasWidth / 2.0;
  const centerY = canvasHeight / 2.0;
  
  const screenX = centerX + (u / pixelScale);
  const screenY = centerY - ((v * Math.sin(pitchRad) - heightM * Math.cos(pitchRad)) / pixelScale);
  
  return { x: screenX, y: screenY };
}

export function screenToLatLon(screenX, screenY, heightM = 0) {
  const { anchorLat, anchorLon, cameraPitchDeg, cameraHeadingDeg, pixelScale, canvasWidth, canvasHeight, earthRadius } = PROJECTION_CONFIG;
  const anchorLatRad = (anchorLat * Math.PI) / 180.0;
  const pitchRad = (cameraPitchDeg * Math.PI) / 180.0;
  const headingRad = (cameraHeadingDeg * Math.PI) / 180.0;
  
  const centerX = canvasWidth / 2.0;
  const centerY = canvasHeight / 2.0;
  
  const u = (screenX - centerX) * pixelScale;
  const v = ((centerY - screenY) * pixelScale + heightM * Math.cos(pitchRad)) / Math.sin(pitchRad);
  
  const eastM = u * Math.cos(headingRad) + v * Math.sin(headingRad);
  const northM = -u * Math.sin(headingRad) + v * Math.cos(headingRad);
  
  const lat = anchorLat + (northM / earthRadius) * (180.0 / Math.PI);
  const lon = anchorLon + (eastM / (earthRadius * Math.cos(anchorLatRad))) * (180.0 / Math.PI);
  
  return { lat, lon };
}
