const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const endpoint = "http://model-container:5000";

module.exports = {
  trainFaceModel: async (userId, imagePaths) => {
    try {
      for (const imgPath of imagePaths) {
        if (!fs.existsSync(imgPath)) {
          throw new Error(`Image file does not exist: ${imgPath}`);
        }

        try {
          fs.accessSync(imgPath, fs.constants.R_OK);
        } catch (accessErr) {
          throw new Error(`Cannot read image file: ${imgPath}`);
        }
      }

      const form = new FormData();
      form.append("userId", userId.toString());

      imagePaths.forEach((imgPath, index) => {
        try {
          const stream = fs.createReadStream(imgPath);

          stream.on("error", (streamErr) => {
            console.error(`Error reading file ${imgPath}:`, streamErr);
          });

          form.append("images", stream, {
            filename: `image_${index}.jpg`,
            contentType: "image/jpeg",
          });
        } catch (streamErr) {
          throw new Error(
            `Failed to create read stream for ${imgPath}: ${streamErr.message}`
          );
        }
      });

      const response = await axios.post(`${endpoint}/train`, form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      console.log("Face model training response:", response.data);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error training face model:", err);

      return {
        success: false,
        error: err.message || "Unknown error occurred",
        details: err.response?.data || null,
      };
    }
  },

  verifyFaceModel: async (userId, imageBase64) => {
    try {
      const buffer = Buffer.from(imageBase64, "base64");

      const tempDir = path.join(__dirname, "..", "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempPath = path.join(tempDir, `${userId}.jpg`);
      fs.writeFileSync(tempPath, buffer);

      if (!fs.existsSync(tempPath)) {
        throw new Error("Failed to write temporary image file");
      }

      const form = new FormData();
      const stream = fs.createReadStream(tempPath);

      form.append("userId", userId.toString());

      stream.on("error", (streamErr) => {
        console.error(`Error reading temp file ${tempPath}:`, streamErr);
      });

      form.append("image", stream, {
        filename: "verification_image.jpg",
        contentType: "image/jpeg",
      });

      const response = await axios.post(`${endpoint}/predict`, form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (cleanupErr) {
        console.warn("Failed to cleanup temp file:", cleanupErr);
      }

      return {
        success: true,
        verified: response.data.verified,
        data: response.data,
      };
    } catch (err) {
      console.error("Error verifying face:", err);

      try {
        const tempPath = path.join(__dirname, "..", "temp", `${userId}.jpg`);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (cleanupErr) {
        console.warn("Failed to cleanup temp file on error:", cleanupErr);
      }

      return {
        success: false,
        verified: false,
        error: err.message || "Unknown error occurred",
      };
    }
  },
};
