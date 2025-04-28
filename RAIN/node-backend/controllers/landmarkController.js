var LandmarkModel = require('../models/landmarkModel.js');

/**
 * landmarkController.js
 *
 * @description :: Server-side logic for managing landmarks.
 */
module.exports = {

    /**
     * landmarkController.list()
     */
    list: function (req, res) {
        LandmarkModel.find(function (err, landmarks) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting landmark.',
                    error: err
                });
            }

            return res.json(landmarks);
        });
    },

    /**
     * landmarkController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        LandmarkModel.findOne({_id: id}, function (err, landmark) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting landmark.',
                    error: err
                });
            }

            if (!landmark) {
                return res.status(404).json({
                    message: 'No such landmark'
                });
            }

            return res.json(landmark);
        });
    },

    /**
     * landmarkController.create()
     */
    create: function (req, res) {
        var landmark = new LandmarkModel({
			name : req.body.name,
			coordinates : req.body.coordinates,
			category : req.body.category
        });

        landmark.save(function (err, landmark) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating landmark',
                    error: err
                });
            }

            return res.status(201).json(landmark);
        });
    },

    /**
     * landmarkController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        LandmarkModel.findOne({_id: id}, function (err, landmark) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting landmark',
                    error: err
                });
            }

            if (!landmark) {
                return res.status(404).json({
                    message: 'No such landmark'
                });
            }

            landmark.name = req.body.name ? req.body.name : landmark.name;
			landmark.coordinates = req.body.coordinates ? req.body.coordinates : landmark.coordinates;
			landmark.category = req.body.category ? req.body.category : landmark.category;
			
            landmark.save(function (err, landmark) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating landmark.',
                        error: err
                    });
                }

                return res.json(landmark);
            });
        });
    },

    /**
     * landmarkController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        LandmarkModel.findByIdAndRemove(id, function (err, landmark) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the landmark.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    }
};
