import cv2, uuid
from pathlib import Path

root = Path("1")
root.mkdir(exist_ok=True)
next_idx = max((int(p.name) for p in root.iterdir() if p.is_dir() and p.name.isdigit()), default=0) + 1
base = root / f"{next_idx:08d}" / "original"
base.mkdir(parents=True, exist_ok=True)

poses = [
    "Look straight ahead and press SPACE",
    "Turn 15 degrees right and press SPACE",
    "Turn 15 degrees left and press SPACE",
    "Tilt slightly up and press SPACE",
    "Tilt slightly down and press SPACE"
]

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise RuntimeError("Camera not available")

for msg in poses:
    while True:
        ret, frame = cap.read()
        if not ret:
            raise RuntimeError("Frame error")
        cv2.putText(frame, msg, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2, cv2.LINE_AA)
        cv2.imshow("capture", frame)
        k = cv2.waitKey(1) & 0xFF
        if k == 32:
            break
        if k == 27:
            cap.release(); cv2.destroyAllWindows(); quit()
    for _ in range(10):
        ret, frame = cap.read()
        if not ret:
            break
        img = cv2.resize(frame, (512, 512), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(base / f"{uuid.uuid4().hex}.jpg"), img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        cv2.imshow("capture", img)
        if cv2.waitKey(1) & 0xFF == 27:
            cap.release(); cv2.destroyAllWindows(); quit()

cap.release()
cv2.destroyAllWindows()