const JWT = require("passport-jwt");
const User = require("../models/user");

const jwtStartegy = JWT.Strategy;
const ExtractJwt = JWT.ExtractJwt;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: "some_secret_file",
};

export const passportAuth = (passport) => {
  passport.use(
    new jwtStartegy(opts, async (jwt_payload, done) => {
      const user = awaitUser.findById(jwt_payload.id);

      if (!user) {
        done(null, false);
      } else {
        done(null, user);
      }
    })
  );
};
