"""
Deep Zoom Image (DZI) Tile Pyramid Generator for Casablanca Pixel Art Map
Converts the master composite image into multi-resolution lossless WebP tiles
compatible with OpenSeadragon and Leaflet DeepZoom.
"""

import os
import math
from PIL import Image

TILE_SIZE = 512
OVERLAP = 1
FORMAT = "webp"

def generate_dzi(source_path: str, output_dir: str, dzi_name: str = "casablanca"):
    """Generate DZI XML descriptor and multi-resolution tile pyramid."""
    print(f"Loading source master image: {source_path}...")
    img = Image.open(source_path)
    width, height = img.size
    print(f"Master dimensions: {width} x {height}")

    # Calculate max zoom level
    max_dimension = max(width, height)
    max_level = int(math.ceil(math.log2(max_dimension)))
    print(f"Max DZI Level: {max_level}")

    # Output paths
    os.makedirs(output_dir, exist_ok=True)
    files_dir = os.path.join(output_dir, f"{dzi_name}_files")
    os.makedirs(files_dir, exist_ok=True)
    dzi_path = os.path.join(output_dir, f"{dzi_name}.dzi")

    # 1. Write DZI XML file
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
       Format="{FORMAT}"
       Overlap="{OVERLAP}"
       TileSize="{TILE_SIZE}">
    <Size Width="{width}" Height="{height}"/>
</Image>
"""
    with open(dzi_path, "w", encoding="utf-8") as f:
        f.write(xml_content.strip())
    print(f"Created DZI descriptor: {dzi_path}")

    # 2. Generate tile pyramid from level max_level down to 0
    current_img = img.copy()
    current_w, current_h = width, height

    total_tiles = 0

    for level in range(max_level, -1, -1):
        level_dir = os.path.join(files_dir, str(level))
        os.makedirs(level_dir, exist_ok=True)

        # Slice current_img into columns and rows
        cols = int(math.ceil(current_w / TILE_SIZE))
        rows = int(math.ceil(current_h / TILE_SIZE))
        
        print(f"Level {level:2d}: {current_w:4d}x{current_h:4d} ({cols:2d} cols x {rows:2d} rows)")

        for c in range(cols):
            for r in range(rows):
                # Calculate bounds with overlap
                x_start = c * TILE_SIZE - (OVERLAP if c > 0 else 0)
                y_start = r * TILE_SIZE - (OVERLAP if r > 0 else 0)
                
                x_end = (c + 1) * TILE_SIZE + (OVERLAP if (c + 1) * TILE_SIZE < current_w else 0)
                y_end = (r + 1) * TILE_SIZE + (OVERLAP if (r + 1) * TILE_SIZE < current_h else 0)

                x_end = min(x_end, current_w)
                y_end = min(y_end, current_h)

                tile = current_img.crop((x_start, y_start, x_end, y_end))
                tile_path = os.path.join(level_dir, f"{c}_{r}.{FORMAT}")
                tile.save(tile_path, "WEBP", lossless=True, quality=100)
                total_tiles += 1

        # Downsample by 2 for the next lower level
        next_w = max(1, int(math.ceil(current_w / 2.0)))
        next_h = max(1, int(math.ceil(current_h / 2.0)))
        
        if level > 0:
            # Use nearest-neighbor or bilinear downsampling
            # Nearest neighbor preserves pixel-art palette without blurring
            current_img = current_img.resize((next_w, next_h), Image.Resampling.NEAREST)
            current_w, current_h = next_w, next_h

    print(f"\nSuccessfully generated {total_tiles} tiles across levels 0 to {max_level} in {files_dir}")

if __name__ == "__main__":
    generate_dzi(
        source_path="assets/composite/casablanca_downtown_master.png",
        output_dir="tiles",
        dzi_name="casablanca"
    )
