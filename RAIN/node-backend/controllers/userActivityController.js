var UseractivityModel = require('../models/userActivityModel.js');

/**
 * userActivityController.js
 *
 * @description :: Server-side logic for managing userActivitys.
 */
module.exports = {

    /**
     * userActivityController.list()
     */
    list: function (req, res) {
        UseractivityModel.find(function (err, userActivitys) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting userActivity.',
                    error: err
                });
            }

            return res.json(userActivitys);
        });
    },

    /**
     * userActivityController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        UseractivityModel.findOne({_id: id}, function (err, userActivity) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting userActivity.',
                    error: err
                });
            }

            if (!userActivity) {
                return res.status(404).json({
                    message: 'No such userActivity'
                });
            }

            return res.json(userActivity);
        });
    },

    /**
     * userActivityController.create()
     */
    create: function (req, res) {
        var userActivity = new UseractivityModel({
			user : req.body.user,
			date : req.body.date,
			visited : req.body.visited
        });

        userActivity.save(function (err, userActivity) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating userActivity',
                    error: err
                });
            }

            return res.status(201).json(userActivity);
        });
    },

    /**
     * userActivityController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        UseractivityModel.findOne({_id: id}, function (err, userActivity) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting userActivity',
                    error: err
                });
            }

            if (!userActivity) {
                return res.status(404).json({
                    message: 'No such userActivity'
                });
            }

            userActivity.user = req.body.user ? req.body.user : userActivity.user;
			userActivity.date = req.body.date ? req.body.date : userActivity.date;
			userActivity.visited = req.body.visited ? req.body.visited : userActivity.visited;
			
            userActivity.save(function (err, userActivity) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating userActivity.',
                        error: err
                    });
                }

                return res.json(userActivity);
            });
        });
    },

    /**
     * userActivityController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        UseractivityModel.findByIdAndRemove(id, function (err, userActivity) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the userActivity.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    }
};
