import { ChatEventsEnum, ChatRoles } from "@/constants";
import { Chat } from "@/models/chats.model";
import { Membership } from "@/models/Membership.model";
import { Message } from "@/models/message.model";
import { User } from "@/models/users.model";
import ChatService from "@/services/chats";
import CloudinaryService from "@/services/cloudinary/cloudinary";
import { IChat, IUser } from "@/types/model";
import { UserRequest } from "@/types/request";
import { ApiError } from "@/utils/api-error";
import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";
import { Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";

const commonChatPipelines = () => [
  {
    $lookup: {
      from: "messages",
      localField: "lastMessage",
      foreignField: "_id",
      as: "lastMessage",
      pipeline: [
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
      ],
    },
  },
  {
    $addFields: {
      lastMessage: { $first: "$lastMessage" },
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "participants.member",
      foreignField: "_id",
      as: "participants",
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
];

const searchUsers = asyncHandler(async (req: UserRequest, res: Response) => {
  const { s } = req.query;
  const userID = req.user._id?.toString();
  const limit = 15;

  const users = await User.find({
    $and: [
      { _id: { $ne: userID } },
      { username: { $regex: new RegExp(s as string, "i") } },
    ],
  })
    .limit(limit)
    .select({
      username: 1,
      avatar: 1,
      isPhoneVerified: 1,
      isEmailVerified: 1,
    })
    .lean();

  return res.status(200).json(new ApiResponse(200, true, "success", users));
});

const getUserChats = asyncHandler(async (req: UserRequest, res: Response) => {
  const userID = req.user._id?.toString();

  const chats = await Chat.aggregate([
    {
      $match: {
        participants: {
          $elemMatch: {
            member: new mongoose.Types.ObjectId(userID),
          },
        },
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
    ...commonChatPipelines(),
  ]);

  return res.status(200).json(new ApiResponse(200, true, "success", chats));
});

const startDirectChat = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const senderID = req.user._id?.toString()!;
    const { receiverID } = req.body;

    const receiver = await User.findById(receiverID);
    if (!receiver) {
      throw new ApiError(404, "Receiver account doesn't exist");
    }

    if (receiver._id?.toString() === req.user._id?.toString()) {
      throw new ApiError(400, "You cannot chat with yourself");
    }

    const chat = await ChatService.getOrCreateDirectChat([
      senderID,
      receiverID,
    ]);

    const { attachments, text } = req.body;

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

    const message = await Message.create({
      chat: chat._id,
      sender: senderID,
      text,
      attachments: properAttachments,
    });

    await Chat.findByIdAndUpdate(
      chat._id,
      { $set: { lastMessage: message._id } },
      { new: true }
    );

    const updatedChat = await Chat.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chat._id?.toString()),
        },
      },
      ...commonChatPipelines(),
    ]);

    const payload = updatedChat[0];

    if (!payload) {
      throw new ApiError(500, "Something went wrong. Internal server error");
    }

    req.app.get("io").in(receiverID).emit(ChatEventsEnum.NEW_CHAT, payload);
    req.app
      .get("io")
      .in(receiverID)
      .emit(ChatEventsEnum.MESSAGE_RECIEVED, payload);
    req.app.get("io").in(senderID).emit(ChatEventsEnum.MESSAGE_SENT, payload);

    return res.status(200).json(
      new ApiResponse(200, true, "Message sent successfully", {
        chat,
        message,
      })
    );
  }
);

const createGroup = asyncHandler(async (req: UserRequest, res: Response) => {
  const userID = req.user._id?.toString();
  const { participants, title, description, image } = req.body;

  const members = [...new Set([...participants, userID])];

  let data: Partial<IChat> = {
    title,
    description,
    createdBy: userID,
  };

  if (image && image.public_id) {
    const file = await CloudinaryService.getFile(image.public_id);
    data.image = file;
  }

  const newChat = await ChatService.createGroupChat(members, data);

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(newChat._id?.toString()),
      },
    },
    ...commonChatPipelines(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(500, "Something went wrong. Internal server error");
  }

  payload.participants.forEach((p: IUser) => {
    if (p._id?.toString() === userID) return;
    req.app
      .get("io")
      .in(p._id?.toString()!)
      .emit(ChatEventsEnum.NEW_CHAT, payload);
  });

  return res
    .status(201)
    .json(new ApiResponse(201, true, "Group created successfully"));
});

const addNewParticipantsToGroup = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { chatID } = req.params;
    const { participants } = req.body;
    const userID = req.user._id?.toString();
    const chat = req.chat;

    const newParticipants = participants.filter(
      (p: string) => p !== userID && isValidObjectId(p)
    );

    await ChatService.updateParticipantsInGroup("ADD", chatID, newParticipants);

    const updatedChat = await Chat.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chatID),
        },
      },
      ...commonChatPipelines(),
    ]);

    const payload = updatedChat[0];

    if (!payload) {
      throw new ApiError(500, "Something went wrong. Internal server error");
    }

    const earlierParticipants = chat.participants.map((p) =>
      p.member.toString()
    );
    const updatedNewParticipants = payload.participants.filter(
      (p: { member: mongoose.Types.ObjectId }) =>
        !earlierParticipants.includes(p.member.toString())
    );

    updatedNewParticipants.forEach((p: { member: mongoose.Types.ObjectId }) => {
      const userID = p.member.toString();
      req.app.get("io").in(userID).emit(ChatEventsEnum.NEW_CHAT, payload);
    });

    return res
      .status(200)
      .json(new ApiResponse(200, true, "new participants added", payload));
  }
);

const removeParticipantsFromGroup = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { chatID } = req.params;
    const { participants } = req.body;
    const userID = req.user._id?.toString();
    const chat = req.chat;

    const removeParticipants = participants.filter(
      (p: string) => p !== userID && isValidObjectId(p)
    );

    await ChatService.updateParticipantsInGroup(
      "REMOVE",
      chatID,
      removeParticipants
    );

    const updatedChat = await Chat.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chatID),
        },
      },
      ...commonChatPipelines(),
    ]);

    const payload = updatedChat[0];

    if (!payload) {
      throw new ApiError(500, "Something went wrong. Internal server error");
    }

    const earlierParticipants = chat.participants;

    const updatedRemovedParticipants = earlierParticipants.filter((p) =>
      payload.participants.includes(p)
    ) as any;

    updatedRemovedParticipants.forEach(
      (p: { member: mongoose.Types.ObjectId }) => {
        const userID = p.member.toString();
        req.app.get("io").in(userID).emit(ChatEventsEnum.LEAVE_CHAT, payload);
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, true, "participants removed", payload));
  }
);

const updateGroupProfile = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { title, description, image } = req.body;
    const { chatID } = req.params;
    const chat = req.chat;

    let data: Record<string, any> = { title, description };

    if (image && image.public_id) {
      if (chat.image && chat.image.public_id !== image.public_id) {
        const file = await CloudinaryService.getFile(image.public_id);
        data.image = file;
      }
    }

    await Chat.findByIdAndUpdate(chatID, { $set: data });

    const updatedChat = await Chat.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chatID),
        },
      },
      ...commonChatPipelines(),
    ]);

    const payload = updatedChat[0];

    if (!payload) {
      throw new ApiError(500, "Something went wrong. Internal server error");
    }

    payload?.participants.forEach(
      (p: { member: mongoose.Types.ObjectId; role: ChatRoles }) => {
        const userID = p.member.toString();
        req.app.get("io").in(userID).emit(ChatEventsEnum.UPDATE_CHAT, payload);
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, true, "group updated", payload));
  }
);

const assignParticipantRole = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const { chatID } = req.params;
    const { participantID, role } = req.body;
    const chat = req.chat;

    const existsInChat = await Chat.findOne({
      type: { $ne: "DIRECT" },
      _id: chatID,
      participants: {
        $elemMatch: {
          member: new mongoose.Types.ObjectId(participantID as string),
        },
      },
    });

    if (!existsInChat) {
      throw new ApiError(404, "Participant not found in chat");
    }

    await Chat.findOneAndUpdate(
      { _id: chatID, "participants.member": participantID },
      { $set: { "participants.$.role": role } }
    );

    chat.participants = chat.participants.map((p) =>
      p.member.toString() === participantID ? { ...p, role } : p
    );

    await chat.save();

    await Membership.findOneAndUpdate(
      {
        chat: new mongoose.Types.ObjectId(chatID),
        member: new mongoose.Types.ObjectId(participantID as string),
      },
      { $set: { role } }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Participant role updated"));
  }
);

const deleteGroup = asyncHandler(async (req: UserRequest, res: Response) => {
  const { chatID } = req.params;
  const chat = req.chat;

  const groupChat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatID),
        type: "GROUP",
      },
    },
    ...commonChatPipelines(),
  ]);

  const payload = groupChat[0];

  if (!payload) {
    throw new ApiError(500, "Something went wrong. Internal server error");
  }

  payload.participants.forEach((p: { member: mongoose.Types.ObjectId }) => {
    const userID = p.member.toString();
    req.app.get("io").in(userID).emit(ChatEventsEnum.LEAVE_CHAT, payload);
  });

  const messages = await Message.find({
    chat: new mongoose.Types.ObjectId(chatID),
  });

  let assetsToDelete = messages.flatMap((m) =>
    m.attachments.map((a) => a.asset.public_id)
  );

  if (chat?.image) assetsToDelete.push(chat.image.public_id);

  // bulk delete memberships and messages and assets
  await CloudinaryService.deleteFiles(assetsToDelete);
  await Message.deleteMany({ chat: new mongoose.Types.ObjectId(chatID) });
  await Membership.deleteMany({ chat: new mongoose.Types.ObjectId(chatID) });

  // finally delete chat
  await Chat.findByIdAndDelete(chatID);

  return res
    .status(200)
    .json(new ApiResponse(200, true, "group deleted successfully"));
});

const leaveGroup = asyncHandler(async (req: UserRequest, res: Response) => {
  const { chatID } = req.params;
  const userID = req.user._id?.toString();

  await Chat.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(chatID), type: "GROUP" },
    {
      $pull: { participants: { member: new mongoose.Types.ObjectId(userID) } },
    }
  );

  await Membership.deleteOne({
    chat: new mongoose.Types.ObjectId(chatID),
    member: new mongoose.Types.ObjectId(userID),
  });

  const groupChat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatID),
        type: "GROUP",
      },
    },
    ...commonChatPipelines(),
  ]);

  const payload = groupChat[0];

  if (!payload) {
    throw new ApiError(500, "Something went wrong. Internal server error");
  }

  req.app.get("io").in(userID).emit(ChatEventsEnum.LEAVE_CHAT, payload);

  return res
    .status(200)
    .json(new ApiResponse(200, true, "Group left successfully"));
});

export {
  searchUsers,
  getUserChats,
  startDirectChat,
  createGroup,
  addNewParticipantsToGroup,
  removeParticipantsFromGroup,
  assignParticipantRole,
  updateGroupProfile,
  deleteGroup,
  leaveGroup,
};
