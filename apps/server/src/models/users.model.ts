import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AvailableLoginMethods, UserLoginMethodEnum } from "../constants";
import { IUser } from "../types/model";

export const notRequiredFields =
  "-password -forgotPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry -refreshToken";

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    avatar: {
      type: {
        url: String,
        format: String,
        resource_type: String,
        public_id: String,
      },
      _id: false,
      required: false,
    },
    loginMethod: {
      type: String,
      enum: AvailableLoginMethods,
      default: UserLoginMethodEnum.CREDENTIALS,
    },
    phone: {
      type: String,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    otpVerificationToken: {
      type: String,
    },
    otpVerificationExpiry: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpiry: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.index({ username: "text" }, { unique: true });
userSchema.index({ username: 1, email: 1 }, { unique: true });

userSchema.pre("save", async function (this: IUser, next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "7D",
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: "30D",
  });
};

userSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha512")
    .update(unHashedToken)
    .digest("hex");
  const tokenExpiry = Date.now() + 15 * 60 * 1000;

  return { unHashedToken, hashedToken, tokenExpiry: new Date(tokenExpiry) };
};

export const User = mongoose.model("User", userSchema);
