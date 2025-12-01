import { Request, Response } from "express";
import { UserRequest } from "@/types/request";
import asyncHandler from "@/utils/async-handler";
import { notRequiredFields, User } from "@/models/users.model";
import { ApiError } from "@/utils/api-error";
import { ApiResponse } from "@/utils/api-response";
import CloudinaryService from "@/services/cloudinary/cloudinary";
import { UserLoginMethodEnum } from "@/constants";

const getCurrentUser = asyncHandler(async (req: UserRequest, res: Response) => {
  const user = await User.findById(req.user._id).select(notRequiredFields);
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, true, "Account fetched successfully", user));
});

const changeAvatar = asyncHandler(async (req: UserRequest, res: Response) => {
  const { public_id } = req.body;

  const file = await CloudinaryService.getFile(public_id);

  const updatedUser = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      avatar: {
        public_id: file.public_id,
        url: file.url,
        format: file.format,
        resource_type: file.resource_type,
      },
    },
  }).select(notRequiredFields);

  if (!updatedUser) {
    throw new ApiError(404, "User does not exist");
  }

  const old_avatar_public_id = req.user?.avatar?.public_id;

  if (old_avatar_public_id)
    await CloudinaryService.deleteFile(old_avatar_public_id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, true, "Avatar updated successfully", updatedUser)
    );
});

const checkUsernameAvailability = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { username } = req.body;

    const user = await User.findOne({ username });

    if (user) {
      throw new ApiError(409, "This username is already taken");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, true, `${username} is available`));
  }
);

const updateUserProfile = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { fullname, email, phone } = req.body;
    let data: Record<string, any> = { fullname, email, phone };

    const existingUser = req.user;

    if (
      existingUser?.email !== email?.trim() &&
      existingUser?.loginMethod !== UserLoginMethodEnum.CREDENTIALS
    ) {
      throw new ApiError(
        400,
        "Users with Google Login can't change their mail"
      );
    }

    if (existingUser?.email !== email.trim()) {
      data.isEmailVerified = false;
    }

    if (existingUser?.phone !== phone.trim()) {
      data.isPhoneVerified = false;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...data },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Profile updated successfully", user));
  }
);

export {
  getCurrentUser,
  changeAvatar,
  checkUsernameAvailability,
  updateUserProfile,
};
