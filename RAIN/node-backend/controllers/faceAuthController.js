const { verifyFaceModel } = require("../services/faceRecognition");

exports.startSession = (req, res) => {
  const sessionId = generateSessionId();
  res.json({ sessionId });
};

exports.verifyFace = async (req, res) => {
  const { sessionId, image } = req.body;

  try {
    const isValid = await verifyFaceModel(sessionId, image);
    res.json({
      success: isValid,
      user: {
        id: 1,
        username: "admin",
        email: "admin@gmail.com",
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
};
