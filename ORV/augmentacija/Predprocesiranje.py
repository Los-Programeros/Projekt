import cv2, numpy as np, uuid, random
from pathlib import Path
import sys

if len(sys.argv) != 2:
    print("Error: Directory path argument required")
    sys.exit(1)

src_dir = Path(sys.argv[1])

try:
    resolved_source = src_dir.resolve()
    print(f"Looking for images in: {resolved_source}")
    if not src_dir.exists() or not src_dir.is_dir():
        print(f"Error: Source folder '{resolved_source}' not found")
        sys.exit(1)
except Exception as e:
    print(f"Error resolving directory: {e}")
    sys.exit(1)

def rand_brightness_contrast(img):
    a = random.uniform(0.6, 1.4)
    b = random.randint(-20, 20)
    return np.clip(img.astype(np.int16) * a + b, 0, 255).astype(np.uint8)

def micro_rotate(img):
    angle = random.uniform(-7, 7)
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_REFLECT101)

def flip_shift(img):
    f = cv2.flip(img, 1)
    dx, dy = random.randint(-3, 3), random.randint(-3, 3)
    s = np.roll(np.roll(f, dy, axis=0), dx, axis=1)
    if dx > 0:  s[:, :dx] = 0
    if dx < 0:  s[:, dx:] = 0
    if dy > 0:  s[:dy, :] = 0
    if dy < 0:  s[dy:, :] = 0
    return s

def occlusion_patch(img):
    h, w = img.shape[:2]
    size = 25
    x = random.randint(int(w * 0.3), int(w * 0.7) - size)
    y = random.randint(int(h * 0.3), int(h * 0.7) - size)
    out = img.copy()
    out[y:y+size, x:x+size] = 0
    return out

augs = [rand_brightness_contrast, micro_rotate, flip_shift, occlusion_patch]

# Izognemo se že predprocesiranim (_gray.jpg) in augmentiranim slikam
for src in src_dir.glob("*.jpg"):
    if "_gray" in src.stem:
        continue
    img = cv2.imread(str(src))
    if img is None:
        continue
    stem = src.stem
    for f in augs:
        out = f(img)
        name = f"{stem}_{f.__name__}_{uuid.uuid4().hex[:6]}.jpg"
        cv2.imwrite(str(src_dir / name), out, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
