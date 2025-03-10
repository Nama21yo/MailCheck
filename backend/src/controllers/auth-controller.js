const UserService = require("../services/user-service");

const userService = new UserService();

exports.signup = async (req, res) => {
  try {
    const response = await userService.signup({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
    });

    return res.status(201).json({
      success: true,
      message: "Successfully created a new user",
      data: response,
      err: {},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      data: {},
      err: error,
    });
  }
};

exports.signin = async (req, res) => {
  try {
    const token = await userService.signin({
      email: req.body.email,
      password: req.body.password,
    });

    return res.status(200).json({
      success: true,
      message: "Successfully signed in",
      data: token,
      err: {},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      data: {},
      err: error,
    });
  }
};
