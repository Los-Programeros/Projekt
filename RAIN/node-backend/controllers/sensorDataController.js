var SensordataModel = require('../models/sensorDataModel.js');

/**
 * sensorDataController.js
 *
 * @description :: Server-side logic for managing sensorDatas.
 */
module.exports = {

    /**
     * sensorDataController.list()
     */
    list: function (req, res) {
        SensordataModel.find(function (err, sensorDatas) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting sensorData.',
                    error: err
                });
            }

            return res.json(sensorDatas);
        });
    },

    /**
     * sensorDataController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        SensordataModel.findOne({_id: id}, function (err, sensorData) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting sensorData.',
                    error: err
                });
            }

            if (!sensorData) {
                return res.status(404).json({
                    message: 'No such sensorData'
                });
            }

            return res.json(sensorData);
        });
    },

    /**
     * sensorDataController.create()
     */
    create: function (req, res) {
        var sensorData = new SensordataModel({
			user : req.body.user,
			userActivity : req.body.userActivity,
			date : req.body.date,
			coordinates : req.body.coordinates,
			speed : req.body.speed
        });

        sensorData.save(function (err, sensorData) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating sensorData',
                    error: err
                });
            }

            return res.status(201).json(sensorData);
        });
    },

    /**
     * sensorDataController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        SensordataModel.findOne({_id: id}, function (err, sensorData) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting sensorData',
                    error: err
                });
            }

            if (!sensorData) {
                return res.status(404).json({
                    message: 'No such sensorData'
                });
            }

            sensorData.user = req.body.user ? req.body.user : sensorData.user;
			sensorData.userActivity = req.body.userActivity ? req.body.userActivity : sensorData.userActivity;
			sensorData.date = req.body.date ? req.body.date : sensorData.date;
			sensorData.coordinates = req.body.coordinates ? req.body.coordinates : sensorData.coordinates;
			sensorData.speed = req.body.speed ? req.body.speed : sensorData.speed;
			
            sensorData.save(function (err, sensorData) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating sensorData.',
                        error: err
                    });
                }

                return res.json(sensorData);
            });
        });
    },

    /**
     * sensorDataController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        SensordataModel.findByIdAndRemove(id, function (err, sensorData) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the sensorData.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    }
};
