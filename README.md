# 🇲🇦 Tiny Casablanca (الدار البيضاء بكسل)
### Seamless Isometric Pixel-Art Map of Downtown Casablanca

[![GitHub Pages](https://img.shields.io/badge/Live-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://loumizhu.github.io/casablanca-pixel-map/)
[![OpenSeadragon](https://img.shields.io/badge/Viewer-OpenSeadragon-blue?style=for-the-badge)](https://openseadragon.github.io/)
[![Pixel Art](https://img.shields.io/badge/Aesthetic-16--Bit%20Retro%20Pixel%20Art-orange?style=for-the-badge)](https://loumizhu.github.io/casablanca-pixel-map/)
[![Licence](https://img.shields.io/badge/Code%20License-MIT-green?style=for-the-badge)](LICENSE)

> An interactive, seamless, isometric pixel-art map of **Downtown Casablanca (Centre-Ville)**, Morocco. Built with deep inspiration from Boris Starkov's [tiny.london](https://tiny.london/) and Andy Coenen's [isometric.nyc](https://isometric.nyc/).

---

## 🌟 Live Interactive Map
**Explore the live map on GitHub Pages:**  
👉 **[https://loumizhu.github.io/casablanca-pixel-map/](https://loumizhu.github.io/casablanca-pixel-map/)**

---

## 🏛️ Downtown Casablanca Landmarks Covered

| Landmark | Arabic Name | Type | Highlights |
|---|---|---|---|
| **Place des Nations Unies** | ساحة الأمم المتحدة | Central Plaza | Modernist white Koubba dome, Casablanca Tramway intersection, Art Deco colonial facades |
| **Tour de l'Horloge** | برج الساعة القديمة | Historic Tower | 1908 stone minaret-clock tower, Ancienne Médina entrance, historic battlements |
| **Place Mohammed V** | ساحة محمد الخامس | Civic Square | Monumental municipal plaza, illuminated dancing fountain, Moroccan star mosaic tiles, pigeons |
| **Wilaya de Casablanca** | ولاية جهة الدار البيضاء | Municipal Palace | Neo-Moorish palace, green glazed ceramic roofs, towering 50-meter clock tower |
| **Grand Théâtre de Casablanca** | المسرح الكبير للدار البيضاء | Culture Complex | Sculptured white curved resin pavilions by Christian de Portzamparc, terracotta promenades |
| **Bab Marrakech** | باب مراكش | Fortress Gate | Historic whitewashed defensive ramparts, horseshoe archway, spice and textile souks |
| **Marché Central** | السوق المركزي | Covered Market | 1917 Art Deco covered market rotunda, traditional seafood grills, fresh produce arcades |
| **Boulevard Mohammed V** | شارع محمد الخامس | Arterial Avenue | 1920s Art Deco apartment blocks with wrought-iron balconies, Casablanca Tramway red track bed |

---

## 📐 Camera & Mathematical Projection

The map uses an orthographic isometric camera with single-camera projection across the whole city:
- **Pitch:** $45^\circ$ elevation below the horizontal.
- **Heading:** $015^\circ$ azimuth (screen-up points N15°E, screen-right points E15°S).
- **Scale:** $0.35$ meters per map pixel ($1 \text{ meter} \approx 2.85 \text{ pixels}$).
- **Anchor Center:** $33.5938^\circ\text{ N}, 7.6158^\circ\text{ W}$ (Downtown Casablanca core).
- **Ground Truth:** Coordinates calibrated to OpenStreetMap geographic boundary vectors.

```text
WGS84 (Lat, Lon) ──► Local Cartesian (East, North) ──► Heading Rotation (15°) ──► Isometric Screen (X, Y)
```

---

## 🎨 Pipeline Architecture

1. **Source Generation:** Orthographic isometric landmark captures generated under strict architectural fidelity constraints.
2. **Nano Banana & Gemini Image Engine:** Stylized into authentic 16-bit retro pixel art with Mediterranean limestone, warm terracotta, Atlantic sky, and Moroccan zellige palettes.
3. **Seamless Overlap Stitching:** Multi-window tent weighting ($w(x, y)$ cosine ramp falling to zero at tile borders) and graph-cut seam routing along streets to eliminate tile boundary seams by construction.
4. **Deep Zoom Tile Pyramid (DZI):** Lossless WebP multi-resolution tile pyramid ($5,632 \times 4,096$ native canvas, 14 pyramid zoom levels from overview down to 1:1 pixel precision).
5. **Interactive Web App:** OpenSeadragon viewer with nearest-neighbor crisp rendering, dynamic landmark pins, search navigator, real-time WGS84 HUD, minimap radar, day/sunset/night themes, and Web Audio retro ambient soundscape.

---

## 🕹️ Controls & Features

- **Pan:** Click and drag the map.
- **Zoom:** Mouse wheel, pinch-to-zoom, or `+` / `-` buttons.
- **Center on Landmark:** Click any card in the left navigator or click directly on glowing map pins.
- **Search:** Filter landmarks by name (English or Arabic) in the search bar.
- **Pixel Grid:** Toggle retro alignment grid (`G` key or grid button).
- **Themes:** Toggle between **Day** (warm Mediterranean light), **Sunset** (terracotta golden hour), and **Night** (cyber-neon neon tram reflections).
- **Audio Ambiance:** Toggle procedural Moroccan urban drone with tramway chime.
- **Reset View:** Press `H` or click the Home button.
- **Fullscreen:** Press `F` or click fullscreen icon.

---

## 📜 Credits & Attribution

- **Project Design:** Inspired by [tiny.london](https://tiny.london/) by Boris Starkov and [isometric.nyc](https://isometric.nyc/) by Andy Coenen.
- **Geospatial Data:** © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL).
- **Map Viewer:** [OpenSeadragon](https://openseadragon.github.io/) (BSD-3-Clause).
- **Stylization Engine:** Google Gemini / Nano Banana (SynthID watermarked AI-assisted pixel art).
- **Code License:** MIT License.
