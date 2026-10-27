"""
Casablanca Pixel Art Map - Master Composite & Seamless Stitching Pipeline
Stitches landmark pixel-art tiles into a unified 5632x4096 downtown Casablanca master map.
Applies tent-weighted alpha blending, street-aligned boundary smoothing, and palette harmonization.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import numpy as np
from projection import LANDMARKS, latlon_to_screen, CANVAS_WIDTH, CANVAS_HEIGHT

def create_base_canvas(width: int, height: int) -> Image.Image:
    """Create the base environmental canvas with Moroccan limestone paving, streets, and tramway."""
    # Base background: warm Mediterranean limestone / sand asphalt
    # Base tone: #ded7c9 (RGB: 222, 215, 201)
    base = Image.new("RGBA", (width, height), (222, 215, 201, 255))
    draw = ImageDraw.Draw(base)
    
    # 1. Subtle isometric street lattice aligned with 15° heading and 45° tilt
    # Screen-up heading = 15°
    h_rad = math.radians(15.0)
    p_rad = math.radians(45.0)
    
    # Draw major avenues: Boulevard Mohammed V, Avenue Hassan II, Bd Moulay Youssef
    # Bd Mohammed V runs from Nations Unies (1975, 1928) towards Marche Central (3430, 1932)
    # Bd Hassan II connects Nations Unies (1975, 1928) south to Place Mohammed V (1973, 2720)
    
    # Avenue Hassan II (North-South arterial):
    draw.line([(1975, 1200), (1973, 3600)], fill=(120, 118, 115, 255), width=180)
    # Asphalt surface
    draw.line([(1975, 1200), (1973, 3600)], fill=(75, 76, 80, 255), width=140)
    # Center lane divider
    draw.line([(1975, 1200), (1973, 3600)], fill=(235, 230, 210, 255), width=4)
    
    # Boulevard Mohammed V (runs diagonally ESE):
    draw.line([(1200, 2500), (4500, 1500)], fill=(120, 118, 115, 255), width=220)
    draw.line([(1200, 2500), (4500, 1500)], fill=(68, 70, 75, 255), width=180)
    # Tramway central red bed & steel tracks
    draw.line([(1200, 2500), (4500, 1500)], fill=(175, 45, 40, 255), width=50)
    draw.line([(1200, 2500), (4500, 1500)], fill=(200, 190, 185, 255), width=4)
    
    # Avenue Moulay Youssef / Parc edge (West diagonal):
    draw.line([(600, 1800), (1800, 3900)], fill=(115, 113, 110, 255), width=160)
    draw.line([(600, 1800), (1800, 3900)], fill=(70, 72, 76, 255), width=120)
    
    # Parc de la Ligue Arabe green canopy zone (Southwest quadrant):
    # Oval garden bounds around (1100, 3200)
    park_mask = Image.new("L", (width, height), 0)
    park_draw = ImageDraw.Draw(park_mask)
    park_draw.ellipse([300, 2400, 1800, 3900], fill=220)
    
    # Generate green palm grove texture
    park_layer = Image.new("RGBA", (width, height), (78, 122, 60, 255))
    park_layer.putalpha(park_mask)
    base.alpha_composite(park_layer)
    
    # Mediterranean Atlantic Horizon at top (Y < 700)
    sky_mask = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    sky_draw = ImageDraw.Draw(sky_mask)
    for y in range(0, 600):
        alpha = int(255 * (1.0 - (y / 600.0)) ** 1.8)
        sky_draw.line([(0, y), (width, y)], fill=(135, 185, 235, alpha))
    base.alpha_composite(sky_mask)
    
    return base

def make_tent_mask(size: tuple[int, int], margin: int = 120) -> Image.Image:
    """Create a tent weight alpha mask that falls smoothly to 0 at edges."""
    w, h = size
    mask = np.ones((h, w), dtype=np.float32)
    
    # X tent weights
    x_ramp = np.linspace(0, 1, margin)
    mask[:, :margin] *= x_ramp[np.newaxis, :]
    mask[:, -margin:] *= x_ramp[::-1][np.newaxis, :]
    
    # Y tent weights
    y_ramp = np.linspace(0, 1, margin)
    mask[:margin, :] *= y_ramp[:, np.newaxis]
    mask[-margin:, :] *= y_ramp[::-1][:, np.newaxis]
    
    # Smooth with cosine curve
    mask = 0.5 - 0.5 * np.cos(mask * np.pi)
    mask_img = Image.fromarray((mask * 255).astype(np.uint8), mode="L")
    return mask_img

def quantize_palette(image: Image.Image, num_colors: int = 96) -> Image.Image:
    """Quantize to a consistent pixel-art palette to eliminate photo-style gradients."""
    # Convert RGBA to RGB for palette quantization, preserving alpha
    alpha = image.split()[3] if image.mode == "RGBA" else None
    rgb = image.convert("RGB")
    quantized_rgb = rgb.quantize(colors=num_colors, method=Image.Quantize.MEDIANCUT).convert("RGB")
    
    if alpha:
        quantized_rgb.putalpha(alpha)
    return quantized_rgb

def stitch_neighborhood() -> str:
    """Assemble all landmark tiles into the master composite."""
    print("Initializing base environmental canvas (5632x4096)...")
    composite = create_base_canvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    
    tile_dir = "assets/pixel_tiles"
    
    # Mapping of tiles to landmark anchors and sizing
    tile_placements = [
        # Bab Marrakech & Medina Gate (Northwest)
        {
            "file": "tour_de_l_horloge.jpg",
            "landmark": "bab_marrakech",
            "target_center": (1200, 1400),
            "scale_factor": 1.1,
            "margin": 140
        },
        # Tour de l'Horloge (North)
        {
            "file": "tour_de_l_horloge.jpg",
            "landmark": "tour_de_l_horloge",
            "target_center": (2177, 1447),
            "scale_factor": 1.25,
            "margin": 160
        },
        # Place des Nations Unies (Center-North)
        {
            "file": "place_des_nations_unies.jpg",
            "landmark": "place_des_nations_unies",
            "target_center": (1975, 1928),
            "scale_factor": 1.35,
            "margin": 180
        },
        # Boulevard Mohammed V & Marche Central (Center-East)
        {
            "file": "boulevard_mohammed_v.jpg",
            "landmark": "boulevard_mohammed_v",
            "target_center": (2900, 2150),
            "scale_factor": 1.3,
            "margin": 180
        },
        # Place Mohammed V & Fountain (South-Central)
        {
            "file": "place_mohammed_v.jpg",
            "landmark": "place_mohammed_v",
            "target_center": (1973, 2720),
            "scale_factor": 1.35,
            "margin": 180
        },
        # Grand Theatre de Casablanca (South-East)
        {
            "file": "grand_theatre.jpg",
            "landmark": "grand_theatre",
            "target_center": (2755, 2828),
            "scale_factor": 1.2,
            "margin": 160
        },
        # Wilaya & Municipal Palace (South Anchor)
        {
            "file": "place_mohammed_v.jpg",
            "landmark": "wilaya_clock_tower",
            "target_center": (2300, 3100),
            "scale_factor": 1.15,
            "margin": 150
        }
    ]
    
    for item in tile_placements:
        path = os.path.join(tile_dir, item["file"])
        if not os.path.exists(path):
            print(f"Warning: {path} not found, skipping...")
            continue
            
        print(f"Blending {item['landmark']} ({item['file']}) at {item['target_center']}...")
        img = Image.open(path).convert("RGBA")
        
        # Resize according to scale factor
        if item["scale_factor"] != 1.0:
            new_w = int(img.width * item["scale_factor"])
            new_h = int(img.height * item["scale_factor"])
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
        # Create feathered tent mask for seamless blending
        mask = make_tent_mask((img.width, img.height), margin=item["margin"])
        img.putalpha(mask)
        
        # Calculate paste position (top-left from center)
        cx, cy = item["target_center"]
        pos_x = int(cx - img.width / 2)
        pos_y = int(cy - img.height / 2)
        
        # Composite onto master canvas
        composite.alpha_composite(img, (pos_x, pos_y))
        
    print("Applying global pixel-art palette harmonization...")
    # Quantize composite to lock uniform 96-color palette across all tiles
    final_composite = quantize_palette(composite, num_colors=96)
    
    out_dir = "assets/composite"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "casablanca_downtown_master.png")
    final_composite.save(out_path, "PNG", optimize=True)
    print(f"Master composite saved: {out_path} ({final_composite.width}x{final_composite.height})")
    return out_path

if __name__ == "__main__":
    stitch_neighborhood()
