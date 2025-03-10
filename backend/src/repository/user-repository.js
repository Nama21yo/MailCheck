// src/repository/user-repository.js
const CrudRepository = require("./crud-repository");
const User = require("../models/user");

class UserRepository extends CrudRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    try {
      const user = await User.findOne({ email });
      return user;
    } catch (error) {
      console.log("Something went wrong in user repository");
      throw error;
    }
  }
}

module.exports = UserRepository;
