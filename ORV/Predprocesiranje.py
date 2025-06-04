import cv2, numpy as np
from pathlib import Path
import sys

if len(sys.argv) != 2:
    print("Error: Directory path argument required")
    sys.exit(1)

root = Path(sys.argv[1])
latest = max(
    (d for d in root.iterdir() if d.is_dir() and d.name.isdigit()),
    key=lambda d: int(d.name),
    default=None,
)
if latest is None:
    raise RuntimeError(f"No numeric folder inside '{root}/'")

src_dir = latest / "original"
dst_dir = latest / "predprocesirano"
dst_dir.mkdir(parents=True, exist_ok=True)

for src in src_dir.glob("*.jpg"):
    img = cv2.imread(str(src))
    if img is None:
        continue
    denoise = cv2.GaussianBlur(img, (5, 5), 0)
    b, g, r = cv2.split(denoise)
    gray = np.clip(0.0722 * b + 0.7152 * g + 0.2126 * r, 0, 255).astype(np.uint8)
    cv2.imwrite(str(dst_dir / src.name), gray, [int(cv2.IMWRITE_JPEG_QUALITY), 95])