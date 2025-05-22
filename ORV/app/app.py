from flask import Flask, request, jsonify
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array, load_img
import numpy as np
import os
from PIL import Image
from io import BytesIO

app = Flask(__name__)

# Naloži model
MODEL_PATH = "2FA_model.keras"
IMAGE_SIZE = 128
model = load_model(MODEL_PATH)

@app.route("/predict", methods=["POST"])
def predict():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image part"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400

    try:
        image = Image.open(file.stream).convert("RGB")
        image = image.resize((IMAGE_SIZE, IMAGE_SIZE))
        image = img_to_array(image) / 255.0
        image = np.expand_dims(image, axis=0)

        prediction = model.predict(image)
        prob = prediction[0][0]
        verified = prob > 0.5

        return jsonify({
            "success": True,
            "verified": bool(verified),
            "confidence": float(prob if verified else 1 - prob)
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
