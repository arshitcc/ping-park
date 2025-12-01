import { ChatRoleEnum } from "@/constants";
import { Chat } from "@/models/chats.model";
import { Membership } from "@/models/Membership.model";
import { UserRequest } from "@/types/request";
import { ApiError } from "@/utils/api-error";
import asyncHandler from "@/utils/async-handler";
import { Response, NextFunction } from "express";
import mongoose from "mongoose";

const isChatAdmin = asyncHandler(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { chatID } = req.params;
    const userID = req.user._id?.toString();

    const existsInChat = await Chat.findOne({
      type: { $ne: "DIRECT" },
      _id: chatID,
      participants: {
        $elemMatch: {
          member: new mongoose.Types.ObjectId(userID),
          role: ChatRoleEnum.ADMIN,
        },
      },
    });

    if (!existsInChat) {
      throw new ApiError(403, "Chat not found or you are not an admin");
    }

    req.chat = existsInChat;
    next();
  }
);

const isChatMember = asyncHandler(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { chatID } = req.params;
    const userID = req.user._id?.toString();

    const existsInChat = await Chat.findOne({
      _id: chatID,
      participants: {
        $elemMatch: {
          member: new mongoose.Types.ObjectId(userID),
        },
      },
    });

    const existsMembership = await Membership.findOne({
      chat: chatID,
      member: userID,
    });

    if (!existsInChat || !existsMembership) {
      throw new ApiError(403, "Un-Authorized action to chat");
    }

    req.chat = existsInChat;
    next();
  }
);

export { isChatAdmin, isChatMember };
