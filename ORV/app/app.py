from flask import Flask, request, jsonify
import os
from PIL import Image
import numpy as np
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D, Input
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import img_to_array
from sklearn.utils import class_weight
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import tensorflow as tf
import uuid
import shutil

app = Flask(__name__)

IMAGE_SIZE = 64
BATCH_SIZE = 16
EPOCHS = 3

DATA_ROOT = os.path.join("data", "user_faces")
MODEL_ROOT = os.path.join("data", "models")
SHARED_NEG_DIR = os.path.abspath(os.path.join("data", "negatives"))

os.makedirs(DATA_ROOT, exist_ok=True)
os.makedirs(MODEL_ROOT, exist_ok=True)

def preprocess_and_save_images(user_id, files):
    print(f"[INFO] Preprocessing images for user {user_id}...")
    user_dir = os.path.join(DATA_ROOT, user_id, "positive")
    neg_dir = os.path.join(DATA_ROOT, user_id, "negative")
    os.makedirs(user_dir, exist_ok=True)

    for file in files:
        try:
            print(f"[INFO] Processing image {file.filename}")
            image = Image.open(file.stream).convert("RGB")
            image = image.resize((IMAGE_SIZE, IMAGE_SIZE))
            save_path = os.path.join(user_dir, f"{uuid.uuid4()}.jpg")
            image.save(save_path)
        except Exception as e:
            print(f"[ERROR] Failed to process image {file.filename}: {e}")
            continue

    command = f"python run.py {user_dir}"
    print(f"Running: {command}")
    status_code = os.system(command)
    print(f"Status code: {status_code}")

    if os.path.exists(SHARED_NEG_DIR):
        try:
            if not os.path.exists(neg_dir):
                os.symlink(SHARED_NEG_DIR, neg_dir)
                print(f"[INFO] Created symlink to shared negatives for user {user_id}")
        except OSError as e:
            print(f"[WARN] Symlink failed ({e}), falling back to copy...")
            os.makedirs(neg_dir, exist_ok=True)
            marker = os.path.join(neg_dir, ".copied")
            if not os.path.exists(marker):
                for fname in os.listdir(SHARED_NEG_DIR):
                    if fname.lower().endswith(('.png', '.jpg', '.jpeg')):
                        try:
                            src = os.path.join(SHARED_NEG_DIR, fname)
                            dst = os.path.join(neg_dir, f"{uuid.uuid4()}.jpg")
                            shutil.copyfile(src, dst)
                        except Exception as e:
                            print(f"[ERROR] Copying negative {fname} failed: {e}")
                with open(marker, "w") as f:
                    f.write("done")
    else:
        print("[WARN] Shared negatives directory does not exist.")

    return os.path.join(DATA_ROOT, user_id)

def train_model(user_id, user_data_dir):
    print(f"[INFO] Training model for user {user_id} using data from {user_data_dir}")

    datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
    )

    train_gen = datagen.flow_from_directory(
        user_data_dir,
        target_size=(IMAGE_SIZE, IMAGE_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='training'
    )
    val_gen = datagen.flow_from_directory(
        user_data_dir,
        target_size=(IMAGE_SIZE, IMAGE_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='validation'
    )

    print(f"[INFO] Training samples: {train_gen.samples}, Validation samples: {val_gen.samples}")

    if train_gen.samples < 2:
        raise Exception("Not enough training samples.")

    print("[INFO] Computing class weights...")
    class_weights = dict(enumerate(
        class_weight.compute_class_weight(
            class_weight='balanced',
            classes=np.unique(train_gen.classes),
            y=train_gen.classes
        )
    ))
    print(f"[INFO] Class weights: {class_weights}")

    print("[INFO] Building model...")
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3))
    base_model.trainable = False

    model = Sequential([
        Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3)),
        base_model,
        GlobalAveragePooling2D(),
        Dense(256, activation='relu'),
        Dropout(0.5),
        Dense(128, activation='relu'),
        Dropout(0.3),
        Dense(1, activation='sigmoid')
    ])

    model.compile(optimizer=Adam(learning_rate=0.001), loss='binary_crossentropy', metrics=['accuracy'])
    print("[INFO] Starting training...")

    early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3)

    model.fit(train_gen, validation_data=val_gen, epochs=EPOCHS,
              class_weight=class_weights,
              callbacks=[early_stopping, reduce_lr])

    model_path = os.path.join(MODEL_ROOT, f"{user_id}.keras")
    model.save(model_path)
    print(f"[INFO] Model saved to {model_path}")
    return model_path

@app.route("/train", methods=["POST"])
def train():
    print("[INFO] Received training request")
    user_id = request.form.get("userId")
    files = request.files.getlist("images")

    if not user_id or not files:
        print("[ERROR] Missing userId or images")
        return jsonify({"success": False, "error": "Missing userId or images"}), 400

    try:
        user_data_dir = preprocess_and_save_images(user_id, files)
        model_path = train_model(user_id, user_data_dir)
        print("[INFO] Training successful")
        return jsonify({"success": True, "model_path": model_path})
    except Exception as e:
        print(f"[ERROR] Training failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    print("[INFO] Received prediction request")
    if 'image' not in request.files:
        print("[ERROR] No image part in request")
        return jsonify({"success": False, "error": "No image part"}), 400

    file = request.files['image']
    if file.filename == '':
        print("[ERROR] No selected file")
        return jsonify({"success": False, "error": "No selected file"}), 400

    user_id = request.form.get("userId")
    if not user_id:
        print("[ERROR] Missing userId")
        return jsonify({"success": False, "error": "Missing userId"}), 400

    try:
        model_path = os.path.join(MODEL_ROOT, f"{user_id}.keras")
        if not os.path.exists(model_path):
            print(f"[ERROR] Model not found for user {user_id}")
            return jsonify({"success": False, "error": "Model not found for user"}), 404

        print(f"[INFO] Loading model from {model_path}")
        model = load_model(model_path)

        image = Image.open(file.stream).convert("RGB")
        image = image.resize((IMAGE_SIZE, IMAGE_SIZE))
        image = img_to_array(image) / 255.0
        image = np.expand_dims(image, axis=0)

        print("[INFO] Predicting...")
        prediction = model.predict(image)
        prob = prediction[0][0]
        verified = prob > 0.5

        print(f"[INFO] Prediction result: prob={prob}, verified={verified}")

        return jsonify({
            "success": True,
            "verified": bool(verified),
            "confidence": float(prob if verified else 1 - prob)
        })

    except Exception as e:
        print(f"[ERROR] Prediction failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    print("[INFO] Starting Flask app...")

    print("[INFO] Preloading MobileNetV2 weights...")
    _ = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3))

    app.run(host="0.0.0.0", port=5000)
