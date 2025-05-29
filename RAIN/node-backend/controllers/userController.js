var UserModel = require("../models/userModel.js");
const fs = require("fs");
const path = require("path");
const { trainFaceModel } = require("../services/faceRecognition");
const faceRecognition = require("../services/faceRecognition");

/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {
  /**
   * userController.list()
   */
  list: function (req, res) {
    UserModel.find(function (err, users) {
      if (err) {
        return res.status(500).json({
          message: "Error when getting user.",
          error: err,
        });
      }

      return res.json(users);
    });
  },

  /**
   * userController.show()
   */
  show: function (req, res) {
    var id = req.params.id;

    UserModel.findOne({ _id: id }, function (err, user) {
      if (err) {
        return res.status(500).json({
          message: "Error when getting user.",
          error: err,
        });
      }

      if (!user) {
        return res.status(404).json({
          message: "No such user",
        });
      }

      return res.json(user);
    });
  },

  /**
   * userController.create()
   */
  register: function (req, res) {
    const { username, email, password, images } = req.body;

    if (!images || images.length !== 5) {
      return res
        .status(400)
        .json({ message: "Exactly 5 images required for registration" });
    }

    UserModel.findOne(
      { $or: [{ username }, { email }] },
      async function (err, existingUser) {
        if (err) {
          return res.status(500).json({
            message: "Error checking for existing user",
            error: err,
          });
        }

        if (existingUser) {
          return res
            .status(400)
            .json({ message: "User with username or email already exists" });
        }

        try {
          const userDir = path.join(__dirname, "../face_data", username);
          fs.mkdirSync(userDir, { recursive: true });

          const savedPaths = images.map((base64, index) => {
            try {
              const imgBuffer = Buffer.from(base64, "base64");
              const filePath = path.join(userDir, `${index}.jpg`);
              fs.writeFileSync(filePath, imgBuffer);

              // Verify file was written successfully
              if (!fs.existsSync(filePath)) {
                throw new Error(`Failed to save image ${index}`);
              }

              return filePath;
            } catch (imgErr) {
              throw new Error(
                `Error processing image ${index}: ${imgErr.message}`
              );
            }
          });

          const user = new UserModel({
            username,
            email,
            password,
            imagePath: userDir,
          });

          user.save(async function (err, savedUser) {
            if (err) {
              try {
                savedPaths.forEach((filePath) => {
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                  }
                });
                fs.rmdirSync(userDir);
              } catch (cleanupErr) {
                console.error("Error cleaning up files:", cleanupErr);
              }

              return res.status(500).json({
                message: "Error creating user",
                error: err,
              });
            }

            try {
              const result = await trainFaceModel(savedUser._id, savedPaths);

              if (result.success) {
                console.log(
                  "Face model training successful for user:",
                  savedUser._id
                );
                return res.status(201).json({
                  ...savedUser.toObject(),
                  trainingStatus: "completed",
                });
              } else {
                console.error("Face model training failed:", result.error);
                return res.status(201).json({
                  ...savedUser.toObject(),
                  trainingStatus: "failed",
                  trainingError: result.error,
                });
              }
            } catch (trainingErr) {
              console.error("Face model training error:", trainingErr);
              return res.status(201).json({
                ...savedUser.toObject(),
                trainingStatus: "failed",
                trainingError: trainingErr.message,
              });
            }
          });
        } catch (err) {
          return res.status(500).json({
            message: "Error saving user images",
            error: err.message || err,
          });
        }
      }
    );
  },

  /**
   * userController.update()
   */
  update: function (req, res) {
    var id = req.params.id;

    UserModel.findOne({ _id: id }, function (err, user) {
      if (err) {
        return res.status(500).json({
          message: "Error when getting user",
          error: err,
        });
      }

      if (!user) {
        return res.status(404).json({
          message: "No such user",
        });
      }

      user.username = req.body.username ? req.body.username : user.username;
      user.password = req.body.password ? req.body.password : user.password;
      user.email = req.body.email ? req.body.email : user.email;

      user.save(function (err, user) {
        if (err) {
          return res.status(500).json({
            message: "Error when updating user.",
            error: err,
          });
        }

        return res.json(user);
      });
    });
  },

  /**
   * userController.remove()
   */
  remove: function (req, res) {
    var id = req.params.id;

    UserModel.findByIdAndRemove(id, function (err, user) {
      if (err) {
        return res.status(500).json({
          message: "Error when deleting the user.",
          error: err,
        });
      }

      return res.status(204).json();
    });
  },

  login: async function (req, res, next) {
    try {
      const user = await new Promise((resolve, reject) => {
        UserModel.authenticate(
          req.body.username,
          req.body.password,
          (err, user) => {
            if (err || !user)
              return reject(new Error("Wrong username or password"));
            resolve(user);
          }
        );
      });

      const result = await faceRecognition.verifyFaceModel(
        user._id,
        req.body.image
      );

      if (!result.success || !result.verified) {
        return res.status(401).json({ message: "Face not recognized" });
      }

      req.session.userId = user._id;

      const { _id, username, email } = user;
      return res.status(200).json({ _id, username, email });
    } catch (err) {
      return res.status(401).json({ message: err.message || "Login failed" });
    }
  },

  profile: function (req, res, next) {
    UserModel.findById(req.session.userId).exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          var err = new Error("Not authorized, go back!");
          err.status = 400;
          return next(err);
        } else {
          return res.render("user/profile", user);
        }
      }
    });
  },

  logout: function (req, res, next) {
    if (req.session) {
      req.session.destroy(function (err) {
        if (err) {
          return next(err);
        }
        return res.status(200).json({ message: "Logged out" });
      });
    } else {
      return res.status(200).json({ message: "No session to destroy" });
    }
  },
};
