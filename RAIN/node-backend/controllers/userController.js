var UserModel = require("../models/userModel.js");

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
  create: function (req, res) {
    const { username, email, password } = req.body;

    UserModel.findOne(
      { $or: [{ username }, { email }] },
      function (err, existingUser) {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error checking for existing user", error: err });
        }

        if (existingUser) {
          return res
            .status(400)
            .json({ message: "User with Username or email already exists!" });
        }

        const user = new UserModel({ username, email, password });

        user.save(function (err, savedUser) {
          if (err) {
            return res
              .status(500)
              .json({ message: "Error creating user", error: err });
          }
          return res.status(201).json(savedUser);
        });
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

  showRegister: function (req, res) {
    res.render("user/register");
  },

  showLogin: function (req, res) {
    res.render("user/login");
  },

  login: function (req, res, next) {
    UserModel.authenticate(
      req.body.username,
      req.body.password,
      function (err, user) {
        if (err || !user) {
          return res
            .status(401)
            .json({ message: "Wrong username or password" });
        }

        req.session.userId = user._id;

        const { _id, username, email } = user;
        return res.status(200).json({ _id, username, email });
      }
    );
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
