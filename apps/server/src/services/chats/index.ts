import { ChatRoleEnum, ChatTypesEnum } from "@/constants";
import { Chat } from "@/models/chats.model";
import { IChat, IUser } from "@/types/model";
import crypto from "crypto";
import mongoose from "mongoose";

class ChatService {
  static async createChatHash(participants: string[]) {
    const participants_combined = participants.sort().join("|");
    const hash = crypto
      .createHash("sha512")
      .update(participants_combined)
      .digest("hex");
    return hash;
  }

  static async getOrCreateDirectChat(participants: [string, string]) {
    const hash = await ChatService.createChatHash(participants);
    let chat = await Chat.findOne({
      chatHash: hash,
      type: ChatTypesEnum.DIRECT,
    });

    if (!chat) {
      chat = await Chat.create({
        type: ChatTypesEnum.DIRECT,
        chatHash: hash,
        participants: participants.sort(),
      });
    }
    return chat;
  }

  static async createGroupChat(participants: string[], data: Partial<IChat>) {
    const hash = await ChatService.createChatHash(participants);
    const chat = await Chat.create({
      type: ChatTypesEnum.GROUP,
      chatHash: hash,
      participants: participants.sort(),
      ...data,
    });
    return chat;
  }

  static async updateChat(chatID: string, data: Partial<IChat>) {
    const chat = await Chat.findByIdAndUpdate(
      chatID,
      { $set: data },
      { new: true }
    );
    return chat;
  }

  static async updateParticipantsInGroup(
    action: "REMOVE" | "ADD",
    chatID: string,
    participants: string[]
  ) {
    const newParticipants = [...new Set(participants)].map(
      (m) => new mongoose.Types.ObjectId(m)
    );

    if (action === "ADD") {
      const newMembers = newParticipants.map((m) => ({
        member: m,
        role: ChatRoleEnum.MEMBER,
      }));

      await Chat.findByIdAndUpdate(
        chatID,
        {
          $pull: { participants: { member: { $in: newParticipants } } },
          $push: { participants: { $each: newMembers } },
        },
        { new: true }
      );
    } else {
      const removeMembers = [...new Set(participants)].map((m) => ({
        member: new mongoose.Types.ObjectId(m),
      }));

      await Chat.findByIdAndUpdate(
        chatID,
        { $pullAll: { participants: removeMembers } }
        // {
        //   $pull: {
        //     participants: {
        //       member: { $in: newParticipants) },
        //     },
        //   },
        // }
      );
    }
  }
}

export default ChatService;
