const userModel = require('../models/userModel');
const landmarkModel = require('../models/landmarkModel');
const sensorDataModel = require('../models/sensorDataModel');
const userActivityModel = require('../models/userActivityModel');

module.exports.admin = async (req, res) => {
    try {
        const users = await userModel.find();
        const landmarks = await landmarkModel.find();
        const sensorData = await sensorDataModel.find().populate('user', 'username');
        const userActivities = await userActivityModel.find()
            .populate('user', 'username')
            .populate('visited.landmark', 'name');
        console.log(JSON.stringify(userActivities, null, 2));

        res.render('admin', {
            users,
            landmarks,
            landmarksJSON: JSON.stringify(landmarks),
            sensorData,
            userActivities
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Napaka pri pridobivanju podatkov.");
    }
};