const LandmarkModel = require('../models/landmarkModel');
const sensorDataModel = require('../models/sensorDataModel');

module.exports.admin = async (req, res) => {
    try {
        const users = await userModel.find(); // tvoji uporabniki
        const landmarks = await landmarkModel.find();
        const sensorData = await sensorDataModel.find(); // če obstaja
        const userActivities = await userActivityModel.find(); // če obstaja

        res.render('admin', {
            users,
            landmarks,
            landmarksJSON: JSON.stringify(landmarks), // direktna serializacija
            sensorData,
            userActivities
        });

    } catch (error) {
        res.status(500).send("Napaka pri pridobivanju podatkov.");
    }
};
