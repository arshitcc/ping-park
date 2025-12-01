import { ChatEventsEnum, ChatRoleEnum, ChatTypesEnum } from "@/constants";
import { Chat } from "@/models/chats.model";
import { Message } from "@/models/message.model";
import CloudinaryService from "@/services/cloudinary/cloudinary";
import { IMessage } from "@/types/model";
import { UserRequest } from "@/types/request";
import { ApiError } from "@/utils/api-error";
import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";
import { Response } from "express";
import mongoose from "mongoose";

const commonMessagePipeline = () => [
  {
    $lookup: {
      from: "users",
      localField: "sender",
      foreignField: "_id",
      as: "sender",
      pipeline: [
        {
          $project: {
            username: 1,
            avatar: 1,
            isPhoneVerified: 1,
            isEmailVerified: 1,
          },
        },
      ],
    },
  },
  {
    $addFields: {
      sender: { $first: "$sender" },
    },
  },
  {
    $lookup: {
      from: "messages",
      localField: "replyTo",
      foreignField: "_id",
      as: "replyTo",
    },
  },
  {
    $addFields: {
      replyTo: { $first: "$replyTo" },
    },
  },
];

const getChatMessages = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { chatID } = req.params;
    let messages: IMessage[];

    messages = await Message.aggregate([
      { $match: { chat: new mongoose.Types.ObjectId(chatID) } },
      ...commonMessagePipeline(),
      { $sort: { createdAt: -1 } },
    ]);

    const messageIds = messages.map((msg) => msg._id);
    const currentUserId = req.user._id;

    if (messageIds.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          "seenBy.member": { $ne: currentUserId },
        },
        {
          $push: {
            seenBy: {
              member: currentUserId,
              seenAt: Date.now(),
            },
          },
        }
      );

      // messages = messages.map((msg) => {
      //   const isSeen = msg.seenBy.some(
      //     (s) => s.member.toString() === currentUserId?.toString()
      //   );
      //   if (!isSeen) {
      //     msg.seenBy.push({
      //       member: currentUserId as IUser,
      //       seenAt: new Date(),
      //     });
      //   }
      //   return msg;
      // });

      messages = await Message.aggregate([
        { $match: { chat: new mongoose.Types.ObjectId(chatID) } },
        ...commonMessagePipeline(),
        { $sort: { createdAt: -1 } },
      ]);

      // emit seen by event
    }

    return res
      .status(200)
      .json(new ApiResponse(200, true, "success", messages));
  }
);

const sendMessage = asyncHandler(async (req: UserRequest, res: Response) => {
  const { replyTo, attachments, text } = req.body;
  const { chatID } = req.params;
  const sender = req.user;
  const senderID = sender._id?.toString();

  let properAttachments = [];
  if (attachments && attachments.length > 0) {
    const assets = await CloudinaryService.getFiles(
      attachments.map((a: { public_id: string; text: string }) => a.public_id)
    );

    properAttachments = attachments.map(
      (a: { public_id: string; text: string }) => ({
        asset: assets.find((ast) => ast.public_id === a.public_id),
        text: a.text,
      })
    );
  }

  const newMessage = await Message.create({
    chat: chatID,
    sender: new mongoose.Types.ObjectId(senderID),
    text,
    attachments: properAttachments,
    replyTo: new mongoose.Types.ObjectId(replyTo as string),
  });

  const chat = await Chat.findByIdAndUpdate(chatID, {
    $set: { lastMessage: newMessage._id },
  });

  const messages = await Message.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(newMessage._id?.toString()) },
    },
    ...commonMessagePipeline(),
  ]);

  /*
  
  const properMessage = await Message.findById(newMessage._id)
    .populate("sender", "username avatar isPhoneVerified isEmailVerified")
    .populate("replyTo");

  */

  const sentMessage = messages[0];

  if (!sentMessage) {
    throw new ApiError(500, "Something went wrong. Please try again later");
  }

  chat?.participants.forEach((p) => {
    if (p.member.toString() === senderID) {
      req.app
        .get("io")
        .in(p.member.toString())
        .emit(ChatEventsEnum.MESSAGE_SENT, {
          message: sentMessage,
        });
      return;
    }

    req.app
      .get("io")
      .in(p.member.toString())
      .emit(ChatEventsEnum.MESSAGE_RECIEVED, {
        message: sentMessage,
      });
  });

  return res
    .status(200)
    .json(new ApiResponse(201, true, "Message sent", { message: sentMessage }));
});

const deleteMessage = asyncHandler(async (req: UserRequest, res: Response) => {
  const { chatID, messageID } = req.params;

  const chat = req.chat;
  const currUser = req.user;

  const existingMessage = await Message.findOne({
    _id: new mongoose.Types.ObjectId(messageID),
    chat: new mongoose.Types.ObjectId(chatID),
  });

  if (!existingMessage) {
    throw new ApiError(404, "Message not found");
  }

  let hasPermissionToDelete = false;
  if (existingMessage.sender?.toString() === currUser._id?.toString()) {
    hasPermissionToDelete = true;
  } else {
    const roleInChat = chat.participants.find(
      (m) => m.member?.toString() === currUser._id?.toString()
    )?.role;

    if (
      chat.type !== ChatTypesEnum.DIRECT &&
      roleInChat &&
      roleInChat === ChatRoleEnum.ADMIN
    ) {
      hasPermissionToDelete = true;
    }
  }

  if (!hasPermissionToDelete) {
    throw new ApiError(403, "Un-authorized to delete this message");
  }

  if (existingMessage.attachments.length > 0) {
    const publicIDs = existingMessage.attachments.map((a) => a.asset.public_id);
    await CloudinaryService.deleteFiles(publicIDs);
  }

  const updatedMessage = await Message.findByIdAndUpdate(
    messageID,
    {
      text: "",
      attachments: [],
      replyTo: null,
      reactions: [],
      readBy: [],
      seenBy: [],
      deletedBy: {
        member: new mongoose.Types.ObjectId(currUser._id?.toString()),
        deletedAt: Date.now(),
      },
    },
    { new: true }
  );

  if (!updatedMessage) {
    throw new ApiError(500, "Something went wrong while deleting the message");
  }

  if (chat.lastMessage?.toString() === updatedMessage._id?.toString()) {
    // update last message to last 2nd message
    const lastSecondMessage = await Message.findOne({
      chat: new mongoose.Types.ObjectId(chatID),
    })
      .sort({ createdAt: -1 })
      .skip(1);

    await Chat.findByIdAndUpdate(chatID, {
      $set: { lastMessage: lastSecondMessage ? lastSecondMessage._id : null },
    });
  }

  chat.participants.forEach((p) => {
    const participantID = p.member?.toString();
    if (participantID === currUser._id?.toString()) return;
    req.app.get("io").in(participantID).emit(ChatEventsEnum.MESSAGE_DELETED);
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, true, "Message Deleted", { message: updatedMessage })
    );
});

const editMessage = asyncHandler(async (req: UserRequest, res: Response) => {
  const { chatID, messageID } = req.params;

  const { text } = req.body; // considering only text message

  const updatedMessage = await Message.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(messageID),
      chat: new mongoose.Types.ObjectId(chatID),
      sender: req.user._id,
    },
    { $set: { text } }
  );

  if (!updatedMessage) {
    throw new ApiError(500, "Something went wrong while updating the message");
  }

  const chat = req.chat;

  chat.participants.forEach((p) => {
    const participantID = p.member?.toString();
    if (participantID === req.user._id?.toString()) return;
    req.app.get("io").in(participantID).emit(ChatEventsEnum.MESSAGE_EDITED);
  });

  return res
    .status(200)
    .json(new ApiResponse(200, true, "Message Updated", updatedMessage));
});

export { getChatMessages, sendMessage, deleteMessage, editMessage };
