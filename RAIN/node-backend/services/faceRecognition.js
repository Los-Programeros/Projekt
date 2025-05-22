module.exports = {
  verifyFace: async (uploadedImage, referenceImage) => {
    // Fake match for now
    return uploadedImage === referenceImage;
  },
};
