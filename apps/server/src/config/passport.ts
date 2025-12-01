import passport from "passport";
import { Strategy as GoogleOAuthStrategy } from "passport-google-oauth20";
import { IUser } from "../types/model";

const GOOGLE_CALLBACK_URL = `${process.env.TREVEL_SERVER_URL}/api/v1/users/auth/google/callback`;

passport.use(
  new GoogleOAuthStrategy(
    {
      clientID: process.env.GOOGLE_WEB_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET!,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      try {
        return done(null, profile);
      } catch (error) {
        console.error("Error in Google Authentication Strategy :", error);
        return done(error, false);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

// function to deserialize a user/profile object into the session
passport.deserializeUser(function (user, done) {
  done(null, user as IUser);
});

export { passport };
