import {
  AvailableChatRoles,
  AvailableChatTypes,
  ChatRoleEnum,
  ChatTypesEnum,
} from "@/constants";
import { IChat } from "@/types/model";
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema<IChat>(
  {
    type: {
      type: String,
      enum: AvailableChatTypes,
      required: true,
      default: ChatTypesEnum.DIRECT,
    },

    title: {
      type: String,
    },

    description: {
      type: String,
    },

    participants: {
      type: [
        {
          member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          role: {
            type: String,
            enum: AvailableChatRoles,
            default: ChatRoleEnum.MEMBER,
          },
        },
      ],
    },

    chatHash: {
      type: String,
      required: true,
      sparse: true,
    },

    image: {
      type: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        resource_type: {
          type: String,
          required: true,
        },
        format: {
          type: String,
          required: true,
        },
      },
      required: false,
    },

    settings: {
      participantsCanSendMessages: {
        type: Boolean,
        default: true,
      },
      participantsCanAddParticipants: {
        type: Boolean,
        default: false,
      },
      participantsCanRemoveParticipants: {
        type: Boolean,
        default: false,
      },
    },

    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

chatSchema.index({}, {})

export const Chat = mongoose.model<IChat>("Chat", chatSchema, "chats");
