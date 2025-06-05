import cv2, numpy as np, uuid, random, shutil
from pathlib import Path
import sys

if len(sys.argv) != 2:
    print("Error: Directory path argument required")
    sys.exit(1)

script_dir = Path(__file__).parent

src_dir = script_dir / "1" / "predprocesirano"
try:
    resolved_source = src_dir.resolve()
    print(f"Looking for images in: {resolved_source}")
    if not src_dir.exists() or not src_dir.is_dir():
        print(f"Error: 'predprocesirano' folder not found inside '{script_dir / '0'}'")
        sys.exit(1)
except Exception as e:
    print(f"Error resolving directory: {e}")
    sys.exit(1)

one_dir = script_dir / "1"
one_dir.mkdir(parents=True, exist_ok=True)
numeric_folders = [d for d in one_dir.iterdir() if d.is_dir() and d.name.isdigit()]
if numeric_folders:
    latest_number = max(int(d.name) for d in numeric_folders)
    new_number = latest_number + 1
else:
    new_number = 0

dst_dir = one_dir / str(new_number)
dst_dir.mkdir(parents=True, exist_ok=True)
print(f"Saving augmented images to: {dst_dir}")

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

for src in src_dir.glob("*.jpg"):
    img = cv2.imread(str(src))
    if img is None:
        continue
    stem = src.stem
    for f in augs:
        out = f(img)
        name = f"{stem}_{f.__name__}_{uuid.uuid4().hex[:6]}.jpg"
        cv2.imwrite(str(dst_dir / name), out, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
