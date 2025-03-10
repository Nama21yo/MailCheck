const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { SALT } = require("../config/serverConfig");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// write a hook and call bcrypt
userSchema.pre("save", function (next) {
  const user = this;
  const encryptedPassword = bcrypt.hashSync(user.password, SALT);
  user.password = encryptedPassword;
  next();
});

userSchema.methods.comparePassword = function compare(password) {
  return bcrypt.compareSync(password, this.password);
};
userSchema.methods.genJWT = function generate() {
  return jwt.sign({ id: this._id, email: this.email }, "some_secret", {
    expiresIn: "1d",
  });
};
const User = mongoose.model("User", userSchema);

module.exports = User;
