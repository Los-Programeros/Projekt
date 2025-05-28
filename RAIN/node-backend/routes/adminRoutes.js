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
      SensorData.find({}).populate('user', 'username'), // Populate user with username
      UserActivity.find({}).populate('user', 'username').populate('visited.landmark', 'name') // Populate user and landmark names
    ]);


    res.render('admin', {
      layout: false,
      users,
      landmarks,
      sensorData,
      userActivities
    });
  } catch (error) {
    console.error('Admin panel error:', error.message);
    res.status(500).send('Admin panel error: ' + error.message);
  }
});

module.exports = router;