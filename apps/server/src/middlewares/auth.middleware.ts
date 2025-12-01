import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/async-handler";
import { ChatRoles } from "../constants";
import { UserRequest } from "../types/request";
import { ApiError } from "../utils/api-error";
import { Membership } from "../models/Membership.model";
import { notRequiredFields, User } from "../models/users.model";

const isLoggedIn = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      throw new ApiError(401, "Session Expired !! Please login again");
    }

    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!
    ) as {
      _id: string;
    };

    if (!decodedToken) {
      throw new ApiError(401, "Unauthorized to app");
    }

    const user = await User.findById(decodedToken?._id?.toString()).select(
      notRequiredFields
    );

    if (!user) {
      throw new ApiError(404, "Account doesn't exist");
    }

    req.user = user;
    next();
  }
);

const allowCommunityRoles = (roles: string[]) =>
  asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
      throw new ApiError(403, "Please Login");
    }

    const { communityID } = req.params;

    const existingMember = await Membership.findOne({
      chat: communityID,
      member: req.user._id,
    });

    if (!existingMember) {
      throw new ApiError(403, "You are not a member of this group");
    }

    if (roles.includes(existingMember.role)) {
      next();
    } else {
      throw new ApiError(403, "You are not allowed to perform this action");
    }
  });

const allowGroupRoles = (roles: ChatRoles[]) =>
  asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
      throw new ApiError(403, "Please Login");
    }

    const { groupID } = req.params;

    const existingMember = await Membership.findOne({
      chat: groupID,
      member: req.user._id,
    });

    if (!existingMember) {
      throw new ApiError(403, "You are not a member of this group");
    }

    if (roles.includes(existingMember.role)) {
      next();
    } else {
      throw new ApiError(403, "You are not allowed to perform this action");
    }
  });

export { isLoggedIn, allowCommunityRoles, allowGroupRoles };
