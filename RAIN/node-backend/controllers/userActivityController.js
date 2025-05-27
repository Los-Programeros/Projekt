var UseractivityModel = require("../models/userActivityModel.js");

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
          message: "Error when getting userActivity.",
          error: err,
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

    UseractivityModel.findOne({ _id: id }, function (err, userActivity) {
      if (err) {
        return res.status(500).json({
          message: "Error when getting userActivity.",
          error: err,
        });
      }

      if (!userActivity) {
        return res.status(404).json({
          message: "No such userActivity",
        });
      }

      return res.json(userActivity);
    });
  },

  /**
   * userActivityController.create()
   */
  create: async function (req, res) {
    const { userId, visited } = req.body;

    if (!userId || !visited) {
      return res
        .status(400)
        .json({ message: "userId and visited landmarkId are required." });
    }

    try {
      let userActivity = await UseractivityModel.findOne({ user: userId });

      const visitEntry = {
        landmark: visited,
        visitedAt: new Date(),
      };

      if (userActivity) {
        userActivity.visited.push(visitEntry);
      } else {
        userActivity = new UseractivityModel({
          user: userId,
          visited: [visitEntry],
        });
      }

      const saved = await userActivity.save();
      return res.status(201).json(saved);
    } catch (err) {
      console.error("Error in creating/updating user activity:", err);
      return res.status(500).json({
        message: "Error when creating/updating userActivity",
        error: err,
      });
    }
  },

  /**
   * userActivityController.update()
   */
  update: function (req, res) {
    var id = req.params.id;

    UseractivityModel.findOne({ _id: id }, function (err, userActivity) {
      if (err) {
        return res.status(500).json({
          message: "Error when getting userActivity",
          error: err,
        });
      }

      if (!userActivity) {
        return res.status(404).json({
          message: "No such userActivity",
        });
      }

      userActivity.user = req.body.user ? req.body.user : userActivity.user;
      userActivity.date = req.body.date ? req.body.date : userActivity.date;
      userActivity.visited = req.body.visited
        ? req.body.visited
        : userActivity.visited;

      userActivity.save(function (err, userActivity) {
        if (err) {
          return res.status(500).json({
            message: "Error when updating userActivity.",
            error: err,
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
          message: "Error when deleting the userActivity.",
          error: err,
        });
      }

      return res.status(204).json();
    });
  },
};
