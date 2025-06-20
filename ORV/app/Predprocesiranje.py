import cv2, numpy as np
from pathlib import Path
import sys

if len(sys.argv) != 2:
    print("Error: Directory path argument required")
    sys.exit(1)

source_root = Path(sys.argv[1])

try:
    resolved_source = source_root.resolve()
    print(f"Looking for images in: {resolved_source}")
    if not resolved_source.exists() or not resolved_source.is_dir():
        print(f"Error: Directory '{resolved_source}' not found")
        sys.exit(1)
except Exception as e:
    print(f"Error resolving directory: {e}")
    sys.exit(1)

for src in resolved_source.glob("*.jpg"):
    img = cv2.imread(str(src))
    if img is None:
        continue
    denoise = cv2.GaussianBlur(img, (5, 5), 0)
    b, g, r = cv2.split(denoise)
    gray = np.clip(0.0722 * b + 0.7152 * g + 0.2126 * r, 0, 255).astype(np.uint8)
    
    out_name = src.stem + "_gray.jpg"
    cv2.imwrite(str(src.parent / out_name), gray, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
