const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const endpoint = "http://localhost:5000/predict";

module.exports = {
  verifyFaceModel: async (sessionId, imageBase64) => {
    try {
      // Decode base64 image (sent from frontend) and write to a temp file
      const buffer = Buffer.from(imageBase64, "base64");
      const tempPath = path.join(__dirname, "..", "temp", `${sessionId}.jpg`);
      fs.writeFileSync(tempPath, buffer);

      // Prepare form-data
      const form = new FormData();
      form.append("image", fs.createReadStream(tempPath));

      const response = await axios.post(endpoint, form, {
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
