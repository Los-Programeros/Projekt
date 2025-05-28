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

# Directory where user training data will be stored
DATA_ROOT = "user_faces"
MODEL_ROOT = "models"

os.makedirs(DATA_ROOT, exist_ok=True)
os.makedirs(MODEL_ROOT, exist_ok=True)

def preprocess_and_save_images(user_id, files):
    user_dir = os.path.join(DATA_ROOT, user_id, "positive")
    os.makedirs(user_dir, exist_ok=True)

    for file in files:
        try:
            image = Image.open(file.stream).convert("RGB")
            image = image.resize((IMAGE_SIZE, IMAGE_SIZE))
            save_path = os.path.join(user_dir, f"{uuid.uuid4()}.jpg")
            image.save(save_path)
        except Exception as e:
            print(f"Failed to process image: {e}")
            continue

    neg_dir = os.path.join(DATA_ROOT, user_id, "negative")
    os.makedirs(neg_dir, exist_ok=True)
    for _ in range(3):
        dummy_image = np.random.randint(0, 255, (IMAGE_SIZE, IMAGE_SIZE, 3), dtype=np.uint8)
        Image.fromarray(dummy_image).save(os.path.join(neg_dir, f"{uuid.uuid4()}.jpg"))

    return os.path.join(DATA_ROOT, user_id)


def train_model(user_id, user_data_dir):
    datagen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1./255, validation_split=0.2)

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

    if train_gen.samples < 2:
        raise Exception("Not enough training samples.")

    class_weights = dict(enumerate(
        class_weight.compute_class_weight(
            class_weight='balanced',
            classes=np.unique(train_gen.classes),
            y=train_gen.classes
        )
    ))

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

    early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3)

    model.fit(train_gen, validation_data=val_gen, epochs=EPOCHS,
              class_weight=class_weights,
              callbacks=[early_stopping, reduce_lr])

    model_path = os.path.join(MODEL_ROOT, f"{user_id}.keras")
    model.save(model_path)
    return model_path


@app.route("/train", methods=["POST"])
def train():
    user_id = request.form.get("userId")
    files = request.files.getlist("images")

    if not user_id or not files:
        return jsonify({"success": False, "error": "Missing userId or images"}), 400

    try:
        user_data_dir = preprocess_and_save_images(user_id, files)
        model_path = train_model(user_id, user_data_dir)
        return jsonify({"success": True, "model_path": model_path})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/predict", methods=["POST"])
def predict():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image part"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400

    user_id = request.form.get("userId")
    if not user_id:
        return jsonify({"success": False, "error": "Missing userId"}), 400

    try:
        model_path = os.path.join(MODEL_ROOT, f"{user_id}.keras")
        if not os.path.exists(model_path):
            return jsonify({"success": False, "error": "Model not found for user"}), 404

        model = load_model(model_path)

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
    app.run(host="0.0.0.0", port=5000)
