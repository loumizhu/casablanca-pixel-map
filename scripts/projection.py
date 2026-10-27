"""
Projection and coordinate mapping module for Casablanca Pixel Art Map.
Matches the isometric camera defined in PLANNING.md:
- Orthographic pitch: 45°
- Heading: 15° (Camera looks toward bearing 015°, screen-up is N15°E)
- Scale: 0.35 meters / pixel
- Anchor: 33.5938° N, 7.6158° W (Downtown Casablanca Center-Ville)
"""

import math
from typing import Tuple, Dict

# Earth radius in meters (WGS84 approx)
EARTH_RADIUS = 6378137.0

# Project constants
ANCHOR_LAT = 33.5938
ANCHOR_LON = -7.6158
CAMERA_PITCH_DEG = 45.0
CAMERA_HEADING_DEG = 15.0
PIXEL_SCALE = 0.35  # meters per pixel

# Canvas dimensions
CANVAS_WIDTH = 5632
CANVAS_HEIGHT = 4096
CENTER_X = CANVAS_WIDTH / 2.0
CENTER_Y = CANVAS_HEIGHT / 2.0

# Verified Casablanca Downtown Landmarks
LANDMARKS: Dict[str, Dict[str, float]] = {
    "place_des_nations_unies": {
        "name": "Place des Nations Unies",
        "name_ar": "ساحة الأمم المتحدة",
        "lat": 33.5950,
        "lon": -7.6187,
        "type": "plaza",
        "desc": "Iconic central square with the white Koubba dome, Casablanca Tramway intersection, and lively promenades."
    },
    "tour_de_l_horloge": {
        "name": "Tour de l'Horloge",
        "name_ar": "برج الساعة القديمة",
        "lat": 33.5969,
        "lon": -7.6173,
        "type": "tower",
        "desc": "Historic 1908 clock tower standing proud at the entrance of the Ancienne Médina and Place des Nations Unies."
    },
    "place_mohammed_v": {
        "name": "Place Mohammed V",
        "name_ar": "ساحة محمد الخامس",
        "lat": 33.5916,
        "lon": -7.6198,
        "type": "plaza",
        "desc": "Monumental administrative and civic square featuring the dancing fountain, pigeon plazas, and French consulate."
    },
    "wilaya_clock_tower": {
        "name": "Wilaya de Casablanca & Clock Tower",
        "name_ar": "ولاية جهة الدار البيضاء",
        "lat": 33.5898,
        "lon": -7.6191,
        "type": "civic",
        "desc": "Monumental Neo-Moorish administrative palace with its iconic 50-meter clock tower overlooking Place Mohammed V."
    },
    "grand_theatre": {
        "name": "Grand Théâtre de Casablanca",
        "name_ar": "المسرح الكبير للدار البيضاء",
        "lat": 33.5905,
        "lon": -7.6171,
        "type": "culture",
        "desc": "Architectural masterpiece designed by Christian de Portzamparc, glowing with sculptured white curved sails."
    },
    "bab_marrakech": {
        "name": "Bab Marrakech (Ancienne Médina Gate)",
        "name_ar": "باب مراكش",
        "lat": 33.5982,
        "lon": -7.6215,
        "type": "gate",
        "desc": "Historic fortress gateway in the ancient city ramparts leading into the bustling alleys and souks of the Medina."
    },
    "marche_central": {
        "name": "Marché Central",
        "name_ar": "السوق المركزي",
        "lat": 33.5938,
        "lon": -7.6134,
        "type": "market",
        "desc": "Famous colonial Art Deco covered food and fish market on Boulevard Mohammed V, framed by horseshoe arches."
    },
    "boulevard_mohammed_v": {
        "name": "Boulevard Mohammed V",
        "name_ar": "شارع محمد الخامس",
        "lat": 33.5933,
        "lon": -7.6185,
        "type": "boulevard",
        "desc": "Grand arterial avenue celebrated for its 1920s Art Deco and Neo-Mauresque architecture and modern tramway line."
    }
}

def latlon_to_meters(lat: float, lon: float) -> Tuple[float, float]:
    """Convert Lat/Lon coordinates to local Cartesian (East, North) meters relative to anchor."""
    lat_rad = math.radians(lat)
    anchor_lat_rad = math.radians(ANCHOR_LAT)
    
    d_lon_rad = math.radians(lon - ANCHOR_LON)
    d_lat_rad = math.radians(lat - ANCHOR_LAT)
    
    east_m = d_lon_rad * EARTH_RADIUS * math.cos(anchor_lat_rad)
    north_m = d_lat_rad * EARTH_RADIUS
    return east_m, north_m

def meters_to_screen(east_m: float, north_m: float, height_m: float = 0.0) -> Tuple[float, float]:
    """Project East/North/Height meters into isometric screen coordinates."""
    heading_rad = math.radians(CAMERA_HEADING_DEG)
    pitch_rad = math.radians(CAMERA_PITCH_DEG)
    
    # Rotate by heading
    u = east_m * math.cos(heading_rad) - north_m * math.sin(heading_rad)
    v = east_m * math.sin(heading_rad) + north_m * math.cos(heading_rad)
    
    # Screen X (pixels)
    screen_x = CENTER_X + (u / PIXEL_SCALE)
    
    # Screen Y (pixels): foreshortened by pitch, height lifts upwards (-y)
    screen_y = CENTER_Y - ((v * math.sin(pitch_rad) - height_m * math.cos(pitch_rad)) / PIXEL_SCALE)
    return screen_x, screen_y

def latlon_to_screen(lat: float, lon: float, height_m: float = 0.0) -> Tuple[float, float]:
    """Full mapping from WGS84 Lat/Lon to Canvas Pixel (X, Y)."""
    east_m, north_m = latlon_to_meters(lat, lon)
    return meters_to_screen(east_m, north_m, height_m)

def screen_to_latlon(screen_x: float, screen_y: float, height_m: float = 0.0) -> Tuple[float, float]:
    """Inverse mapping from Screen Pixel (X, Y) back to WGS84 Lat/Lon (at ground z=height_m)."""
    pitch_rad = math.radians(CAMERA_PITCH_DEG)
    heading_rad = math.radians(CAMERA_HEADING_DEG)
    anchor_lat_rad = math.radians(ANCHOR_LAT)
    
    u = (screen_x - CENTER_X) * PIXEL_SCALE
    v = ((CENTER_Y - screen_y) * PIXEL_SCALE + height_m * math.cos(pitch_rad)) / math.sin(pitch_rad)
    
    east_m = u * math.cos(heading_rad) + v * math.sin(heading_rad)
    north_m = -u * math.sin(heading_rad) + v * math.cos(heading_rad)
    
    lat = ANCHOR_LAT + (north_m / EARTH_RADIUS) * (180.0 / math.pi)
    lon = ANCHOR_LON + (east_m / (EARTH_RADIUS * math.cos(anchor_lat_rad))) * (180.0 / math.pi)
    return lat, lon

if __name__ == "__main__":
    print(f"Casablanca Isometric Map Projection:")
    print(f"Canvas size: {CANVAS_WIDTH} x {CANVAS_HEIGHT}")
    print(f"Anchor: {ANCHOR_LAT}N, {ANCHOR_LON}W\n")
    print(f"{'Landmark ID':<25} | {'Lat':<8} | {'Lon':<8} | {'Screen X':<10} | {'Screen Y':<10}")
    print("-" * 75)
    
    for l_id, info in LANDMARKS.items():
        sx, sy = latlon_to_screen(info["lat"], info["lon"])
        print(f"{l_id:<25} | {info['lat']:<8.4f} | {info['lon']:<8.4f} | {sx:<10.1f} | {sy:<10.1f}")
