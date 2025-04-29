const express = require('express');
const router = express.Router();

const User = require('../models/userModel');
const Landmark = require('../models/landmarkModel');
const SensorData = require('../models/sensorDataModel');
const UserActivity = require('../models/userActivityModel');

// GET /admin - Admin Panel Page
router.get('/', async (req, res) => {
  try {
    const [users, landmarks, sensorData, userActivities] = await Promise.all([
      User.find({}),
      Landmark.find({}),
      SensorData.find({}),
      UserActivity.find({})
    ]);

    res.render('admin', {
      layout: false,
      users,
      landmarks,
      sensorData,
      userActivities
    });
  } catch (error) {
    res.status(500).send('Admin panel error: ' + error.message);
  }
});

module.exports = router;