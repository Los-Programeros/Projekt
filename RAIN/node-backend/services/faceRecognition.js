const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const endpoint = "http://model-container:5000"; // Adjust this for your Docker setup

module.exports = {
  trainFaceModel: async (userId, imagePaths) => {
    try {
      const form = new FormData();
      form.append("userId", userId);

      imagePaths.forEach((imgPath, index) => {
        form.append("images", fs.createReadStream(imgPath));
      });

      const response = await axios.post(`${endpoint}/train`, form, {
        headers: form.getHeaders(),
      });

      console.log("Face model training response:", response.data);
      return true;
    } catch (err) {
      console.error("Error training face model:", err);
      return false;
    }
  },

  verifyFaceModel: async (sessionId, imageBase64) => {
    try {
      const buffer = Buffer.from(imageBase64, "base64");
      const tempPath = path.join(__dirname, "..", "temp", `${sessionId}.jpg`);
      fs.writeFileSync(tempPath, buffer);

      const form = new FormData();
      form.append("image", fs.createReadStream(tempPath));

      const response = await axios.post(`${endpoint}/predict`, form, {
        headers: form.getHeaders(),
      });

      fs.unlinkSync(tempPath);

      return response.data.verified;
    } catch (err) {
      console.error("Error verifying face:", err);
      return false;
    }
  },
};
