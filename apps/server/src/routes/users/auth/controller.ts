import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto, { BinaryLike } from "crypto";
import asyncHandler from "@/utils/async-handler";
import { notRequiredFields, User } from "@/models/users.model";
import { ApiError } from "@/utils/api-error";
import { UserLoginMethodEnum } from "@/constants/index";
import { ApiResponse } from "@/utils/api-response";
import { UserRequest } from "@/types/request";
import { IUser } from "@/types/model";

export async function generateAccessAndRefreshTokens(user: IUser) {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to create session");
  }
}

const chechUsernameAvailable = asyncHandler(
  async (req: Request, res: Response) => {
    const { username } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new ApiError(409, "This username is already taken");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, true, "success", { available: true }));
  }
);

const userRegister = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new ApiError(409, "This username is already taken");
    } else throw new ApiError(409, "Account with this email already exists");
  }

  const user = await User.create({
    username,
    email,
    password,
    loginMethod: UserLoginMethodEnum.CREDENTIALS,
  });

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const createdUser = await User.findOne({ _id: user._id }).select(
    notRequiredFields
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while creating account. Please try again"
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        true,
        "Account created successfully !! Please verify your email."
      )
    );
});

const userLogin = asyncHandler(async (req: Request, res: Response) => {
  const { user, password } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email: user }, { username: user }],
  });

  if (!existingUser) {
    throw new ApiError(404, "Account doesn't exist");
  }

  const isPasswordCorrect = await existingUser.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(403, "Wrong Credentials");
  }

  if (existingUser.loginMethod !== UserLoginMethodEnum.CREDENTIALS) {
    throw new ApiError(
      400,
      "Please use original login method to access your account"
    );
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(existingUser);

  const currUser = await User.findById(existingUser._id).select(
    notRequiredFields
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none" as const,
  };

  const accessTokenOptions = {
    ...options,
    maxAge: eval(process.env.ACCESS_TOKEN_EXPIRY!),
  };
  const refreshTokenOptions = {
    ...options,
    maxAge: eval(process.env.REFRESH_TOKEN_EXPIRY!),
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .json(
      new ApiResponse(200, true, "Login Successful !!", {
        user: currUser,
        key: accessToken,
        refreshKey: refreshToken,
      })
    );
});

const userLogout = asyncHandler(async (req: UserRequest, res: Response) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none" as const,
  };

  const accessTokenOptions = {
    ...options,
    maxAge: eval(process.env.ACCESS_TOKEN_EXPIRY!),
  };

  const refreshTokenOptions = {
    ...options,
    maxAge: eval(process.env.REFRESH_TOKEN_EXPIRY!),
  };

  return res
    .status(200)
    .clearCookie("accessToken", accessTokenOptions)
    .clearCookie("refreshToken", refreshTokenOptions)
    .json(new ApiResponse(200, true, "Logout Successful"));
});

const refreshSession = asyncHandler(async (req: UserRequest, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Session Expired !! Please login again");
  }

  const decodedToken = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET!
  ) as {
    _id: string;
  };

  if (!decodedToken) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findOne({
    _id: decodedToken._id,
    refreshToken,
  }).select(notRequiredFields);

  if (!user) {
    throw new ApiError(401, "Session Expired !! Please login again");
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshTokens(user);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none" as const,
  };

  const accessTokenOptions = {
    ...options,
    maxAge: eval(process.env.ACCESS_TOKEN_EXPIRY!),
  };
  const refreshTokenOptions = {
    ...options,
    maxAge: eval(process.env.REFRESH_TOKEN_EXPIRY!),
  };

  return res
    .status(200)
    .cookie("accessToken", newAccessToken, accessTokenOptions)
    .cookie("refreshToken", newRefreshToken, refreshTokenOptions)
    .json(
      new ApiResponse(200, true, "Session Refreshed", {
        key: newAccessToken,
        refreshKey: newRefreshToken,
        user,
      })
    );
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token?.trim()) {
    throw new ApiError(400, "Invalid Link");
  }

  let hashedToken = crypto.createHash("sha512").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(404, "Invalid Link or Verification time is expired");
  }

  if (user.isEmailVerified) {
    throw new ApiError(489, "Email is already verified!");
  }

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  user.isEmailVerified = true;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, true, "Email verified successfully", {
      isEmailVerified: true,
    })
  );
});

const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { otp } = req.body;

  const user = await User.findOne({
    otpVerificationToken: otp,
    otpVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(404, "Incorrect or Expired OTP");
  }

  if (user.isPhoneVerified) {
    throw new ApiError(489, "Phone number is already verified!");
  }

  user.otpVerificationToken = undefined;
  user.otpVerificationToken = undefined;
  user.isPhoneVerified = true;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, true, "Phone number verified successfully", {
      isPhoneVerified: true,
    })
  );
});

const resendVerificationEmail = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const user = req.user;

    if (user.isEmailVerified) {
      throw new ApiError(489, "Email is already verified!");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Verification Mail has been sent to your registred email-ID"
        )
      );
  }
);

const resendVerificationOTP = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const user = req.user;

    const { phone } = req.body;

    if (user.isPhoneVerified) {
      throw new ApiError(489, "Phone number is already verified!");
    }

    await user.save({ validateBeforeSave: true });
    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "OTP has been sent to given phone number")
      );
  }
);

const forgotPasswordRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { user } = req.body;

    const existingUser = (await User.findOne({
      $or: [{ email: user }, { username: user }],
    })) as IUser;

    if (!existingUser) {
      throw new ApiError(404, "Account doesn't exists");
    }

    if (existingUser.loginMethod !== UserLoginMethodEnum.CREDENTIALS) {
      throw new ApiError(
        400,
        "Please use original login method to access your account"
      );
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      existingUser.generateTemporaryToken();

    existingUser.forgotPasswordToken = hashedToken;
    existingUser.forgotPasswordExpiry = tokenExpiry;
    await existingUser.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Reset Password Link has been sent to your registred email-ID"
        )
      );
  }
);

const resetForgottenPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token) {
      throw new ApiError(404, "Invalid Link");
    }

    const { newPassword } = req.body;

    const hashedToken = crypto
      .createHash("sha512")
      .update(token as BinaryLike)
      .digest("hex");

    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(
        404,
        "Invalid Link or Password Verification time is expired"
      );
    }

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Password reset successfully"));
  }
);

const changeCurrentPassword = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (oldPassword === newPassword) {
      throw new ApiError(
        400,
        "New password can't be same as Old password. Try Something New!"
      );
    }

    if (newPassword !== confirmNewPassword) {
      throw new ApiError(400, "Passwords do not match");
    }

    const exisitingUser = await User.findById(req.user._id);
    if (!exisitingUser) {
      throw new ApiError(404, "Account does not exist");
    }
    const isPasswordCorrect =
      await exisitingUser.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(403, "Wrong Password");
    }

    exisitingUser.password = newPassword;
    await exisitingUser.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Password changed successfully"));
  }
);

export {
  chechUsernameAvailable,
  userRegister,
  userLogin,
  userLogout,
  refreshSession,
  verifyEmail,
  verifyOTP,
  resendVerificationEmail,
  resendVerificationOTP,
  forgotPasswordRequest,
  resetForgottenPassword,
  changeCurrentPassword,
};
