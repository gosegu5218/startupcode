#!/usr/bin/env python3
"""
run_detection.py
- Usage: python run_detection.py <image_path>
- Tries to load best.pt from several candidate locations and runs detection.
"""
import sys
import os
import json
import glob

try:
    image_path = sys.argv[1]
except Exception:
    print(json.dumps({"error": "image_path_required"}))
    sys.exit(1)

this_dir = os.path.dirname(os.path.abspath(__file__))
# Enforce using the single provided best.pt in backend/AI/best.pt only
weights_path = os.path.abspath(os.path.join(this_dir, 'best.pt'))
if not os.path.exists(weights_path):
    err = {"error": "weights_not_found", "path": weights_path}
    sys.stderr.write(json.dumps(err))
    sys.exit(2)

if not os.path.exists(image_path):
    print(json.dumps({"error": "image_not_found", "path": image_path}))
    sys.exit(2)

try:
    from ultralytics import YOLO

    # Load only the enforced best.pt (no fallbacks)
    model = YOLO(weights_path)

    results = model.predict(source=image_path, imgsz=640, conf=0.25)

    detections = []
    for r in results:
        boxes = getattr(r, 'boxes', None)
        if boxes is None:
            continue
        for box in boxes:
            cls_id = int(box.cls.cpu().numpy()[0]) if hasattr(box, 'cls') else None
            conf = float(box.conf.cpu().numpy()[0]) if hasattr(box, 'conf') else None
            name = model.names[cls_id] if (model and cls_id is not None and hasattr(model, 'names')) else str(cls_id)
            detections.append({
                'label': name,
                'confidence': conf
            })

    print(json.dumps({"detections": detections}))
    sys.exit(0)

except Exception as e:
    # Strict mode: fail loudly if anything goes wrong while loading/running the provided model
    err = {
        "error": "detection_failed",
        "message": str(e)
    }
    sys.stderr.write(json.dumps(err))
    sys.exit(3)
