import mongoose from "mongoose";
import { AvailableChatRoles, ChatRoleEnum } from "../constants";
import { IMembership } from "../types/model";

const membershipSchema = new mongoose.Schema<IMembership>(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: AvailableChatRoles,
      default: ChatRoleEnum.MEMBER,
    },

    unreadCount: {
      type: Number,
      default: 0,
    },

    lastReadAt: {
      type: Date,
      default: null,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
    
    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Membership = mongoose.model("Membership", membershipSchema);
