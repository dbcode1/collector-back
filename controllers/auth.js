const jwt = require("jsonwebtoken");
require("dotenv").config();
const expressJwt = require("express-jwt");
const _ = require("lodash");
const User = require("../models/user");
const { Resend } = require("resend");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const { ObjectId } = require("mongodb");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.signup = async (req, res) => {
  console.log(req.body);
  console.log("SIGNUP");
  const { name, email, password } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  let user = await User.findOne({ email });
  console.log("USER", user);
  if (user) {
    //console.log("user exists")
    return res.status(400).json({
      error: "Email is taken",
    });
  }

  const token = jwt.sign({ name, email, password }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });

  const { data, error } = await resend.emails.send({
    from: "danb1@danielbrusky.com",
    to: email,
    subject: "Activate your account",
    html: `
                      <h1>Please use the following link to activate your account</h1>
                      <a href="${process.env.CLIENT_URL}/auth/activate/${token}">Activate</a>
                      <hr />
                      <p>This email may contain sensitive information</p>

                  `,
  });
  return res.json({
    message: "Check your email for activation instructions",
  });
};

exports.accountActivation = (req, res) => {
  console.log("activate");
  const { token } = req.body;
  console.log("token", token);
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
      if (err) {
        console.log("JWT VERIFY IN ACCOUNT ACTIVATION ERROR", err);
        return res.status(401).json({
          error: "Expired link. Signup again",
        });
      }

      const { name, email, password } = jwt.decode(token);

      const user = new User({ name, email, password });

      user.save((err, user) => {
        if (err) {
          console.log("SAVE USER IN ACCOUNT ACTIVATION ERROR", err);
          return res.status(401).json({
            error: "Error saving user in database. Try signup again",
          });
        }
        return res.json({
          message: "Signup success. Please signin.",
        });
      });
    });
  } else {
    return res.json({
      message: "Something went wrong. Try again.",
    });
  }
};

exports.signin = (req, res) => {
  const { email, password } = req.body;

  // check if user exist
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist. Please signup",
      });
    }
    console.log(user);
    // authenticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "Email and password do not match",
      });
    }
    // generate a token and send to client

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "100m",
    });
    console.log("user signin token", token);
    const { _id, name, email, role } = user;

    return res.json({
      token,
      user: { _id, name, email, role },
    });
  });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

exports.adminMiddleware = (req, res, next) => {
  console.log("req.user", req.user);
  User.findById({ _id: req.user._id }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(400).json({
        error: "Admin resource. Access denied",
      });
    }

    req.profile = user;
    next();
  });
};

const sendEmail = async (currentToken, email) => {
  console.log("resend");
  const { data, error } = await resend.emails.send({
    from: "danb1@danielbrusky.com",
    to: email,
    subject: "PASSWORD RESET LINK",
    html: `
                      <h1>Please use the following link to reset your password</h1>
                      <a href="${process.env.CLIENT_URL}/auth/password/reset/${currentToken}">Activate</a>
                      <hr />
                      <p>This email may contain sensitive information</p>
        
                  `,
  });
  if (error) {
    console.log(error);
  }
};

exports.forgotPassword = async (req, res) => {
  console.log("forgot")
  const { email } = req.body;
  let currentUser = "";
  let currentToken = "";
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist",
      });
    }

    const token = jwt.sign({ _id: user._id, name: user.name }, "skittles", {
      expiresIn: "10m",
    });
    currentUser = user;
    currentToken = token;
    updated(currentUser, currentToken, email);
  });
  const updated = async (currentUser, currentToken, email) => {
    currentUser.updateOne(
      { resetPasswordLink: currentToken },
      (err, success) => {
        if (err) {
          console.log("Reset Password Link Error", err);
          return res.status(400).json({
            error: "Database connection error on user password forgot request",
          });
        } else {
          sendEmail(currentToken, email);
          return res.json({ message: "email sent" });
        }
      },
    );
  };
};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    jwt.verify(resetPasswordLink, "skittles", function (err, decoded) {
      if (err) {
        return res.status(400).json({
          error: "Expired link. Try again. ",
        });
      }
      User.findOne({ resetPasswordLink }, (err, user) => {
        if (err || !user) {
          return res.status(400).json({
            error: "Something went wrong. Try later",
          });
        }

        const updatedFields = {
          password: newPassword,
          resetPasswordLink: "",
        };

        user = _.extend(user, updatedFields);
        user.save((err, result) => {
          if (err) {
            return res.status(400).json({
              error: "Error reseting user password",
            });
          }
          res.json({
            message: "Great you can login with your new password",
          });
        });
      });
    });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  const query = { _id: new ObjectId(req.id) };

  console.log("delete user", req.body.id);
  // const token = req.body.token;
  // console.log(req.body);

  //const user = await User.findById(req.body.id);
  const user = await User.deleteOne({ _id: req.body.id });
  console.log("Delete User", user);

  return res.json({ message: "Sorry to see you go... come back sometime." });
};
